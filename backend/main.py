"""
FastAPI app: POST /reboot (start Selenium in background), GET /events (SSE).
"""

from pathlib import Path

# Load .env from project root (parent of backend/)
_root = Path(__file__).resolve().parent.parent
_env = _root / ".env"
if _env.exists():
    from dotenv import load_dotenv
    load_dotenv(_env)

import asyncio
import json
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from state_manager import get_state, subscribe, unsubscribe, event_stream
from selenium_worker import run_reboot_workflow

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    # cleanup if any


app = FastAPI(title="Centcon Reboot API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/reboot")
async def reboot():
    """Start router reboot workflow in background; returns immediately."""
    state = get_state()
    if state["state"] not in ("IDLE", "ONLINE", "FAILED"):
        return {"ok": False, "message": "Reboot already in progress"}
    asyncio.create_task(run_reboot_workflow())
    return {"ok": True, "message": "Reboot started"}


@app.get("/events")
async def events():
    """SSE endpoint: stream state, log, countdown, heartbeat events."""

    async def generate():
        queue = await subscribe()
        try:
            # Send current state immediately so new clients get latest
            current = get_state()
            yield f"data: {json.dumps({'type': 'state', **current})}\n\n"
            async for event in event_stream(queue):
                yield f"data: {json.dumps(event)}\n\n"
        finally:
            await unsubscribe(queue)

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.get("/state")
async def state():
    """Current reboot state (for polling if needed)."""
    return get_state()

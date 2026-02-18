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
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from state_manager import get_state, subscribe, unsubscribe, event_stream
from selenium_reboot import run_reboot_workflow
from selenium_login import run_login_workflow

# Prevent multiple simultaneous reboot processes
reboot_in_progress = False
login_in_progress = False

# Load CORS origins from .env
cors_origins_env = os.getenv("CORS_ORIGINS", "")
cors_origins = [origin.strip() for origin in cors_origins_env.split(",") if origin]


# Lifespan context
@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    # cleanup if any


# FastAPI app
app = FastAPI(title="Centcon Reboot API", lifespan=lifespan)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Reboot workflow
async def _run_reboot_then_clear():
    global reboot_in_progress
    try:
        await run_reboot_workflow()
    finally:
        reboot_in_progress = False


@app.post("/reboot")
async def reboot():
    """Start router reboot workflow in background; returns immediately."""
    global reboot_in_progress
    if reboot_in_progress:
        raise HTTPException(
            status_code=409,
            detail="Reboot already in progress",
        )
    state = get_state()
    if state["state"] not in ("IDLE", "ONLINE", "FAILED"):
        raise HTTPException(
            status_code=409,
            detail="Reboot already in progress",
        )
    reboot_in_progress = True
    asyncio.create_task(_run_reboot_then_clear())
    return {"ok": True, "message": "Reboot started"}


# Login workflow
async def _run_login_then_clear():
    global login_in_progress
    try:
        await run_login_workflow()
    finally:
        login_in_progress = False


@app.post("/login")
async def login_to_modem():
    """Open browser and login to modem, leave window open for user."""
    global login_in_progress

    if login_in_progress:
        raise HTTPException(
            status_code=409,
            detail="Login already in progress",
        )

    login_in_progress = True

    try:
        asyncio.create_task(_run_login_then_clear())
        return {"ok": True, "message": "Login started"}
    except Exception as e:
        login_in_progress = False
        raise HTTPException(status_code=500, detail=str(e))


# SSE events endpoint
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


# Polling endpoint for state
@app.get("/state")
async def state():
    """Current reboot state (for polling if needed)."""
    return get_state()


# PIN verification
class PinVerifyRequest(BaseModel):
    pin: str


CENTCON_PIN = os.environ["CENTCON_PIN"]  # raises KeyError if missing


@app.post("/verify-pin")
async def verify_pin(request: PinVerifyRequest):
    """Verify PIN for CENTCON access."""
    if request.pin == CENTCON_PIN:
        return {"ok": True, "message": "PIN verified"}
    return {"ok": False, "message": "Invalid PIN"}


# Auth config endpoint
@app.get("/auth-config")
async def auth_config():
    """Return authentication configuration."""
    show_login = os.getenv("CENTCON_SHOW_LOGIN", "true").lower() == "true"
    return {
        "showLogin": show_login,
        "message": "Login enabled" if show_login else "Login disabled",
    }

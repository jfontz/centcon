"""
FastAPI app for CENTCON: setup (/api/setup-*), command execution (/commands),
state streaming (/events), state polling (/state), PIN verification (/verify-pin),
and auth configuration (/auth-config).
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
from selenium_open_reboot_page import run_open_reboot_page_workflow

from setup_utils import (
    check_setup_needed,
    get_defaults,
    save_to_env,
    REQUIRED_VARS,
)

# Command metadata is the contract between backend scheduling and frontend button behavior.
COMMAND_DEFINITIONS = {
    "reboot": {
        "label": "Reboot Modem",
        "buttonClass": "btn-reboot",
        "icon": "reboot",
        "confirm": True,
        "dangerous": True,
        "blocksOthers": True,
        "allowWhileBusy": False,
        "disableSelf": True,
        "workflow": run_reboot_workflow,
    },
    "login": {
        "label": "Login to Modem",
        "buttonClass": "control-btn",
        "icon": "newTab",
        "confirm": False,
        "dangerous": False,
        "blocksOthers": False,
        "allowWhileBusy": True,
        "disableSelf": True,
        "workflow": run_login_workflow,
    },
    "open-reboot-page": {
        "label": "Open Reboot Page",
        "buttonClass": "control-btn",
        "icon": "navigate",
        "confirm": False,
        "dangerous": False,
        "blocksOthers": False,
        "allowWhileBusy": True,
        "disableSelf": True,
        "workflow": run_open_reboot_page_workflow,
    },
}

ERR_UNKNOWN_COMMAND = "Unknown command"
ERR_ALREADY_IN_PROGRESS = "already in progress"
ERR_BLOCKING_ACTIVE = "is blocking other commands"
ERR_REQUIRES_IDLE = "requires all other commands to be idle"
ERR_BUSY = "cannot run while another command is active"
OK_STARTED = "started"

# In-process guard only; expected to run as a single-process backend.
command_in_progress: set[str] = set()

# Load CORS origins from .env or fallback to localhost defaults
cors_origins_env = os.getenv("CORS_ORIGINS", "")
cors_origins = [origin.strip() for origin in cors_origins_env.split(",") if origin]

# Fallback: allow standard localhost ports if empty
if not cors_origins:
    cors_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]


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

class SetupRequest(BaseModel):
    MODEM_IP: str
    MODEM_USERNAME: str
    MODEM_PASSWORD: str
    CENTCON_PIN: str


class PinVerifyRequest(BaseModel):
    pin: str


@app.get("/api/setup-needed")
async def setup_needed():
    """Check if first-run setup is required."""
    try:
        setup_required, missing, invalid = check_setup_needed()

        response = {
            "setupRequired": setup_required,
            "missingFields": missing,
            "invalidFields": invalid,
            "fieldDescriptions": REQUIRED_VARS,
        }

        # If setup is needed, provide defaults
        if setup_required:
            defaults = get_defaults()
            response["defaults"] = defaults

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Setup check failed: {str(e)}")


@app.post("/api/setup-complete")
async def setup_complete(request: SetupRequest):
    """Complete first-run setup by saving validated configuration."""
    try:
        # Get all defaults (includes frontend, backend, CORS, auth, selenium, etc.)
        defaults = get_defaults()

        # Merge submitted data from form on top of defaults
        data = {
            **defaults,
            **{
                "MODEM_IP": request.MODEM_IP.strip(),
                "MODEM_USERNAME": request.MODEM_USERNAME.strip(),
                "MODEM_PASSWORD": request.MODEM_PASSWORD,  # Don't strip password
                "CENTCON_PIN": request.CENTCON_PIN.strip(),
            },
        }

        # Save everything to .env
        success, message = save_to_env(data)

        if success:
            return {"ok": True, "message": message}
        else:
            raise HTTPException(status_code=400, detail=message)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Setup failed: {str(e)}")


async def _run_command_then_clear(command_id: str):
    """Run a registered command workflow and clear its in-progress marker."""
    try:
        workflow = COMMAND_DEFINITIONS[command_id]["workflow"]
        await workflow()
    finally:
        command_in_progress.discard(command_id)


@app.get("/commands")
async def list_commands():
    """Return available Selenium-backed commands for the dashboard controls."""
    return {
        "commands": [
            {
                "id": command_id,
                "label": definition["label"],
                "buttonClass": definition["buttonClass"],
                "icon": definition["icon"],
                "confirm": definition["confirm"],
                "dangerous": definition["dangerous"],
                "blocksOthers": definition["blocksOthers"],
                "allowWhileBusy": definition["allowWhileBusy"],
                "disableSelf": definition["disableSelf"],
            }
            for command_id, definition in COMMAND_DEFINITIONS.items()
        ]
    }


@app.post("/commands/{command_id}")
async def start_command(command_id: str):
    """Start a registered Selenium command in the background."""
    if command_id not in COMMAND_DEFINITIONS:
        raise HTTPException(status_code=404, detail=ERR_UNKNOWN_COMMAND)

    definition = COMMAND_DEFINITIONS[command_id]
    if command_id in command_in_progress:
        raise HTTPException(
            status_code=409,
            detail=f"{command_id} {ERR_ALREADY_IN_PROGRESS}",
        )

    if command_in_progress:
        # A blocking command is exclusive in both directions:
        # it prevents later commands from starting, and it cannot start
        # while any other command is already active.
        active_blockers = [
            active_id
            for active_id in command_in_progress
            if COMMAND_DEFINITIONS[active_id]["blocksOthers"]
        ]
        if active_blockers:
            raise HTTPException(
                status_code=409,
                detail=f"{active_blockers[0]} {ERR_BLOCKING_ACTIVE}",
            )

        if definition["blocksOthers"]:
            raise HTTPException(
                status_code=409,
                detail=f"{command_id} {ERR_REQUIRES_IDLE}",
            )

        if not definition["allowWhileBusy"]:
            raise HTTPException(
                status_code=409,
                detail=f"{command_id} {ERR_BUSY}",
            )

    command_in_progress.add(command_id)

    try:
        asyncio.create_task(_run_command_then_clear(command_id))
        return {"ok": True, "message": f"{command_id} {OK_STARTED}"}
    except Exception as e:
        command_in_progress.discard(command_id)
        raise HTTPException(status_code=500, detail=str(e))


# SSE events endpoint
@app.get("/events")
async def events():
    """
    Server-Sent Events endpoint for realtime updates.

    Event payloads:
    - 'state': {type, state, message, progress, countdown?}
        Reboot/login workflow state machine updates. Also used to pause
        frontend auto-refresh during reboot and resume once ONLINE.
    - 'log': {type, level, message, timestamp}
        Timeline entries for the log panel (header/progress/error messages).
    - 'countdown': {type, countdown}
        Remaining seconds in the reboot wait period; drives StatusBadge only
        to avoid spamming the log panel.
    - 'heartbeat': {type}
        Keep-alive ping emitted when no other events have occurred recently.
    """

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
    """Current command state (fallback for environments that cannot use SSE)."""
    return get_state()


@app.post("/verify-pin")
async def verify_pin(request: PinVerifyRequest):
    """Verify PIN for CENTCON access."""
    centcon_pin = os.getenv("CENTCON_PIN", "")

    if request.pin.upper() == centcon_pin.upper():
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


# TODO: Use concurrently (or similar) to start frontend and backend together for faster launch.

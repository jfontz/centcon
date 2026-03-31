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
import re
from typing import Literal, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, field_validator, model_validator
from collections import defaultdict
import time

from state_manager import get_state, subscribe, unsubscribe, event_stream, emit
from selenium_reboot import run_reboot_workflow
from selenium_login import run_login_workflow
from selenium_wifi_credentials import run_wifi_credentials_workflow

from setup_utils import (
    check_setup_needed,
    get_defaults,
    save_to_env,
    REQUIRED_VARS,
)

# Command definitions
# Each entry defines a Selenium-backed command exposed to the frontend.
# The frontend reads this list from GET /commands and renders buttons accordingly.
# - workflow:       async function to run when the command is triggered
# - confirm:        whether the frontend should show a confirmation dialog first
# - dangerous:      marks the button as destructive (red styling)
# - blocksOthers:   if True, this command cannot run while any other is active,
#                   and prevents other commands from starting while it runs
# - allowWhileBusy: if True, this command can be triggered even while another is running
# - disableSelf:    if True, the button disables itself while the command is in progress
COMMAND_DEFINITIONS = {
    "reboot": {
        "label": "Reboot Router",
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
        "label": "Login to Router",
        "buttonClass": "control-btn",
        "icon": "newTab",
        "confirm": False,
        "dangerous": False,
        "blocksOthers": False,
        "allowWhileBusy": True,
        "disableSelf": True,
        "workflow": run_login_workflow,
    },
    "wifi-credentials": {
        "label": "Change Wi-Fi Credentials",
        "buttonClass": "control-btn",
        "icon": "wifi",
        "confirm": False,
        "dangerous": False,
        "blocksOthers": False,
        "allowWhileBusy": False,
        "disableSelf": True,
        "workflow": None,  # handled by /commands/wifi-credentials
    },
}

# Error and status message constants
ERR_UNKNOWN_COMMAND = "Unknown command"
ERR_ALREADY_IN_PROGRESS = "already in progress"
ERR_BLOCKING_ACTIVE = "is blocking other commands"
ERR_REQUIRES_IDLE = "requires all other commands to be idle"
ERR_BUSY = "cannot run while another command is active"
OK_STARTED = "started"

# In-process guard to prevent concurrent command execution.
# Expected to run as a single-process backend — no distributed locking needed.
command_in_progress: set[str] = set()

_pin_attempts: dict[str, list[float]] = defaultdict(list)
_MAX_PIN_ATTEMPTS = 5
_PIN_WINDOW_SECONDS = 60

# CORS configuration
# Load allowed origins from .env. Falls back to standard localhost dev ports
# if the variable is missing or empty.
cors_origins_env = os.getenv("CORS_ORIGINS", "")
cors_origins = [origin.strip() for origin in cors_origins_env.split(",") if origin]

if not cors_origins:
    cors_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]


# App setup
@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    # cleanup if any


app = FastAPI(title="Centcon Reboot API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request models
class SetupRequest(BaseModel):
    ROUTER_IP: str
    ROUTER_USERNAME: str
    ROUTER_PASSWORD: str
    CENTCON_PIN: str


class PinVerifyRequest(BaseModel):
    pin: str


# Setup endpoints
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

        # Provide defaults only when setup is needed so the wizard can pre-fill fields
        if setup_required:
            defaults = get_defaults()
            response["defaults"] = defaults

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Setup check failed: {str(e)}")


@app.post("/api/setup-complete")
async def setup_complete(request: SetupRequest):
    """Complete first-run setup by saving validated configuration to .env."""
    try:
        # Start from full defaults so all non-wizard fields get written too
        defaults = get_defaults()

        # Overlay the user-submitted values on top of defaults
        data = {
            **defaults,
            **{
                "ROUTER_IP": request.ROUTER_IP.strip(),
                "ROUTER_USERNAME": request.ROUTER_USERNAME.strip(),
                "ROUTER_PASSWORD": request.ROUTER_PASSWORD,  # intentionally not stripped
                "CENTCON_PIN": request.CENTCON_PIN.strip(),
            },
        }

        success, message = save_to_env(data)

        if success:
            return {"ok": True, "message": message}
        else:
            raise HTTPException(status_code=400, detail=message)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Setup failed: {str(e)}")


# Command helpers
async def _run_command_then_clear(command_id: str):
    """Run a registered command workflow and clear its in-progress marker when done."""
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


# Wi-Fi credentials endpoint
# This command is not in COMMAND_DEFINITIONS because it requires dynamic input
# (target SSIDs, new names/passwords, broadcast intents) collected from the modal.
# It uses its own request model with strict server-side validation.

# Regex for valid Wi-Fi SSID names — letters, numbers, spaces, underscore, hyphen only
SSID_NAME_REGEX = re.compile(r"^[A-Za-z0-9 _-]+$")


class WifiTarget(BaseModel):
    """
    Validated representation of a single SSID target for the credentials workflow.

    All fields are validated server-side regardless of frontend validation.
    The band consistency validator ensures freq, ssid_index, and router_index agree
    so no inconsistent state can reach Selenium.
    """
    ssid_index: int                                          # 0–7 (position in wlan_info array)
    freq: Literal["2.4", "5"]                               # Wi-Fi band
    router_index: str                                         # "1"–"8" (displayed SSID number on router)
    new_name: str = ""                                       # New SSID name, empty = keep current
    new_pass: str = ""                                       # New password, empty = keep current
    broadcast_intent: Optional[Literal["enable", "disable"]] = None  # None = no broadcast change

    @field_validator("ssid_index")
    @classmethod
    def validate_ssid_index(cls, value: int) -> int:
        if value < 0 or value > 7:
            raise ValueError("ssid_index must be between 0 and 7")
        return value

    @field_validator("router_index", mode="before")
    @classmethod
    def validate_router_index(cls, value) -> str:
        if value is None:
            raise ValueError("router_index is required")
        raw = str(value)
        if not raw.isdigit():
            raise ValueError("router_index must be a number between 1 and 8")
        idx = int(raw)
        if idx < 1 or idx > 8:
            raise ValueError("router_index must be between 1 and 8")
        return str(idx)

    @field_validator("new_name", mode="before")
    @classmethod
    def validate_new_name(cls, value) -> str:
        if value is None or value == "":
            return ""
        trimmed = str(value).strip()
        if trimmed == "":
            raise ValueError("Wi-Fi name is required.")
        if len(trimmed) > 32:
            raise ValueError("Wi-Fi name must be 1–32 characters.")
        if not SSID_NAME_REGEX.match(trimmed):
            raise ValueError("Use letters, numbers, spaces, underscore, or hyphen.")
        return trimmed

    @field_validator("new_pass", mode="before")
    @classmethod
    def validate_new_pass(cls, value) -> str:
        if value is None or value == "":
            return ""
        raw = str(value)
        if len(raw) < 8 or len(raw) > 63:
            raise ValueError("Password must be 8–63 characters.")
        if raw.strip() != raw:
            raise ValueError("Password cannot start or end with spaces.")
        return raw

    @model_validator(mode="after")
    def validate_band_consistency(self):
        """
        Cross-field check: ensures freq, ssid_index, and router_index are internally consistent.
        The frontend always sends these in sync; a mismatch here indicates a malformed request.
        """
        if self.freq == "2.4" and not (0 <= self.ssid_index <= 3):
            raise ValueError("ssid_index must be 0–3 for 2.4 GHz")
        if self.freq == "5" and not (4 <= self.ssid_index <= 7):
            raise ValueError("ssid_index must be 4–7 for 5 GHz")

        router_idx = int(self.router_index)
        if self.freq == "2.4" and not (1 <= router_idx <= 4):
            raise ValueError("router_index must be 1–4 for 2.4 GHz")
        if self.freq == "5" and not (5 <= router_idx <= 8):
            raise ValueError("router_index must be 5–8 for 5 GHz")
        if router_idx != self.ssid_index + 1:
            raise ValueError("router_index must match ssid_index + 1")

        return self


class WifiCredentialsRequest(BaseModel):
    targets: list[WifiTarget]


@app.post("/commands/wifi-credentials")
async def start_wifi_credentials(request: WifiCredentialsRequest):
    """Start the Wi-Fi credentials Selenium workflow with target SSIDs and new values."""
    command_id = "wifi-credentials"

    if command_id in command_in_progress:
        raise HTTPException(status_code=409, detail=f"{command_id} {ERR_ALREADY_IN_PROGRESS}")

    # Block if a blocking command (e.g. reboot) is already running
    active_blockers = [
        active_id
        for active_id in command_in_progress
        if COMMAND_DEFINITIONS.get(active_id, {}).get("blocksOthers")
    ]
    if active_blockers:
        raise HTTPException(status_code=409, detail=f"{active_blockers[0]} {ERR_BLOCKING_ACTIVE}")

    command_in_progress.add(command_id)

    # Convert validated Pydantic models to plain dicts for the Selenium workflow
    targets_payload = [target.dict() for target in request.targets]

    # Timeout matches the frontend modal timeout — if Selenium hangs on a step,
    # the backend fails cleanly and emits FAILED so the modal unlocks.
    WIFI_WORKFLOW_TIMEOUT = 90  # seconds

    async def run():
        try:
            await asyncio.wait_for(
                run_wifi_credentials_workflow(targets_payload),
                timeout=WIFI_WORKFLOW_TIMEOUT,
            )
        except asyncio.TimeoutError:
            await emit({
                "type": "state",
                "state": "FAILED",
                "message": "Workflow timed out — Selenium took too long on a step.",
                "progress": 0,
                "command": "wifi-credentials",
            })
        finally:
            command_in_progress.discard(command_id)

    try:
        asyncio.create_task(run())
        return {"ok": True, "message": f"{command_id} {OK_STARTED}"}
    except Exception as e:
        command_in_progress.discard(command_id)
        raise HTTPException(status_code=500, detail=str(e))


# Generic command endpoint
@app.post("/commands/{command_id}")
async def start_command(command_id: str):
    """Start a registered Selenium command in the background."""
    if command_id not in COMMAND_DEFINITIONS:
        raise HTTPException(status_code=404, detail=ERR_UNKNOWN_COMMAND)

    definition = COMMAND_DEFINITIONS[command_id]
    if not definition.get("workflow"):
        raise HTTPException(
            status_code=400,
            detail=f"{command_id} requires payload; use /commands/wifi-credentials",
        )

    if command_id in command_in_progress:
        raise HTTPException(
            status_code=409,
            detail=f"{command_id} {ERR_ALREADY_IN_PROGRESS}",
        )

    if command_in_progress:
        # A blocking command is exclusive in both directions:
        # it cannot start while anything else is active, and nothing else
        # can start while it is active.
        active_blockers = [
            active_id
            for active_id in command_in_progress
            if COMMAND_DEFINITIONS.get(active_id, {}).get("blocksOthers")
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
    Server-Sent Events endpoint for realtime dashboard updates.

    Event payload types:
    - state:     {type, state, message, progress, countdown?}
                 Workflow state machine updates. Also used to pause/resume
                 frontend auto-refresh during reboot.
    - log:       {type, level, message, timestamp}
                 Timeline entries for the log panel.
    - countdown: {type, countdown}
                 Remaining seconds in the reboot wait period.
                 Drives the StatusBadge only — not logged to the log panel
                 to avoid spamming it every second.
    - heartbeat: {type}
                 Keep-alive ping emitted when no other events have occurred recently.
    """

    async def generate():
        queue = await subscribe()
        try:
            # Send current state immediately so new clients don't miss the latest
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
            "X-Accel-Buffering": "no",  # prevents nginx from buffering SSE responses
        },
    )


# Utility endpoints
@app.get("/state")
async def state():
    """Current command state — fallback polling endpoint for environments that cannot use SSE."""
    return get_state()


@app.post("/verify-pin")
async def verify_pin(request: PinVerifyRequest, req: Request):
    """Verify the CENTCON access PIN. Rate-limited to 5 attempts per 60 seconds."""
    if _is_rate_limited(req.client.host):
        raise HTTPException(status_code=429, detail="Too many attempts. Try again in a minute.")

    centcon_pin = os.getenv("CENTCON_PIN", "")
    if request.pin.upper() == centcon_pin.upper():
        return {"ok": True, "message": "PIN verified"}
    return {"ok": False, "message": "Invalid PIN"}

def _is_rate_limited(ip: str) -> bool:
    now = time.time()
    _pin_attempts[ip] = [t for t in _pin_attempts[ip] if now - t < _PIN_WINDOW_SECONDS]
    if len(_pin_attempts[ip]) >= _MAX_PIN_ATTEMPTS:
        return True
    _pin_attempts[ip].append(now)
    return False


@app.get("/auth-config")
async def auth_config():
    """Return authentication configuration — whether the login screen is enabled."""
    show_login = os.getenv("CENTCON_SHOW_LOGIN", "true").lower() == "true"
    return {
        "showLogin": show_login,
        "message": "Login enabled" if show_login else "Login disabled",
    }

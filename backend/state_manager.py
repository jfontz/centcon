"""
Shared state and event queue for command workflows.
Single source of truth; events are broadcast to all SSE subscribers.
"""

import asyncio
from typing import AsyncIterator

# Initial state
INITIAL_STATE = {
    "state": "IDLE",      # High-level command state (IDLE, LOGGING_IN, NAVIGATING, REBOOTING, WAITING, CHECKING_CONNECTION, ONLINE, FAILED, SUCCEEDED)
    "message": "",        # Human-readable status for the UI
    "countdown": None,    # Remaining seconds in reboot countdown (or None when idle)
    "command": None,      # Active command id for the current Selenium workflow
}

HEARTBEAT_TIMEOUT_SECONDS = 15.0

_state: dict = INITIAL_STATE.copy()
_client_queues: list[asyncio.Queue] = []
_lock = asyncio.Lock()


def get_state() -> dict:
    """Return current state snapshot used by /state polling and initial SSE payload."""
    return _state.copy()


def update_state(partial: dict) -> None:
    """
    Update shared state (merge partial into _state).

    countdown is allowed to be explicitly set to None so that the frontend
    can clear the countdown display once the device is back ONLINE.
    """
    global _state
    for k, v in partial.items():
        if v is not None or k == "countdown":
            _state[k] = v


def reset_state() -> None:
    """Reset to initial state before starting a new reboot or login workflow."""
    global _state
    _state = INITIAL_STATE.copy()


async def subscribe() -> asyncio.Queue:
    """Register a new SSE client; returns a queue that will receive events."""
    async with _lock:
        q: asyncio.Queue = asyncio.Queue()
        _client_queues.append(q)
        return q


async def unsubscribe(queue: asyncio.Queue) -> None:
    """Remove a client queue when a browser tab disconnects."""
    async with _lock:
        if queue in _client_queues:
            _client_queues.remove(queue)


async def emit(event: dict) -> None:
    """
    Emit an event to all subscribed clients and update shared state if applicable.

    Supported event types:
    - 'state': {state, message, countdown?}
    - 'log': {level, message, timestamp}
    - 'countdown': {countdown}
    - 'heartbeat': {}
    """
    if event.get("type") == "state":
        update_state({
            "state": event.get("state", _state["state"]),
            "message": event.get("message", _state["message"]),
            "command": event.get("command", _state["command"]),
        })
    if event.get("type") == "countdown":
        update_state({"countdown": event.get("countdown")})

    async with _lock:
        for q in _client_queues:
            try:
                q.put_nowait(event)
            except asyncio.QueueFull:
                pass


async def event_stream(queue: asyncio.Queue) -> AsyncIterator[dict]:
    """
    Consume events from a client queue for SSE.

    If no events arrive within 15 seconds, a 'heartbeat' event is yielded so
    that intermediaries and browsers keep the SSE connection alive.
    """
    while True:
        try:
            event = await asyncio.wait_for(queue.get(), timeout=HEARTBEAT_TIMEOUT_SECONDS)
            yield event
        except asyncio.TimeoutError:
            yield {"type": "heartbeat"}

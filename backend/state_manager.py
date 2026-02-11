"""
Shared state and event queue for router reboot workflow.
Single source of truth; events are broadcast to all SSE subscribers.
"""

import asyncio
from typing import Any, AsyncIterator

# Initial state
INITIAL_STATE = {
    "state": "IDLE",
    "message": "",
    "progress": 0,
    "countdown": None,
}

_state: dict = INITIAL_STATE.copy()
_client_queues: list[asyncio.Queue] = []
_lock = asyncio.Lock()


def get_state() -> dict:
    """Return current state snapshot."""
    return _state.copy()


def update_state(partial: dict) -> None:
    """Update shared state (merge partial into _state)."""
    global _state
    for k, v in partial.items():
        if v is not None or k == "countdown":
            _state[k] = v


def reset_state() -> None:
    """Reset to initial state (e.g. when starting a new reboot)."""
    global _state
    _state = INITIAL_STATE.copy()


async def subscribe() -> asyncio.Queue:
    """Register a new SSE client; returns a queue that will receive events."""
    async with _lock:
        q: asyncio.Queue = asyncio.Queue()
        _client_queues.append(q)
        return q


async def unsubscribe(queue: asyncio.Queue) -> None:
    """Remove a client queue."""
    async with _lock:
        if queue in _client_queues:
            _client_queues.remove(queue)


async def emit(event: dict) -> None:
    """Emit event to all subscribed clients and update state if applicable."""
    if event.get("type") == "state":
        update_state({
            "state": event.get("state", _state["state"]),
            "message": event.get("message", _state["message"]),
            "progress": event.get("progress", _state["progress"]),
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
    """Consume events from a client queue (for SSE)."""
    while True:
        try:
            event = await asyncio.wait_for(queue.get(), timeout=15.0)
            yield event
        except asyncio.TimeoutError:
            yield {"type": "heartbeat"}

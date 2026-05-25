"""
Shared exception types for CENTCON workflow functions.

Kept in a separate module to avoid circular imports — main.py imports the
Selenium workflow modules, and those modules need this sentinel, so it cannot
live in main.py itself.
"""


class _AlreadyReportedError(Exception):
    """
    Raised by workflow functions that have already emitted a terminal FAILED SSE
    state before raising. Callers catch this to avoid emitting a second, generic
    FAILED message that would overwrite the more specific one shown to the user.
    """

    pass

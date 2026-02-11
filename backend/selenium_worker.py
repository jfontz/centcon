"""
Selenium automation for router login and reboot.
Emits structured events to state_manager for SSE broadcast.

Exact navigation flow: login (By.ID) → Advanced Settings → Maintenance → Reboot tab → reboot (By.ID) → alert → wait → close.
"""

import asyncio
import os
import time
import threading
from datetime import datetime, timezone
from pathlib import Path
from dotenv import load_dotenv

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException

from state_manager import emit, reset_state

# Go one directory up from this file
ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env")

ROUTER_URL = os.getenv("REBOOT_MODEM_URL")
USERNAME = os.getenv("REBOOT_USERNAME")
PASSWORD = os.getenv("REBOOT_PASSWORD")

if not ROUTER_URL:
    raise RuntimeError("Missing REBOOT_MODEM_URL in .env")

if not USERNAME or not PASSWORD:
    raise RuntimeError("Missing REBOOT_USERNAME or REBOOT_PASSWORD in .env")

COUNTDOWN_SECONDS = 120
CONNECTION_CHECK_INTERVAL = 5
CONNECTION_CHECK_TIMEOUT = 120  # total seconds to try reconnecting


def _log_ts() -> str:
    """Server-side ISO 8601 timestamp for log events."""
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"


def _run_selenium_blocking(main_loop: asyncio.AbstractEventLoop) -> None:
    """Run Selenium in a thread; uses asyncio.run_coroutine_threadsafe to emit to main loop."""

    def _emit_sync(ev: dict):
        asyncio.run_coroutine_threadsafe(emit(ev), main_loop).result()

    def _log(level: str, message: str):
        _emit_sync({"type": "log", "level": level, "message": message, "timestamp": _log_ts()})

    driver = None
    wait_time = 10
    wait_short = 5

    try:
        options = webdriver.ChromeOptions()
        if os.getenv("SELENIUM_HEADLESS", "true").lower() == "true":
            options.add_argument("--headless=new")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")

        driver = webdriver.Chrome(options=options)
        driver.implicitly_wait(wait_time)

        # 1. Navigate to router login page
        driver.get(ROUTER_URL)
        _log("info", "Reboot Process Started")

        # 2. Wait for and fill username field
        WebDriverWait(driver, wait_time).until(
            EC.presence_of_element_located((By.ID, "username"))
        )
        elem = driver.find_element(By.ID, "username")
        elem.clear()
        elem.send_keys(USERNAME)

        # 3. Fill password field
        elem = driver.find_element(By.ID, "password")
        elem.clear()
        elem.send_keys(PASSWORD)

        # 4. Click login button
        WebDriverWait(driver, wait_time).until(
            EC.element_to_be_clickable((By.ID, "login"))
        )
        login_button = driver.find_element(By.ID, "login")
        login_button.click()

        # 5. Verify login success
        try:
            WebDriverWait(driver, wait_time).until(
                EC.presence_of_element_located((By.CLASS_NAME, "logout-btn"))
            )
            _log("info", "Login successful")
            _emit_sync({"type": "state", "state": "LOGGING_IN", "message": "Login successful", "progress": 10})
        except TimeoutException:
            _log("error", "Login failed")
            _emit_sync({"type": "state", "state": "FAILED", "message": "Login failed", "progress": 0})
            driver.quit()
            return
        
        # 6. Navigate to Reboot tab
        driver.get(ROUTER_URL + "maintenance_globe.cgi?reboot")
        _log("info", "Navigated to Reboot tab")
        _emit_sync({"type": "state", "state": "NAVIGATING", "message": "Navigated to Reboot tab", "progress": 60})

        # 7. Click reboot button
        WebDriverWait(driver, wait_time).until(
            EC.element_to_be_clickable((By.ID, "reboot"))
        ).click()
        _log("info", "Reboot button clicked")
        _emit_sync({"type": "state", "state": "REBOOTING", "message": "Reboot button clicked", "progress": 70})

        # 8. Accept alert
        WebDriverWait(driver, wait_short).until(EC.alert_is_present())
        alert = driver.switch_to.alert
        alert.accept()
        _log("info", "Reboot command sent")
        # _log("info", "FAKE Reboot command sent")
        _emit_sync({"type": "state", "state": "REBOOTING", "message": "Reboot command sent", "progress": 75})

        # 9. Emit WAITING + single log immediately (give user feedback)
        _log("info", "Waiting for device to reboot (120 seconds)")
        _emit_sync({"type": "state", "state": "WAITING", "message": "Waiting for device to reboot (120 seconds)", "progress": 80})
        _emit_sync({"type": "countdown", "countdown": COUNTDOWN_SECONDS})

        # 10. Quit driver in background thread (non-blocking) - kept alive for 10 secs for the modem to sucessfully receive the command
        def _quit_driver_delayed(drv):
            time.sleep(10)  # keep driver alive for 10 seconds
            try:
                drv.quit()
            except Exception:
                pass

        threading.Thread(target=_quit_driver_delayed, args=(driver,), daemon=True).start()
        driver = None  # Prevent double quit in finally


    except Exception as e:
        _emit_sync({"type": "state", "state": "FAILED", "message": str(e), "progress": 0})
        _log("error", str(e))
    finally:
        if driver:
            try:
                driver.quit()
            except Exception:
                pass
            # If we threw after alert accept (e.g. during sleep/quit), emit WAITING so async countdown can run
            from state_manager import get_state
            s = get_state().get("state")
            if s not in ("WAITING", "FAILED"):
                _log("info", "Waiting for device to reboot (120 seconds)")
                _emit_sync({"type": "state", "state": "WAITING", "message": "Waiting for device to reboot (120 seconds)", "progress": 80})
                _emit_sync({"type": "countdown", "countdown": COUNTDOWN_SECONDS})


async def run_reboot_workflow() -> None:
    """
    Run login + reboot in a thread, then countdown (badge only) and connection check in async.
    Countdown ticks update StatusBadge only; log panel gets start/end and every 3rd connection attempt.
    """
    import concurrent.futures
    import urllib.request

    reset_state()
    loop = asyncio.get_event_loop()
    executor = concurrent.futures.ThreadPoolExecutor(max_workers=1)

    future = loop.run_in_executor(executor, lambda: _run_selenium_blocking(loop))
    await future

    from state_manager import get_state
    if get_state()["state"] != "WAITING":
        return

    # Countdown: every second emit state + countdown only (NO log per second)
    for remaining in range(COUNTDOWN_SECONDS - 1, -1, -1):
        await asyncio.sleep(1)
        progress = 80 + int(15 * (COUNTDOWN_SECONDS - remaining) / COUNTDOWN_SECONDS)
        await emit({"type": "state", "state": "WAITING", "message": f"Device rebooting... {remaining}s remaining", "progress": min(progress, 95)})
        await emit({"type": "countdown", "countdown": remaining})

    # Transition to checking connection (one log entry)
    await emit({"type": "state", "state": "CHECKING_CONNECTION", "message": "Checking connection to router...", "progress": 95})
    await emit({"type": "log", "level": "info", "message": "Checking connection to router...", "timestamp": _log_ts()})

    # Try to reach router every 5 seconds; log every 3rd attempt only
    attempt = 0
    deadline = time.monotonic() + CONNECTION_CHECK_TIMEOUT
    while time.monotonic() < deadline:
        attempt += 1
        if attempt % 3 == 0:
            await emit({"type": "log", "level": "info", "message": f"Checking connection... (attempt {attempt})", "timestamp": _log_ts()})
        try:
            req = urllib.request.Request(ROUTER_URL, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=10) as resp:
                if resp.status == 200:
                    await emit({"type": "state", "state": "ONLINE", "message": "ONLINE", "progress": 100, "countdown": None})
                    await emit({"type": "log", "level": "success", "message": "Device is back online!", "timestamp": _log_ts()})
                    return
        except Exception:
            pass
        await asyncio.sleep(CONNECTION_CHECK_INTERVAL)

    await emit({"type": "state", "state": "FAILED", "message": "Failed to reconnect after 2 minutes", "progress": 0})
    await emit({"type": "log", "level": "error", "message": "Failed to reconnect after 2 minutes", "timestamp": _log_ts()})

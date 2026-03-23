"""
Selenium automation for router login and reboot.

Globe G-1426G-A specific flow:
- Login via username/password form
- Jump directly to the Reboot page using a stable URL
- Trigger reboot, accept confirmation alert, then keep the driver alive
  briefly so the modem receives the command before the connection drops.

All progress and log updates are emitted via state_manager for SSE broadcast.
"""

import asyncio
import concurrent.futures
import os
import threading
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv

from selenium import webdriver
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

from state_manager import emit, get_state, reset_state

# Go one directory up from this file
ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env")

COUNTDOWN_SECONDS = 120
CONNECTION_CHECK_INTERVAL = 5
CONNECTION_CHECK_TIMEOUT = 120  # total seconds to try reconnecting
COMMAND_ID = "reboot"
WAIT_TIME_SECONDS = 10
ALERT_WAIT_SECONDS = 5
DRIVER_QUIT_DELAY_SECONDS = 10
HTTP_REQUEST_TIMEOUT = 10
WAITING_PROGRESS_START = 80
WAITING_PROGRESS_END = 95
LOGIN_SUCCESS_PROGRESS = 10
NAVIGATION_PROGRESS = 60
REBOOT_CLICK_PROGRESS = 70
REBOOT_SENT_PROGRESS = 75
RECONNECT_LOG_EVERY_N_ATTEMPTS = 3
USERNAME_FIELD_ID = "username"
PASSWORD_FIELD_ID = "password"
LOGIN_BUTTON_ID = "login"
LOGOUT_BUTTON_CLASS = "logout-btn"
REBOOT_BUTTON_ID = "reboot"
REBOOT_PAGE_PATH = "maintenance_globe.cgi?reboot"
CHECKING_CONNECTION_MESSAGE = "Checking connection to router..."


def _log_ts() -> str:
    """Server-side ISO 8601 timestamp for log events."""
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"


def _build_waiting_message(countdown: int) -> str:
    """Human-readable wait message for the initial reboot hold period."""
    return f"Waiting for device to reboot ({countdown} seconds)"


def _build_driver() -> webdriver.Chrome:
    """Create a Chrome driver using Selenium's built-in driver manager.
    No network calls needed after first run — works offline."""
    options = webdriver.ChromeOptions()
    if os.getenv("REBOOT_SELENIUM_HEADLESS", "true").lower() == "true":
        options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-proxy-server")

    return webdriver.Chrome(options=options)


def _login_to_router(
    driver: webdriver.Chrome,
    router_url: str,
    username: str,
    password: str,
) -> None:
    """Open the router page and submit the login form."""
    driver.get(router_url)

    WebDriverWait(driver, WAIT_TIME_SECONDS).until(
        EC.presence_of_element_located((By.ID, USERNAME_FIELD_ID))
    )
    elem = driver.find_element(By.ID, USERNAME_FIELD_ID)
    elem.clear()
    elem.send_keys(username)

    elem = driver.find_element(By.ID, PASSWORD_FIELD_ID)
    elem.clear()
    elem.send_keys(password)

    WebDriverWait(driver, WAIT_TIME_SECONDS).until(
        EC.element_to_be_clickable((By.ID, LOGIN_BUTTON_ID))
    )
    driver.find_element(By.ID, LOGIN_BUTTON_ID).click()


def _emit_waiting_feedback(emit_state, emit_countdown, log_progress) -> None:
    """Emit the initial WAITING state once the reboot command is considered sent."""
    waiting_message = _build_waiting_message(COUNTDOWN_SECONDS)
    log_progress("progress", waiting_message)
    emit_state("WAITING", waiting_message, WAITING_PROGRESS_START)
    emit_countdown(COUNTDOWN_SECONDS)


def _start_delayed_driver_shutdown(driver: webdriver.Chrome) -> None:
    """Delay browser shutdown so the modem has time to process the reboot request."""

    def _quit_driver_delayed(drv):
        time.sleep(DRIVER_QUIT_DELAY_SECONDS)
        try:
            drv.quit()
        except Exception:
            pass

    threading.Thread(target=_quit_driver_delayed, args=(driver,), daemon=True).start()


async def _emit_command_event(event: dict) -> None:
    """Attach the reboot command id to an event before broadcasting it."""
    await emit({**event, "command": COMMAND_ID})


async def _emit_command_state(state: str, message: str, progress: int, **extra) -> None:
    """Emit a state update for the reboot workflow."""
    await _emit_command_event(
        {
            "type": "state",
            "state": state,
            "message": message,
            "progress": progress,
            **extra,
        }
    )


async def _emit_command_log(level: str, message: str) -> None:
    """Emit a log entry for the reboot workflow."""
    await _emit_command_event(
        {
            "type": "log",
            "level": level,
            "message": message,
            "timestamp": _log_ts(),
        }
    )


async def _emit_command_countdown(countdown: int) -> None:
    """Emit a countdown update for the reboot workflow."""
    await _emit_command_event(
        {
            "type": "countdown",
            "countdown": countdown,
        }
    )


async def _wait_for_router_online(router_url: str) -> bool:
    """Poll the router until it answers HTTP 200 or the retry window expires."""
    attempt = 0
    deadline = time.monotonic() + CONNECTION_CHECK_TIMEOUT

    while time.monotonic() < deadline:
        attempt += 1
        if attempt % RECONNECT_LOG_EVERY_N_ATTEMPTS == 0:
            await _emit_command_log(
                "checking",
                f"Checking connection... (attempt {attempt})",
            )
        try:
            req = urllib.request.Request(
                router_url,
                headers={"User-Agent": "Mozilla/5.0"},
            )
            with urllib.request.urlopen(req, timeout=HTTP_REQUEST_TIMEOUT) as resp:
                if resp.status == 200:
                    return True
        except Exception:
            pass
        await asyncio.sleep(CONNECTION_CHECK_INTERVAL)

    return False


def _run_selenium_blocking(main_loop: asyncio.AbstractEventLoop) -> str | None:
    """
    Run Selenium in a worker thread and emit events back into the main asyncio loop.
    Returns ROUTER_URL if the reboot command was issued successfully, else None.
    """

    # Load env here
    router_url = os.getenv("MODEM_URL")
    username = os.getenv("MODEM_USERNAME")
    password = os.getenv("MODEM_PASSWORD")

    if not router_url or not username or not password:
        # Wizard can continue without crashing
        return None

    def _emit_sync(ev: dict):
        payload = {**ev, "command": COMMAND_ID}
        asyncio.run_coroutine_threadsafe(emit(payload), main_loop).result()

    def _emit_state(state: str, message: str, progress: int, **extra):
        _emit_sync(
            {
                "type": "state",
                "state": state,
                "message": message,
                "progress": progress,
                **extra,
            }
        )

    def _emit_countdown(countdown: int):
        _emit_sync({"type": "countdown", "countdown": countdown})

    def _log(level: str, message: str):
        _emit_sync(
            {
                "type": "log",
                "level": level,
                "message": message,
                "timestamp": _log_ts(),
            }
        )

    driver = None

    try:
        driver = _build_driver()

        # 1. Navigate to router login page
        driver.get(router_url)
        _log("header", "Reboot Process Started")

        # 2-4. Fill credentials and submit login form
        _login_to_router(driver, router_url, username, password)

        # 5. Verify login success
        try:
            WebDriverWait(driver, WAIT_TIME_SECONDS).until(
                EC.presence_of_element_located((By.CLASS_NAME, LOGOUT_BUTTON_CLASS))
            )
            _log("success", "Login successful")
            _emit_state("LOGGING_IN", "Login successful", LOGIN_SUCCESS_PROGRESS)
        except TimeoutException:
            _log("error", "Login failed")
            _emit_state("FAILED", "Login failed", 0)
            driver.quit()
            return None

        # 6. Navigate directly to the Reboot page
        driver.get(router_url + REBOOT_PAGE_PATH)
        _log("navigate", "Navigated to Reboot tab")
        _emit_state("NAVIGATING", "Navigated to Reboot tab", NAVIGATION_PROGRESS)

        # 7. Click reboot button
        WebDriverWait(driver, WAIT_TIME_SECONDS).until(
            EC.element_to_be_clickable((By.ID, REBOOT_BUTTON_ID))
        ).click()
        _emit_state("REBOOTING", "Reboot button clicked", REBOOT_CLICK_PROGRESS)

        # 8. Accept reboot confirmation alert
        WebDriverWait(driver, ALERT_WAIT_SECONDS).until(EC.alert_is_present())
        alert = driver.switch_to.alert
        # alert.accept()
        _log("action", "Reboot command sent")
        _emit_state("REBOOTING", "Reboot command sent", REBOOT_SENT_PROGRESS)

        # 9. Emit WAITING + single log immediately (give user feedback)
        _emit_waiting_feedback(_emit_state, _emit_countdown, _log)

        # 10. Quit driver in a background thread so the modem has time to process
        #     the reboot command before the TCP connection is closed.
        _start_delayed_driver_shutdown(driver)
        driver = None  # Prevent double quit in finally

        # Return URL so async block can use it for connection check
        return router_url

    except Exception as e:
        _emit_state("FAILED", str(e), 0)
        _log("error", str(e))
        return None
    finally:
        if driver:
            try:
                driver.quit()
            except Exception:
                pass
            current_state = get_state().get("state")
            if current_state not in ("WAITING", "FAILED"):
                _emit_waiting_feedback(_emit_state, _emit_countdown, _log)


async def run_reboot_workflow() -> None:
    """
    Run login + reboot in a thread, then countdown (badge only) and connection check in async.
    Countdown ticks update StatusBadge only; log panel gets start/end and every 3rd connection attempt.
    """
    reset_state()
    loop = asyncio.get_running_loop()
    executor = concurrent.futures.ThreadPoolExecutor(max_workers=1)

    # Run Selenium reboot and capture ROUTER_URL
    future = loop.run_in_executor(executor, lambda: _run_selenium_blocking(loop))
    router_url = await future

    if not router_url:
        # Skip connection check safely if .env missing
        return

    # Countdown: every second emit state + countdown only (NO log per second)
    for remaining in range(COUNTDOWN_SECONDS - 1, -1, -1):
        await asyncio.sleep(1)
        progress = WAITING_PROGRESS_START + int(
            (WAITING_PROGRESS_END - WAITING_PROGRESS_START)
            * (COUNTDOWN_SECONDS - remaining)
            / COUNTDOWN_SECONDS
        )
        await _emit_command_state(
            "WAITING",
            f"Device rebooting... {remaining}s remaining",
            min(progress, WAITING_PROGRESS_END),
        )
        await _emit_command_countdown(remaining)

    # Transition to checking connection (one log entry)
    await _emit_command_state(
        "CHECKING_CONNECTION",
        CHECKING_CONNECTION_MESSAGE,
        WAITING_PROGRESS_END,
    )
    await _emit_command_log("checking", CHECKING_CONNECTION_MESSAGE)

    # Try to reach router every 5 seconds; log every 3rd attempt only
    if await _wait_for_router_online(router_url):
        await _emit_command_state(
            "ONLINE",
            "ONLINE",
            100,
            countdown=None,
        )
        await _emit_command_log("success", "Device is back online!")
        return

    await _emit_command_state(
        "FAILED",
        "Failed to reconnect after 2 minutes",
        0,
    )
    await _emit_command_log("error", "Failed to reconnect after 2 minutes")

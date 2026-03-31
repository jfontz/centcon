"""
Selenium automation for router login only.

Opens a visible Chrome window, logs in with stored credentials, and leaves the
session open so the user can manually inspect or change router settings.
All notable steps and errors are emitted as log events via state_manager.
"""

import asyncio
import concurrent.futures
import os
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from selenium import webdriver
from selenium.common.exceptions import TimeoutException, WebDriverException
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

from state_manager import emit, reset_state

# Load environment
ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env")
COMMAND_ID = "login"
WAIT_TIME_SECONDS = 10
USERNAME_FIELD_ID = "username"
PASSWORD_FIELD_ID = "password"
LOGIN_BUTTON_ID = "login"
LOGOUT_BUTTON_CLASS = "logout-btn"
BROWSER_CLOSED_INDICATORS = [
    "invalid session id",
    "browser has closed",
    "no such window",
    "target window already closed",
    "web view not found",
]


def _log_ts() -> str:
    """Server-side ISO 8601 timestamp for log events."""
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"


def _build_driver() -> webdriver.Chrome:
    """Create a Chrome driver using Selenium's built-in driver manager.
    No network calls needed after first run — works offline."""
    options = webdriver.ChromeOptions()
    # IMPORTANT: Never run headless for login - user must see and control the browser.
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--no-proxy-server")

    return webdriver.Chrome(options=options)


def _safe_quit(driver: webdriver.Chrome | None) -> None:
    if not driver:
        return
    try:
        driver.quit()
    except Exception:
        pass


def _run_login_blocking(
    main_loop: asyncio.AbstractEventLoop,
    router_url: str,
    username: str,
    password: str,
) -> None:
    """Run login in a thread; browser stays open after login for manual control."""

    def _emit_sync(ev: dict):
        payload = {**ev, "command": COMMAND_ID}
        asyncio.run_coroutine_threadsafe(emit(payload), main_loop).result()

    def _emit_state(state: str, message: str):
        _emit_sync(
            {
                "type": "state",
                "state": state,
                "message": message,
            }
        )

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

        _log("header", "Login process started")
        _emit_state("RUNNING", "Opening browser")

        # Navigate to router login page
        driver.get(router_url)
        _emit_state("LOGGING_IN", "Logging into router")

        # Wait for and fill username field
        WebDriverWait(driver, WAIT_TIME_SECONDS).until(
            EC.presence_of_element_located((By.ID, USERNAME_FIELD_ID))
        )
        elem = driver.find_element(By.ID, USERNAME_FIELD_ID)
        elem.clear()
        elem.send_keys(username)

        # Fill password field
        elem = driver.find_element(By.ID, PASSWORD_FIELD_ID)
        elem.clear()
        elem.send_keys(password)

        # Click login button
        WebDriverWait(driver, WAIT_TIME_SECONDS).until(
            EC.element_to_be_clickable((By.ID, LOGIN_BUTTON_ID))
        )
        driver.find_element(By.ID, LOGIN_BUTTON_ID).click()

        # Verify login success
        try:
            WebDriverWait(driver, WAIT_TIME_SECONDS).until(
                EC.presence_of_element_located((By.CLASS_NAME, LOGOUT_BUTTON_CLASS))
            )
            _emit_state(
                "SUCCEEDED",
                "Browser opened and logged in",
            )
            _log("success", "Login successful - Browser left open for manual control")
        except TimeoutException:
            _emit_state("FAILED", "Login failed")
            _log("error", "Login failed - Invalid credentials or timeout")
            _safe_quit(driver)
            return

        # DO NOT quit driver - leave browser open for user
        # User will manually close the browser when done

    except WebDriverException as e:
        # Handle browser-related errors (e.g., user closed browser)
        error_msg = str(e).lower()

        if any(indicator in error_msg for indicator in BROWSER_CLOSED_INDICATORS):
            _emit_state("FAILED", "Browser was closed by user")
            _log("warning", "Login cancelled - Browser was closed by user")
        else:
            clean_msg = str(e).split("Stacktrace:")[0].strip()
            _emit_state("FAILED", clean_msg)
            _log("error", f"Browser error: {clean_msg}")

        _safe_quit(driver)

    except Exception as e:
        # Handle other errors with cleaner message
        error_msg = str(e).split("Stacktrace:")[0].strip()
        _emit_state("FAILED", error_msg)
        _log("error", f"Login failed: {error_msg}")
        _safe_quit(driver)


async def run_login_workflow() -> None:
    """
    Run login in a thread, leave browser open.
    No countdown, no connection checking - just login and done.
    """

    # Load env
    router_url = os.getenv("ROUTER_URL")
    username = os.getenv("ROUTER_USERNAME")
    password = os.getenv("ROUTER_PASSWORD")

    if not router_url or not username or not password:
        raise RuntimeError("Missing router credentials in .env")

    reset_state()
    loop = asyncio.get_running_loop()
    executor = concurrent.futures.ThreadPoolExecutor(max_workers=1)

    # Pass env vars into blocking function
    future = loop.run_in_executor(
        executor,
        lambda: _run_login_blocking(loop, router_url, username, password),
    )
    await future

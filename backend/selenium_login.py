"""
Selenium automation for router login only.
Opens browser, logs in, and leaves window open for manual control.
Emits structured events to state_manager for SSE broadcast.
"""

import asyncio
import os
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.common.exceptions import TimeoutException, WebDriverException
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from webdriver_manager.chrome import ChromeDriverManager

from state_manager import emit, reset_state

# Load environment
ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env")

ROUTER_URL = os.getenv("MODEM_URL")
USERNAME = os.getenv("MODEM_USERNAME")
PASSWORD = os.getenv("MODEM_PASSWORD")

if not ROUTER_URL or not USERNAME or not PASSWORD:
    raise RuntimeError("Missing router credentials in .env")


def _log_ts() -> str:
    """Server-side ISO 8601 timestamp for log events."""
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"


def _run_login_blocking(main_loop: asyncio.AbstractEventLoop) -> None:
    """Run login in a thread; browser stays open after login."""

    def _emit_sync(ev: dict):
        asyncio.run_coroutine_threadsafe(emit(ev), main_loop).result()

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
    wait_time = 10

    try:
        options = webdriver.ChromeOptions()
        # IMPORTANT: Never run headless for login - user needs to see the browser
        # options.add_argument("--headless=new")  # DON'T USE THIS
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")

        driver = webdriver.Chrome(
            service=Service(ChromeDriverManager().install()), options=options
        )
        driver.implicitly_wait(wait_time)

        _log("header", "Login process started")

        # Navigate to router login page
        driver.get(ROUTER_URL)

        # Wait for and fill username field
        WebDriverWait(driver, wait_time).until(
            EC.presence_of_element_located((By.ID, "username"))
        )
        elem = driver.find_element(By.ID, "username")
        elem.clear()
        elem.send_keys(USERNAME)

        # Fill password field
        elem = driver.find_element(By.ID, "password")
        elem.clear()
        elem.send_keys(PASSWORD)

        # Click login button
        WebDriverWait(driver, wait_time).until(
            EC.element_to_be_clickable((By.ID, "login"))
        )
        login_button = driver.find_element(By.ID, "login")
        login_button.click()

        # Verify login success
        try:
            WebDriverWait(driver, wait_time).until(
                EC.presence_of_element_located((By.CLASS_NAME, "logout-btn"))
            )
            _log("success", "Login successful - Browser left open for manual control")
        except TimeoutException:
            _log("error", "Login failed - Invalid credentials or timeout")
            if driver:
                driver.quit()
            return

        # DO NOT quit driver - leave browser open for user
        # User will manually close the browser when done

    except WebDriverException as e:
        # Handle browser-related errors (e.g., user closed browser)
        error_msg = str(e).lower()

        # Check if user closed the browser (various error messages)
        browser_closed_indicators = [
            "invalid session id",
            "browser has closed",
            "no such window",
            "target window already closed",
            "web view not found",
        ]

        if any(indicator in error_msg for indicator in browser_closed_indicators):
            _log("warning", "Login cancelled - Browser was closed by user")
        else:
            # Strip stacktrace for cleaner error message
            clean_msg = str(e).split("Stacktrace:")[0].strip()
            _log("error", f"Browser error: {clean_msg}")

        if driver:
            try:
                driver.quit()
            except:
                pass

    except Exception as e:
        # Handle other errors with cleaner message
        error_msg = str(e).split("Stacktrace:")[0].strip()
        _log("error", f"Login failed: {error_msg}")

        if driver:
            try:
                driver.quit()
            except:
                pass


async def run_login_workflow() -> None:
    """
    Run login in a thread, leave browser open.
    No countdown, no connection checking - just login and done.
    """
    import concurrent.futures

    reset_state()
    loop = asyncio.get_running_loop()
    executor = concurrent.futures.ThreadPoolExecutor(max_workers=1)

    future = loop.run_in_executor(executor, lambda: _run_login_blocking(loop))
    await future
    
# TODO: Review icon mappings and replace placeholders with final production icons when available.
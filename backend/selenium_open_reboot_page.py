"""
Experimental Selenium automation that logs into the router and opens the reboot
page, then leaves the browser open for manual inspection.
"""

import asyncio
import os
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from selenium import webdriver
from selenium.common.exceptions import TimeoutException, WebDriverException
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from webdriver_manager.chrome import ChromeDriverManager

from state_manager import emit, reset_state

ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env")

COMMAND_ID = "open-reboot-page"


def _log_ts() -> str:
    """Server-side ISO 8601 timestamp for log events."""
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"


def _run_open_reboot_page_blocking(
    main_loop: asyncio.AbstractEventLoop,
    router_url: str,
    username: str,
    password: str,
) -> None:
    """Run the experimental command in a thread and leave the browser open."""

    def _emit_sync(event: dict):
        payload = {**event, "command": COMMAND_ID}
        asyncio.run_coroutine_threadsafe(emit(payload), main_loop).result()

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
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")

        driver = webdriver.Chrome(
            service=Service(ChromeDriverManager().install()), options=options
        )
        driver.implicitly_wait(wait_time)

        _emit_sync(
            {
                "type": "state",
                "state": "RUNNING",
                "message": "Opening browser",
                "progress": 5,
            }
        )
        _log("header", "Experimental command started")

        driver.get(router_url)
        _emit_sync(
            {
                "type": "state",
                "state": "LOGGING_IN",
                "message": "Logging into modem",
                "progress": 20,
            }
        )

        WebDriverWait(driver, wait_time).until(
            EC.presence_of_element_located((By.ID, "username"))
        )
        elem = driver.find_element(By.ID, "username")
        elem.clear()
        elem.send_keys(username)

        elem = driver.find_element(By.ID, "password")
        elem.clear()
        elem.send_keys(password)

        WebDriverWait(driver, wait_time).until(
            EC.element_to_be_clickable((By.ID, "login"))
        )
        driver.find_element(By.ID, "login").click()

        try:
            WebDriverWait(driver, wait_time).until(
                EC.presence_of_element_located((By.CLASS_NAME, "logout-btn"))
            )
            _log("success", "Login successful")
        except TimeoutException:
            _emit_sync(
                {
                    "type": "state",
                    "state": "FAILED",
                    "message": "Login failed",
                    "progress": 0,
                }
            )
            _log("error", "Experimental command failed during login")
            driver.quit()
            return

        driver.get(router_url + "maintenance_globe.cgi?reboot")
        _emit_sync(
            {
                "type": "state",
                "state": "SUCCEEDED",
                "message": "Reboot page opened",
                "progress": 100,
            }
        )
        _log("navigate", "Opened reboot page and left browser open")

    except WebDriverException as e:
        error_msg = str(e).lower()
        browser_closed_indicators = [
            "invalid session id",
            "browser has closed",
            "no such window",
            "target window already closed",
            "web view not found",
        ]

        if any(indicator in error_msg for indicator in browser_closed_indicators):
            _emit_sync(
                {
                    "type": "state",
                    "state": "FAILED",
                    "message": "Browser was closed by user",
                    "progress": 0,
                }
            )
            _log("warning", "Experimental command cancelled by user")
        else:
            clean_msg = str(e).split("Stacktrace:")[0].strip()
            _emit_sync(
                {
                    "type": "state",
                    "state": "FAILED",
                    "message": clean_msg,
                    "progress": 0,
                }
            )
            _log("error", f"Browser error: {clean_msg}")

        if driver:
            try:
                driver.quit()
            except Exception:
                pass

    except Exception as e:
        error_msg = str(e).split("Stacktrace:")[0].strip()
        _emit_sync(
            {
                "type": "state",
                "state": "FAILED",
                "message": error_msg,
                "progress": 0,
            }
        )
        _log("error", f"Experimental command failed: {error_msg}")

        if driver:
            try:
                driver.quit()
            except Exception:
                pass


async def run_open_reboot_page_workflow() -> None:
    """Run the experimental flow in a thread and leave the browser open."""
    import concurrent.futures

    router_url = os.getenv("MODEM_URL")
    username = os.getenv("MODEM_USERNAME")
    password = os.getenv("MODEM_PASSWORD")

    if not router_url or not username or not password:
        raise RuntimeError("Missing router credentials in .env")

    reset_state()
    loop = asyncio.get_running_loop()
    executor = concurrent.futures.ThreadPoolExecutor(max_workers=1)

    future = loop.run_in_executor(
        executor,
        lambda: _run_open_reboot_page_blocking(loop, router_url, username, password),
    )
    await future


# TODO: Remove this experimental command and related code after testing is complete, or move to a separate file for future reference.
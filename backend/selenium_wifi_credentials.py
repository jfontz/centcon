"""
Selenium workflow for changing Wi-Fi credentials on the Globe G-1426G-A router.
Handles 2.4 GHz and 5 GHz SSIDs independently in a single session with one save.
"""

import asyncio
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

ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env")

COMMAND_ID = "wifi-credentials"

# Element IDs
ID_24G_SSID_NUM = "24gSsidNum"
ID_24G_SSID_SELECTIZED = "24gSsidNum-selectized"
ID_24G_WIFI_NAME = "24gWifiName"
ID_24G_WIFI_PASS = "24gWifiPass"

ID_5G_SSID_NUM = "5gSsidNum"
ID_5G_SSID_SELECTIZED = "5gSsidNum-selectized"
ID_5G_WIFI_NAME = "5gWifiName"
ID_5G_WIFI_PASS = "5gWifiPass"

# Default SSID numbers shown on page load — no dropdown interaction needed for these
DEFAULT_SSID_24G = "1"
DEFAULT_SSID_5G = "5"
ADVANCED_URL_SUFFIX = "wifi_globe.cgi?advanced"
ID_TOGGLE_PREFIX = "unsteerToggleSwitchSsid"


def _log_ts() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"


def _run_wifi_credentials_blocking(
    main_loop: asyncio.AbstractEventLoop,
    router_url: str,
    username: str,
    password: str,
    targets: list[dict],
) -> None:
    """
    targets: list of dicts, each with:
        ssid_index  (int)  0-7
        freq        (str)  "2.4" or "5"
        router_index (str)  "1"-"4" for 2.4, "5"-"8" for 5
        new_name    (str)  new Wi-Fi name, or "" to keep current
        new_pass    (str)  new password, or "" to keep current
        broadcast_intent (str | None) "enable" | "disable" | None
    """

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

    def _expand_advanced_settings(driver, wait, band_label: str):
        """Click the Advanced Settings toggle for a given band label."""
        toggles = driver.find_elements(By.CSS_SELECTOR, "strong.label")
        for toggle in toggles:
            if toggle.text.strip() == "Advanced Settings":
                parent = toggle.find_element(By.XPATH, "..")
                parent_class = parent.get_attribute("class") or ""
                if ":base-active" not in parent_class:
                    toggle.click()
                    import time
                    time.sleep(0.5)
                break
        _log("info", f"Advanced Settings expanded for {band_label}")

    def _select_ssid_via_selectize(
        driver, wait, select_id: str, value: str, name_field_id: str
    ):
        """
        Select an SSID number via Selectize.js using its JavaScript API.
        Waits for the Wi-Fi Name field to update before returning.
        """
        name_field = driver.find_element(By.ID, name_field_id)
        original_value = name_field.get_attribute("value")

        driver.execute_script(
            "document.getElementById(arguments[0]).selectize.setValue(arguments[1])",
            select_id,
            value,
        )

        wait.until(
            lambda d: d.find_element(By.ID, name_field_id).get_attribute("value")
            != original_value
        )

    def _fill_field(driver, field_id: str, value: str):
        """Clear a field and type a new value."""
        field = driver.find_element(By.ID, field_id)
        field.clear()
        field.send_keys(value)

    def _reconcile_broadcast_toggle(driver, router_index: str, intent: str):
        """
        Check current broadcast toggle state and click only if it doesn't match intent.
        router_index: "1"–"8"
        intent: "enable" or "disable"
        """
        toggle_id = f"{ID_TOGGLE_PREFIX}{router_index}"
        toggle = driver.find_element(By.ID, toggle_id)
        classes = toggle.get_attribute("class") or ""
        is_active = "-active" in classes

        if intent == "enable" and not is_active:
            toggle.click()
            _log("info", f"Broadcast enabled for SSID {router_index}")
        elif intent == "disable" and is_active:
            toggle.click()
            _log("info", f"Broadcast disabled for SSID {router_index}")
        else:
            state = "on" if is_active else "off"
            _log("info", f"SSID {router_index} broadcast already {state} — skipped")

    def _handle_advanced_broadcast(
        driver, wait, router_url: str, targets_with_intent: list[dict]
    ):
        """Navigate to Advanced page and reconcile broadcast toggles."""
        driver.get(router_url + ADVANCED_URL_SUFFIX)
        wait.until(EC.presence_of_element_located((By.ID, f"{ID_TOGGLE_PREFIX}1")))
        _log("navigate", "Opened Wi-Fi Settings → Advanced")

        any_changed = False
        for t in targets_with_intent:
            intent = t.get("broadcast_intent")
            if not intent:
                continue
            router_index = str(t["router_index"])
            _reconcile_broadcast_toggle(driver, router_index, intent)
            any_changed = True

        if any_changed:
            confirm_btn = driver.find_element(
                By.CSS_SELECTOR, "input.button.-primary[value='Confirm']"
            )
            confirm_btn.click()
            _log("progress", "Clicking Confirm — waiting for router to apply")
            wait_save = WebDriverWait(driver, 60)
            try:
                wait_save.until(EC.staleness_of(confirm_btn))
                wait_save.until(
                    EC.presence_of_element_located((By.ID, f"{ID_TOGGLE_PREFIX}1"))
                )
                _log("success", "Broadcast changes saved")
            except TimeoutException:
                _log(
                    "success",
                    "Broadcast changes applied (page reload timed out — this is normal)",
                )

    driver = None
    wait_time = 15
    has_cred_changes = any(t.get("new_name") or t.get("new_pass") for t in targets)
    has_broadcast_intents = any(t.get("broadcast_intent") for t in targets)

    try:
        options = webdriver.ChromeOptions()
        if os.getenv("WIFI_SELENIUM_HEADLESS", "true").lower() == "true":
            options.add_argument("--headless=new")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument("--no-proxy-server")

        # Selenium's built-in driver manager handles ChromeDriver automatically.
        # No network calls needed after first run — works offline.
        driver = webdriver.Chrome(options=options)
        driver.implicitly_wait(wait_time)
        wait = WebDriverWait(driver, wait_time)

        # ── State: starting ──────────────────────────────────────────────────
        _emit_sync({"type": "state", "state": "RUNNING", "message": "Opening browser", "progress": 5})
        _log("header", "Wi-Fi credential change started")

        # ── Login ────────────────────────────────────────────────────────────
        driver.get(router_url)
        _emit_sync({"type": "state", "state": "LOGGING_IN", "message": "Logging into router", "progress": 15})

        wait.until(EC.presence_of_element_located((By.ID, "username")))
        elem = driver.find_element(By.ID, "username")
        elem.clear()
        elem.send_keys(username)

        elem = driver.find_element(By.ID, "password")
        elem.clear()
        elem.send_keys(password)

        wait.until(EC.element_to_be_clickable((By.ID, "login")))
        driver.find_element(By.ID, "login").click()

        try:
            wait.until(EC.presence_of_element_located((By.CLASS_NAME, "logout-btn")))
            _log("success", "Login successful")
        except TimeoutException:
            _emit_sync({"type": "state", "state": "FAILED", "message": "Login failed", "progress": 0})
            _log("error", "Login failed — check credentials in .env")
            driver.quit()
            return

        if has_cred_changes:
            # ── Navigate to Wi-Fi Basic ──────────────────────────────────────────
            _emit_sync({"type": "state", "state": "RUNNING", "message": "Navigating to Wi-Fi Settings", "progress": 25})
            driver.get(router_url + "wifi_globe.cgi?basic")
            wait.until(EC.presence_of_element_located((By.ID, ID_24G_WIFI_NAME)))
            _log("navigate", "Opened Wi-Fi Settings → Basic")

            # ── Separate targets by band ─────────────────────────────────────────
            target_24g = next((t for t in targets if t["freq"] == "2.4"), None)
            target_5g = next((t for t in targets if t["freq"] == "5"), None)

            # ── Handle 2.4 GHz ──────────────────────────────────────────────────
            if target_24g:
                router_index = str(target_24g["router_index"])
                if router_index != DEFAULT_SSID_24G:
                    _log("action", f"Expanding Advanced Settings for 2.4 GHz")
                    _expand_advanced_settings(driver, wait, "2.4 GHz")
                    _log("action", f"Selecting SSID {router_index} on 2.4 GHz")
                    _emit_sync({"type": "state", "state": "RUNNING", "message": f"Selecting 2.4 GHz SSID {router_index}", "progress": 40})
                    _select_ssid_via_selectize(driver, wait, ID_24G_SSID_NUM, router_index, ID_24G_WIFI_NAME)
                    _log("info", f"2.4 GHz SSID {router_index} selected")
                else:
                    _log("info", f"Using default 2.4 GHz SSID {router_index}")

                if target_24g.get("new_name"):
                    _fill_field(driver, ID_24G_WIFI_NAME, target_24g["new_name"])
                    _log("info", f"Wi-Fi name set for 2.4 GHz SSID {router_index}")

                if target_24g.get("new_pass"):
                    _fill_field(driver, ID_24G_WIFI_PASS, target_24g["new_pass"])
                    _log("info", f"Password set for 2.4 GHz SSID {router_index}")

            # ── Handle 5 GHz ────────────────────────────────────────────────────
            if target_5g:
                router_index = str(target_5g["router_index"])
                if router_index != DEFAULT_SSID_5G:
                    _log("action", f"Expanding Advanced Settings for 5 GHz")
                    _expand_advanced_settings(driver, wait, "5 GHz")
                    _log("action", f"Selecting SSID {router_index} on 5 GHz")
                    _emit_sync({"type": "state", "state": "RUNNING", "message": f"Selecting 5 GHz SSID {router_index}", "progress": 60})
                    _select_ssid_via_selectize(driver, wait, ID_5G_SSID_NUM, router_index, ID_5G_WIFI_NAME)
                    _log("info", f"5 GHz SSID {router_index} selected")
                else:
                    _log("info", f"Using default 5 GHz SSID {router_index}")

                if target_5g.get("new_name"):
                    _fill_field(driver, ID_5G_WIFI_NAME, target_5g["new_name"])
                    _log("info", f"Wi-Fi name set for 5 GHz SSID {router_index}")

                if target_5g.get("new_pass"):
                    _fill_field(driver, ID_5G_WIFI_PASS, target_5g["new_pass"])
                    _log("info", f"Password set for 5 GHz SSID {router_index}")

            # ── Save Changes ─────────────────────────────────────────────────────
            _emit_sync({"type": "state", "state": "RUNNING", "message": "Saving changes", "progress": 80})
            _log("progress", "Clicking Save Changes — waiting for router to apply")

            save_btn = driver.find_element(
                By.CSS_SELECTOR, "input.button.-primary[value='Save Changes']"
            )
            save_btn.click()

            wait_save = WebDriverWait(driver, 30)
            # Wait for page to reload (save takes ~10s — router rerenders the page when done)
            wait_save.until(EC.staleness_of(save_btn))
            wait_save.until(EC.presence_of_element_located((By.ID, ID_24G_WIFI_NAME)))
            _log("success", "Changes saved successfully")

        if has_broadcast_intents:
            _emit_sync({"type": "state", "state": "RUNNING", "message": "Updating broadcast settings", "progress": 85})
            _handle_advanced_broadcast(driver, wait, router_url, targets)

        _emit_sync({"type": "state", "state": "ONLINE", "message": "Wi-Fi credentials updated", "progress": 100})
        driver.quit()

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
            _emit_sync({"type": "state", "state": "FAILED", "message": "Browser was closed by user", "progress": 0})
            _log("warning", "Workflow cancelled — browser was closed")
        else:
            clean_msg = str(e).split("Stacktrace:")[0].strip()
            _emit_sync({"type": "state", "state": "FAILED", "message": clean_msg, "progress": 0})
            _log("error", f"Browser error: {clean_msg}")

        if driver:
            try:
                driver.quit()
            except Exception:
                pass

    except Exception as e:
        error_msg = str(e).split("Stacktrace:")[0].strip()
        _emit_sync({"type": "state", "state": "FAILED", "message": error_msg, "progress": 0})
        _log("error", f"Workflow failed: {error_msg}")

        if driver:
            try:
                driver.quit()
            except Exception:
                pass


async def run_wifi_credentials_workflow(targets: list[dict]) -> None:
    import concurrent.futures

    router_url = os.getenv("ROUTER_URL")
    username = os.getenv("ROUTER_USERNAME")
    password = os.getenv("ROUTER_PASSWORD")

    if not router_url or not username or not password:
        raise RuntimeError("Missing router credentials in .env")

    reset_state()
    loop = asyncio.get_running_loop()
    executor = concurrent.futures.ThreadPoolExecutor(max_workers=1)

    await loop.run_in_executor(
        executor,
        lambda: _run_wifi_credentials_blocking(
            loop, router_url, username, password, targets
        ),
    )
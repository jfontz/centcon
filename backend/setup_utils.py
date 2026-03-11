"""
Utilities for first-run setup wizard.
Handles validation, auto-detection, and .env file updates.
"""

import os
import socket
import subprocess
from pathlib import Path
from typing import Dict, List, Tuple
from dotenv import load_dotenv, set_key

ROOT_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = ROOT_DIR / ".env"
DEFAULT_GATEWAY_TIMEOUT = 5
MODEM_PROBE_TIMEOUT = 2
DEFAULT_HTTP_PORT = 80
COMMON_MODEM_IPS = ["192.168.254.254", "192.168.1.1", "192.168.0.1", "10.0.0.1"]

# Required environment variables
SETUP_VARS = {
    # Modem
    "MODEM_IP": {"desc": "IP address of your modem", "default": None},
    "MODEM_USERNAME": {"desc": "Username for modem login", "default": "admin"},
    "MODEM_PASSWORD": {"desc": "Password for modem login", "default": ""},
    # Centcon PIN
    "CENTCON_PIN": {"desc": "4-character PIN for CENTCON access", "default": None},
    # Frontend
    "VITE_MODEM_IP": {
        "desc": "Exposed modem IP for frontend",
        "default": None,
    },  # will copy MODEM_IP
    "VITE_AUTO_REFRESH_INTERVAL": {
        "desc": "Frontend auto-refresh interval (ms)",
        "default": "60000",
    },
    "VITE_BACKEND_URL": {
        "desc": "Backend API URL",
        "default": "http://localhost:8000",
    },
    # Backend
    "API_HOST": {"desc": "Backend network interface", "default": "0.0.0.0"},
    "API_PORT": {"desc": "Backend API port", "default": "8000"},
    # CORS
    "CORS_ORIGINS": {
        "desc": "Allowed frontend origins",
        "default": "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000",
    },
    # Authentication
    "CENTCON_SHOW_LOGIN": {"desc": "Show login page on startup", "default": "true"},
    # Selenium
    "REBOOT_SELENIUM_HEADLESS": {
        "desc": "Run browser in headless mode for reboot automation",
        "default": "true",
    },
    "WIFI_SELENIUM_HEADLESS": {
        "desc": "Run browser in headless mode for Wi-Fi credentials automation",
        "default": "true",
    },
}


def load_env():
    """Load environment variables from .env file."""
    if ENV_FILE.exists():
        load_dotenv(ENV_FILE)


def check_setup_needed() -> Tuple[bool, List[str], List[str]]:
    load_env()
    missing = []
    invalid = []

    for key in SETUP_VARS.keys():
        value = os.getenv(key)
        if not value or value.strip() == "":
            missing.append(key)
        elif key == "MODEM_IP" and not is_valid_ip(value):
            invalid.append(key)
        elif key == "CENTCON_PIN" and not is_valid_pin(value):
            invalid.append(key)

    setup_required = len(missing) > 0 or len(invalid) > 0
    return setup_required, missing, invalid


def is_valid_ip(ip: str) -> bool:
    """Validate IP address format."""
    try:
        parts = ip.split(".")
        return len(parts) == 4 and all(
            part.isdigit() and 0 <= int(part) <= 255 for part in parts
        )
    except Exception:
        return False


def is_valid_pin(pin: str) -> bool:
    """Validate PIN format (4 alphanumeric characters)."""
    return len(pin) == 4 and pin.isalnum()


def auto_detect_modem_ip() -> str:
    """Attempt to auto-detect modem IP."""
    try:
        if os.name == "nt":
            result = subprocess.run(
                ["ipconfig"],
                capture_output=True,
                text=True,
                timeout=DEFAULT_GATEWAY_TIMEOUT,
            )
            for line in result.stdout.split("\n"):
                if "Default Gateway" in line:
                    parts = line.split(":")
                    if len(parts) > 1:
                        ip = parts[1].strip()
                        if is_valid_ip(ip):
                            return ip
        else:
            result = subprocess.run(
                ["ip", "route"],
                capture_output=True,
                text=True,
                timeout=DEFAULT_GATEWAY_TIMEOUT,
            )
            for line in result.stdout.split("\n"):
                if "default via" in line:
                    parts = line.split()
                    if len(parts) > 2:
                        ip = parts[2]
                        if is_valid_ip(ip):
                            return ip
    except Exception:
        pass

    for ip in COMMON_MODEM_IPS:
        if is_modem_reachable(ip):
            return ip

    return COMMON_MODEM_IPS[0]


def is_modem_reachable(
    ip: str,
    port: int = DEFAULT_HTTP_PORT,
    timeout: int = MODEM_PROBE_TIMEOUT,
) -> bool:
    """Check if modem is reachable at given IP."""
    try:
        with socket.create_connection((ip, port), timeout=timeout):
            return True
    except Exception:
        return False


def get_defaults() -> Dict[str, str]:
    """
    Return defaults for first-run setup.
    If a variable exists in .env, use that value.
    Otherwise, use default or auto-detect.
    """
    load_env()
    defaults = {}

    for key, meta in SETUP_VARS.items():
        # First, use existing .env value if present
        env_val = os.getenv(key)
        if env_val is not None and env_val.strip() != "":
            defaults[key] = env_val
        # Otherwise use the default from SETUP_VARS
        elif meta["default"] is not None:
            defaults[key] = meta["default"]

    # Auto-detect MODEM_IP if missing
    if "MODEM_IP" not in defaults or not defaults["MODEM_IP"]:
        defaults["MODEM_IP"] = auto_detect_modem_ip()

    # Copy MODEM_IP to VITE_MODEM_IP if missing
    if "VITE_MODEM_IP" not in defaults or not defaults["VITE_MODEM_IP"]:
        defaults["VITE_MODEM_IP"] = defaults["MODEM_IP"]

    # CENTCON_PIN: do not generate, leave blank if not set
    if "CENTCON_PIN" not in defaults:
        defaults["CENTCON_PIN"] = ""

    return defaults


def validate_modem_credentials(
    ip: str, username: str, password: str
) -> Tuple[bool, str]:
    """Validate modem credentials by attempting connection."""
    if not is_valid_ip(ip):
        return False, "Invalid IP address format"
    if not is_modem_reachable(ip):
        return False, f"Cannot reach modem at {ip}"
    if not username or not password:
        return False, "Username and password are required"
    return True, ""


def save_to_env(data: Dict[str, str]) -> Tuple[bool, str]:
    """Save validated data to .env file."""
    try:
        if not ENV_FILE.exists():
            ENV_FILE.touch()

        def _validate_setup_value(key: str, value: str) -> Tuple[bool, str | None]:
            if key == "MODEM_IP" and not is_valid_ip(value):
                return False, f"Invalid IP address: {value}"
            if key == "CENTCON_PIN" and value and not is_valid_pin(value):
                return False, "PIN must be exactly 4 alphanumeric characters"
            return True, None

        def _validate_required_creds(payload: Dict[str, str]) -> Tuple[bool, str | None]:
            if all(
                k in payload
                for k in ["MODEM_IP", "MODEM_USERNAME", "MODEM_PASSWORD"]
            ):
                valid, error = validate_modem_credentials(
                    payload["MODEM_IP"],
                    payload["MODEM_USERNAME"],
                    payload["MODEM_PASSWORD"],
                )
                if not valid:
                    return False, error
            return True, None

        for key, value in data.items():
            valid, error = _validate_setup_value(key, value)
            if not valid:
                return False, error or "Invalid configuration value"

        valid, error = _validate_required_creds(data)
        if not valid:
            return False, error or "Invalid modem credentials"

        for key, value in data.items():
            set_key(ENV_FILE, key, value)

        if "MODEM_IP" in data:
            modem_url = f"http://{data['MODEM_IP']}/"
            set_key(ENV_FILE, "MODEM_URL", modem_url)

        return True, "Setup completed successfully"

    except Exception as e:
        return False, f"Failed to save configuration: {str(e)}"


# Descriptions of required fields for frontend / API
REQUIRED_VARS = {k: v["desc"] for k, v in SETUP_VARS.items()}

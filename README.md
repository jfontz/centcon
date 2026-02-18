# Centcon

Real-time modem/router monitoring dashboard with automated modem/router functionality.

**Stack:** React (Vite) frontend · FastAPI backend · Selenium automation · Server-Sent Events

---

## Compatibility

> ⚠️ **The Selenium automation is built specifically for one modem model.** It uses custom navigation logic tailored to that device's admin interface and will not work correctly on other modems without modification.

| Field | Value |
|-------|-------|
| ISP | Globe (Philippines) |
| Device Model | G-1426G-A |
| Software Version | 3TN00802HJLI90 |

If you have a different modem model or firmware version, the reboot automation sequence will likely fail or navigate incorrectly. You would need to update the Selenium logic in the backend to match your modem's admin interface.

---

## Prerequisites

Before you begin, install the following software:

| Tool | Version | Download | Verify |
|------|---------|----------|--------|
| Node.js | 18+ | https://nodejs.org/ | `node --version` |
| Python | 3.10+ | https://www.python.org/downloads/ | `python --version` |
| Google Chrome | Latest | https://www.google.com/chrome/ | Open `chrome://version` |
| Git | Any | https://git-scm.com/downloads | `git --version` |

> **Windows note:** When installing Python, check **"Add Python to PATH"** on the first screen of the installer.

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/jfontz/centcon
cd centcon
```

### 2. Configure Environment Variables

Copy the example environment file and fill in your values:

```bash
# macOS/Linux
cp .env.example .env

# Windows
copy .env.example .env
```

Open `.env` and set the following required values:

| Variable | Description |
|----------|-------------|
| `MODEM_IP` | Your modem's local IP address (e.g. `192.168.0.1`) |
| `MODEM_URL` | Full URL to modem admin page (e.g. `http://192.168.0.1/`) |
| `VITE_MODEM_IP` | Same as `MODEM_IP` — used by the frontend |
| `MODEM_USERNAME` | Modem admin username |
| `MODEM_PASSWORD` | Modem admin password |
| `CENTCON_PIN` | PIN to protect access to the dashboard |

All other values have sensible defaults and do not need to be changed for local development. See `.env.example` for the full list with descriptions.

### 3. Install Frontend Dependencies

From the project root:

```bash
npm install
```

### 4. Set Up the Python Backend

Navigate to the backend directory and create a virtual environment:

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment:

```bash
# Windows (Command Prompt)
.venv\Scripts\activate

# Windows (PowerShell)
.venv\Scripts\Activate.ps1

# macOS/Linux
source .venv/bin/activate
```

You should see `(.venv)` appear in your terminal prompt. Then install dependencies:

```bash
pip install -r requirements.txt
```

This installs FastAPI, Selenium, webdriver-manager, and uvicorn. ChromeDriver is managed automatically.

---

## Running the App

The frontend and backend must be running at the same time — use two separate terminal windows.

**Terminal 1 — Frontend** (from project root):

```bash
npm run dev
```

Runs at `http://localhost:5173`

**Terminal 2 — Backend** (from `backend/` directory, with venv active):

```bash
source .venv/bin/activate   # macOS/Linux
# or
.venv\Scripts\activate      # Windows

python run.py
```

Runs at `http://localhost:8000`

To stop either server, press `Ctrl+C` in its terminal.

---

## Verifying the Setup

Once both servers are running:

1. Open `http://localhost:5173` — you should see the login screen. Enter the `CENTCON_PIN` you set in `.env`.
2. Open `http://localhost:8000/docs` — you should see the FastAPI interactive API docs.
3. On the dashboard, click **"Reboot Modem"** to test the full automation sequence. This will log into your modem and trigger a real reboot — only do this if you're okay with a brief network interruption.

---

## Project Structure

```text
centcon/
├── .env                        ← your local config (not committed)
├── .env.example                ← template with all variables documented
├── .gitignore
├── index.html
├── package.json
├── vite.config.js
│
├── src/                        ← React frontend source
│   ├── App.jsx
│   ├── main.jsx
│   ├── index.css
│   ├── assets/icons/           ← SVG icons + index.js barrel export
│   ├── components/
│   │   ├── buttons/            ← SystemControlButton
│   │   ├── cards/              ← CPU, Memory, LAN, WiFi, etc.
│   │   ├── header/             ← Header, StatusBadge, MetaInfo
│   │   ├── log/                ← LogPanel subcomponents
│   │   ├── modals/             ← RebootConfirmModal
│   │   ├── ui/                 ← Shared layout primitives
│   │   └── *.jsx               ← Top-level section components
│   ├── context/                ← AuthContext, ModemContext
│   ├── hooks/                  ← useModemData
│   ├── pages/                  ← Login page
│   ├── services/               ← authAPI, modemAPI
│   └── utils/                  ← formatters, validators, helpers
│
└── backend/
    ├── run.py                  ← server entry point
    ├── main.py                 ← FastAPI app + route definitions
    ├── state_manager.py        ← SSE state + event emitter
    ├── selenium_reboot.py      ← automated reboot workflow
    ├── selenium_login.py       ← automated login workflow
    ├── requirements.txt
    └── .venv/                  ← Python virtual environment (not committed)
```

---

## Troubleshooting

**`python: command not found`**
Try `python3` instead. On Windows, reinstall Python and ensure "Add to PATH" is checked.

**`pip: command not found`**
Run `python -m pip install --upgrade pip` (or `python3 -m pip ...` on macOS/Linux).

**`Cannot activate virtual environment` (Windows PowerShell)**
Run PowerShell as Administrator and allow script execution:
```powershell
Set-ExecutionPolicy RemoteSigned
```

**`ChromeDriver error` or `Chrome binary not found`**
Ensure Google Chrome is installed in its default location:
- Windows: `C:\Program Files\Google\Chrome\Application\chrome.exe`
- macOS: `/Applications/Google Chrome.app`
- Linux: `/usr/bin/google-chrome`

**`Module not found` errors**
Make sure `(.venv)` is visible in your terminal prompt, then re-run:
```bash
pip install -r requirements.txt
```

**Login page asks for a PIN but I didn't set one**
Open your `.env` file and ensure `CENTCON_PIN` is set to a value. Restart the backend after saving.
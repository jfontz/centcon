# CENTCON

Real-time modem/router monitoring dashboard with one-click automated reboot and assisted modem/router login.

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

### 2. Install Frontend Dependencies

From the project root:

```bash
npm install
```

### 3. Set Up the Python Backend

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

## First-Run Setup

On the first launch, CENTCON will detect that no configuration exists and open a **setup wizard** automatically. You don't need to manually create or edit any files.

The wizard will ask for:

| Field | What it is |
|-------|------------|
| Modem IP Address | The local IP of your modem's admin page (default for Globe: `192.168.254.254`) |
| Modem Username | Your modem's admin username — found on the sticker on your modem |
| Modem Password | Your modem's admin password — same sticker |
| CENTCON PIN | A 4-character PIN *you choose* to protect access to the dashboard |

All values are saved to a `.env` file in the project root. If you ever need to change something after setup — or you forget your PIN — you can open that file directly and edit any value, then restart the app.

---

## Verifying the Setup

Once both servers are running and setup is complete:

1. Open `http://localhost:5173` — you should see the login screen. Enter the `CENTCON_PIN` you set during setup.
2. Open `http://localhost:8000/docs` — you should see the FastAPI interactive API docs.
3. On the dashboard, click **"Reboot Modem"** to test the full automation sequence. This will log into your modem and trigger a real reboot — only do this if you're okay with a brief network interruption.

---

## Project Structure

```text
centcon/
├── .env                        ← your local config (created by setup wizard, not committed)
├── .env.example                ← template with all variables documented
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
│
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   ├── index.css
│   │
│   ├── assets/
│   │   └── icons/              ← SVG icons + index.js barrel export
│   │
│   ├── components/
│   │   ├── buttons/
│   │   │   └── SystemControlButton.jsx
│   │   ├── cards/              ← CPUCard, MemoryCard, LANCard, WiFi24Card, WiFi5Card,
│   │   │                          TemperatureCard, RuntimeCard, DeviceModelCard, DeviceSoftwareCard
│   │   ├── header/
│   │   │   ├── Header.jsx
│   │   │   ├── HeaderButton.jsx
│   │   │   ├── MetaInfo.jsx
│   │   │   └── StatusBadge.jsx
│   │   ├── log/
│   │   │   ├── LogContent.jsx
│   │   │   ├── LogEntry.jsx
│   │   │   └── LogHeader.jsx
│   │   ├── modals/
│   │   │   └── RebootConfirmModal.jsx
│   │   ├── ui/                 ← IconWrapper, MainLayout, MetricCard, SectionContainer
│   │   ├── ConnectedDevices.jsx
│   │   ├── DeviceInformation.jsx
│   │   ├── LogPanel.jsx
│   │   ├── SystemControls.jsx
│   │   └── SystemStatus.jsx
│   │
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── ModemContext.jsx
│   │
│   ├── hooks/
│   │   └── useModemData.js
│   │
│   ├── pages/
│   │   ├── Login.jsx
│   │   └── Setup.jsx           ← first-run setup wizard
│   │
│   ├── services/
│   │   ├── authAPI.js
│   │   ├── modemAPI.js
│   │   └── setupAPI.js
│   │
│   └── utils/
│       ├── formatters.js
│       ├── getIcon.jsx
│       ├── modemHelpers.js
│       └── validators.js
│
└── backend/
    ├── run.py                  ← server entry point
    ├── main.py                 ← FastAPI app + route definitions
    ├── state_manager.py        ← SSE state + event emitter
    ├── selenium_reboot.py      ← automated reboot workflow
    ├── selenium_login.py       ← automated login workflow
    ├── setup_utils.py          ← first-run setup logic + .env management
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

**Setup wizard keeps appearing even after completing setup**
The backend may not have restarted after the `.env` file was written. Stop and restart the backend server.

**Login page asks for a PIN but I forgot it**
Open the `.env` file in the project root — your `CENTCON_PIN` is stored there in plain text. You can also change it there and restart the app.

---

## License

This project is licensed under [Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)](https://creativecommons.org/licenses/by-nc/4.0/).

**You are free to:**
- Use and run this tool for personal use
- Share and redistribute it with others
- Modify it for your own needs

**Under the following conditions:**
- **Attribution** — You must give credit to the original author
- **NonCommercial** — You may not sell this tool or use it for any commercial purpose

*This software is provided as-is, without warranty of any kind.*

---

*Built by [jfontz](https://github.com/jfontz)*
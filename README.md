# CENTCON

Real-time modem/router dashboard with Selenium-powered automation for reboots, assisted admin login, and live Wi-Fi credential and broadcast management. Includes a live event log with passive network monitoring, device tracking, and grouped operation logs.

**Stack:** React (Vite) frontend · FastAPI backend · Selenium automation · Server-Sent Events

---

## Compatibility

> ⚠️ **The Selenium automation is built specifically for one modem model.** It uses custom navigation logic tailored to that device's admin interface and will not work correctly on other modems without modification.

| Field | Value |
|-------|-------|
| ISP | Globe (Philippines) |
| Device Model | G-1426G-A |
| Software Version | 3TN00802HJLI90 |

If you have a different modem model or firmware version, the Selenium automation sequences (reboot, login, and Wi-Fi credential changes) will likely fail or navigate incorrectly. You would need to update the Selenium logic in the backend to match your modem's admin interface.

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

## Event Log

The log panel runs passively in the background and records events as they are detected on each data refresh. It does not require any interaction.

**Monitored events:**

| Event | Description |
|-------|-------------|
| LOS (Loss of Signal) | Fiber signal lost — TX and RX power both read as zero |
| LOS cleared | Fiber signal restored |
| Internet lost | WAN connection dropped while fiber is still up |
| Internet restored | WAN connection re-established |
| Modem unreachable | Dashboard cannot reach the modem API |
| Modem restored | Modem API is reachable again |
| Modem reachable (LOS active) | Modem API is back but fiber signal is still lost — surfaced after a connectivity gap |
| WAN IP changed | External IP address changed since last poll |
| Device connected | A new device appeared on the network between polls |
| High device count | Total connected devices hit an unusual threshold or spiked suddenly |
| High CPU usage | Modem CPU exceeded 80% |
| High memory usage | Modem memory usage exceeded 90% |
| High temperature | Optical transceiver temperature exceeded 70°C |

Automation events (reboot, Wi-Fi credential changes) are grouped together in the log under a labeled block so they're easy to scan separately from passive monitoring events.

---

## Connected Devices

The Connected Devices section shows a count of devices by interface type (LAN, 2.4GHz, 5GHz). Clicking **View all** opens a modal listing every connected device with its hostname, IP address, and band.

Devices can be marked as **Trusted** or left as **Unknown**. Trusted status is saved locally in the browser and persists across modem reboots. It is only lost if a device's IP address changes (e.g. after a DHCP lease expiry that assigns a different IP).

---

## Project Structure

```text
└── 📁centcon
    └── 📁backend
        ├── main.py                        # FastAPI app, routes, command scheduling
        ├── requirements.txt
        ├── run.py                         # Uvicorn entry point
        ├── selenium_login.py              # Opens Chrome, logs into modem, leaves session open for manual use
        ├── selenium_reboot.py             # Full reboot automation workflow
        ├── selenium_wifi_credentials.py   # Changes credentials and broadcast toggles across Basic and Advanced pages in one session
        ├── setup_utils.py                 # First-run setup helpers for validation, auto-detect, and .env writes
        ├── state_manager.py               # SSE state broadcasting and subscriptions
    └── 📁public
        ├── favicon.svg
    └── 📁src
        └── 📁assets
            └── 📁icons
                ├── action.svg
                ├── check.svg
                ├── clear.svg
                ├── cpu.svg
                ├── device.svg
                ├── error.svg
                ├── eye.svg
                ├── eye-slash.svg
                ├── hourglass.svg
                ├── index.js
                ├── info.svg
                ├── lan.svg
                ├── load.svg
                ├── log.svg
                ├── login.svg
                ├── logout.svg
                ├── memory.svg
                ├── navigate.svg
                ├── new-tab.svg
                ├── process.svg
                ├── reboot.svg
                ├── refresh-data.svg
                ├── runtime.svg
                ├── software.svg
                ├── temperature.svg
                ├── warning.svg
                ├── wifi.svg
        └── 📁components
            └── 📁buttons
                ├── SystemControlButton.jsx
            └── 📁cards
                ├── CPUCard.jsx
                ├── DeviceModelCard.jsx
                ├── DeviceSoftwareCard.jsx
                ├── LANCard.jsx
                ├── MemoryCard.jsx
                ├── RuntimeCard.jsx
                ├── TemperatureCard.jsx
                ├── WiFi24Card.jsx
                ├── WiFi5Card.jsx
            └── 📁header
                ├── Header.jsx
                ├── HeaderButton.jsx
                ├── MetaInfo.jsx
                ├── StatusBadge.jsx
            └── 📁log
                ├── LogContent.jsx
                ├── LogEntry.jsx
                ├── LogHeader.jsx
            └── 📁modals
                ├── DeviceListModal.jsx
                ├── RebootConfirmModal.jsx
                ├── WifiCredentialModal.jsx
            └── 📁ui
                ├── HelpTooltip.jsx
                ├── IconWrapper.jsx
                ├── InputField.jsx
                ├── MainLayout.jsx
                ├── MetricCard.jsx
                ├── SectionContainer.jsx
            ├── ConnectedDevices.jsx
            ├── DeviceInformation.jsx
            ├── LogPanel.jsx
            ├── SystemControls.jsx
            ├── SystemStatus.jsx
        └── 📁config
            ├── systemCommands.js          # Button definitions — add/remove buttons here
        └── 📁context
            ├── AuthContext.jsx
            ├── ModemContext.jsx
        └── 📁hooks
            ├── useModemData.js
        └── 📁pages
            ├── Login.jsx
            ├── Setup.jsx
        └── 📁services
            ├── apiConfig.js               # Shared backend URL constant
            ├── authAPI.js
            ├── commandApi.js              # SSE connection and command triggers
            ├── modemDataApi.js            # Modem data fetching and parsing
            ├── setupAPI.js
        └── 📁utils
            ├── formatters.js
            ├── getIcon.jsx
            ├── modemHelpers.js
            ├── validators.js
        ├── App.jsx
        ├── index.css
        ├── main.jsx
    ├── .env
    ├── .env.example
    ├── .gitignore
    ├── eslint.config.js
    ├── index.html
    ├── LICENSE
    ├── package-lock.json
    ├── package.json
    ├── README.md
    └── vite.config.js
```

---

## Extending CENTCON

The frontend renders system control buttons automatically from the config file, so no changes to `SystemControls.jsx` are needed when adding or removing standard buttons.

Removing a button:
- Delete its entry from `src/config/systemCommands.js`.
- Delete its entry from `COMMAND_DEFINITIONS` in `backend/main.py`.
- Delete its workflow file from `backend/`.

Adding a button:
- Add a new entry to `src/config/systemCommands.js` with the required fields: `id`, `label`, `buttonClass`, `icon`, `confirm`, `dangerous`, `blocksOthers`, `allowWhileBusy`, `disableSelf`.
- Create a new Selenium workflow file in `backend/` following the same pattern as `selenium_reboot.py` or `selenium_login.py`.
- Add a matching entry to `COMMAND_DEFINITIONS` in `backend/main.py`.

> **Note:** Wi-Fi Credentials is a special case — it opens a modal to collect input before triggering, and uses its own dedicated backend route (`/commands/wifi-credentials`) instead of the standard `COMMAND_DEFINITIONS` flow. If you're modifying it, refer to `selenium_wifi_credentials.py` and the route in `main.py` directly.

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

**Need to see the Selenium browser window?**
Set `REBOOT_SELENIUM_HEADLESS` or `WIFI_SELENIUM_HEADLESS` to `false` in `.env`, then restart the backend.

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

*Built by [jfontz](https://github.com/jfontz) · [MIT License](./LICENSE)*
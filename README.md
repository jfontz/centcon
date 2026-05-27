# CENTCON

Real-time router dashboard with Selenium-powered automation for reboots, assisted admin login, and live Wi-Fi credential and broadcast management. Includes a live event log with passive network monitoring, device tracking, grouped operation logs, and persistent event history.

**Stack:** React (Vite) frontend · FastAPI backend · Selenium automation · Server-Sent Events

![CENTCON Dashboard](./docs/preview.png)

---

## Compatibility

> ⚠️ **The Selenium automation is built specifically for one router model.** It uses custom navigation logic tailored to that device's admin interface and will not work correctly on other routers without modification.

| Field | Value |
|-------|-------|
| ISP | Globe (Philippines) |
| Device Model | G-1426G-A |
| Software Version | 3TN00802HJLI90 |

If you have a different router model or firmware version, the Selenium automation sequences will likely fail or navigate incorrectly. You would need to update the Selenium logic in the backend to match your router's admin interface.

---

## Prerequisites

| Tool | Version | Download |
|------|---------|----------|
| Node.js | 18+ | https://nodejs.org/ |
| Python | 3.10+ | https://www.python.org/downloads/ |
| Google Chrome | Latest | https://www.google.com/chrome/ |

> **Windows note:** When installing Python, check **"Add Python to PATH"** on the first screen of the installer.

---

## Installation & Running

### Windows

Clone the repo or [download the zip](https://github.com/jfontz/centcon/archive/refs/heads/main.zip) and extract it, then open a terminal in the project folder:

```bash
git clone https://github.com/jfontz/centcon
cd centcon
```

Then double-click `LAUNCH_CENTCON.bat`. On first run it creates the virtual environment, installs all dependencies, and opens the dashboard. Subsequent runs launch directly.

<details>
<summary>Manual launch</summary>

```bash
npm install
python -m venv .venv
.venv\Scripts\activate
pip install -r backend/requirements.txt
```

```bash
# Terminal 1 — backend
.venv\Scripts\activate
python backend/run.py

# Terminal 2 — frontend
npm run dev
```

Then open `http://localhost:5173`.
</details>

### macOS / Linux

Clone the repo or [download the zip](https://github.com/jfontz/centcon/archive/refs/heads/main.zip) and extract it, then:

```bash
git clone https://github.com/jfontz/centcon
cd centcon
npm install
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

```bash
# Terminal 1 — backend
source .venv/bin/activate
python backend/run.py

# Terminal 2 — frontend
npm run dev
```

Then open `http://localhost:5173`.

---

## First-Run Setup

On first launch CENTCON opens a setup wizard automatically. The wizard will ask for:

| Field | What it is |
|-------|------------|
| Router IP Address | Local IP of your router's admin page (Globe default: `192.168.254.254`) |
| Router Username | Admin username — on the sticker on your router |
| Router Password | Admin password — same sticker |
| CENTCON PIN | A 4-character PIN you choose to protect the dashboard |

All values are saved to `.env` in the project root. To change anything later, edit that file and restart.

---

## Router Visual

The Device section displays a CSS-rendered silhouette of the G-1426G-A with five live LED indicators:

| LED | What it represents |
|-----|--------------------|
| PWR | Power — on when the router is reachable |
| FIBER | Fiber signal — off or pulsing red during LOS |
| INTERNET | WAN connection status |
| 2.4G | Green if devices connected, amber if band is up but empty |
| 5G | Same as above |

| Condition | PWR | FIBER | INTERNET | 2.4G / 5G |
|-----------|-----|-------|----------|-----------|
| All systems online | 🟢 | 🟢 | 🟢 | 🟢 / 🟡 |
| LOS active | 🟢 | 🔴 pulse | ⚫ | ⚫ |
| No WAN (fiber ok) | 🟢 | 🟢 | 🔴 | 🟢 / 🟡 |
| Rebooting | 🟡 pulse | ⚫ | ⚫ | ⚫ |
| Router unreachable | ⚫ | ⚫ | ⚫ | ⚫ |

---

## Event Log

The log panel runs passively and records events on each data refresh. No interaction required.

| Event | Description |
|-------|-------------|
| LOS (Loss of Signal) | Fiber signal lost — TX and RX power both read as zero |
| LOS cleared | Fiber signal restored |
| Internet lost | WAN dropped while fiber is still up |
| Internet restored | WAN re-established |
| Router unreachable | Dashboard cannot reach the router API |
| Router restored | Router API reachable again |
| Router reachable (LOS active) | API back but fiber still lost — surfaced after a connectivity gap |
| WAN IP changed | External IP changed since last poll |
| Device connected | New device appeared on the network between polls |
| High device count | Connected devices hit an unusual threshold or spiked suddenly |
| High CPU usage | Router CPU exceeded 80% |
| High memory usage | Router memory exceeded 90% |
| High temperature | Optical transceiver temperature exceeded 70°C |

Automation events (reboot, Wi-Fi credential changes) are grouped under a labeled block, separate from passive monitoring events.

---

## Event History

The **History** tab persists significant events across sessions using localStorage, retained for up to 60 days.

**Recorded:** LOS, internet lost/restored, router unreachable/restored, reboots, device and health warnings.

- Bar chart showing event severity over time
- 24H, 7D, and 60D time range toggles with adjustable resolution
- Click any bar to inspect the timestamped events in that window
- Summary showing uptime percentage and total event count
- Clear history with confirmation

---

## Connected Devices

Shows device counts by interface (LAN, 2.4GHz, 5GHz). **View all** opens a modal with each device's hostname, IP, and band.

Devices can be marked **Trusted** or **Unknown** — saved locally in the browser and persistent across reboots. Resets if a device's IP changes after a DHCP lease expiry.

---

## Troubleshooting

**`ChromeDriver version mismatch`**
Remove any manually installed ChromeDriver from your PATH. Selenium's built-in manager handles this automatically.

**`Chrome binary not found`**
Ensure Chrome is installed in its default location (`C:\Program Files\Google\Chrome\Application\chrome.exe` on Windows, `/Applications/Google Chrome.app` on macOS).

**Need to see the Selenium browser window?**
Set `REBOOT_SELENIUM_HEADLESS` or `WIFI_SELENIUM_HEADLESS` to `false` in `.env` and restart the backend.

**`Module not found` errors**
Confirm `(.venv)` is visible in your terminal prompt, then re-run `pip install -r backend/requirements.txt`.

**Setup wizard keeps reappearing**
The backend didn't restart after `.env` was written. Stop and restart it.

**Forgot your PIN**
Open `.env` in the project root — `CENTCON_PIN` is stored there in plain text.

---

*Built by [jfontz](https://github.com/jfontz) · [MIT License](./LICENSE) · [Contributing](./CONTRIBUTING.md)*
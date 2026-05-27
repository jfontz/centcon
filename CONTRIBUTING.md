# Contributing to CENTCON

## Project Structure

Only the files and folders relevant to development are listed. Config files, lock files, and static assets are omitted.

```text
centcon/
├── backend/
│   ├── main.py                      # FastAPI app — routes, SSE, COMMAND_DEFINITIONS
│   ├── run.py                       # Uvicorn entry point
│   ├── state_manager.py             # SSE state broadcasting and subscriptions
│   ├── setup_utils.py               # First-run wizard helpers (.env validation, auto-detect, writes)
│   ├── workflow_errors.py           # Shared exception types for Selenium workflow failures
│   ├── selenium_login.py            # Assisted login — opens Chrome and leaves session open
│   ├── selenium_reboot.py           # Reboot automation workflow
│   └── selenium_wifi_credentials.py # Wi-Fi credential and broadcast toggle workflow
│
└── src/
    ├── components/
    │   ├── buttons/
    │   │   └── SystemControlButton.jsx  # Action button — handles command locking, pending state, and overlay text
    │   ├── cards/                   # Individual metric cards (CPU, memory, temp, LAN, Wi-Fi)
    │   ├── header/                  # Header bar, status badge, meta info
    │   ├── log/                     # Log panel, log entries, history chart view
    │   ├── modals/                  # Confirm, device list, reboot, Wi-Fi credential modals
    │   ├── ui/                      # Shared primitives (MetricCard, InputField, SectionContainer, etc.)
    │   ├── ConnectedDevices.jsx     # Device count by band + expandable device list
    │   ├── RouterVisual.jsx         # CSS router silhouette with live LED indicators
    │   ├── SystemControls.jsx       # Reboot, login, and Wi-Fi credential buttons
    │   └── SystemStatus.jsx         # Uptime, temperature, CPU, memory cards
    ├── context/
    │   ├── AuthContext.jsx          # Session auth — 8-hour JWT expiry, PIN always required
    │   └── RouterContext.jsx        # Router telemetry, command state, SSE, and log state
    ├── hooks/
    │   ├── useRouterData.js         # API polling, status derivation, reboot-aware refresh control
    │   └── useTheme.js              # Theme state and toggle logic
    ├── pages/
    │   ├── Login.jsx                # PIN login screen
    │   └── Setup.jsx                # First-run setup wizard
    ├── services/
    │   ├── apiConfig.js             # Shared backend URL constant
    │   ├── authAPI.js               # PIN verification — returns JWT for subsequent requests
    │   ├── commandApi.js            # SSE connection, command triggers, command metadata fetch
    │   ├── routerDataApi.js         # Router data fetching and parsing
    │   └── setupAPI.js              # First-run setup wizard API calls
    └── utils/
        ├── formatters.js            # Display formatting helpers
        ├── getIcon.jsx              # Icon lookup by name
        ├── getLedStates.js          # Maps router state to LED configs for RouterVisual
        ├── historyStorage.js        # localStorage history: read, write, prune, bucket
        ├── routerHelpers.js         # Router data transformation helpers
        └── validators.js            # Input validation helpers
```

## Extending CENTCON

### Adding or removing action buttons

`COMMAND_DEFINITIONS` in `backend/main.py` is the single source of truth for button definitions — the frontend fetches this from `GET /commands` on mount. No separate frontend config exists.

**To add a button:**
1. Add an entry to `COMMAND_DEFINITIONS` with these fields: `label`, `buttonClass`, `icon`, `confirm`, `dangerous`, `blocksOthers`, `allowWhileBusy`, `disableSelf`, and `workflow`.
2. Create a matching Selenium workflow file in `backend/`, following the pattern in `selenium_reboot.py`.

**To remove a button:**
1. Delete its entry from `COMMAND_DEFINITIONS`.
2. Delete its workflow file from `backend/`.

> **Wi-Fi Credentials is a special case.** It uses a dedicated route (`/commands/wifi-credentials`) and opens a modal to collect input before triggering — it does not go through the standard `COMMAND_DEFINITIONS` flow. To modify it, refer to `selenium_wifi_credentials.py` and the route in `main.py` directly.

### Adapting the Selenium automation

The automation is built specifically for the Globe G-1426G-A router interface. To adapt it for a different model, update the navigation logic in the relevant `selenium_*.py` file to match your router's admin UI.
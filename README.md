# Centcon

React frontend for modem monitoring + FastAPI backend for router reboot automation (Selenium + SSE).

## Quick start

### Frontend (React + Vite)

```bash
npm install
npm run dev
```

Runs at `http://localhost:5173` by default.

### Backend (FastAPI + Selenium + SSE)

Used for the **Reboot Router** flow: login, navigate, reboot, 2‑minute countdown, connection check. Streams progress via Server-Sent Events.

1. **Python 3.10+** and a **Chrome** install (for Selenium).

2. From project root, create a venv and install deps:

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
# source .venv/bin/activate
pip install -r requirements.txt
```

3. Optional: copy `.env` from project root into `backend/` or set env in the shell. Backend also loads `.env` from the **project root** (parent of `backend/`) if present. Relevant vars:

   - `REBOOT_USERNAME`, `REBOOT_PASSWORD` (or `MODEM_USERNAME`, `MODEM_PASSWORD`) — router login
   - `REBOOT_MODEM_URL` (e.g. `http://192.168.254.254/`)
   - `SELENIUM_HEADLESS=true`
   - `SELENIUM_TIMEOUT=30`

4. Run the API:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

- **POST /reboot** — start reboot workflow (non-blocking).
- **GET /events** — SSE stream (state, log, countdown, heartbeat).
- **GET /state** — current reboot state (polling).

5. Frontend must reach the backend at `http://localhost:8000` (or set `VITE_REBOOT_API_URL` in `.env`).

---

# React + Vite (template)

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

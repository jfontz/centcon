# Centcon

Real-time modem monitoring dashboard with automated router reboot functionality.

**Stack:** React (Vite) frontend + FastAPI backend + Selenium automation + Server-Sent Events

## Installation

### Step 1: Install Prerequisites

Ensure the following software is installed on your system:

**Node.js 18+**

* Download: https://nodejs.org/
* Verify command: `node --version`

**Python 3.10+**

* Download: https://www.python.org/downloads/
* **Note for Windows users:** Ensure "Add Python to PATH" is checked during installation.
* Verify command: `python --version` or `python3 --version`

**Google Chrome**

* Download: https://www.google.com/chrome/
* Verify: Open Chrome and navigate to `chrome://version`

**Git**

* Download: https://git-scm.com/downloads
* Verify command: `git --version`

### Step 2: Clone the Repository

```bash
git clone <your-repo-url>
cd centcon
```

### Step 3: Setup Frontend

Open a terminal in the project root and run the following:

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will run at `http://localhost:5173`. Keep this terminal open and open a new terminal for the backend.

### Step 4: Setup Backend

#### A. Create Python Virtual Environment

Navigate to the backend directory and create a virtual environment:

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment:

* **Windows (Command Prompt):**

```cmd
.venv\Scripts\activate
```

* **Windows (PowerShell):**

```powershell
.venv\Scripts\Activate.ps1
```

* **macOS/Linux:**

```bash
source .venv/bin/activate
```

Ensure `(.venv)` appears in your terminal prompt before proceeding.

#### B. Install Python Dependencies

With the virtual environment active, install the required packages:

```bash
pip install -r requirements.txt
```

This installs FastAPI, Selenium, webdriver-manager, and uvicorn. ChromeDriver is managed automatically.

#### C. Configure Environment Variables

Create a file named `.env` in the project root directory (one level up from the `backend/` folder).

**File Structure:**

```text
centcon/
├── .env
├── backend/
├── src/
└── package.json
```

**.env content:**

```ini
REBOOT_USERNAME=admin
REBOOT_PASSWORD=your_router_password_here
REBOOT_MODEM_URL=http://192.168.254.254/
SELENIUM_HEADLESS=false
```

#### D. Start Backend Server

Ensure you are in the `backend/` directory with the virtual environment active:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend will run at `http://localhost:8000`.

### Step 5: Verification

1. **Frontend:** Open `http://localhost:5173` in your browser.
2. **Backend Documentation:** Open `http://localhost:8000/docs` to verify the API is running.
3. **Functionality Test:** Click the "Reboot Router" button in the application interface to test the automation sequence.

---

## Quick Reference

**Start Frontend:**

```bash
npm run dev
```

**Start Backend:**

```bash
cd backend
# Activate virtual environment (Windows)
.venv\Scripts\activate
# Activate virtual environment (macOS/Linux)
source .venv/bin/activate

uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

To stop servers, press `Ctrl+C` in the respective terminals.

---

## Troubleshooting

**"python: command not found"**

* Windows: Try `python3` or reinstall Python ensuring "Add to PATH" is selected.
* macOS/Linux: Use `python3`.

**"pip: command not found"**

* Windows: `python -m pip install --upgrade pip`
* macOS/Linux: `python3 -m pip install --upgrade pip`

**"Cannot activate virtual environment" (Windows PowerShell)**

Run the following command as Administrator to allow script execution:

```powershell
Set-ExecutionPolicy RemoteSigned
```

**"ChromeDriver error" or "Chrome binary not found"**

Ensure Google Chrome is installed in the default application directory.

* Windows: `C:\Program Files\Google\Chrome\Application\chrome.exe`
* macOS: `/Applications/Google Chrome.app`
* Linux: `/usr/bin/google-chrome`

**"Module not found" errors**

Ensure the virtual environment is activated (`(.venv)` is visible) and run `pip install -r requirements.txt` again.
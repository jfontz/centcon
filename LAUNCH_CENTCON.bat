@echo off
setlocal

REM Project root
set "ROOT=%~dp0"
cd /d "%ROOT%"

REM Python venv interpreter
set "PYTHON=%ROOT%.venv\Scripts\python.exe"

REM Create venv and install backend dependencies if venv doesn't exist
if not exist "%PYTHON%" (
    echo [setup] Creating virtual environment...
    python -m venv .venv
    if errorlevel 1 (
        echo [error] Failed to create virtual environment. Make sure Python is installed and on PATH.
        pause
        exit /b 1
    )

    echo [setup] Installing backend dependencies...
    "%ROOT%.venv\Scripts\python.exe" -m pip install -r backend\requirements.txt
    if errorlevel 1 (
        echo [error] Failed to install dependencies.
        pause
        exit /b 1
    )

    echo [setup] Backend setup complete.
)

REM Install frontend dependencies if node_modules doesn't exist
if not exist "%ROOT%node_modules" (
    echo [setup] Installing frontend dependencies...
    npm install
    if errorlevel 1 (
        echo [error] Failed to install frontend dependencies. Make sure Node.js is installed and on PATH.
        pause
        exit /b 1
    )

    echo [setup] Frontend setup complete.
)

echo Starting backend...
start "backend" cmd /k cd /d "%ROOT%" ^& "%PYTHON%" backend\run.py

echo Starting frontend...
start "frontend" cmd /k cd /d "%ROOT%" ^& npm run dev

REM Give Vite time to boot
timeout /t 5 >nul

start http://localhost:5173/
@echo off
setlocal

REM Project root
set "ROOT=%~dp0"
cd /d "%ROOT%"

REM Python venv interpreter
set "PYTHON=%ROOT%.venv\Scripts\python.exe"

REM Ensure venv exists
if not exist "%PYTHON%" (
    echo [.venv] not found
    exit /b 1
)

echo Starting backend...
start "backend" cmd /k cd /d "%ROOT%" ^& "%PYTHON%" backend\run.py

echo Starting frontend...
start "frontend" cmd /k cd /d "%ROOT%" ^& npm run dev

REM Give Vite time to boot
timeout /t 5 >nul

start http://localhost:5173/
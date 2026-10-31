@echo off
title Government Sahayak - Launcher
echo ======================================================================
echo           Starting Government Sahayak (ప్రభుత్వ సహాయక్)
echo ======================================================================
echo.

:: Check for Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH!
    echo Please install Python 3.10+ from https://www.python.org/
    pause
    exit /b 1
)

:: Check for Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

echo [1/3] Checking and installing Python backend dependencies...
cd backend
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [WARNING] Some python dependencies may not have installed properly.
)
cd ..

echo.
echo [2/3] Checking and installing Web frontend dependencies...
cd helpdesk-web
if not exist "node_modules\" (
    echo Installing node dependencies (one-time setup, please wait)...
    call npm install
)
cd ..

echo.
echo [3/3] Launching Backend & Frontend Servers...
echo ----------------------------------------------------------------------
echo  Backend will run at:  http://localhost:8000
echo  Web Portal will run at: http://localhost:3000
echo ----------------------------------------------------------------------
echo.

:: Start Backend in a background window
start "Government Sahayak Backend" cmd /k "python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000"

:: Start Frontend in a background window
start "Government Sahayak Web Portal" cmd /k "cd helpdesk-web && npm run dev"

:: Wait 3 seconds and open the browser
timeout /t 3 /nobreak >nul
start http://localhost:3000

echo.
echo ======================================================================
echo  Application is running! You can now use the portal in your browser.
echo  To shut down, close the two terminal windows.
echo ======================================================================
echo.
pause

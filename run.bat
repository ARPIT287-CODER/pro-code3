@echo off
title ProCode Platform Launcher
echo =======================================================
echo          PROCODE - COLLEGE DSA PRACTICE PLATFORM
echo =======================================================
echo.
echo [1/2] Checking client build...
cd /d "%~dp0procode\client"
call npm run build

echo.
echo [2/2] Launching Unified ProCode Server on http://localhost:5000...
echo.
echo  - Frontend + Backend: http://localhost:5000
echo  - Host Login: admin@procode.edu / Admin@123
echo.
echo Press Ctrl+C at any time to stop the server.
echo =======================================================
cd /d "%~dp0procode\server"
node index.js
pause

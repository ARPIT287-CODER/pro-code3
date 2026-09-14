@echo off
title ProCode Dev Launcher
echo =======================================================
echo     PROCODE - STARTING FRONTEND + BACKEND DEV
echo =======================================================
echo.
echo Launching Server (Port 5000)...
start "ProCode Backend API" cmd /k "cd /d %~dp0procode\server && npm run dev"

echo Launching Client Vite (Port 5173)...
start "ProCode Frontend UI" cmd /k "cd /d %~dp0procode\client && npm run dev"

echo.
echo Both servers started in separate terminal windows!
echo - Frontend: http://localhost:5173
echo - Backend API: http://localhost:5000
echo =======================================================
pause

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "    PROCODE - STARTING FRONTEND + BACKEND DEV" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Launching Server (Port 5000)..." -ForegroundColor Yellow
Start-Process cmd -ArgumentList "/k", "cd /d "$PSScriptRoot\server" && npm run dev"

Write-Host "Launching Client Vite (Port 5173)..." -ForegroundColor Yellow
Start-Process cmd -ArgumentList "/k", "cd /d "$PSScriptRoot\client" && npm run dev"

Write-Host ""
Write-Host "Both servers started in separate terminal windows!" -ForegroundColor Green
Write-Host " - Frontend:    http://localhost:5173" -ForegroundColor Green
Write-Host " - Backend API: http://localhost:5000" -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Cyan

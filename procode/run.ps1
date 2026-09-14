Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "         PROCODE - COLLEGE DSA PRACTICE PLATFORM" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[1/2] Checking client build..." -ForegroundColor Yellow
Set-Location "\client"
npm run build

Write-Host ""
Write-Host "[2/2] Launching Unified ProCode Server on http://localhost:5000..." -ForegroundColor Green
Write-Host " - Frontend + Backend: http://localhost:5000" -ForegroundColor Green
Write-Host " - Host Login: admin@procode.edu / Admin@123" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C at any time to stop the server." -ForegroundColor Yellow
Write-Host "=======================================================" -ForegroundColor Cyan
Set-Location "\server"
node index.js

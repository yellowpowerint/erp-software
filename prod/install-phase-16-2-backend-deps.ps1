# Phase 16.2: Advanced PDF Manipulation & Merging - Backend Dependencies Installation Script (PowerShell)

Write-Host "Installing Phase 16.2 Backend Dependencies..." -ForegroundColor Green

$backendPath = Join-Path $PSScriptRoot "..\dev\backend"
Set-Location $backendPath

Write-Host "Installing pdf-lib..." -ForegroundColor Yellow
npm install pdf-lib@^1.17.1

Write-Host "" 
Write-Host "Backend dependencies installed successfully!" -ForegroundColor Green
Write-Host "" 
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Run: npx prisma generate"
Write-Host "2. Restart the backend server"

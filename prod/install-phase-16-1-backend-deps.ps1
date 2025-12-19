# Phase 16.1: OCR & Text Extraction - Backend Dependencies Installation Script (PowerShell)

Write-Host "Installing Phase 16.1 Backend Dependencies..." -ForegroundColor Green

$backendPath = Join-Path $PSScriptRoot "..\dev\backend"
Set-Location $backendPath

# Install OCR dependencies
Write-Host "Installing tesseract.js..." -ForegroundColor Yellow
npm install tesseract.js@^5.0.0

Write-Host "Installing pdf-parse..." -ForegroundColor Yellow
npm install pdf-parse@^1.1.1

Write-Host "Installing sharp..." -ForegroundColor Yellow
npm install sharp@^0.33.0

# Install types
Write-Host "Installing TypeScript types..." -ForegroundColor Yellow
npm install --save-dev @types/pdf-parse

Write-Host ""
Write-Host "Backend dependencies installed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Run: npx prisma generate"
Write-Host "2. Run: npx prisma migrate deploy"
Write-Host "3. Restart the backend server"

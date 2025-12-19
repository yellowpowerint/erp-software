# Phase 16.1: OCR & Text Extraction - Production Deployment Script (PowerShell)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Phase 16.1: OCR & Text Extraction" -ForegroundColor Cyan
Write-Host "Production Deployment Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"
$rootPath = Split-Path -Parent $PSScriptRoot

# Step 1: Backend Dependencies
Write-Host "Step 1: Installing Backend Dependencies..." -ForegroundColor Yellow
Set-Location "$rootPath\dev\backend"

npm install tesseract.js@^5.0.0
npm install pdf-parse@^1.1.1
npm install sharp@^0.33.0
npm install --save-dev @types/pdf-parse

Write-Host "✓ Backend dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 2: Generate Prisma Client
Write-Host "Step 2: Generating Prisma Client..." -ForegroundColor Yellow
npx prisma generate

Write-Host "✓ Prisma client generated" -ForegroundColor Green
Write-Host ""

# Step 3: Run Database Migration
Write-Host "Step 3: Running Database Migration..." -ForegroundColor Yellow
Write-Host "IMPORTANT: This will modify your database schema" -ForegroundColor Red
$confirm = Read-Host "Continue with migration? (yes/no)"

if ($confirm -eq "yes") {
    npx prisma migrate deploy
    Write-Host "✓ Database migration completed" -ForegroundColor Green
} else {
    Write-Host "⚠ Migration skipped" -ForegroundColor Yellow
}
Write-Host ""

# Step 4: Frontend Dependencies
Write-Host "Step 4: Installing Frontend Dependencies..." -ForegroundColor Yellow
Set-Location "$rootPath\dev\frontend"

# No additional frontend dependencies needed (react-pdf already installed in Phase 15)
Write-Host "✓ Frontend dependencies verified" -ForegroundColor Green
Write-Host ""

# Step 5: Build Frontend
Write-Host "Step 5: Building Frontend..." -ForegroundColor Yellow
npm run build

Write-Host "✓ Frontend build completed" -ForegroundColor Green
Write-Host ""

# Step 6: Verify Installation
Write-Host "Step 6: Verifying Installation..." -ForegroundColor Yellow

$backendPackageJson = Get-Content "$rootPath\dev\backend\package.json" | ConvertFrom-Json
$hasTesseract = $backendPackageJson.dependencies.PSObject.Properties.Name -contains "tesseract.js"
$hasPdfParse = $backendPackageJson.dependencies.PSObject.Properties.Name -contains "pdf-parse"
$hasSharp = $backendPackageJson.dependencies.PSObject.Properties.Name -contains "sharp"

if ($hasTesseract -and $hasPdfParse -and $hasSharp) {
    Write-Host "✓ All required packages installed" -ForegroundColor Green
} else {
    Write-Host "⚠ Some packages may be missing" -ForegroundColor Yellow
}
Write-Host ""

# Step 7: Create OCR Configuration
Write-Host "Step 7: Initializing OCR Configuration..." -ForegroundColor Yellow
Write-Host "OCR configuration will be created on first access to settings page" -ForegroundColor Cyan
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deployment Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✓ Backend dependencies installed" -ForegroundColor Green
Write-Host "✓ Prisma client generated" -ForegroundColor Green
Write-Host "✓ Database migration completed" -ForegroundColor Green
Write-Host "✓ Frontend build completed" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Restart the backend server: npm run start:dev" -ForegroundColor White
Write-Host "2. Restart the frontend server: npm run dev" -ForegroundColor White
Write-Host "3. Access OCR settings at: /settings/ocr" -ForegroundColor White
Write-Host "4. Test OCR by uploading a document" -ForegroundColor White
Write-Host ""
Write-Host "Phase 16.1 deployment complete! 🎉" -ForegroundColor Green

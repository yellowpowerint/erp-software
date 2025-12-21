# Phase 16.6: Fillable Forms + Templates + Fill & Sign - Production Deployment Script (PowerShell)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Phase 16.6: Fillable Forms + Templates + Fill & Sign" -ForegroundColor Cyan
Write-Host "Production Deployment Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"
$rootPath = Split-Path -Parent $PSScriptRoot

# Step 1: Backend dependencies
Write-Host "Step 1: Installing Backend Dependencies..." -ForegroundColor Yellow
Set-Location "$rootPath\dev\backend"

npm install

Write-Host "✓ Backend dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 2: Generate Prisma Client
Write-Host "Step 2: Generating Prisma Client..." -ForegroundColor Yellow
npx prisma generate
Write-Host "✓ Prisma client generated" -ForegroundColor Green
Write-Host ""

# Step 3: Apply migrations (production)
Write-Host "Step 3: Applying database migrations..." -ForegroundColor Yellow
# NOTE: In Render, migrations run automatically in start:prod (npx prisma migrate deploy)
# This step is for manual/self-hosted environments.
npx prisma migrate deploy
Write-Host "✓ Migrations applied" -ForegroundColor Green
Write-Host ""

# Step 4: Build backend
Write-Host "Step 4: Building backend..." -ForegroundColor Yellow
npm run build
Write-Host "✓ Backend build completed" -ForegroundColor Green
Write-Host ""

# Step 5: Build frontend
Write-Host "Step 5: Building frontend..." -ForegroundColor Yellow
Set-Location "$rootPath\dev\frontend"
npm install
npm run build
Write-Host "✓ Frontend build completed" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deployment Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✓ Prisma client generated" -ForegroundColor Green
Write-Host "✓ DB migrations deployed" -ForegroundColor Green
Write-Host "✓ Backend build completed" -ForegroundColor Green
Write-Host "✓ Frontend build completed" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps (Render):" -ForegroundColor Yellow
Write-Host "1. Deploy backend and confirm /api/documents/:id/form-template works" -ForegroundColor White
Write-Host "2. Upload a fillable PDF and test Fillable Forms panel" -ForegroundColor White
Write-Host "3. Finalize draft and confirm version history updated" -ForegroundColor White
Write-Host ""
Write-Host "Phase 16.6 deployment complete!" -ForegroundColor Green

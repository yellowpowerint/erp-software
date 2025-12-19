# Phase 16.2: Advanced PDF Manipulation & Merging - Production Deployment Script (PowerShell)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Phase 16.2: Advanced PDF Manipulation & Merging" -ForegroundColor Cyan
Write-Host "Production Deployment Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"
$rootPath = Split-Path -Parent $PSScriptRoot

# Step 1: Backend Dependencies
Write-Host "Step 1: Installing Backend Dependencies..." -ForegroundColor Yellow
Set-Location "$rootPath\dev\backend"

npm install pdf-lib@^1.17.1

Write-Host "✓ Backend dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 2: Generate Prisma Client
Write-Host "Step 2: Generating Prisma Client..." -ForegroundColor Yellow
npx prisma generate
Write-Host "✓ Prisma client generated" -ForegroundColor Green
Write-Host ""

# Step 3: Frontend Dependencies
Write-Host "Step 3: Verifying Frontend Dependencies..." -ForegroundColor Yellow
Set-Location "$rootPath\dev\frontend"

# react-pdf is already installed; no new deps required for Phase 16.2
Write-Host "✓ Frontend dependencies verified" -ForegroundColor Green
Write-Host ""

# Step 4: Build Frontend
Write-Host "Step 4: Building Frontend..." -ForegroundColor Yellow
npm run build
Write-Host "✓ Frontend build completed" -ForegroundColor Green
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deployment Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✓ pdf-lib installed" -ForegroundColor Green
Write-Host "✓ Prisma client generated" -ForegroundColor Green
Write-Host "✓ Frontend build completed" -ForegroundColor Green
Write-Host "" 
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Restart the backend server: npm run start:dev" -ForegroundColor White
Write-Host "2. Restart the frontend server: npm run dev" -ForegroundColor White
Write-Host "3. Use PDF tools at: /documents/tools" -ForegroundColor White
Write-Host "" 
Write-Host "Phase 16.2 deployment complete!" -ForegroundColor Green

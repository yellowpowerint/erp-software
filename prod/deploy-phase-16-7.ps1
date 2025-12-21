# Phase 16.7: Audit Package Builder - Production Deployment Script (PowerShell)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Phase 16.7: Audit Package Builder" -ForegroundColor Cyan
Write-Host "Production Deployment Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"
$rootPath = Split-Path -Parent $PSScriptRoot

Write-Host "Step 1: Installing backend dependencies..." -ForegroundColor Yellow
Set-Location "$rootPath\dev\backend"
npm install

Write-Host "Step 2: Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate

Write-Host "Step 3: Applying migrations..." -ForegroundColor Yellow
# NOTE: Render runs this automatically via start:prod (npx prisma migrate deploy)
# This is for manual/self-hosted environments.
npx prisma migrate deploy

Write-Host "Step 4: Building backend..." -ForegroundColor Yellow
npm run build

Write-Host "Step 5: Building frontend..." -ForegroundColor Yellow
Set-Location "$rootPath\dev\frontend"
npm install
npm run build

Write-Host "" 
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deployment Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✓ Prisma client generated" -ForegroundColor Green
Write-Host "✓ DB migrations deployed" -ForegroundColor Green
Write-Host "✓ Backend build completed" -ForegroundColor Green
Write-Host "✓ Frontend build completed" -ForegroundColor Green
Write-Host "" 
Write-Host "Worker Env Vars (Render backend):" -ForegroundColor Yellow
Write-Host "- AUDIT_PACKAGE_WORKER_ENABLED=true" -ForegroundColor White
Write-Host "- AUDIT_PACKAGE_WORKER_CONCURRENCY=1" -ForegroundColor White
Write-Host "- AUDIT_PACKAGE_WORKER_STUCK_MINUTES=30" -ForegroundColor White
Write-Host "" 
Write-Host "Phase 16.7 deployment complete!" -ForegroundColor Green

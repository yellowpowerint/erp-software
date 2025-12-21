# Phase 17.3: CSV Advanced Features - Production Deployment Script (PowerShell)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Phase 17.3: CSV Advanced Features" -ForegroundColor Cyan
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
Write-Host "CSV Worker Env Vars (Render backend):" -ForegroundColor Yellow
Write-Host "- CSV_IMPORT_WORKER_ENABLED=true" -ForegroundColor White
Write-Host "- CSV_IMPORT_WORKER_CONCURRENCY=1" -ForegroundColor White
Write-Host "- CSV_IMPORT_WORKER_STUCK_MINUTES=30" -ForegroundColor White
Write-Host "- CSV_EXPORT_WORKER_ENABLED=true" -ForegroundColor White
Write-Host "- CSV_EXPORT_WORKER_CONCURRENCY=1" -ForegroundColor White
Write-Host "- CSV_EXPORT_WORKER_STUCK_MINUTES=30" -ForegroundColor White
Write-Host "- CSV_PREVIEW_ROWS=20" -ForegroundColor White
Write-Host "" 
Write-Host "Scheduled Exports Env Vars (Render backend):" -ForegroundColor Yellow
Write-Host "- CSV_SCHEDULED_EXPORTS_ENABLED=true" -ForegroundColor White
Write-Host "" 
Write-Host "SMTP Env Vars (Render backend):" -ForegroundColor Yellow
Write-Host "- SMTP_HOST=smtp.example.com" -ForegroundColor White
Write-Host "- SMTP_PORT=587" -ForegroundColor White
Write-Host "- SMTP_USER=your_smtp_user" -ForegroundColor White
Write-Host "- SMTP_PASS=your_smtp_password" -ForegroundColor White
Write-Host "- SMTP_FROM=Mining ERP <no-reply@your-domain.com>" -ForegroundColor White
Write-Host "- SMTP_SECURE=false" -ForegroundColor White
Write-Host "" 
Write-Host "Phase 17.3 deployment complete!" -ForegroundColor Green

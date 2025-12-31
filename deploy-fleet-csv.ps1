#!/usr/bin/env pwsh
# Deploy Fleet Management CSV Import/Export changes to production VPS

$VPS_IP = "216.158.230.187"
$VPS_USER = "root"

Write-Host "Deploying Fleet Management CSV Import/Export to production VPS..." -ForegroundColor Cyan

# Pull latest changes
Write-Host "`nStep 1: Pulling latest code from GitHub..." -ForegroundColor Yellow
ssh ${VPS_USER}@${VPS_IP} "cd /var/www/mining-erp && git pull origin main"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to pull code from GitHub" -ForegroundColor Red
    exit 1
}

# Build frontend
Write-Host "`nStep 2: Building frontend..." -ForegroundColor Yellow
ssh ${VPS_USER}@${VPS_IP} "cd /var/www/mining-erp/dev/frontend && npm ci && npm run build"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to build frontend" -ForegroundColor Red
    exit 1
}

# Restart frontend
Write-Host "`nStep 3: Restarting frontend service..." -ForegroundColor Yellow
ssh ${VPS_USER}@${VPS_IP} "pm2 restart erp-frontend"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to restart frontend" -ForegroundColor Red
    exit 1
}

Write-Host "`nDeployment completed successfully!" -ForegroundColor Green
Write-Host "Fleet Management pages now have CSV import/export functionality:" -ForegroundColor Cyan
Write-Host "  - Fleet Vehicles (Assets)" -ForegroundColor White
Write-Host "  - Fuel Management" -ForegroundColor White
Write-Host "  - Maintenance Records" -ForegroundColor White
Write-Host "  - Fleet Inspections" -ForegroundColor White
Write-Host "  - Operator Assignments" -ForegroundColor White
Write-Host "  - Breakdown Logs" -ForegroundColor White

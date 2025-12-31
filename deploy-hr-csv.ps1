#!/usr/bin/env pwsh
# Deploy HR Module CSV Import/Export to production VPS

$VPS_IP = "216.158.230.187"
$VPS_USER = "root"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "HR Module CSV Import/Export Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "This will deploy:" -ForegroundColor Yellow
Write-Host "  - Frontend: CSV UI for Attendance, Leave Requests, Performance Reviews" -ForegroundColor White
Write-Host "  - Backend: CSV import/export endpoints and processing logic" -ForegroundColor White
Write-Host ""

# Pull latest changes
Write-Host "Step 1: Pulling latest code from GitHub..." -ForegroundColor Yellow
ssh ${VPS_USER}@${VPS_IP} "cd /var/www/mining-erp && git pull origin main"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to pull code from GitHub" -ForegroundColor Red
    exit 1
}

# Build and restart backend
Write-Host "`nStep 2: Building and restarting backend..." -ForegroundColor Yellow
ssh ${VPS_USER}@${VPS_IP} "cd /var/www/mining-erp/dev/backend && npm ci && npm run build && npx prisma generate && pm2 restart erp-backend"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to build/restart backend" -ForegroundColor Red
    exit 1
}

# Build and restart frontend
Write-Host "`nStep 3: Building and restarting frontend..." -ForegroundColor Yellow
ssh ${VPS_USER}@${VPS_IP} "cd /var/www/mining-erp/dev/frontend && npm ci && npm run build && pm2 restart erp-frontend"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to build/restart frontend" -ForegroundColor Red
    exit 1
}

# Verify PM2 status
Write-Host "`nStep 4: Verifying PM2 status..." -ForegroundColor Yellow
ssh ${VPS_USER}@${VPS_IP} "pm2 status"

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Deployment completed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "HR Module CSV Features Deployed:" -ForegroundColor Cyan
Write-Host "  ✓ Attendance - Import/Export" -ForegroundColor Green
Write-Host "  ✓ Leave Requests - Import/Export" -ForegroundColor Green
Write-Host "  ✓ Performance Reviews - Import/Export" -ForegroundColor Green
Write-Host ""
Write-Host "Access the HR module at: http://${VPS_IP}/hr" -ForegroundColor White
Write-Host ""

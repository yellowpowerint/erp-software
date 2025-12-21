# Phase 18.1 - Procurement Requisition Management Deployment Script (PowerShell)
# This script deploys Session 18.1 to Render.com

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Phase 18.1 Deployment - Requisition Management" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Database Migration
Write-Host "Step 1: Running Database Migration..." -ForegroundColor Yellow
Write-Host "Navigate to Render Dashboard > PostgreSQL > Query" -ForegroundColor White
Write-Host "Run the migration SQL from:" -ForegroundColor White
Write-Host "  dev/backend/prisma/migrations/20251221_add_phase_18_1_requisitions/migration.sql" -ForegroundColor Green
Write-Host ""
Write-Host "Press Enter after migration is complete..." -ForegroundColor Yellow
Read-Host

# Step 2: Backend Deployment
Write-Host "Step 2: Deploying Backend..." -ForegroundColor Yellow
Set-Location -Path "..\..\dev\backend"
Write-Host "Building backend..." -ForegroundColor White
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Backend build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Backend built successfully!" -ForegroundColor Green
Write-Host ""

# Step 3: Frontend Deployment
Write-Host "Step 3: Deploying Frontend..." -ForegroundColor Yellow
Set-Location -Path "..\frontend"
Write-Host "Building frontend..." -ForegroundColor White
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Frontend built successfully!" -ForegroundColor Green
Write-Host ""

# Step 4: Git Deployment
Write-Host "Step 4: Committing and Pushing to GitHub..." -ForegroundColor Yellow
Set-Location -Path "..\.."
git add .
git commit -m "feat: implement Phase 18.1 - Procurement Requisition Management

- Add Prisma schema for requisitions, items, attachments, approvals
- Implement ProcurementModule with RequisitionsService and controller
- Add /api/procurement/requisitions endpoints with RBAC
- Create frontend pages: list, create, detail
- Add menu integration for requisition management
- Support multi-stage approval workflow
- File attachment upload functionality
- Mining-specific requisition types and priorities"

git push origin main

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Verify Render auto-deployment completed successfully" -ForegroundColor White
Write-Host "2. Check backend logs for any migration errors" -ForegroundColor White
Write-Host "3. Test requisition creation and approval workflow" -ForegroundColor White
Write-Host "4. Verify file upload functionality" -ForegroundColor White
Write-Host "5. Test role-based access controls" -ForegroundColor White
Write-Host ""
Write-Host "Frontend URL: https://your-frontend.onrender.com/procurement/requisitions" -ForegroundColor Cyan
Write-Host "Backend API: https://your-backend.onrender.com/api/procurement/requisitions" -ForegroundColor Cyan
Write-Host ""

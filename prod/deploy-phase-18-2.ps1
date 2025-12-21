# Phase 18.2 - Procurement Automated Approval Workflows Deployment Script (PowerShell)

Write-Host "Phase 18.2 Deployment - Automated Approval Workflows" -ForegroundColor Cyan
Write-Host ""

Write-Host "1) Run DB migration in Render Postgres Query Console:" -ForegroundColor Yellow
Write-Host "   dev/backend/prisma/migrations/20251221_add_phase_18_2_procurement_workflows/migration.sql" -ForegroundColor Green
Read-Host "Press Enter to continue"

Write-Host "2) Build backend" -ForegroundColor Yellow
Set-Location -Path "..\..\dev\backend"
npm run build
if ($LASTEXITCODE -ne 0) { throw "Backend build failed" }

Write-Host "3) Build frontend" -ForegroundColor Yellow
Set-Location -Path "..\frontend"
npm run build
if ($LASTEXITCODE -ne 0) { throw "Frontend build failed" }

Write-Host "4) Commit + push" -ForegroundColor Yellow
Set-Location -Path "..\.."
git add .
git commit -m "feat: implement Phase 18.2 - Automated Procurement Approval Workflows"
git push origin main

Write-Host "Done. Verify Render deploy + smoke test workflows/delegations/approvals." -ForegroundColor Green

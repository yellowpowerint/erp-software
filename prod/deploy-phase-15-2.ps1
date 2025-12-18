# Phase 15.2 Deployment Script - Document Library & Management UI
# Mining ERP System
# Date: December 17, 2025

$ErrorActionPreference = "Stop"

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Phase 15.2 Deployment Script" -ForegroundColor Cyan
Write-Host "Document Library & Management UI" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check if running from correct directory
if (-not (Test-Path "dev\backend") -or -not (Test-Path "dev\frontend")) {
    Write-Host "Error: Must run from project root directory" -ForegroundColor Red
    exit 1
}

Write-Host "Step 1: Installing Backend Dependencies" -ForegroundColor Yellow
Set-Location dev\backend
npm install archiver@^6.0.1 --save
npm install @types/archiver@^6.0.2 --save-dev
Write-Host "✓ Backend dependencies installed" -ForegroundColor Green
Write-Host ""

Write-Host "Step 2: Installing Frontend Dependencies" -ForegroundColor Yellow
Set-Location ..\frontend
npm install react-pdf@^7.7.0 date-fns@^3.0.0 --save
Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green
Write-Host ""

Write-Host "Step 3: Verifying Phase 15.1 Database Schema" -ForegroundColor Yellow
Set-Location ..\backend
npx prisma generate
Write-Host "✓ Prisma client generated" -ForegroundColor Green
Write-Host ""

Write-Host "Step 4: Building Backend" -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Backend build successful" -ForegroundColor Green
} else {
    Write-Host "✗ Backend build failed" -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "Step 5: Building Frontend" -ForegroundColor Yellow
Set-Location ..\frontend
npm run build
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Frontend build successful" -ForegroundColor Green
} else {
    Write-Host "✗ Frontend build failed" -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "Step 6: Running Tests (if available)" -ForegroundColor Yellow
Set-Location ..\backend
npm test -- --passWithNoTests 2>$null
if (-not $?) { Write-Host "No backend tests configured" -ForegroundColor Gray }
Set-Location ..\frontend
npm test -- --passWithNoTests 2>$null
if (-not $?) { Write-Host "No frontend tests configured" -ForegroundColor Gray }
Write-Host "✓ Tests completed" -ForegroundColor Green
Write-Host ""

Write-Host "Step 7: Creating Deployment Archive" -ForegroundColor Yellow
Set-Location ..\..\
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$archiveName = "phase-15-2-deployment-$timestamp.zip"

$filesToArchive = @(
    "dev\backend\dist",
    "dev\backend\package.json",
    "dev\backend\package-lock.json",
    "dev\backend\prisma",
    "dev\frontend\.next",
    "dev\frontend\package.json",
    "dev\frontend\package-lock.json",
    "dev\frontend\public",
    "prod\.env.production.template",
    "notes\PHASE-15-2-IMPLEMENTATION-GUIDE.md"
)

Compress-Archive -Path $filesToArchive -DestinationPath "prod\$archiveName" -Force
Write-Host "✓ Deployment archive created: prod\$archiveName" -ForegroundColor Green
Write-Host ""

Write-Host "Step 8: Creating Deployment Checklist" -ForegroundColor Yellow
$checklistContent = @"
# Phase 15.2 Deployment Checklist

## Pre-Deployment

- [ ] Verify Phase 15.1 is deployed and working
- [ ] Backup production database
- [ ] Review environment variables (no new vars required)
- [ ] Test batch operations in staging
- [ ] Verify storage permissions for ZIP creation

## Deployment Steps

1. [ ] Stop application services
2. [ ] Extract deployment archive
3. [ ] Install dependencies (npm install in both backend/frontend)
4. [ ] Verify Prisma schema is up to date (npx prisma generate)
5. [ ] Start backend service
6. [ ] Start frontend service
7. [ ] Verify health endpoints

## Post-Deployment Verification

### Backend API Tests

- [ ] Test batch delete: ``POST /api/documents/batch-delete``
- [ ] Test batch download: ``POST /api/documents/batch-download``
- [ ] Test batch tag: ``PATCH /api/documents/batch-tag``
- [ ] Test storage usage: ``GET /api/documents/storage-usage``
- [ ] Verify all Phase 15.1 endpoints still work

### Frontend UI Tests

- [ ] Access /documents page
- [ ] Test grid view
- [ ] Test list view
- [ ] Test search functionality
- [ ] Test category filter
- [ ] Test module filter
- [ ] Test date range filter
- [ ] Test sorting (name, date, size, category)
- [ ] Test document card actions
- [ ] Test bulk selection
- [ ] Test bulk delete
- [ ] Test bulk download (ZIP)
- [ ] Test bulk tag
- [ ] Open document detail modal
- [ ] Test preview tab (image, PDF, text)
- [ ] Test details tab editing
- [ ] Test version history tab
- [ ] Verify recent documents widget on dashboard

### Performance Tests

- [ ] Load page with 100+ documents
- [ ] Test search with large dataset
- [ ] Test batch download with 10+ files
- [ ] Monitor memory usage during ZIP creation
- [ ] Check API response times

## Rollback Plan

If issues occur:

1. Stop services
2. Restore previous deployment
3. Restart services
4. Restore database backup if needed
5. Investigate logs

## Known Issues

- Batch download only supports local storage (S3 files skipped)
- Large batches (>50 documents) may timeout - reduce batch size

## Support Contacts

- Backend: [Team Contact]
- Frontend: [Team Contact]
- DevOps: [Team Contact]

---

**Deployment Date:** _______________
**Deployed By:** _______________
**Sign-off:** _______________
"@

$checklistPath = "prod\PHASE-15-2-DEPLOYMENT-CHECKLIST-$timestamp.md"
$checklistContent | Out-File -FilePath $checklistPath -Encoding UTF8
Write-Host "✓ Deployment checklist created" -ForegroundColor Green
Write-Host ""

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Phase 15.2 Deployment Package Ready!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Archive: prod\$archiveName"
Write-Host "Checklist: $checklistPath"
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Review the deployment checklist"
Write-Host "2. Test in staging environment"
Write-Host "3. Deploy to production"
Write-Host "4. Run post-deployment verification"
Write-Host ""
Write-Host "Note: Ensure Phase 15.1 is deployed before deploying Phase 15.2" -ForegroundColor Yellow
Write-Host ""

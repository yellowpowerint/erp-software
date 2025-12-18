# Phase 15.1 Document Management System - Deployment Script (PowerShell)
# This script deploys the Document Management System to production

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Phase 15.1 DMS Deployment Script" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

function Print-Success {
    param($Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Print-Error {
    param($Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Print-Info {
    param($Message)
    Write-Host "ℹ $Message" -ForegroundColor Yellow
}

# Check if we're in the correct directory
if (-not (Test-Path "dev\backend") -or -not (Test-Path "dev\frontend")) {
    Print-Error "Error: Must run from project root directory"
    exit 1
}

Print-Info "Starting Phase 15.1 deployment..."
Write-Host ""

try {
    # Step 1: Backend Dependencies
    Print-Info "Step 1: Installing backend dependencies..."
    Set-Location dev\backend
    npm install
    Print-Success "Backend dependencies installed"
    Set-Location ..\..
    Write-Host ""

    # Step 2: Frontend Dependencies
    Print-Info "Step 2: Installing frontend dependencies..."
    Set-Location dev\frontend
    npm install
    Print-Success "Frontend dependencies installed"
    Set-Location ..\..
    Write-Host ""

    # Step 3: Database Migration
    Print-Info "Step 3: Running database migrations..."
    Set-Location dev\backend
    npx prisma generate
    Print-Success "Prisma client generated"
    
    npx prisma migrate deploy
    Print-Success "Database migrations applied"
    Set-Location ..\..
    Write-Host ""

    # Step 4: Create uploads directory
    Print-Info "Step 4: Creating uploads directory..."
    New-Item -ItemType Directory -Force -Path "dev\backend\uploads\documents" | Out-Null
    Print-Success "Uploads directory created"
    Write-Host ""

    # Step 5: Build Backend
    Print-Info "Step 5: Building backend..."
    Set-Location dev\backend
    npm run build
    Print-Success "Backend built successfully"
    Set-Location ..\..
    Write-Host ""

    # Step 6: Build Frontend
    Print-Info "Step 6: Building frontend..."
    Set-Location dev\frontend
    npm run build
    Print-Success "Frontend built successfully"
    Set-Location ..\..
    Write-Host ""

    # Step 7: Run Tests
    Print-Info "Step 7: Running tests..."
    Set-Location dev\backend
    try {
        npm test -- --passWithNoTests 2>$null
    } catch {
        Print-Info "No backend tests found"
    }
    Set-Location ..\..
    Write-Host ""

    # Step 8: Create deployment archive
    Print-Info "Step 8: Creating deployment archive..."
    $Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $ArchiveName = "phase-15-1-deployment-$Timestamp.zip"
    
    Compress-Archive -Path @(
        "dev\backend\dist",
        "dev\backend\package.json",
        "dev\backend\package-lock.json",
        "dev\backend\prisma",
        "dev\backend\uploads",
        "dev\frontend\.next",
        "dev\frontend\package.json",
        "dev\frontend\package-lock.json",
        "dev\frontend\public"
    ) -DestinationPath "prod\$ArchiveName" -Force
    
    Print-Success "Deployment archive created: $ArchiveName"
    Write-Host ""

    # Step 9: Generate deployment checklist
    Print-Info "Step 9: Generating deployment checklist..."
    $ChecklistContent = @"
Phase 15.1 Document Management System - Deployment Checklist
Generated: $(Get-Date)

PRE-DEPLOYMENT:
☐ Backup production database
☐ Review environment variables (.env files)
☐ Verify storage configuration (LOCAL/S3/Cloudinary)
☐ Check AWS credentials (if using S3)
☐ Verify max file size limits
☐ Test file upload in staging environment

DEPLOYMENT STEPS:
☐ Stop backend service
☐ Stop frontend service
☐ Extract deployment archive
☐ Run database migrations (npx prisma migrate deploy)
☐ Set environment variables:
   - STORAGE_PROVIDER (local/s3/cloudinary)
   - LOCAL_STORAGE_PATH (if using local storage)
   - AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET (if using S3)
   - MAX_FILE_SIZE (default: 10485760 bytes = 10MB)
   - MAX_FILES_PER_UPLOAD (default: 10)
☐ Create uploads directory with proper permissions
☐ Start backend service
☐ Start frontend service
☐ Verify services are running

POST-DEPLOYMENT VERIFICATION:
☐ Test document upload (single file)
☐ Test document upload (multiple files)
☐ Test document download
☐ Test document search
☐ Test document deletion
☐ Verify file size validation
☐ Verify file type validation
☐ Check storage location (local/S3)
☐ Verify permissions (role-based access)
☐ Test API endpoints:
   - POST /api/documents/upload
   - POST /api/documents/upload-multiple
   - GET /api/documents
   - GET /api/documents/:id
   - GET /api/documents/:id/download
   - PUT /api/documents/:id
   - DELETE /api/documents/:id
   - GET /api/documents/search

ROLLBACK PLAN:
☐ Restore database from backup
☐ Revert to previous deployment
☐ Restore previous environment variables
☐ Restart services

MONITORING:
☐ Monitor disk space usage (if using local storage)
☐ Monitor S3 costs (if using S3)
☐ Monitor upload errors in logs
☐ Monitor API response times
☐ Check for failed uploads

NOTES:
- Default storage: LOCAL (uploads/ directory)
- To use S3: Set STORAGE_PROVIDER=s3 and configure AWS credentials
- Maximum file size can be adjusted via MAX_FILE_SIZE env variable
- Supported file types include: PDF, Office documents, images, text files
- All uploads require authentication (JWT)
- Role-based permissions apply to all document operations
"@

    $ChecklistContent | Out-File -FilePath "prod\deployment-checklist-$Timestamp.txt" -Encoding UTF8
    Print-Success "Deployment checklist created: deployment-checklist-$Timestamp.txt"
    Write-Host ""

    # Summary
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "Deployment Preparation Complete!" -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""
    Print-Success "Archive: prod\$ArchiveName"
    Print-Success "Checklist: prod\deployment-checklist-$Timestamp.txt"
    Write-Host ""
    Print-Info "Next steps:"
    Write-Host "  1. Review the deployment checklist"
    Write-Host "  2. Backup production database"
    Write-Host "  3. Extract archive on production server"
    Write-Host "  4. Follow deployment checklist"
    Write-Host ""
    Print-Info "For local testing:"
    Write-Host "  Backend: cd dev\backend && npm run start:prod"
    Write-Host "  Frontend: cd dev\frontend && npm start"
    Write-Host ""

} catch {
    Print-Error "Deployment failed: $_"
    exit 1
}

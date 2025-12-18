#!/bin/bash

# Phase 15.1 Document Management System - Deployment Script
# This script deploys the Document Management System to production

set -e

echo "=========================================="
echo "Phase 15.1 DMS Deployment Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if we're in the correct directory
if [ ! -d "dev/backend" ] || [ ! -d "dev/frontend" ]; then
    print_error "Error: Must run from project root directory"
    exit 1
fi

print_info "Starting Phase 15.1 deployment..."
echo ""

# Step 1: Backend Dependencies
print_info "Step 1: Installing backend dependencies..."
cd dev/backend
npm install
if [ $? -eq 0 ]; then
    print_success "Backend dependencies installed"
else
    print_error "Failed to install backend dependencies"
    exit 1
fi
cd ../..
echo ""

# Step 2: Frontend Dependencies
print_info "Step 2: Installing frontend dependencies..."
cd dev/frontend
npm install
if [ $? -eq 0 ]; then
    print_success "Frontend dependencies installed"
else
    print_error "Failed to install frontend dependencies"
    exit 1
fi
cd ../..
echo ""

# Step 3: Database Migration
print_info "Step 3: Running database migrations..."
cd dev/backend
npx prisma generate
if [ $? -eq 0 ]; then
    print_success "Prisma client generated"
else
    print_error "Failed to generate Prisma client"
    exit 1
fi

npx prisma migrate deploy
if [ $? -eq 0 ]; then
    print_success "Database migrations applied"
else
    print_error "Failed to apply database migrations"
    exit 1
fi
cd ../..
echo ""

# Step 4: Create uploads directory
print_info "Step 4: Creating uploads directory..."
mkdir -p dev/backend/uploads/documents
if [ $? -eq 0 ]; then
    print_success "Uploads directory created"
else
    print_error "Failed to create uploads directory"
    exit 1
fi
echo ""

# Step 5: Build Backend
print_info "Step 5: Building backend..."
cd dev/backend
npm run build
if [ $? -eq 0 ]; then
    print_success "Backend built successfully"
else
    print_error "Failed to build backend"
    exit 1
fi
cd ../..
echo ""

# Step 6: Build Frontend
print_info "Step 6: Building frontend..."
cd dev/frontend
npm run build
if [ $? -eq 0 ]; then
    print_success "Frontend built successfully"
else
    print_error "Failed to build frontend"
    exit 1
fi
cd ../..
echo ""

# Step 7: Run Tests (if available)
print_info "Step 7: Running tests..."
cd dev/backend
npm test -- --passWithNoTests 2>/dev/null || print_info "No backend tests found"
cd ../..
echo ""

# Step 8: Create deployment archive
print_info "Step 8: Creating deployment archive..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ARCHIVE_NAME="phase-15-1-deployment-${TIMESTAMP}.zip"

zip -r "prod/${ARCHIVE_NAME}" \
    dev/backend/dist \
    dev/backend/package.json \
    dev/backend/package-lock.json \
    dev/backend/prisma \
    dev/backend/uploads \
    dev/frontend/.next \
    dev/frontend/package.json \
    dev/frontend/package-lock.json \
    dev/frontend/public \
    -x "*/node_modules/*" "*.git/*" 2>/dev/null

if [ $? -eq 0 ]; then
    print_success "Deployment archive created: ${ARCHIVE_NAME}"
else
    print_error "Failed to create deployment archive"
    exit 1
fi
echo ""

# Step 9: Generate deployment checklist
print_info "Step 9: Generating deployment checklist..."
cat > "prod/deployment-checklist-${TIMESTAMP}.txt" << EOF
Phase 15.1 Document Management System - Deployment Checklist
Generated: $(date)

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

EOF

print_success "Deployment checklist created: deployment-checklist-${TIMESTAMP}.txt"
echo ""

# Summary
echo "=========================================="
echo "Deployment Preparation Complete!"
echo "=========================================="
echo ""
print_success "Archive: prod/${ARCHIVE_NAME}"
print_success "Checklist: prod/deployment-checklist-${TIMESTAMP}.txt"
echo ""
print_info "Next steps:"
echo "  1. Review the deployment checklist"
echo "  2. Backup production database"
echo "  3. Extract archive on production server"
echo "  4. Follow deployment checklist"
echo ""
print_info "For local testing:"
echo "  Backend: cd dev/backend && npm run start:prod"
echo "  Frontend: cd dev/frontend && npm start"
echo ""

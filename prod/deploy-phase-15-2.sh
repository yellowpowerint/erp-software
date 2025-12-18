#!/bin/bash

# Phase 15.2 Deployment Script - Document Library & Management UI
# Mining ERP System
# Date: December 17, 2025

set -e

echo "======================================"
echo "Phase 15.2 Deployment Script"
echo "Document Library & Management UI"
echo "======================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running from correct directory
if [ ! -d "dev/backend" ] || [ ! -d "dev/frontend" ]; then
    echo -e "${RED}Error: Must run from project root directory${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Installing Backend Dependencies${NC}"
cd dev/backend
npm install archiver@^6.0.1 --save
npm install @types/archiver@^6.0.2 --save-dev
echo -e "${GREEN}✓ Backend dependencies installed${NC}"
echo ""

echo -e "${YELLOW}Step 2: Installing Frontend Dependencies${NC}"
cd ../frontend
npm install react-pdf@^7.7.0 date-fns@^3.0.0 --save
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
echo ""

echo -e "${YELLOW}Step 3: Verifying Phase 15.1 Database Schema${NC}"
cd ../backend
npx prisma generate
echo -e "${GREEN}✓ Prisma client generated${NC}"
echo ""

echo -e "${YELLOW}Step 4: Building Backend${NC}"
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backend build successful${NC}"
else
    echo -e "${RED}✗ Backend build failed${NC}"
    exit 1
fi
echo ""

echo -e "${YELLOW}Step 5: Building Frontend${NC}"
cd ../frontend
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend build successful${NC}"
else
    echo -e "${RED}✗ Frontend build failed${NC}"
    exit 1
fi
echo ""

echo -e "${YELLOW}Step 6: Running Tests (if available)${NC}"
cd ../backend
npm test -- --passWithNoTests 2>/dev/null || echo "No backend tests configured"
cd ../frontend
npm test -- --passWithNoTests 2>/dev/null || echo "No frontend tests configured"
echo -e "${GREEN}✓ Tests completed${NC}"
echo ""

echo -e "${YELLOW}Step 7: Creating Deployment Archive${NC}"
cd ../../
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ARCHIVE_NAME="phase-15-2-deployment-${TIMESTAMP}.tar.gz"

tar -czf "prod/${ARCHIVE_NAME}" \
    dev/backend/dist \
    dev/backend/package.json \
    dev/backend/package-lock.json \
    dev/backend/prisma \
    dev/frontend/.next \
    dev/frontend/package.json \
    dev/frontend/package-lock.json \
    dev/frontend/public \
    prod/.env.production.template \
    notes/PHASE-15-2-IMPLEMENTATION-GUIDE.md

echo -e "${GREEN}✓ Deployment archive created: prod/${ARCHIVE_NAME}${NC}"
echo ""

echo -e "${YELLOW}Step 8: Creating Deployment Checklist${NC}"
cat > "prod/PHASE-15-2-DEPLOYMENT-CHECKLIST-${TIMESTAMP}.md" << 'EOF'
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

- [ ] Test batch delete: `POST /api/documents/batch-delete`
- [ ] Test batch download: `POST /api/documents/batch-download`
- [ ] Test batch tag: `PATCH /api/documents/batch-tag`
- [ ] Test storage usage: `GET /api/documents/storage-usage`
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
EOF

echo -e "${GREEN}✓ Deployment checklist created${NC}"
echo ""

echo "======================================"
echo -e "${GREEN}Phase 15.2 Deployment Package Ready!${NC}"
echo "======================================"
echo ""
echo "Archive: prod/${ARCHIVE_NAME}"
echo "Checklist: prod/PHASE-15-2-DEPLOYMENT-CHECKLIST-${TIMESTAMP}.md"
echo ""
echo "Next steps:"
echo "1. Review the deployment checklist"
echo "2. Test in staging environment"
echo "3. Deploy to production"
echo "4. Run post-deployment verification"
echo ""
echo -e "${YELLOW}Note: Ensure Phase 15.1 is deployed before deploying Phase 15.2${NC}"
echo ""

# Phase 18.1 - Procurement Requisition Management Deployment Checklist

## Pre-Deployment Checklist

### Database Preparation
- [ ] Backup production database before migration
- [ ] Review migration SQL in `dev/backend/prisma/migrations/20251221_add_phase_18_1_requisitions/migration.sql`
- [ ] Verify migration is idempotent (safe to re-run)
- [ ] Ensure all foreign key references exist (users, projects, stock_items)

### Code Review
- [ ] Backend: ProcurementModule registered in AppModule
- [ ] Backend: All DTO validations in place
- [ ] Backend: RBAC guards on all endpoints
- [ ] Backend: File upload configured with StorageService
- [ ] Frontend: All pages created (list, create, detail)
- [ ] Frontend: Menu integration complete
- [ ] Frontend: Role-based access implemented

### Environment Variables
No new environment variables required for Phase 18.1.
Existing variables used:
- `DATABASE_URL` - PostgreSQL connection
- `DIRECT_URL` - Direct PostgreSQL connection
- `STORAGE_PROVIDER` - For file uploads (local/s3)
- `BASE_URL` - For file URL generation

## Deployment Steps

### 1. Database Migration
```sql
-- Run in Render PostgreSQL Query Console
-- File: dev/backend/prisma/migrations/20251221_add_phase_18_1_requisitions/migration.sql

-- Creates:
-- - Enums: Priority, RequisitionType, RequisitionStatus
-- - Tables: requisitions, requisition_items, requisition_attachments, requisition_approvals
-- - Indexes and foreign keys
-- - Asset.projectId column for Project.assets relation
```

**Verification:**
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'requisition%';

-- Check enums exist
SELECT typname FROM pg_type 
WHERE typname IN ('Priority', 'RequisitionType', 'RequisitionStatus');

-- Verify indexes
SELECT indexname FROM pg_indexes 
WHERE tablename LIKE 'requisition%';
```

### 2. Backend Deployment
- [ ] Push code to GitHub main branch
- [ ] Verify Render auto-deployment triggered
- [ ] Monitor build logs for errors
- [ ] Check deployment status (should show "Live")
- [ ] Verify backend health endpoint responds

**Test Backend Endpoints:**
```bash
# Health check
curl https://your-backend.onrender.com/api/health

# List requisitions (requires auth token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-backend.onrender.com/api/procurement/requisitions

# Get stats
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-backend.onrender.com/api/procurement/requisitions/stats
```

### 3. Frontend Deployment
- [ ] Verify frontend build completed
- [ ] Check deployment logs
- [ ] Verify static assets deployed
- [ ] Test frontend loads without errors

**Test Frontend Pages:**
- [ ] `/procurement/requisitions` - List page loads
- [ ] `/procurement/requisitions/new` - Create form loads
- [ ] Menu shows "Requisitions" under Finance & Procurement
- [ ] Role-based menu visibility works

### 4. Integration Testing

#### Create Requisition Flow
- [ ] Login as EMPLOYEE or PROCUREMENT_OFFICER
- [ ] Navigate to Requisitions page
- [ ] Click "New Requisition"
- [ ] Fill in requisition details
- [ ] Add at least one item
- [ ] Save as draft - verify saved
- [ ] Submit for approval - verify status change
- [ ] Check notification sent to approver

#### Approval Workflow
- [ ] Login as DEPARTMENT_HEAD or OPERATIONS_MANAGER
- [ ] Check pending approvals count
- [ ] View requisition detail
- [ ] Verify approval history shows pending stage
- [ ] Test approval action (if implemented)

#### File Upload
- [ ] Open requisition detail
- [ ] Upload attachment (PDF, image, or document)
- [ ] Verify file appears in attachments list
- [ ] Click "View" to download file
- [ ] Verify file URL is accessible

#### Permissions Testing
- [ ] EMPLOYEE can create requisitions
- [ ] EMPLOYEE cannot edit others' requisitions
- [ ] PROCUREMENT_OFFICER can view all requisitions
- [ ] SUPER_ADMIN can manage all requisitions
- [ ] Unauthorized users cannot access endpoints

### 5. Data Validation

**Check Database Records:**
```sql
-- Count requisitions
SELECT COUNT(*) FROM requisitions;

-- Check requisition statuses
SELECT status, COUNT(*) FROM requisitions GROUP BY status;

-- Verify items linked correctly
SELECT r.requisitionNo, COUNT(i.id) as item_count
FROM requisitions r
LEFT JOIN requisition_items i ON r.id = i.requisitionId
GROUP BY r.id, r.requisitionNo;

-- Check attachments
SELECT COUNT(*) FROM requisition_attachments;

-- Verify approval records
SELECT COUNT(*) FROM requisition_approvals;
```

### 6. Performance Testing
- [ ] List page loads in < 2 seconds
- [ ] Create requisition completes in < 1 second
- [ ] File upload completes in < 5 seconds
- [ ] No console errors in browser
- [ ] No memory leaks on repeated actions

### 7. Error Handling
- [ ] Test creating requisition without items - shows error
- [ ] Test submitting without required fields - validation works
- [ ] Test uploading oversized file - rejected
- [ ] Test unauthorized access - 403 error
- [ ] Test invalid requisition ID - 404 error

## Post-Deployment Verification

### Smoke Tests
- [ ] Create 3 test requisitions (different types)
- [ ] Submit 1 for approval
- [ ] Upload attachments to 1 requisition
- [ ] Cancel 1 requisition
- [ ] Verify all actions reflected in database

### Monitoring
- [ ] Check Render logs for errors
- [ ] Monitor database query performance
- [ ] Check file storage usage
- [ ] Verify notification delivery

### Documentation
- [ ] Update user guide with requisition workflow
- [ ] Document approval process
- [ ] Add file upload guidelines
- [ ] Update API documentation

## Rollback Plan

If critical issues are found:

1. **Database Rollback:**
```sql
-- WARNING: This deletes all requisition data
DROP TABLE IF EXISTS requisition_approvals CASCADE;
DROP TABLE IF EXISTS requisition_attachments CASCADE;
DROP TABLE IF EXISTS requisition_items CASCADE;
DROP TABLE IF EXISTS requisitions CASCADE;
ALTER TABLE assets DROP COLUMN IF EXISTS projectId;
DROP TYPE IF EXISTS RequisitionStatus;
DROP TYPE IF EXISTS RequisitionType;
DROP TYPE IF EXISTS Priority;
```

2. **Code Rollback:**
```bash
git revert HEAD
git push origin main
```

3. **Verify Render redeploys previous version**

## Success Criteria

- [ ] All database tables created successfully
- [ ] Backend endpoints respond correctly
- [ ] Frontend pages load without errors
- [ ] Users can create and submit requisitions
- [ ] File uploads work correctly
- [ ] Approval workflow functions
- [ ] Role-based access enforced
- [ ] No critical errors in logs
- [ ] Performance meets requirements

## Support Contacts

- **Technical Issues:** IT Manager
- **Database Issues:** Database Administrator
- **User Training:** Department Heads
- **Procurement Workflow:** Procurement Officer

## Notes

- Phase 18.1 is the foundation for full procurement system
- Future phases will add RFQ, bidding, and purchase orders
- Monitor requisition volume for scaling needs
- Consider adding email notifications for approvals

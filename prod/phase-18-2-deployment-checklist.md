# Phase 18.2 - Procurement Automated Approval Workflows Deployment Checklist

## Pre-Deployment Checklist

### Database Preparation
- [ ] Backup production database before migration
- [ ] Review migration SQL in `dev/backend/prisma/migrations/20251221_add_phase_18_2_procurement_workflows/migration.sql`
- [ ] Verify migration is idempotent (safe to re-run)
- [ ] Ensure existing requisition tables from Phase 18.1 are already deployed

### Code Review
- [ ] Backend: ProcurementModule registers workflow + delegation controllers/services
- [ ] Backend: RequisitionsController exposes approval action endpoints
- [ ] Backend: RBAC guards enabled (JWT + RolesGuard)
- [ ] Backend: Notifications include `APPROVAL_INFO_REQUEST`
- [ ] Frontend: Pages created for workflows, delegations, pending approvals
- [ ] Frontend: Requisition detail page includes approval actions

### Environment Variables
No new environment variables required for Phase 18.2.
Existing variables used:
- `DATABASE_URL`
- `DIRECT_URL`
- `BASE_URL` (notifications / file URL generation)

## Deployment Steps

### 1. Database Migration
Run in Render PostgreSQL Query Console:
- `dev/backend/prisma/migrations/20251221_add_phase_18_2_procurement_workflows/migration.sql`

**Creates/Updates:**
- Tables: `procurement_workflows`, `procurement_workflow_stages`, `approval_delegations`
- Enum: `ProcurementApprovalType`
- Updates: `requisition_approvals` unique constraint to `(requisitionId, stage, approverId)` and adds `createdAt`
- Updates: `notifications` enum includes `APPROVAL_INFO_REQUEST`

**Verification SQL:**
```sql
-- Tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('procurement_workflows','procurement_workflow_stages','approval_delegations');

-- Columns / constraints
SELECT conname
FROM pg_constraint
WHERE conname ILIKE '%requisition_approvals%';

-- Enum
SELECT typname FROM pg_type WHERE typname IN ('ProcurementApprovalType','NotificationType');
```

### 2. Backend Deployment
- [ ] Push code to GitHub main branch
- [ ] Verify Render auto-deployment triggered
- [ ] Monitor build logs for errors
- [ ] Verify backend health endpoint responds

**Test Backend Endpoints:**
```bash
# Workflows
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-backend.onrender.com/api/procurement/workflows

# Delegations
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-backend.onrender.com/api/procurement/delegations
```

### 3. Frontend Deployment
- [ ] Verify frontend build completed
- [ ] Test frontend loads without errors

**Test Frontend Pages:**
- [ ] `/procurement/workflows`
- [ ] `/procurement/delegations`
- [ ] `/procurement/requisitions/pending`
- [ ] `/procurement/requisitions/:id`

### 4. Integration Smoke Tests

#### Workflow Setup
- [ ] Login as `SUPER_ADMIN` and seed workflows via UI (or POST `/api/procurement/workflows/seed`)
- [ ] Confirm workflows appear in `/procurement/workflows`

#### Approval Flow
- [ ] Create a requisition and submit
- [ ] Login as stage 1 approver (or delegate) and approve
- [ ] Verify stage advancement and new approver notification
- [ ] Reject a requisition and verify status + requestor notification
- [ ] Request info and verify requestor notification type `APPROVAL_INFO_REQUEST`

#### Delegation
- [ ] Create a delegation (delegator -> delegate)
- [ ] Login as delegate and approve a requisition on behalf of delegator

## Rollback Plan

If critical issues are found:

1. **Database Rollback (destructive for workflow/delegation data):**
```sql
DROP TABLE IF EXISTS procurement_workflow_stages CASCADE;
DROP TABLE IF EXISTS procurement_workflows CASCADE;
DROP TABLE IF EXISTS approval_delegations CASCADE;

-- Revert requisition approvals constraint would require restoring the previous unique index.
-- If needed, use the Phase 18.1 migration baseline as reference.
```

2. **Code Rollback:**
```bash
git revert HEAD
git push origin main
```

## Success Criteria
- [ ] Migration runs successfully in production
- [ ] Workflows and delegations endpoints work with RBAC
- [ ] Requisition approval actions work end-to-end
- [ ] Notifications created for approval/request-info/reject
- [ ] No critical errors in Render logs

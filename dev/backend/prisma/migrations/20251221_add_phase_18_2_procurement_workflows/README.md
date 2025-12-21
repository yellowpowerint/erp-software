# Migration: Phase 18.2 - Automated Approval Workflows (Procurement)

**Created:** 2025-12-21  
**Session:** 18.2 - Automated Approval Workflows

## Overview
This migration adds procurement-specific approval workflow configuration and approval delegation support, enabling:

- Configurable requisition approval workflows by type and amount range
- Multi-stage approvals (SINGLE / ALL / MAJORITY)
- Delegation of approvals during absence
- Support for request-more-info notifications

## Changes

### Enums
- Adds `ProcurementApprovalType`: `SINGLE`, `ALL`, `MAJORITY`
- Adds `APPROVAL_INFO_REQUEST` to existing `NotificationType`

### Tables
- `procurement_workflows`
- `procurement_workflow_stages`
- `approval_delegations`

### Requisitions
- Adds `workflowId` (nullable) to link requisitions to the workflow used

### Requisition Approvals
- Adds `createdAt` timestamp
- Changes uniqueness to allow **multiple approvers per stage**:
  - Old: unique `(requisitionId, stage)`
  - New: unique `(requisitionId, stage, approverId)`

## Idempotency
Migration uses guarded `DO $$ ... EXCEPTION ... $$` blocks to be safe on Render and for re-runs.

## Deployment
Run SQL:
- `dev/backend/prisma/migrations/20251221_add_phase_18_2_procurement_workflows/migration.sql`

## Rollback (Destructive)
```sql
DROP TABLE IF EXISTS "approval_delegations" CASCADE;
DROP TABLE IF EXISTS "procurement_workflow_stages" CASCADE;
DROP TABLE IF EXISTS "procurement_workflows" CASCADE;

ALTER TABLE "requisitions" DROP COLUMN IF EXISTS "workflowId";

-- remove createdAt if needed
ALTER TABLE "requisition_approvals" DROP COLUMN IF EXISTS "createdAt";

DROP TYPE IF EXISTS "ProcurementApprovalType";
```

**Warning:** Rollback will delete workflow and delegation configuration.

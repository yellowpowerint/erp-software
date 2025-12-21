# Migration: Phase 18.1 - Requisition Management System

**Created:** 2024-12-21  
**Session:** 18.1 - Procurement Requisition Management

## Overview
This migration adds the complete requisition management system for procurement, including requisitions, items, attachments, and multi-stage approval workflows.

## Changes

### New Enums
- `Priority`: LOW, MEDIUM, HIGH, CRITICAL (for requisition and item urgency)
- `RequisitionType`: STOCK_REPLENISHMENT, PROJECT_MATERIALS, EQUIPMENT_PURCHASE, MAINTENANCE_PARTS, SAFETY_SUPPLIES, CONSUMABLES, EMERGENCY, CAPITAL_EXPENDITURE
- `RequisitionStatus`: DRAFT, SUBMITTED, PENDING_APPROVAL, APPROVED, PARTIALLY_APPROVED, REJECTED, CANCELLED, IN_PROCUREMENT, COMPLETED

### New Tables
1. **requisitions**
   - Core requisition entity with workflow tracking
   - Links to projects, users (requestor, approver, rejecter)
   - Tracks status, priority, department, site location
   - Financial tracking with totalEstimate and currency

2. **requisition_items**
   - Line items for each requisition
   - Quantity, unit, pricing, specifications
   - Optional link to stock_items for inventory integration
   - Individual item urgency levels

3. **requisition_attachments**
   - Supporting documents (quotes, specs, approvals)
   - File metadata and uploader tracking
   - Cascade delete with parent requisition

4. **requisition_approvals**
   - Multi-stage approval workflow
   - Stage-based progression
   - Approver comments and timestamps
   - Uses existing ApprovalStatus enum

### Schema Modifications
- **assets**: Added `projectId` column and foreign key to support Project.assets relation

## Idempotency
This migration uses PostgreSQL `DO $$ ... EXCEPTION WHEN duplicate_object/duplicate_column/duplicate_table THEN null ... $$` blocks to ensure safe re-execution on Render.com and other managed PostgreSQL services.

## Deployment Notes
- Run this migration on your Render PostgreSQL database
- Ensure all foreign key references (users, projects, stock_items) exist
- Backend API endpoints are already implemented in `ProcurementModule`
- Frontend pages will be added in the next step

## Rollback
To rollback this migration:
```sql
DROP TABLE IF EXISTS "requisition_approvals" CASCADE;
DROP TABLE IF EXISTS "requisition_attachments" CASCADE;
DROP TABLE IF EXISTS "requisition_items" CASCADE;
DROP TABLE IF EXISTS "requisitions" CASCADE;
ALTER TABLE "assets" DROP COLUMN IF EXISTS "projectId";
DROP TYPE IF EXISTS "RequisitionStatus";
DROP TYPE IF EXISTS "RequisitionType";
DROP TYPE IF EXISTS "Priority";
```

**Warning:** This will permanently delete all requisition data.

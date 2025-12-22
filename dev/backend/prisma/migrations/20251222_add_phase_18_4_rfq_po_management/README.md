# Migration: Phase 18.4 - RFQ, Bidding & Purchase Order Management (Procurement)

**Created:** 2025-12-22  
**Session:** 18.4 - RFQ, Bidding & Purchase Order Management

## Overview
This migration adds the database structures for Session 18.4:

- RFQ management (`rfqs`, `rfq_items`, vendor invites)
- Vendor bid submissions (`rfq_responses`, `rfq_response_items`)
- Purchase Orders (`purchase_orders`, `purchase_order_items`)
- Vendor portal support: optional `users.vendorId` and `UserRole.VENDOR`

## Changes

### Enums
- Adds `VENDOR` to `UserRole`
- Adds `RFQStatus`
- Adds `RFQResponseStatus`
- Adds `POStatus`
- Adds `PurchaseOrderPaymentStatus`

### Tables
- `rfqs`
- `rfq_items`
- `rfq_vendor_invites`
- `rfq_responses`
- `rfq_response_items`
- `purchase_orders`
- `purchase_order_items`

### Users
- Adds `vendorId` (nullable) to `users` to associate a login with a vendor for vendor-portal flows.

## Idempotency
Migration uses guarded `DO $$ ... EXCEPTION ... $$` blocks and `CREATE TABLE IF NOT EXISTS` to be safe on Render and for re-runs.

## Deployment
Run SQL:
- `dev/backend/prisma/migrations/20251222_add_phase_18_4_rfq_po_management/migration.sql`

## Rollback (Destructive)
```sql
DROP TABLE IF EXISTS "purchase_order_items" CASCADE;
DROP TABLE IF EXISTS "purchase_orders" CASCADE;
DROP TABLE IF EXISTS "rfq_response_items" CASCADE;
DROP TABLE IF EXISTS "rfq_responses" CASCADE;
DROP TABLE IF EXISTS "rfq_vendor_invites" CASCADE;
DROP TABLE IF EXISTS "rfq_items" CASCADE;
DROP TABLE IF EXISTS "rfqs" CASCADE;

ALTER TABLE "users" DROP COLUMN IF EXISTS "vendorId";

DROP TYPE IF EXISTS "PurchaseOrderPaymentStatus";
DROP TYPE IF EXISTS "POStatus";
DROP TYPE IF EXISTS "RFQResponseStatus";
DROP TYPE IF EXISTS "RFQStatus";

-- NOTE: enum value removal for UserRole is not supported in Postgres.
```

**Warning:** Rollback will delete all RFQ/PO data.

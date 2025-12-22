# Migration: Phase 18.3 - Vendor Management (Procurement)

**Created:** 2025-12-21  
**Session:** 18.3 - Vendor/Supplier Management

## Overview
This migration adds vendor management tables and enums to support:

- Vendor registration and classification (type/status/categories)
- Vendor contacts
- Vendor compliance documents with expiry tracking
- Vendor products/catalog
- Vendor performance evaluations

## Changes

### Enums
- Adds `VendorType`: `MANUFACTURER`, `DISTRIBUTOR`, `WHOLESALER`, `RETAILER`, `SERVICE_PROVIDER`, `CONTRACTOR`
- Adds `VendorStatus`: `PENDING`, `APPROVED`, `SUSPENDED`, `BLACKLISTED`, `INACTIVE`

### Tables
- `vendors`
- `vendor_contacts`
- `vendor_documents`
- `vendor_products`
- `vendor_evaluations`

## Idempotency
Migration uses guarded `DO $$ ... EXCEPTION ... $$` blocks and `CREATE TABLE IF NOT EXISTS` to be safe on Render and for re-runs.

## Deployment
Run SQL:
- `dev/backend/prisma/migrations/20251221_add_phase_18_3_vendor_management/migration.sql`

## Rollback (Destructive)
```sql
DROP TABLE IF EXISTS "vendor_evaluations" CASCADE;
DROP TABLE IF EXISTS "vendor_products" CASCADE;
DROP TABLE IF EXISTS "vendor_documents" CASCADE;
DROP TABLE IF EXISTS "vendor_contacts" CASCADE;
DROP TABLE IF EXISTS "vendors" CASCADE;

DROP TYPE IF EXISTS "VendorStatus";
DROP TYPE IF EXISTS "VendorType";
```

**Warning:** Rollback will delete all vendor data.

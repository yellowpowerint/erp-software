-- Phase 18.6 - Inventory Integration, Reporting & Analytics (Procurement)
-- All operations are idempotent and safe to re-run on Render Postgres

-- 1) Add inventorySyncedAt to goods_receipts
DO $$ BEGIN
  ALTER TABLE "goods_receipts" ADD COLUMN IF NOT EXISTS "inventorySyncedAt" TIMESTAMP(3);
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- 2) Add reservedQuantity to stock_items
DO $$ BEGIN
  ALTER TABLE "stock_items" ADD COLUMN IF NOT EXISTS "reservedQuantity" INTEGER NOT NULL DEFAULT 0;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- 3) Indexes
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "goods_receipts_inventorySyncedAt_idx" ON "goods_receipts"("inventorySyncedAt");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "stock_items_reservedQuantity_idx" ON "stock_items"("reservedQuantity");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

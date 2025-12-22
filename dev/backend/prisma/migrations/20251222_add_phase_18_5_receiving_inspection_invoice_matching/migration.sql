-- Phase 18.5 - Receiving, Inspection & Invoice Matching (Procurement)
-- All operations are idempotent and safe to re-run on Render Postgres

-- 1) Enums
DO $$ BEGIN
  CREATE TYPE "ReceiptStatus" AS ENUM (
    'PENDING_INSPECTION',
    'INSPECTING',
    'ACCEPTED',
    'PARTIALLY_ACCEPTED',
    'REJECTED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ItemCondition" AS ENUM (
    'GOOD',
    'DAMAGED',
    'DEFECTIVE',
    'WRONG_ITEM'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "InspectionResult" AS ENUM (
    'PASSED',
    'PASSED_WITH_NOTES',
    'FAILED',
    'PENDING_REVIEW'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "MatchStatus" AS ENUM (
    'PENDING',
    'MATCHED',
    'PARTIAL_MATCH',
    'MISMATCH',
    'DISPUTED',
    'RESOLVED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "VendorInvoicePaymentStatus" AS ENUM (
    'UNPAID',
    'PARTIALLY_PAID',
    'PAID',
    'OVERDUE'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2) Tables
CREATE TABLE IF NOT EXISTS "goods_receipts" (
  "id" TEXT NOT NULL,
  "grnNumber" TEXT NOT NULL,
  "purchaseOrderId" TEXT NOT NULL,
  "receivedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "receivedById" TEXT NOT NULL,

  "warehouseId" TEXT,
  "siteLocation" TEXT NOT NULL,

  "deliveryNote" TEXT,
  "carrierName" TEXT,
  "vehicleNumber" TEXT,
  "driverName" TEXT,

  "status" "ReceiptStatus" NOT NULL DEFAULT 'PENDING_INSPECTION',

  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "goods_receipts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "goods_receipt_items" (
  "id" TEXT NOT NULL,
  "goodsReceiptId" TEXT NOT NULL,
  "poItemId" TEXT NOT NULL,
  "itemName" TEXT NOT NULL,
  "orderedQty" DECIMAL(10,2) NOT NULL,
  "receivedQty" DECIMAL(10,2) NOT NULL,
  "acceptedQty" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "rejectedQty" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "unit" TEXT NOT NULL,
  "condition" "ItemCondition" NOT NULL DEFAULT 'GOOD',
  "notes" TEXT,

  CONSTRAINT "goods_receipt_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "quality_inspections" (
  "id" TEXT NOT NULL,
  "goodsReceiptId" TEXT NOT NULL,
  "inspectorId" TEXT NOT NULL,
  "inspectionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  "overallResult" "InspectionResult" NOT NULL,
  "qualityScore" INTEGER,

  "visualCheck" BOOLEAN NOT NULL DEFAULT FALSE,
  "quantityCheck" BOOLEAN NOT NULL DEFAULT FALSE,
  "specCheck" BOOLEAN NOT NULL DEFAULT FALSE,
  "documentCheck" BOOLEAN NOT NULL DEFAULT FALSE,
  "safetyCheck" BOOLEAN NOT NULL DEFAULT FALSE,

  "findings" TEXT,
  "recommendations" TEXT,
  "photos" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],

  CONSTRAINT "quality_inspections_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "vendor_invoices" (
  "id" TEXT NOT NULL,
  "invoiceNumber" TEXT NOT NULL,
  "vendorId" TEXT NOT NULL,
  "purchaseOrderId" TEXT,

  "subtotal" DECIMAL(15,2) NOT NULL,
  "taxAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "totalAmount" DECIMAL(15,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'GHS',

  "invoiceDate" TIMESTAMP(3) NOT NULL,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "receivedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  "matchStatus" "MatchStatus" NOT NULL DEFAULT 'PENDING',
  "matchedAt" TIMESTAMP(3),
  "matchedById" TEXT,

  "priceVariance" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "quantityVariance" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "discrepancyNotes" TEXT,

  "approvedForPayment" BOOLEAN NOT NULL DEFAULT FALSE,
  "approvedAt" TIMESTAMP(3),
  "approvedById" TEXT,

  "paymentStatus" "VendorInvoicePaymentStatus" NOT NULL DEFAULT 'UNPAID',
  "paidAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "paidAt" TIMESTAMP(3),

  "invoiceDocument" TEXT,

  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "vendor_invoices_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "vendor_invoice_items" (
  "id" TEXT NOT NULL,
  "invoiceId" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "quantity" DECIMAL(10,2) NOT NULL,
  "unitPrice" DECIMAL(15,2) NOT NULL,
  "totalPrice" DECIMAL(15,2) NOT NULL,
  "poItemId" TEXT,

  CONSTRAINT "vendor_invoice_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "vendor_payments" (
  "id" TEXT NOT NULL,
  "invoiceId" TEXT NOT NULL,
  "amount" DECIMAL(15,2) NOT NULL,
  "paymentDate" TIMESTAMP(3) NOT NULL,
  "paymentMethod" TEXT NOT NULL,
  "reference" TEXT,
  "processedById" TEXT NOT NULL,
  "notes" TEXT,

  CONSTRAINT "vendor_payments_pkey" PRIMARY KEY ("id")
);

-- 3) Indexes / Uniques
DO $$ BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS "goods_receipts_grnNumber_key" ON "goods_receipts"("grnNumber");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "goods_receipts_purchaseOrderId_idx" ON "goods_receipts"("purchaseOrderId");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "goods_receipt_items_goodsReceiptId_idx" ON "goods_receipt_items"("goodsReceiptId");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "goods_receipt_items_poItemId_idx" ON "goods_receipt_items"("poItemId");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "quality_inspections_goodsReceiptId_idx" ON "quality_inspections"("goodsReceiptId");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "quality_inspections_inspectorId_idx" ON "quality_inspections"("inspectorId");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS "vendor_invoices_vendorId_invoiceNumber_key" ON "vendor_invoices"("vendorId", "invoiceNumber");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "vendor_invoices_matchStatus_idx" ON "vendor_invoices"("matchStatus");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "vendor_invoices_purchaseOrderId_idx" ON "vendor_invoices"("purchaseOrderId");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "vendor_invoice_items_invoiceId_idx" ON "vendor_invoice_items"("invoiceId");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "vendor_invoice_items_poItemId_idx" ON "vendor_invoice_items"("poItemId");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "vendor_payments_invoiceId_idx" ON "vendor_payments"("invoiceId");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "vendor_payments_processedById_idx" ON "vendor_payments"("processedById");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

-- 4) Foreign Keys
DO $$ BEGIN
  ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "goods_receipt_items" ADD CONSTRAINT "goods_receipt_items_goodsReceiptId_fkey" FOREIGN KEY ("goodsReceiptId") REFERENCES "goods_receipts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "goods_receipt_items" ADD CONSTRAINT "goods_receipt_items_poItemId_fkey" FOREIGN KEY ("poItemId") REFERENCES "purchase_order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "quality_inspections" ADD CONSTRAINT "quality_inspections_goodsReceiptId_fkey" FOREIGN KEY ("goodsReceiptId") REFERENCES "goods_receipts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "quality_inspections" ADD CONSTRAINT "quality_inspections_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "vendor_invoices" ADD CONSTRAINT "vendor_invoices_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "vendor_invoices" ADD CONSTRAINT "vendor_invoices_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "vendor_invoices" ADD CONSTRAINT "vendor_invoices_matchedById_fkey" FOREIGN KEY ("matchedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "vendor_invoices" ADD CONSTRAINT "vendor_invoices_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "vendor_invoice_items" ADD CONSTRAINT "vendor_invoice_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "vendor_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "vendor_invoice_items" ADD CONSTRAINT "vendor_invoice_items_poItemId_fkey" FOREIGN KEY ("poItemId") REFERENCES "purchase_order_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "vendor_payments" ADD CONSTRAINT "vendor_payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "vendor_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "vendor_payments" ADD CONSTRAINT "vendor_payments_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

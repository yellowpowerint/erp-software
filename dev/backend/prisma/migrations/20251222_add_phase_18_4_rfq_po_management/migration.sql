-- Phase 18.4 - RFQ, Bidding & Purchase Order Management (Procurement)
-- All operations are idempotent and safe to re-run on Render Postgres

-- 1) Extend UserRole enum with VENDOR
DO $$ BEGIN
  ALTER TYPE "UserRole" ADD VALUE 'VENDOR';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2) Add users.vendorId (vendor portal association)
DO $$ BEGIN
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "vendorId" TEXT;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- 3) Enums
DO $$ BEGIN
  CREATE TYPE "RFQStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED', 'EVALUATING', 'AWARDED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "RFQResponseStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'SHORTLISTED', 'SELECTED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "POStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'ACKNOWLEDGED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'COMPLETED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PurchaseOrderPaymentStatus" AS ENUM ('UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 4) Tables
CREATE TABLE IF NOT EXISTS "rfqs" (
  "id" TEXT NOT NULL,
  "rfqNumber" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "requisitionId" TEXT,
  "status" "RFQStatus" NOT NULL DEFAULT 'DRAFT',

  "issueDate" TIMESTAMP(3),
  "responseDeadline" TIMESTAMP(3) NOT NULL,
  "validityPeriod" INTEGER NOT NULL DEFAULT 30,

  "deliveryLocation" TEXT NOT NULL,
  "deliveryTerms" TEXT,
  "paymentTerms" TEXT,
  "specialConditions" TEXT,

  "siteAccess" TEXT,
  "safetyRequirements" TEXT,
  "technicalSpecs" TEXT,

  "selectedResponseId" TEXT,

  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "rfqs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "rfq_items" (
  "id" TEXT NOT NULL,
  "rfqId" TEXT NOT NULL,
  "itemName" TEXT NOT NULL,
  "description" TEXT,
  "specifications" TEXT,
  "quantity" DECIMAL(10,2) NOT NULL,
  "unit" TEXT NOT NULL,
  "estimatedPrice" DECIMAL(15,2),

  CONSTRAINT "rfq_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "rfq_vendor_invites" (
  "id" TEXT NOT NULL,
  "rfqId" TEXT NOT NULL,
  "vendorId" TEXT NOT NULL,
  "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "viewedAt" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'INVITED',

  CONSTRAINT "rfq_vendor_invites_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "rfq_responses" (
  "id" TEXT NOT NULL,
  "rfqId" TEXT NOT NULL,
  "vendorId" TEXT NOT NULL,
  "status" "RFQResponseStatus" NOT NULL DEFAULT 'SUBMITTED',

  "totalAmount" DECIMAL(15,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'GHS',
  "validUntil" TIMESTAMP(3) NOT NULL,

  "deliveryDays" INTEGER NOT NULL,
  "paymentTerms" TEXT,
  "warranty" TEXT,

  "quotationDoc" TEXT,
  "technicalDoc" TEXT,

  "technicalScore" DECIMAL(5,2),
  "commercialScore" DECIMAL(5,2),
  "overallScore" DECIMAL(5,2),
  "evaluationNotes" TEXT,

  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "evaluatedAt" TIMESTAMP(3),

  CONSTRAINT "rfq_responses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "rfq_response_items" (
  "id" TEXT NOT NULL,
  "responseId" TEXT NOT NULL,
  "rfqItemId" TEXT NOT NULL,
  "unitPrice" DECIMAL(15,2) NOT NULL,
  "totalPrice" DECIMAL(15,2) NOT NULL,
  "leadTimeDays" INTEGER,
  "notes" TEXT,

  CONSTRAINT "rfq_response_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "purchase_orders" (
  "id" TEXT NOT NULL,
  "poNumber" TEXT NOT NULL,
  "requisitionId" TEXT,
  "rfqResponseId" TEXT,
  "vendorId" TEXT NOT NULL,
  "status" "POStatus" NOT NULL DEFAULT 'DRAFT',

  "subtotal" DECIMAL(15,2) NOT NULL,
  "taxAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "discountAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "shippingCost" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "totalAmount" DECIMAL(15,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'GHS',

  "deliveryAddress" TEXT NOT NULL,
  "deliverySite" TEXT,
  "expectedDelivery" TIMESTAMP(3) NOT NULL,
  "actualDelivery" TIMESTAMP(3),
  "deliveryTerms" TEXT,

  "paymentTerms" INTEGER NOT NULL DEFAULT 30,
  "paymentStatus" "PurchaseOrderPaymentStatus" NOT NULL DEFAULT 'UNPAID',

  "approvedById" TEXT,
  "approvedAt" TIMESTAMP(3),

  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "purchase_order_items" (
  "id" TEXT NOT NULL,
  "purchaseOrderId" TEXT NOT NULL,
  "itemName" TEXT NOT NULL,
  "description" TEXT,
  "quantity" DECIMAL(10,2) NOT NULL,
  "unit" TEXT NOT NULL,
  "unitPrice" DECIMAL(15,2) NOT NULL,
  "totalPrice" DECIMAL(15,2) NOT NULL,
  "receivedQty" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "stockItemId" TEXT,

  CONSTRAINT "purchase_order_items_pkey" PRIMARY KEY ("id")
);

-- 5) Indexes / Uniques
DO $$ BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS "rfqs_rfqNumber_key" ON "rfqs"("rfqNumber");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "rfqs_status_idx" ON "rfqs"("status");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "rfqs_requisitionId_idx" ON "rfqs"("requisitionId");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "rfq_items_rfqId_idx" ON "rfq_items"("rfqId");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS "rfq_vendor_invites_rfqId_vendorId_key" ON "rfq_vendor_invites"("rfqId", "vendorId");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "rfq_vendor_invites_vendorId_idx" ON "rfq_vendor_invites"("vendorId");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS "rfq_responses_rfqId_vendorId_key" ON "rfq_responses"("rfqId", "vendorId");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "rfq_responses_vendorId_idx" ON "rfq_responses"("vendorId");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "rfq_response_items_responseId_idx" ON "rfq_response_items"("responseId");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "rfq_response_items_rfqItemId_idx" ON "rfq_response_items"("rfqItemId");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS "purchase_orders_poNumber_key" ON "purchase_orders"("poNumber");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "purchase_orders_status_idx" ON "purchase_orders"("status");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "purchase_orders_vendorId_idx" ON "purchase_orders"("vendorId");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "purchase_orders_requisitionId_idx" ON "purchase_orders"("requisitionId");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "purchase_order_items_purchaseOrderId_idx" ON "purchase_order_items"("purchaseOrderId");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "purchase_order_items_stockItemId_idx" ON "purchase_order_items"("stockItemId");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

-- 6) Foreign Keys
DO $$ BEGIN
  ALTER TABLE "users" ADD CONSTRAINT "users_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "rfqs" ADD CONSTRAINT "rfqs_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "requisitions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "rfqs" ADD CONSTRAINT "rfqs_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "rfq_items" ADD CONSTRAINT "rfq_items_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "rfqs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "rfq_vendor_invites" ADD CONSTRAINT "rfq_vendor_invites_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "rfqs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "rfq_vendor_invites" ADD CONSTRAINT "rfq_vendor_invites_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "rfq_responses" ADD CONSTRAINT "rfq_responses_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "rfqs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "rfq_responses" ADD CONSTRAINT "rfq_responses_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "rfq_response_items" ADD CONSTRAINT "rfq_response_items_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "rfq_responses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "rfq_response_items" ADD CONSTRAINT "rfq_response_items_rfqItemId_fkey" FOREIGN KEY ("rfqItemId") REFERENCES "rfq_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "requisitions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_rfqResponseId_fkey" FOREIGN KEY ("rfqResponseId") REFERENCES "rfq_responses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES "stock_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

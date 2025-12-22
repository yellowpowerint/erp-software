-- Phase 18.3 - Supplier/Vendor Management
-- All operations are idempotent and safe to re-run on Render Postgres

-- CreateEnum: VendorType
DO $$ BEGIN
  CREATE TYPE "VendorType" AS ENUM (
    'MANUFACTURER',
    'DISTRIBUTOR',
    'WHOLESALER',
    'RETAILER',
    'SERVICE_PROVIDER',
    'CONTRACTOR'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum: VendorStatus
DO $$ BEGIN
  CREATE TYPE "VendorStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'SUSPENDED',
    'BLACKLISTED',
    'INACTIVE'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable: vendors
CREATE TABLE IF NOT EXISTS "vendors" (
  "id" TEXT NOT NULL,
  "vendorCode" TEXT NOT NULL,
  "companyName" TEXT NOT NULL,
  "tradingName" TEXT,
  "type" "VendorType" NOT NULL,
  "category" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],

  "primaryContact" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "alternatePhone" TEXT,
  "website" TEXT,

  "address" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "region" TEXT NOT NULL,
  "country" TEXT NOT NULL DEFAULT 'Ghana',
  "postalCode" TEXT,
  "gpsCoordinates" TEXT,

  "taxId" TEXT,
  "businessRegNo" TEXT,
  "vatRegistered" BOOLEAN NOT NULL DEFAULT FALSE,
  "vatNumber" TEXT,

  "bankName" TEXT,
  "bankBranch" TEXT,
  "accountNumber" TEXT,
  "accountName" TEXT,
  "swiftCode" TEXT,

  "paymentTerms" INTEGER NOT NULL DEFAULT 30,
  "creditLimit" DECIMAL(15,2),
  "currency" TEXT NOT NULL DEFAULT 'GHS',

  "rating" DECIMAL(3,2) NOT NULL DEFAULT 0,
  "totalOrders" INTEGER NOT NULL DEFAULT 0,
  "totalSpend" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "onTimeDelivery" DECIMAL(5,2) NOT NULL DEFAULT 0,
  "qualityScore" DECIMAL(5,2) NOT NULL DEFAULT 0,

  "status" "VendorStatus" NOT NULL DEFAULT 'PENDING',
  "isPreferred" BOOLEAN NOT NULL DEFAULT FALSE,
  "isBlacklisted" BOOLEAN NOT NULL DEFAULT FALSE,
  "blacklistReason" TEXT,

  "miningLicense" TEXT,
  "environmentalCert" TEXT,
  "safetyCompliance" BOOLEAN NOT NULL DEFAULT FALSE,
  "insuranceCert" TEXT,
  "insuranceExpiry" TIMESTAMP(3),

  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable: vendor_contacts
CREATE TABLE IF NOT EXISTS "vendor_contacts" (
  "id" TEXT NOT NULL,
  "vendorId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "position" TEXT,
  "email" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "isPrimary" BOOLEAN NOT NULL DEFAULT FALSE,

  CONSTRAINT "vendor_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable: vendor_documents
CREATE TABLE IF NOT EXISTS "vendor_documents" (
  "id" TEXT NOT NULL,
  "vendorId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "expiryDate" TIMESTAMP(3),
  "uploadedById" TEXT NOT NULL,
  "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "vendor_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable: vendor_products
CREATE TABLE IF NOT EXISTS "vendor_products" (
  "id" TEXT NOT NULL,
  "vendorId" TEXT NOT NULL,
  "productName" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "description" TEXT,
  "unitPrice" DECIMAL(15,2) NOT NULL,
  "unit" TEXT NOT NULL,
  "leadTimeDays" INTEGER,
  "minOrderQty" DECIMAL(10,2),

  CONSTRAINT "vendor_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable: vendor_evaluations
CREATE TABLE IF NOT EXISTS "vendor_evaluations" (
  "id" TEXT NOT NULL,
  "vendorId" TEXT NOT NULL,
  "evaluatorId" TEXT NOT NULL,
  "period" TEXT NOT NULL,
  "qualityScore" INTEGER NOT NULL,
  "deliveryScore" INTEGER NOT NULL,
  "priceScore" INTEGER NOT NULL,
  "serviceScore" INTEGER NOT NULL,
  "safetyScore" INTEGER NOT NULL,
  "overallScore" DECIMAL(3,2) NOT NULL,
  "comments" TEXT,
  "recommendation" TEXT,
  "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "vendor_evaluations_pkey" PRIMARY KEY ("id")
);

-- Indexes
DO $$ BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS "vendors_vendorCode_key" ON "vendors"("vendorCode");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "vendors_status_idx" ON "vendors"("status");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "vendors_isPreferred_idx" ON "vendors"("isPreferred");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "vendors_isBlacklisted_idx" ON "vendors"("isBlacklisted");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "vendor_contacts_vendorId_idx" ON "vendor_contacts"("vendorId");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "vendor_documents_vendorId_idx" ON "vendor_documents"("vendorId");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "vendor_documents_expiryDate_idx" ON "vendor_documents"("expiryDate");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "vendor_documents_uploadedById_idx" ON "vendor_documents"("uploadedById");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "vendor_products_vendorId_idx" ON "vendor_products"("vendorId");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "vendor_evaluations_vendorId_idx" ON "vendor_evaluations"("vendorId");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "vendor_evaluations_evaluatorId_idx" ON "vendor_evaluations"("evaluatorId");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "vendor_evaluations_evaluatedAt_idx" ON "vendor_evaluations"("evaluatedAt");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

-- Foreign Keys
DO $$ BEGIN
  ALTER TABLE "vendors" ADD CONSTRAINT "vendors_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "vendor_contacts" ADD CONSTRAINT "vendor_contacts_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "vendor_documents" ADD CONSTRAINT "vendor_documents_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "vendor_documents" ADD CONSTRAINT "vendor_documents_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "vendor_products" ADD CONSTRAINT "vendor_products_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "vendor_evaluations" ADD CONSTRAINT "vendor_evaluations_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "vendor_evaluations" ADD CONSTRAINT "vendor_evaluations_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

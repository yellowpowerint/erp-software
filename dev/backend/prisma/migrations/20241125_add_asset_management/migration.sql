-- CreateEnum: Asset Categories
DO $$ BEGIN
    CREATE TYPE "AssetCategory" AS ENUM ('HEAVY_EQUIPMENT', 'VEHICLES', 'MACHINERY', 'TOOLS', 'COMPUTERS', 'FURNITURE', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum: Asset Status
DO $$ BEGIN
    CREATE TYPE "AssetStatus" AS ENUM ('ACTIVE', 'MAINTENANCE', 'INACTIVE', 'RETIRED', 'DAMAGED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum: Asset Condition
DO $$ BEGIN
    CREATE TYPE "AssetCondition" AS ENUM ('EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'CRITICAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable: Assets
CREATE TABLE IF NOT EXISTS "assets" (
    "id" TEXT NOT NULL,
    "assetCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "AssetCategory" NOT NULL,
    "manufacturer" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "purchaseDate" TIMESTAMP(3) NOT NULL,
    "purchasePrice" DOUBLE PRECISION NOT NULL,
    "currentValue" DOUBLE PRECISION,
    "depreciationRate" DOUBLE PRECISION,
    "location" TEXT,
    "status" "AssetStatus" NOT NULL DEFAULT 'ACTIVE',
    "condition" "AssetCondition" NOT NULL DEFAULT 'GOOD',
    "assignedTo" TEXT,
    "notes" TEXT,
    "warrantyExpiry" TIMESTAMP(3),
    "lastMaintenanceAt" TIMESTAMP(3),
    "nextMaintenanceAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Maintenance Logs
CREATE TABLE IF NOT EXISTS "maintenance_logs" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "maintenanceType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "performedBy" TEXT,
    "performedAt" TIMESTAMP(3) NOT NULL,
    "cost" DOUBLE PRECISION,
    "nextDueDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "assets_assetCode_key" ON "assets"("assetCode");
CREATE INDEX IF NOT EXISTS "assets_category_idx" ON "assets"("category");
CREATE INDEX IF NOT EXISTS "assets_status_idx" ON "assets"("status");
CREATE INDEX IF NOT EXISTS "assets_condition_idx" ON "assets"("condition");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "maintenance_logs_assetId_idx" ON "maintenance_logs"("assetId");
CREATE INDEX IF NOT EXISTS "maintenance_logs_performedAt_idx" ON "maintenance_logs"("performedAt");

-- AddForeignKey
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assets')
      AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'maintenance_logs_assetId_fkey') THEN
        ALTER TABLE "maintenance_logs" ADD CONSTRAINT "maintenance_logs_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

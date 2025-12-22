DO $$ BEGIN
  CREATE TYPE "FleetAssetType" AS ENUM (
    'VEHICLE',
    'HEAVY_MACHINERY',
    'DRILLING_EQUIPMENT',
    'PROCESSING_EQUIPMENT',
    'SUPPORT_EQUIPMENT',
    'TRANSPORT'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "FuelType" AS ENUM (
    'DIESEL',
    'PETROL',
    'ELECTRIC',
    'HYBRID',
    'LPG',
    'NONE'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "FleetAssetStatus" AS ENUM (
    'ACTIVE',
    'IN_MAINTENANCE',
    'BREAKDOWN',
    'STANDBY',
    'DECOMMISSIONED',
    'SOLD'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "FleetAssetCondition" AS ENUM (
    'EXCELLENT',
    'GOOD',
    'FAIR',
    'POOR',
    'CRITICAL'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "fleet_assets" (
  "id" TEXT NOT NULL,
  "assetCode" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" "FleetAssetType" NOT NULL,
  "category" TEXT NOT NULL,

  "registrationNo" TEXT,
  "serialNumber" TEXT,
  "engineNumber" TEXT,
  "chassisNumber" TEXT,

  "make" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "capacity" TEXT,
  "fuelType" "FuelType" NOT NULL,
  "tankCapacity" NUMERIC(10,2),

  "purchaseDate" TIMESTAMP(3),
  "purchasePrice" NUMERIC(15,2),
  "vendor" TEXT,
  "warrantyExpiry" TIMESTAMP(3),

  "status" "FleetAssetStatus" NOT NULL DEFAULT 'ACTIVE',
  "condition" "FleetAssetCondition" NOT NULL DEFAULT 'GOOD',
  "currentLocation" TEXT NOT NULL,
  "currentOperator" TEXT,
  "operatorId" TEXT,

  "currentOdometer" NUMERIC(12,2) NOT NULL DEFAULT 0,
  "currentHours" NUMERIC(12,2) NOT NULL DEFAULT 0,
  "lastOdometerUpdate" TIMESTAMP(3),

  "depreciationMethod" TEXT NOT NULL DEFAULT 'STRAIGHT_LINE',
  "usefulLifeYears" INTEGER NOT NULL DEFAULT 10,
  "salvageValue" NUMERIC(15,2) NOT NULL DEFAULT 0,
  "currentValue" NUMERIC(15,2),

  "insuranceProvider" TEXT,
  "insurancePolicyNo" TEXT,
  "insuranceExpiry" TIMESTAMP(3),
  "insurancePremium" NUMERIC(15,2),

  "miningPermit" TEXT,
  "permitExpiry" TIMESTAMP(3),
  "safetyInspection" TIMESTAMP(3),
  "nextInspectionDue" TIMESTAMP(3),
  "emissionsCert" TEXT,
  "emissionsExpiry" TIMESTAMP(3),

  "decommissionReason" TEXT,
  "decommissionedAt" TIMESTAMP(3),

  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "fleet_assets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "fleet_documents" (
  "id" TEXT NOT NULL,
  "assetId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "storageKey" TEXT NOT NULL,
  "storageProvider" TEXT NOT NULL DEFAULT 'local',
  "expiryDate" TIMESTAMP(3),
  "uploadedById" TEXT NOT NULL,
  "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "fleet_documents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "fleet_assignments" (
  "id" TEXT NOT NULL,
  "assetId" TEXT NOT NULL,
  "operatorId" TEXT NOT NULL,
  "projectId" TEXT,
  "siteLocation" TEXT NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "notes" TEXT,
  "assignedById" TEXT NOT NULL,

  CONSTRAINT "fleet_assignments_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "fleet_assets" ADD CONSTRAINT "fleet_assets_assetCode_key" UNIQUE ("assetCode");
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "fleet_assets" ADD CONSTRAINT "fleet_assets_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "fleet_assets" ADD CONSTRAINT "fleet_assets_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "fleet_documents" ADD CONSTRAINT "fleet_documents_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "fleet_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "fleet_documents" ADD CONSTRAINT "fleet_documents_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "fleet_assignments" ADD CONSTRAINT "fleet_assignments_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "fleet_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "fleet_assignments" ADD CONSTRAINT "fleet_assignments_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "fleet_assignments" ADD CONSTRAINT "fleet_assignments_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "fleet_assignments" ADD CONSTRAINT "fleet_assignments_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "fleet_assets_type_idx" ON "fleet_assets"("type");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "fleet_assets_status_idx" ON "fleet_assets"("status");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "fleet_assets_currentLocation_idx" ON "fleet_assets"("currentLocation");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "fleet_documents_assetId_idx" ON "fleet_documents"("assetId");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "fleet_documents_expiryDate_idx" ON "fleet_documents"("expiryDate");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "fleet_assignments_assetId_idx" ON "fleet_assignments"("assetId");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "fleet_assignments_operatorId_idx" ON "fleet_assignments"("operatorId");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "fleet_assignments_projectId_idx" ON "fleet_assignments"("projectId");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "fleet_assignments_status_idx" ON "fleet_assignments"("status");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

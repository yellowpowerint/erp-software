DO $$ BEGIN
  CREATE TYPE "BreakdownCategory" AS ENUM (
    'MECHANICAL',
    'ELECTRICAL',
    'HYDRAULIC',
    'ENGINE',
    'TRANSMISSION',
    'TIRES_TRACKS',
    'STRUCTURAL',
    'OPERATOR_ERROR',
    'EXTERNAL_DAMAGE',
    'OTHER'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "Severity" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "BreakdownStatus" AS ENUM (
    'REPORTED',
    'ACKNOWLEDGED',
    'DIAGNOSING',
    'AWAITING_PARTS',
    'IN_REPAIR',
    'RESOLVED',
    'CLOSED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "FleetInspectionType" AS ENUM (
    'PRE_OPERATION',
    'POST_OPERATION',
    'WEEKLY',
    'MONTHLY',
    'SAFETY',
    'REGULATORY'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "breakdown_logs" (
  "id" TEXT NOT NULL,
  "assetId" TEXT NOT NULL,

  "breakdownDate" TIMESTAMP(3) NOT NULL,
  "reportedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "location" TEXT NOT NULL,
  "siteLocation" TEXT NOT NULL,

  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "category" "BreakdownCategory" NOT NULL,
  "severity" "Severity" NOT NULL,

  "operationalImpact" TEXT,
  "estimatedDowntime" DECIMAL(10,2),
  "actualDowntime" DECIMAL(10,2),
  "productionLoss" DECIMAL(15,2),

  "status" "BreakdownStatus" NOT NULL DEFAULT 'REPORTED',
  "rootCause" TEXT,
  "resolution" TEXT,
  "resolvedDate" TIMESTAMP(3),

  "repairType" TEXT,
  "repairCost" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "partsUsed" TEXT,

  "reportedById" TEXT NOT NULL,
  "assignedToId" TEXT,
  "resolvedById" TEXT,

  "photos" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "documents" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],

  "maintenanceRecordId" TEXT,

  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "breakdown_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "usage_logs" (
  "id" TEXT NOT NULL,
  "assetId" TEXT NOT NULL,

  "date" TIMESTAMP(3) NOT NULL,
  "shiftId" TEXT,
  "shift" TEXT,

  "operatorId" TEXT NOT NULL,

  "siteLocation" TEXT NOT NULL,
  "projectId" TEXT,

  "startOdometer" DECIMAL(12,2),
  "endOdometer" DECIMAL(12,2),
  "distanceCovered" DECIMAL(10,2),

  "startHours" DECIMAL(12,2),
  "endHours" DECIMAL(12,2),
  "operatingHours" DECIMAL(10,2),

  "idleHours" DECIMAL(10,2),

  "workDescription" TEXT,
  "loadsCarried" INTEGER,
  "materialMoved" DECIMAL(15,2),
  "tripsCompleted" INTEGER,

  "preOpCheck" BOOLEAN NOT NULL DEFAULT FALSE,
  "postOpCheck" BOOLEAN NOT NULL DEFAULT FALSE,
  "issuesReported" TEXT,

  "fuelAdded" DECIMAL(10,2),

  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "usage_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "fleet_inspections" (
  "id" TEXT NOT NULL,
  "assetId" TEXT NOT NULL,

  "type" "FleetInspectionType" NOT NULL,
  "inspectionDate" TIMESTAMP(3) NOT NULL,

  "inspectorId" TEXT NOT NULL,

  "overallResult" "InspectionResult" NOT NULL,
  "score" INTEGER,

  "checklistItems" JSONB NOT NULL,
  "findings" TEXT,
  "recommendations" TEXT,
  "defectsFound" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],

  "followUpRequired" BOOLEAN NOT NULL DEFAULT FALSE,
  "followUpDate" TIMESTAMP(3),
  "followUpNotes" TEXT,

  "photos" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "documents" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],

  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "fleet_inspections_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "breakdown_logs" ADD CONSTRAINT "breakdown_logs_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "fleet_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "breakdown_logs" ADD CONSTRAINT "breakdown_logs_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "breakdown_logs" ADD CONSTRAINT "breakdown_logs_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "breakdown_logs" ADD CONSTRAINT "breakdown_logs_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "breakdown_logs" ADD CONSTRAINT "breakdown_logs_maintenanceRecordId_fkey" FOREIGN KEY ("maintenanceRecordId") REFERENCES "maintenance_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "usage_logs" ADD CONSTRAINT "usage_logs_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "fleet_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "usage_logs" ADD CONSTRAINT "usage_logs_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "usage_logs" ADD CONSTRAINT "usage_logs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "fleet_inspections" ADD CONSTRAINT "fleet_inspections_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "fleet_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "fleet_inspections" ADD CONSTRAINT "fleet_inspections_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "breakdown_logs_assetId_idx" ON "breakdown_logs"("assetId");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "breakdown_logs_status_idx" ON "breakdown_logs"("status");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "breakdown_logs_severity_idx" ON "breakdown_logs"("severity");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "breakdown_logs_category_idx" ON "breakdown_logs"("category");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "usage_logs_assetId_idx" ON "usage_logs"("assetId");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "usage_logs_date_idx" ON "usage_logs"("date");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "usage_logs_operatorId_idx" ON "usage_logs"("operatorId");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "usage_logs_siteLocation_idx" ON "usage_logs"("siteLocation");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "fleet_inspections_assetId_idx" ON "fleet_inspections"("assetId");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "fleet_inspections_inspectionDate_idx" ON "fleet_inspections"("inspectionDate");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "fleet_inspections_type_idx" ON "fleet_inspections"("type");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

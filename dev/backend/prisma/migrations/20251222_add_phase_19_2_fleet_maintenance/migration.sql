DO $$ BEGIN
  CREATE TYPE "MaintenanceType" AS ENUM (
    'PREVENTIVE',
    'CORRECTIVE',
    'PREDICTIVE',
    'EMERGENCY',
    'INSPECTION',
    'OVERHAUL'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ScheduleFrequency" AS ENUM (
    'TIME_BASED',
    'DISTANCE_BASED',
    'HOURS_BASED',
    'COMBINED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "MaintenanceStatus" AS ENUM (
    'SCHEDULED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
    'OVERDUE'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "maintenance_schedules" (
  "id" TEXT NOT NULL,
  "assetId" TEXT NOT NULL,
  "type" "MaintenanceType" NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,

  "frequency" "ScheduleFrequency" NOT NULL,
  "intervalValue" INTEGER NOT NULL,
  "intervalUnit" TEXT NOT NULL,

  "lastPerformed" TIMESTAMP(3),
  "lastOdometer" DECIMAL(12,2),
  "lastHours" DECIMAL(12,2),
  "nextDue" TIMESTAMP(3),
  "nextDueOdometer" DECIMAL(12,2),
  "nextDueHours" DECIMAL(12,2),

  "alertDaysBefore" INTEGER NOT NULL DEFAULT 7,
  "alertKmBefore" DECIMAL(10,2),
  "alertHoursBefore" DECIMAL(10,2),

  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',

  "estimatedCost" DECIMAL(15,2),
  "estimatedDuration" INTEGER,

  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "maintenance_schedules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "maintenance_records" (
  "id" TEXT NOT NULL,
  "assetId" TEXT NOT NULL,
  "scheduleId" TEXT,

  "type" "MaintenanceType" NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,

  "scheduledDate" TIMESTAMP(3),
  "startDate" TIMESTAMP(3) NOT NULL,
  "completionDate" TIMESTAMP(3),
  "downtime" DECIMAL(10,2),

  "odometerReading" DECIMAL(12,2),
  "hoursReading" DECIMAL(12,2),

  "workPerformed" TEXT,
  "partsReplaced" TEXT,
  "technicianNotes" TEXT,

  "laborCost" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "partsCost" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "externalCost" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "totalCost" DECIMAL(15,2) NOT NULL DEFAULT 0,

  "serviceProvider" TEXT,
  "vendorId" TEXT,
  "invoiceNumber" TEXT,

  "status" "MaintenanceStatus" NOT NULL DEFAULT 'SCHEDULED',
  "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',

  "performedById" TEXT,
  "approvedById" TEXT,

  "documents" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "photos" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],

  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "maintenance_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "maintenance_checklists" (
  "id" TEXT NOT NULL,
  "assetType" "FleetAssetType" NOT NULL,
  "name" TEXT NOT NULL,
  "items" JSONB NOT NULL,
  "isDefault" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "maintenance_checklists_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "maintenance_schedules" ADD CONSTRAINT "maintenance_schedules_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "fleet_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "fleet_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "maintenance_schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "maintenance_schedules_assetId_idx" ON "maintenance_schedules"("assetId");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "maintenance_schedules_nextDue_idx" ON "maintenance_schedules"("nextDue");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "maintenance_schedules_isActive_idx" ON "maintenance_schedules"("isActive");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "maintenance_records_assetId_idx" ON "maintenance_records"("assetId");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "maintenance_records_scheduleId_idx" ON "maintenance_records"("scheduleId");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "maintenance_records_status_idx" ON "maintenance_records"("status");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "maintenance_checklists_assetType_idx" ON "maintenance_checklists"("assetType");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

-- CreateEnum: Shift Type
DO $$ BEGIN
    CREATE TYPE "ShiftType" AS ENUM ('DAY', 'NIGHT', 'MORNING', 'AFTERNOON', 'EVENING');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum: Production Activity Type
DO $$ BEGIN
    CREATE TYPE "ProductionActivityType" AS ENUM ('MINING', 'DRILLING', 'BLASTING', 'HAULING', 'CRUSHING', 'PROCESSING', 'MAINTENANCE', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable: Production Logs
CREATE TABLE IF NOT EXISTS "production_logs" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "shiftType" "ShiftType" NOT NULL,
    "activityType" "ProductionActivityType" NOT NULL,
    "location" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "equipmentUsed" TEXT,
    "operatorName" TEXT,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Shifts
CREATE TABLE IF NOT EXISTS "shifts" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "shiftType" "ShiftType" NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "supervisor" TEXT,
    "crew" TEXT[],
    "location" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Field Reports
CREATE TABLE IF NOT EXISTS "field_reports" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "reportDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "reportedBy" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "findings" TEXT,
    "recommendations" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "attachments" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "field_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "production_logs_projectId_idx" ON "production_logs"("projectId");
CREATE INDEX IF NOT EXISTS "production_logs_date_idx" ON "production_logs"("date");
CREATE INDEX IF NOT EXISTS "production_logs_shiftType_idx" ON "production_logs"("shiftType");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "shifts_date_idx" ON "shifts"("date");
CREATE INDEX IF NOT EXISTS "shifts_shiftType_idx" ON "shifts"("shiftType");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "field_reports_projectId_idx" ON "field_reports"("projectId");
CREATE INDEX IF NOT EXISTS "field_reports_reportDate_idx" ON "field_reports"("reportDate");

-- AddForeignKey
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects')
      AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'production_logs_projectId_fkey') THEN
        ALTER TABLE "production_logs" ADD CONSTRAINT "production_logs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects')
      AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'field_reports_projectId_fkey') THEN
        ALTER TABLE "field_reports" ADD CONSTRAINT "field_reports_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

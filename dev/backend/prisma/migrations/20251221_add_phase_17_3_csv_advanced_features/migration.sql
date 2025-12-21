ALTER TABLE "import_jobs" ADD COLUMN IF NOT EXISTS "scheduledAt" TIMESTAMP(3);
ALTER TABLE "import_jobs" ADD COLUMN IF NOT EXISTS "batchId" TEXT;

CREATE TABLE IF NOT EXISTS "csv_audit_logs" (
  "id" TEXT PRIMARY KEY,
  "jobType" TEXT NOT NULL,
  "jobId" TEXT,
  "action" TEXT NOT NULL,
  "details" JSONB,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "csv_audit_logs_jobType_jobId_idx" ON "csv_audit_logs"("jobType", "jobId");
CREATE INDEX IF NOT EXISTS "csv_audit_logs_createdAt_idx" ON "csv_audit_logs"("createdAt");
ALTER TABLE "csv_audit_logs" ADD CONSTRAINT IF NOT EXISTS "csv_audit_logs_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "csv_batches" (
  "id" TEXT PRIMARY KEY,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "totalJobs" INTEGER NOT NULL DEFAULT 0,
  "completedJobs" INTEGER NOT NULL DEFAULT 0,
  "failedJobs" INTEGER NOT NULL DEFAULT 0,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "csv_batches_createdById_idx" ON "csv_batches"("createdById");
CREATE INDEX IF NOT EXISTS "csv_batches_status_idx" ON "csv_batches"("status");
ALTER TABLE "csv_batches" ADD CONSTRAINT IF NOT EXISTS "csv_batches_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "import_rollbacks" (
  "id" TEXT PRIMARY KEY,
  "importJobId" TEXT NOT NULL UNIQUE,
  "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
  "rolledBackAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "import_rollbacks_importJobId_idx" ON "import_rollbacks"("importJobId");
ALTER TABLE "import_rollbacks" ADD CONSTRAINT IF NOT EXISTS "import_rollbacks_importJobId_fkey" FOREIGN KEY ("importJobId") REFERENCES "import_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "import_changes" (
  "id" TEXT PRIMARY KEY,
  "rollbackId" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "recordId" TEXT NOT NULL,
  "operation" TEXT NOT NULL,
  "before" JSONB,
  "after" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "import_changes_rollbackId_idx" ON "import_changes"("rollbackId");
CREATE INDEX IF NOT EXISTS "import_changes_model_recordId_idx" ON "import_changes"("model", "recordId");
ALTER TABLE "import_changes" ADD CONSTRAINT IF NOT EXISTS "import_changes_rollbackId_fkey" FOREIGN KEY ("rollbackId") REFERENCES "import_rollbacks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "scheduled_exports" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "module" TEXT NOT NULL,
  "filters" JSONB,
  "columns" TEXT[] NOT NULL,
  "context" JSONB,
  "schedule" TEXT NOT NULL,
  "recipients" TEXT[] NOT NULL,
  "format" TEXT NOT NULL DEFAULT 'csv',
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "lastRunAt" TIMESTAMP(3),
  "nextRunAt" TIMESTAMP(3),
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "scheduled_exports_isActive_nextRunAt_idx" ON "scheduled_exports"("isActive", "nextRunAt");
CREATE INDEX IF NOT EXISTS "scheduled_exports_module_idx" ON "scheduled_exports"("module");
ALTER TABLE "scheduled_exports" ADD CONSTRAINT IF NOT EXISTS "scheduled_exports_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "scheduled_export_runs" (
  "id" TEXT PRIMARY KEY,
  "scheduledExportId" TEXT NOT NULL,
  "exportJobId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "errorMessage" TEXT,
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "scheduled_export_runs_scheduledExportId_idx" ON "scheduled_export_runs"("scheduledExportId");
CREATE INDEX IF NOT EXISTS "scheduled_export_runs_status_idx" ON "scheduled_export_runs"("status");
ALTER TABLE "scheduled_export_runs" ADD CONSTRAINT IF NOT EXISTS "scheduled_export_runs_scheduledExportId_fkey" FOREIGN KEY ("scheduledExportId") REFERENCES "scheduled_exports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Optional link from ScheduledExportRun to ExportJob
ALTER TABLE "scheduled_export_runs" ADD CONSTRAINT IF NOT EXISTS "scheduled_export_runs_exportJobId_fkey" FOREIGN KEY ("exportJobId") REFERENCES "export_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

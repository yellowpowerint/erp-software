DO $$ BEGIN
    CREATE TYPE "DocumentAuditPackageStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "document_audit_package_jobs" (
    "id" TEXT NOT NULL,
    "status" "DocumentAuditPackageStatus" NOT NULL DEFAULT 'PENDING',
    "title" TEXT NOT NULL,
    "spec" JSONB NOT NULL,
    "outputDocumentId" TEXT,
    "errorMessage" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_audit_package_jobs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "document_audit_package_jobs_status_idx" ON "document_audit_package_jobs"("status");
CREATE INDEX IF NOT EXISTS "document_audit_package_jobs_createdById_idx" ON "document_audit_package_jobs"("createdById");
CREATE INDEX IF NOT EXISTS "document_audit_package_jobs_createdAt_idx" ON "document_audit_package_jobs"("createdAt");

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents')
      AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'document_audit_package_jobs_outputDocumentId_fkey') THEN
        ALTER TABLE "document_audit_package_jobs" ADD CONSTRAINT "document_audit_package_jobs_outputDocumentId_fkey" FOREIGN KEY ("outputDocumentId") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users')
      AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'document_audit_package_jobs_createdById_fkey') THEN
        ALTER TABLE "document_audit_package_jobs" ADD CONSTRAINT "document_audit_package_jobs_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

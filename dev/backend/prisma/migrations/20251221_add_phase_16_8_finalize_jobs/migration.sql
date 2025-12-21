DO $$ BEGIN
    CREATE TYPE "DocumentFinalizeStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "document_integrity_seals" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "algorithm" TEXT NOT NULL DEFAULT 'sha256',
    "hash" TEXT NOT NULL,
    "previousHash" TEXT,
    "metadata" JSONB,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_integrity_seals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "document_integrity_seals_documentId_versionNumber_key" ON "document_integrity_seals"("documentId", "versionNumber");
CREATE INDEX IF NOT EXISTS "document_integrity_seals_documentId_idx" ON "document_integrity_seals"("documentId");
CREATE INDEX IF NOT EXISTS "document_integrity_seals_createdAt_idx" ON "document_integrity_seals"("createdAt");

CREATE TABLE IF NOT EXISTS "document_finalize_jobs" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "status" "DocumentFinalizeStatus" NOT NULL DEFAULT 'PENDING',
    "options" JSONB NOT NULL,
    "outputFileUrl" TEXT,
    "outputFileName" TEXT,
    "outputFileSize" INTEGER,
    "outputFileHash" TEXT,
    "integritySealId" TEXT,
    "errorMessage" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_finalize_jobs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "document_finalize_jobs_integritySealId_key" ON "document_finalize_jobs"("integritySealId");
CREATE INDEX IF NOT EXISTS "document_finalize_jobs_documentId_idx" ON "document_finalize_jobs"("documentId");
CREATE INDEX IF NOT EXISTS "document_finalize_jobs_status_idx" ON "document_finalize_jobs"("status");
CREATE INDEX IF NOT EXISTS "document_finalize_jobs_createdById_idx" ON "document_finalize_jobs"("createdById");
CREATE INDEX IF NOT EXISTS "document_finalize_jobs_createdAt_idx" ON "document_finalize_jobs"("createdAt");

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents')
      AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'document_integrity_seals_documentId_fkey') THEN
        ALTER TABLE "document_integrity_seals" ADD CONSTRAINT "document_integrity_seals_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users')
      AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'document_integrity_seals_createdById_fkey') THEN
        ALTER TABLE "document_integrity_seals" ADD CONSTRAINT "document_integrity_seals_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents')
      AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'document_finalize_jobs_documentId_fkey') THEN
        ALTER TABLE "document_finalize_jobs" ADD CONSTRAINT "document_finalize_jobs_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'document_integrity_seals')
      AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'document_finalize_jobs_integritySealId_fkey') THEN
        ALTER TABLE "document_finalize_jobs" ADD CONSTRAINT "document_finalize_jobs_integritySealId_fkey" FOREIGN KEY ("integritySealId") REFERENCES "document_integrity_seals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users')
      AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'document_finalize_jobs_createdById_fkey') THEN
        ALTER TABLE "document_finalize_jobs" ADD CONSTRAINT "document_finalize_jobs_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

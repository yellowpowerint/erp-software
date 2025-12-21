DO $$ BEGIN
    CREATE TYPE "DocumentConversionProvider" AS ENUM ('LOCAL', 'CLOUDCONVERT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "DocumentConversionStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "document_conversion_jobs" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "provider" "DocumentConversionProvider" NOT NULL DEFAULT 'LOCAL',
    "status" "DocumentConversionStatus" NOT NULL DEFAULT 'PENDING',
    "inputMimeType" TEXT NOT NULL,
    "outputFileUrl" TEXT,
    "outputFileName" TEXT,
    "outputFileSize" INTEGER,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "processingTime" INTEGER,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "options" JSONB,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_conversion_jobs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "document_conversion_jobs_documentId_idx" ON "document_conversion_jobs"("documentId");
CREATE INDEX IF NOT EXISTS "document_conversion_jobs_status_idx" ON "document_conversion_jobs"("status");
CREATE INDEX IF NOT EXISTS "document_conversion_jobs_createdAt_idx" ON "document_conversion_jobs"("createdAt");

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents')
      AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'document_conversion_jobs_documentId_fkey') THEN
        ALTER TABLE "document_conversion_jobs" ADD CONSTRAINT "document_conversion_jobs_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users')
      AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'document_conversion_jobs_createdById_fkey') THEN
        ALTER TABLE "document_conversion_jobs" ADD CONSTRAINT "document_conversion_jobs_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

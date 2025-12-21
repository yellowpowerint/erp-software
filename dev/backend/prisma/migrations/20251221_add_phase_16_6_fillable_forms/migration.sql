DO $$ BEGIN
    CREATE TYPE "DocumentFormDraftStatus" AS ENUM ('DRAFT', 'FINALIZED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "document_form_templates" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "documentVersion" INTEGER NOT NULL,
    "fieldSchema" JSONB NOT NULL,
    "fieldCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_form_templates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "document_form_templates_documentId_documentVersion_key" ON "document_form_templates"("documentId", "documentVersion");
CREATE INDEX IF NOT EXISTS "document_form_templates_documentId_idx" ON "document_form_templates"("documentId");
CREATE INDEX IF NOT EXISTS "document_form_templates_createdAt_idx" ON "document_form_templates"("createdAt");

CREATE TABLE IF NOT EXISTS "document_form_drafts" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "templateId" TEXT,
    "status" "DocumentFormDraftStatus" NOT NULL DEFAULT 'DRAFT',
    "values" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "signatureData" TEXT,
    "signatureType" TEXT,
    "signatureReason" TEXT,
    "signatureMetadata" JSONB,
    "outputFileUrl" TEXT,
    "outputFileName" TEXT,
    "outputFileSize" INTEGER,
    "outputDocumentVersion" INTEGER,
    "finalizedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_form_drafts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "document_form_drafts_documentId_idx" ON "document_form_drafts"("documentId");
CREATE INDEX IF NOT EXISTS "document_form_drafts_templateId_idx" ON "document_form_drafts"("templateId");
CREATE INDEX IF NOT EXISTS "document_form_drafts_status_idx" ON "document_form_drafts"("status");
CREATE INDEX IF NOT EXISTS "document_form_drafts_createdAt_idx" ON "document_form_drafts"("createdAt");

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents')
      AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'document_form_templates_documentId_fkey') THEN
        ALTER TABLE "document_form_templates" ADD CONSTRAINT "document_form_templates_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users')
      AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'document_form_templates_createdById_fkey') THEN
        ALTER TABLE "document_form_templates" ADD CONSTRAINT "document_form_templates_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents')
      AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'document_form_drafts_documentId_fkey') THEN
        ALTER TABLE "document_form_drafts" ADD CONSTRAINT "document_form_drafts_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'document_form_templates')
      AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'document_form_drafts_templateId_fkey') THEN
        ALTER TABLE "document_form_drafts" ADD CONSTRAINT "document_form_drafts_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "document_form_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users')
      AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'document_form_drafts_createdById_fkey') THEN
        ALTER TABLE "document_form_drafts" ADD CONSTRAINT "document_form_drafts_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

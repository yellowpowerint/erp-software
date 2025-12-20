-- Phase 16.4: AI-Powered Document Intelligence

-- Add fileHash to documents
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents')
    AND NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'documents' AND column_name = 'fileHash'
    ) THEN
      ALTER TABLE "documents" ADD COLUMN "fileHash" TEXT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "documents_fileHash_idx" ON "documents"("fileHash");

-- Create document_ai_insights table
CREATE TABLE IF NOT EXISTS "document_ai_insights" (
  "id" TEXT NOT NULL,
  "documentId" TEXT NOT NULL,

  "provider" TEXT,
  "model" TEXT,

  "summary" TEXT,
  "entities" JSONB,
  "suggestedCategory" "DocumentCategory",
  "suggestedTags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "anomalies" JSONB,
  "linkedRecords" JSONB,

  "embedding" DOUBLE PRECISION[] NOT NULL DEFAULT ARRAY[]::DOUBLE PRECISION[],

  "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "document_ai_insights_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "document_ai_insights_documentId_key" ON "document_ai_insights"("documentId");
CREATE INDEX IF NOT EXISTS "document_ai_insights_analyzedAt_idx" ON "document_ai_insights"("analyzedAt");

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents')
    AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'document_ai_insights')
    AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'document_ai_insights_documentId_fkey') THEN
      ALTER TABLE "document_ai_insights"
        ADD CONSTRAINT "document_ai_insights_documentId_fkey"
        FOREIGN KEY ("documentId") REFERENCES "documents"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Add clientUploadId to documents for idempotent upload retries (M5.1)

ALTER TABLE "documents"
  ADD COLUMN IF NOT EXISTS "clientUploadId" TEXT;

DO $$ BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS "documents_uploadedById_clientUploadId_key" ON "documents"("uploadedById", "clientUploadId");
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

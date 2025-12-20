-- CreateEnum: UserRole (if not exists from initial_setup migration)
DO $$ BEGIN
  CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'CEO', 'CFO', 'DEPARTMENT_HEAD', 'ACCOUNTANT', 'PROCUREMENT_OFFICER', 'OPERATIONS_MANAGER', 'IT_MANAGER', 'HR_MANAGER', 'SAFETY_OFFICER', 'WAREHOUSE_MANAGER', 'EMPLOYEE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "DocumentCategory" AS ENUM (
    'INVOICE',
    'RECEIPT',
    'PURCHASE_ORDER',
    'QUOTATION',
    'CONTRACT',
    'SAFETY_REPORT',
    'INCIDENT_REPORT',
    'COMPLIANCE_DOC',
    'PROJECT_REPORT',
    'HR_DOCUMENT',
    'PAYROLL',
    'TAX_FORM',
    'AUDIT_DOCUMENT',
    'TRAINING_MATERIAL',
    'CERTIFICATE',
    'EQUIPMENT_MANUAL',
    'OTHER'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "documents" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "category" "DocumentCategory" NOT NULL,
    "module" TEXT NOT NULL,
    "referenceId" TEXT,
    "description" TEXT,
    "tags" TEXT[] NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isLatest" BOOLEAN NOT NULL DEFAULT true,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users')
    AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'documents_uploadedById_fkey') THEN
      ALTER TABLE "documents" ADD CONSTRAINT "documents_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "documents_module_referenceId_idx" ON "documents"("module", "referenceId");
CREATE INDEX IF NOT EXISTS "documents_category_idx" ON "documents"("category");
CREATE INDEX IF NOT EXISTS "documents_uploadedById_idx" ON "documents"("uploadedById");

CREATE TABLE IF NOT EXISTS "document_versions" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "changeNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_versions_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents')
    AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'document_versions_documentId_fkey') THEN
      ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users')
    AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'document_versions_uploadedById_fkey') THEN
      ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "document_versions_documentId_versionNumber_key" ON "document_versions"("documentId", "versionNumber");

CREATE TABLE IF NOT EXISTS "document_metadata" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "pageCount" INTEGER,
    "author" TEXT,
    "title" TEXT,
    "subject" TEXT,
    "keywords" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "createdDate" TIMESTAMP(3),
    "modifiedDate" TIMESTAMP(3),
    "extractedText" TEXT,

    CONSTRAINT "document_metadata_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents')
    AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'document_metadata_documentId_fkey') THEN
      ALTER TABLE "document_metadata" ADD CONSTRAINT "document_metadata_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "document_metadata_documentId_key" ON "document_metadata"("documentId");

CREATE TABLE IF NOT EXISTS "document_permissions" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "canView" BOOLEAN NOT NULL DEFAULT false,
    "canEdit" BOOLEAN NOT NULL DEFAULT false,
    "canDelete" BOOLEAN NOT NULL DEFAULT false,
    "canShare" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "document_permissions_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents')
    AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'document_permissions_documentId_fkey') THEN
      ALTER TABLE "document_permissions" ADD CONSTRAINT "document_permissions_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "document_permissions_documentId_role_key" ON "document_permissions"("documentId", "role");

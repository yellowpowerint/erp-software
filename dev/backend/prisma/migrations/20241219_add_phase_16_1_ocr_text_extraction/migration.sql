-- CreateEnum: DocumentCategory (if not exists from documents_module_core migration)
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

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "OCRProvider" AS ENUM ('TESSERACT_JS', 'GOOGLE_VISION', 'AWS_TEXTRACT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "OCRStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "ExtractedDataType" AS ENUM ('INVOICE', 'RECEIPT', 'CONTRACT', 'GENERAL_TEXT', 'STRUCTURED_DATA');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "ocr_jobs" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "provider" "OCRProvider" NOT NULL DEFAULT 'TESSERACT_JS',
    "status" "OCRStatus" NOT NULL DEFAULT 'PENDING',
    "priority" INTEGER NOT NULL DEFAULT 5,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "processingTime" INTEGER,
    "extractedText" TEXT,
    "confidence" DOUBLE PRECISION,
    "pageCount" INTEGER,
    "errorMessage" TEXT,
    "language" TEXT NOT NULL DEFAULT 'eng',
    "autoRotate" BOOLEAN NOT NULL DEFAULT true,
    "enhanceImage" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ocr_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "extracted_document_data" (
    "id" TEXT NOT NULL,
    "ocrJobId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "dataType" "ExtractedDataType" NOT NULL,
    "extractedFields" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION,
    "invoiceNumber" TEXT,
    "invoiceDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "supplierName" TEXT,
    "supplierAddress" TEXT,
    "totalAmount" DOUBLE PRECISION,
    "taxAmount" DOUBLE PRECISION,
    "currency" TEXT,
    "vendorName" TEXT,
    "receiptNumber" TEXT,
    "receiptDate" TIMESTAMP(3),
    "receiptAmount" DOUBLE PRECISION,
    "paymentMethod" TEXT,
    "contractNumber" TEXT,
    "contractDate" TIMESTAMP(3),
    "partyNames" TEXT[],
    "contractValue" DOUBLE PRECISION,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "entities" JSONB,
    "keyPhrases" TEXT[],
    "isValidated" BOOLEAN NOT NULL DEFAULT false,
    "validatedById" TEXT,
    "validatedAt" TIMESTAMP(3),
    "correctedFields" JSONB,
    "correctionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "extracted_document_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ocr_configuration" (
    "id" TEXT NOT NULL,
    "defaultProvider" "OCRProvider" NOT NULL DEFAULT 'TESSERACT_JS',
    "autoOCREnabled" BOOLEAN NOT NULL DEFAULT false,
    "autoOCRCategories" "DocumentCategory"[],
    "maxConcurrentJobs" INTEGER NOT NULL DEFAULT 3,
    "defaultLanguage" TEXT NOT NULL DEFAULT 'eng',
    "confidenceThreshold" DOUBLE PRECISION NOT NULL DEFAULT 70.0,
    "tesseractConfig" JSONB,
    "googleVisionConfig" JSONB,
    "awsTextractConfig" JSONB,
    "autoCreateInvoice" BOOLEAN NOT NULL DEFAULT false,
    "autoCreateExpense" BOOLEAN NOT NULL DEFAULT false,
    "autoCreateContract" BOOLEAN NOT NULL DEFAULT false,
    "notifyOnCompletion" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnFailure" BOOLEAN NOT NULL DEFAULT true,
    "retainRawText" BOOLEAN NOT NULL DEFAULT true,
    "retainExtractedData" BOOLEAN NOT NULL DEFAULT true,
    "updatedById" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ocr_configuration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ocr_processing_logs" (
    "id" TEXT NOT NULL,
    "ocrJobId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ocr_processing_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ocr_jobs_documentId_idx" ON "ocr_jobs"("documentId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ocr_jobs_status_idx" ON "ocr_jobs"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ocr_jobs_createdAt_idx" ON "ocr_jobs"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "extracted_document_data_ocrJobId_idx" ON "extracted_document_data"("ocrJobId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "extracted_document_data_documentId_idx" ON "extracted_document_data"("documentId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "extracted_document_data_dataType_idx" ON "extracted_document_data"("dataType");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ocr_processing_logs_ocrJobId_idx" ON "ocr_processing_logs"("ocrJobId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ocr_processing_logs_timestamp_idx" ON "ocr_processing_logs"("timestamp");

-- AddForeignKey
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users')
      AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ocr_jobs_createdById_fkey') THEN
        ALTER TABLE "ocr_jobs" ADD CONSTRAINT "ocr_jobs_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ocr_jobs')
      AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'extracted_document_data_ocrJobId_fkey') THEN
        ALTER TABLE "extracted_document_data" ADD CONSTRAINT "extracted_document_data_ocrJobId_fkey" FOREIGN KEY ("ocrJobId") REFERENCES "ocr_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users')
      AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'extracted_document_data_validatedById_fkey') THEN
        ALTER TABLE "extracted_document_data" ADD CONSTRAINT "extracted_document_data_validatedById_fkey" FOREIGN KEY ("validatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users')
      AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ocr_configuration_updatedById_fkey') THEN
        ALTER TABLE "ocr_configuration" ADD CONSTRAINT "ocr_configuration_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

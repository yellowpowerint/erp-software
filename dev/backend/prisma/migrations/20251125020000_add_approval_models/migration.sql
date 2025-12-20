-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "ApprovalType" AS ENUM ('INVOICE', 'PURCHASE_REQUEST', 'EXPENSE_CLAIM', 'LEAVE_REQUEST', 'PAYMENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "invoices" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "supplierName" TEXT NOT NULL,
    "supplierEmail" TEXT,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "createdById" TEXT NOT NULL,
    "attachmentUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "purchase_requests" (
    "id" TEXT NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "estimatedCost" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "justification" TEXT NOT NULL,
    "urgency" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "createdById" TEXT NOT NULL,
    "attachmentUrl" TEXT,
    "supplierSuggestion" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "approval_history" (
    "id" TEXT NOT NULL,
    "type" "ApprovalType" NOT NULL,
    "referenceId" TEXT NOT NULL,
    "approverLevel" INTEGER NOT NULL DEFAULT 1,
    "approverId" TEXT NOT NULL,
    "action" "ApprovalStatus" NOT NULL,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invoiceId" TEXT,
    "purchaseRequestId" TEXT,

    CONSTRAINT "approval_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "invoices_invoiceNumber_key" ON "invoices"("invoiceNumber");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "invoices_createdById_idx" ON "invoices"("createdById");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "invoices_createdAt_idx" ON "invoices"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "purchase_requests_requestNumber_key" ON "purchase_requests"("requestNumber");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "purchase_requests_status_idx" ON "purchase_requests"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "purchase_requests_createdById_idx" ON "purchase_requests"("createdById");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "purchase_requests_createdAt_idx" ON "purchase_requests"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "approval_history_referenceId_idx" ON "approval_history"("referenceId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "approval_history_approverId_idx" ON "approval_history"("approverId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "approval_history_createdAt_idx" ON "approval_history"("createdAt");

-- AddForeignKey
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users')
      AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invoices_createdById_fkey') THEN
        ALTER TABLE "invoices" ADD CONSTRAINT "invoices_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users')
      AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'purchase_requests_createdById_fkey') THEN
        ALTER TABLE "purchase_requests" ADD CONSTRAINT "purchase_requests_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users')
      AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'approval_history_approverId_fkey') THEN
        ALTER TABLE "approval_history" ADD CONSTRAINT "approval_history_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices')
      AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'approval_history_invoiceId_fkey') THEN
        ALTER TABLE "approval_history" ADD CONSTRAINT "approval_history_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchase_requests')
      AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'approval_history_purchaseRequestId_fkey') THEN
        ALTER TABLE "approval_history" ADD CONSTRAINT "approval_history_purchaseRequestId_fkey" FOREIGN KEY ("purchaseRequestId") REFERENCES "purchase_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- This migration was partially applied and failed.
-- Recreating with idempotent operations to allow completion.

-- CreateEnum (only if not exists)
DO $$ BEGIN
  CREATE TYPE "NotificationType" AS ENUM ('APPROVAL_REQUEST', 'APPROVAL_APPROVED', 'APPROVAL_REJECTED', 'SYSTEM_ALERT', 'MENTION');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateEnum (only if not exists)
DO $$ BEGIN
  CREATE TYPE "ITRequestType" AS ENUM ('EQUIPMENT', 'SOFTWARE', 'ACCESS', 'SUPPORT', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateEnum (only if not exists)
DO $$ BEGIN
  CREATE TYPE "PaymentType" AS ENUM ('VOUCHER', 'REIMBURSEMENT', 'ADVANCE', 'PETTY_CASH');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add enum values safely
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'ApprovalType' AND e.enumlabel = 'IT_REQUEST'
  ) THEN
    ALTER TYPE "ApprovalType" ADD VALUE 'IT_REQUEST';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'ApprovalType' AND e.enumlabel = 'PAYMENT_REQUEST'
  ) THEN
    ALTER TYPE "ApprovalType" ADD VALUE 'PAYMENT_REQUEST';
  END IF;
END $$;

-- CreateTable (only if not exists)
CREATE TABLE IF NOT EXISTS "it_requests" (
    "id" TEXT NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "requestType" "ITRequestType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "createdById" TEXT NOT NULL,
    "estimatedCost" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "justification" TEXT NOT NULL,
    "attachmentUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "it_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable (only if not exists)
CREATE TABLE IF NOT EXISTS "payment_requests" (
    "id" TEXT NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "paymentType" "PaymentType" NOT NULL,
    "payeeName" TEXT NOT NULL,
    "payeeAccount" TEXT,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "createdById" TEXT NOT NULL,
    "attachmentUrl" TEXT,
    "notes" TEXT,
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable (only if not exists)
CREATE TABLE IF NOT EXISTS "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "referenceId" TEXT,
    "referenceType" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable (only if not exists)
CREATE TABLE IF NOT EXISTS "user_assignments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_assignments_pkey" PRIMARY KEY ("id")
);

-- Add columns to approval_history if they don't exist
DO $$ BEGIN
  ALTER TABLE "approval_history" ADD COLUMN "itRequestId" TEXT;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "approval_history" ADD COLUMN "paymentRequestId" TEXT;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- Create indexes (ignore if exists)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'it_requests_requestNumber_key') THEN
    CREATE UNIQUE INDEX "it_requests_requestNumber_key" ON "it_requests"("requestNumber");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'it_requests_status_idx') THEN
    CREATE INDEX "it_requests_status_idx" ON "it_requests"("status");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'it_requests_createdById_idx') THEN
    CREATE INDEX "it_requests_createdById_idx" ON "it_requests"("createdById");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'it_requests_createdAt_idx') THEN
    CREATE INDEX "it_requests_createdAt_idx" ON "it_requests"("createdAt");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'payment_requests_requestNumber_key') THEN
    CREATE UNIQUE INDEX "payment_requests_requestNumber_key" ON "payment_requests"("requestNumber");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'payment_requests_status_idx') THEN
    CREATE INDEX "payment_requests_status_idx" ON "payment_requests"("status");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'payment_requests_createdById_idx') THEN
    CREATE INDEX "payment_requests_createdById_idx" ON "payment_requests"("createdById");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'payment_requests_createdAt_idx') THEN
    CREATE INDEX "payment_requests_createdAt_idx" ON "payment_requests"("createdAt");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'notifications_userId_idx') THEN
    CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'notifications_read_idx') THEN
    CREATE INDEX "notifications_read_idx" ON "notifications"("read");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'notifications_createdAt_idx') THEN
    CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'user_assignments_userId_idx') THEN
    CREATE INDEX "user_assignments_userId_idx" ON "user_assignments"("userId");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'user_assignments_itemId_idx') THEN
    CREATE INDEX "user_assignments_itemId_idx" ON "user_assignments"("itemId");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'user_assignments_userId_itemType_itemId_key') THEN
    CREATE UNIQUE INDEX "user_assignments_userId_itemType_itemId_key" ON "user_assignments"("userId", "itemType", "itemId");
  END IF;
END $$;

-- AddForeignKey (only if not exists)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'it_requests_createdById_fkey'
  ) THEN
    ALTER TABLE "it_requests" ADD CONSTRAINT "it_requests_createdById_fkey" 
      FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payment_requests_createdById_fkey'
  ) THEN
    ALTER TABLE "payment_requests" ADD CONSTRAINT "payment_requests_createdById_fkey" 
      FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'notifications_userId_fkey'
  ) THEN
    ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" 
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_assignments_userId_fkey'
  ) THEN
    ALTER TABLE "user_assignments" ADD CONSTRAINT "user_assignments_userId_fkey" 
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'approval_history_itRequestId_fkey'
  ) THEN
    ALTER TABLE "approval_history" ADD CONSTRAINT "approval_history_itRequestId_fkey" 
      FOREIGN KEY ("itRequestId") REFERENCES "it_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'approval_history_paymentRequestId_fkey'
  ) THEN
    ALTER TABLE "approval_history" ADD CONSTRAINT "approval_history_paymentRequestId_fkey" 
      FOREIGN KEY ("paymentRequestId") REFERENCES "payment_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

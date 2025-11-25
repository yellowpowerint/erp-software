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

-- Add new enum values safely
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

-- CreateIndex (ignore if exists)
DO $$ BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS "it_requests_requestNumber_key" ON "it_requests"("requestNumber");
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "it_requests_status_idx" ON "it_requests"("status");
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "it_requests_createdById_idx" ON "it_requests"("createdById");
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "it_requests_createdAt_idx" ON "it_requests"("createdAt");
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS "payment_requests_requestNumber_key" ON "payment_requests"("requestNumber");
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "payment_requests_status_idx" ON "payment_requests"("status");
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "payment_requests_createdById_idx" ON "payment_requests"("createdById");
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "payment_requests_createdAt_idx" ON "payment_requests"("createdAt");
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "notifications_userId_idx" ON "notifications"("userId");
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "notifications_read_idx" ON "notifications"("read");
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "notifications_createdAt_idx" ON "notifications"("createdAt");
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "user_assignments_userId_idx" ON "user_assignments"("userId");
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "user_assignments_itemId_idx" ON "user_assignments"("itemId");
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS "user_assignments_userId_itemType_itemId_key" ON "user_assignments"("userId", "itemType", "itemId");
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;

-- Add new columns to approval_history if they don't exist
DO $$ BEGIN
  ALTER TABLE "approval_history" ADD COLUMN IF NOT EXISTS "itRequestId" TEXT;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "approval_history" ADD COLUMN IF NOT EXISTS "paymentRequestId" TEXT;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- AddForeignKey (only if not exists)
DO $$ BEGIN
  ALTER TABLE "it_requests" ADD CONSTRAINT "it_requests_createdById_fkey" 
    FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "payment_requests" ADD CONSTRAINT "payment_requests_createdById_fkey" 
    FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "user_assignments" ADD CONSTRAINT "user_assignments_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "approval_history" ADD CONSTRAINT "approval_history_itRequestId_fkey" 
    FOREIGN KEY ("itRequestId") REFERENCES "it_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "approval_history" ADD CONSTRAINT "approval_history_paymentRequestId_fkey" 
    FOREIGN KEY ("paymentRequestId") REFERENCES "payment_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

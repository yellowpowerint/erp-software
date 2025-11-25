-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('APPROVAL_REQUEST', 'APPROVAL_APPROVED', 'APPROVAL_REJECTED', 'SYSTEM_ALERT', 'MENTION');

-- CreateEnum
CREATE TYPE "ITRequestType" AS ENUM ('EQUIPMENT', 'SOFTWARE', 'ACCESS', 'SUPPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('VOUCHER', 'REIMBURSEMENT', 'ADVANCE', 'PETTY_CASH');

-- AlterEnum
ALTER TYPE "ApprovalType" ADD VALUE 'IT_REQUEST';
ALTER TYPE "ApprovalType" ADD VALUE 'PAYMENT_REQUEST';

-- CreateTable
CREATE TABLE "it_requests" (
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

-- CreateTable
CREATE TABLE "payment_requests" (
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

-- CreateTable
CREATE TABLE "notifications" (
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

-- CreateTable
CREATE TABLE "user_assignments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "it_requests_requestNumber_key" ON "it_requests"("requestNumber");

-- CreateIndex
CREATE INDEX "it_requests_status_idx" ON "it_requests"("status");

-- CreateIndex
CREATE INDEX "it_requests_createdById_idx" ON "it_requests"("createdById");

-- CreateIndex
CREATE INDEX "it_requests_createdAt_idx" ON "it_requests"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "payment_requests_requestNumber_key" ON "payment_requests"("requestNumber");

-- CreateIndex
CREATE INDEX "payment_requests_status_idx" ON "payment_requests"("status");

-- CreateIndex
CREATE INDEX "payment_requests_createdById_idx" ON "payment_requests"("createdById");

-- CreateIndex
CREATE INDEX "payment_requests_createdAt_idx" ON "payment_requests"("createdAt");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_read_idx" ON "notifications"("read");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "user_assignments_userId_idx" ON "user_assignments"("userId");

-- CreateIndex
CREATE INDEX "user_assignments_itemId_idx" ON "user_assignments"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "user_assignments_userId_itemType_itemId_key" ON "user_assignments"("userId", "itemType", "itemId");

-- AddForeignKey
ALTER TABLE "approval_history" ADD CONSTRAINT "approval_history_itRequestId_fkey" FOREIGN KEY ("itRequestId") REFERENCES "it_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_history" ADD CONSTRAINT "approval_history_paymentRequestId_fkey" FOREIGN KEY ("paymentRequestId") REFERENCES "payment_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "it_requests" ADD CONSTRAINT "it_requests_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_requests" ADD CONSTRAINT "payment_requests_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_assignments" ADD CONSTRAINT "user_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

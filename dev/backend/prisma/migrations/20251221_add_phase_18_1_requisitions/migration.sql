-- CreateEnum: Priority (for requisition urgency and item priority)
DO $$ BEGIN
 CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- CreateEnum: RequisitionType
DO $$ BEGIN
 CREATE TYPE "RequisitionType" AS ENUM ('STOCK_REPLENISHMENT', 'PROJECT_MATERIALS', 'EQUIPMENT_PURCHASE', 'MAINTENANCE_PARTS', 'SAFETY_SUPPLIES', 'CONSUMABLES', 'EMERGENCY', 'CAPITAL_EXPENDITURE');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- CreateEnum: RequisitionStatus
DO $$ BEGIN
 CREATE TYPE "RequisitionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'PENDING_APPROVAL', 'APPROVED', 'PARTIALLY_APPROVED', 'REJECTED', 'CANCELLED', 'IN_PROCUREMENT', 'COMPLETED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- CreateTable: requisitions
CREATE TABLE IF NOT EXISTS "requisitions" (
    "id" TEXT NOT NULL,
    "requisitionNo" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "RequisitionType" NOT NULL,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "status" "RequisitionStatus" NOT NULL DEFAULT 'DRAFT',
    "department" TEXT NOT NULL,
    "projectId" TEXT,
    "siteLocation" TEXT NOT NULL,
    "requiredDate" TIMESTAMP(3) NOT NULL,
    "justification" TEXT,
    "totalEstimate" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "requestedById" TEXT NOT NULL,
    "currentStage" INTEGER NOT NULL DEFAULT 1,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedById" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "requisitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: requisition_items
CREATE TABLE IF NOT EXISTS "requisition_items" (
    "id" TEXT NOT NULL,
    "requisitionId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit" TEXT NOT NULL,
    "estimatedPrice" DECIMAL(15,2) NOT NULL,
    "totalPrice" DECIMAL(15,2) NOT NULL,
    "specifications" TEXT,
    "preferredVendor" TEXT,
    "stockItemId" TEXT,
    "urgency" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "notes" TEXT,

    CONSTRAINT "requisition_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable: requisition_attachments
CREATE TABLE IF NOT EXISTS "requisition_attachments" (
    "id" TEXT NOT NULL,
    "requisitionId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "requisition_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable: requisition_approvals
CREATE TABLE IF NOT EXISTS "requisition_approvals" (
    "id" TEXT NOT NULL,
    "requisitionId" TEXT NOT NULL,
    "stage" INTEGER NOT NULL,
    "approverId" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "comments" TEXT,
    "actionAt" TIMESTAMP(3),

    CONSTRAINT "requisition_approvals_pkey" PRIMARY KEY ("id")
);

-- AlterTable: assets (add projectId for Project.assets relation)
DO $$ BEGIN
    ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "projectId" TEXT;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- CreateIndex: requisitions
DO $$ BEGIN
    CREATE UNIQUE INDEX IF NOT EXISTS "requisitions_requisitionNo_key" ON "requisitions"("requisitionNo");
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS "requisitions_status_idx" ON "requisitions"("status");
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS "requisitions_requestedById_idx" ON "requisitions"("requestedById");
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS "requisitions_department_idx" ON "requisitions"("department");
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

-- CreateIndex: requisition_items
DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS "requisition_items_requisitionId_idx" ON "requisition_items"("requisitionId");
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS "requisition_items_stockItemId_idx" ON "requisition_items"("stockItemId");
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

-- CreateIndex: requisition_attachments
DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS "requisition_attachments_requisitionId_idx" ON "requisition_attachments"("requisitionId");
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS "requisition_attachments_uploadedById_idx" ON "requisition_attachments"("uploadedById");
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

-- CreateIndex: requisition_approvals
DO $$ BEGIN
    CREATE UNIQUE INDEX IF NOT EXISTS "requisition_approvals_requisitionId_stage_key" ON "requisition_approvals"("requisitionId", "stage");
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS "requisition_approvals_approverId_idx" ON "requisition_approvals"("approverId");
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

-- CreateIndex: assets (for projectId)
DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS "assets_projectId_idx" ON "assets"("projectId");
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

-- AddForeignKey: requisitions
DO $$ BEGIN
    ALTER TABLE "requisitions" ADD CONSTRAINT "requisitions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "requisitions" ADD CONSTRAINT "requisitions_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "requisitions" ADD CONSTRAINT "requisitions_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "requisitions" ADD CONSTRAINT "requisitions_rejectedById_fkey" FOREIGN KEY ("rejectedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey: requisition_items
DO $$ BEGIN
    ALTER TABLE "requisition_items" ADD CONSTRAINT "requisition_items_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "requisitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "requisition_items" ADD CONSTRAINT "requisition_items_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES "stock_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey: requisition_attachments
DO $$ BEGIN
    ALTER TABLE "requisition_attachments" ADD CONSTRAINT "requisition_attachments_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "requisitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "requisition_attachments" ADD CONSTRAINT "requisition_attachments_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey: requisition_approvals
DO $$ BEGIN
    ALTER TABLE "requisition_approvals" ADD CONSTRAINT "requisition_approvals_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "requisitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "requisition_approvals" ADD CONSTRAINT "requisition_approvals_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey: assets (for projectId)
DO $$ BEGIN
    ALTER TABLE "assets" ADD CONSTRAINT "assets_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

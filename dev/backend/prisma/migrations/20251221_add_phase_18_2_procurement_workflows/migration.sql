-- Phase 18.2 - Automated Approval Workflows (Procurement)

-- Add new NotificationType enum value
DO $$ BEGIN
  ALTER TYPE "NotificationType" ADD VALUE 'APPROVAL_INFO_REQUEST';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum: ProcurementApprovalType
DO $$ BEGIN
  CREATE TYPE "ProcurementApprovalType" AS ENUM ('SINGLE', 'ALL', 'MAJORITY');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable: procurement_workflows
CREATE TABLE IF NOT EXISTS "procurement_workflows" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "type" "RequisitionType",
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "minAmount" DECIMAL(15,2),
  "maxAmount" DECIMAL(15,2),
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "procurement_workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable: procurement_workflow_stages
CREATE TABLE IF NOT EXISTS "procurement_workflow_stages" (
  "id" TEXT NOT NULL,
  "workflowId" TEXT NOT NULL,
  "stageNumber" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "approverRole" "UserRole",
  "approverId" TEXT,
  "approvalType" "ProcurementApprovalType" NOT NULL DEFAULT 'SINGLE',
  "escalationHours" INTEGER,
  "escalateToId" TEXT,
  CONSTRAINT "procurement_workflow_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable: approval_delegations
CREATE TABLE IF NOT EXISTS "approval_delegations" (
  "id" TEXT NOT NULL,
  "delegatorId" TEXT NOT NULL,
  "delegateId" TEXT NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "reason" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "approval_delegations_pkey" PRIMARY KEY ("id")
);

-- AlterTable: requisitions (link to workflow)
DO $$ BEGIN
  ALTER TABLE "requisitions" ADD COLUMN IF NOT EXISTS "workflowId" TEXT;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- AlterTable: requisition_approvals (support multiple approvers per stage)
DO $$ BEGIN
  ALTER TABLE "requisition_approvals" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Drop old unique constraint if exists (legacy)
DO $$ BEGIN
  ALTER TABLE "requisition_approvals" DROP CONSTRAINT IF EXISTS "requisition_approvals_requisitionId_stage_key";
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- CreateIndex/Constraints
DO $$ BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS "procurement_workflow_stages_workflowId_stageNumber_key" ON "procurement_workflow_stages"("workflowId", "stageNumber");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "procurement_workflows_isActive_idx" ON "procurement_workflows"("isActive");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "procurement_workflows_type_idx" ON "procurement_workflows"("type");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "procurement_workflow_stages_workflowId_idx" ON "procurement_workflow_stages"("workflowId");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "procurement_workflow_stages_approverId_idx" ON "procurement_workflow_stages"("approverId");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "approval_delegations_delegatorId_idx" ON "approval_delegations"("delegatorId");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "approval_delegations_delegateId_idx" ON "approval_delegations"("delegateId");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "approval_delegations_isActive_idx" ON "approval_delegations"("isActive");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

-- New unique index for requisition approvals
DO $$ BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS "requisition_approvals_requisitionId_stage_approverId_key" ON "requisition_approvals"("requisitionId", "stage", "approverId");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "requisition_approvals_requisitionId_stage_idx" ON "requisition_approvals"("requisitionId", "stage");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

-- Foreign Keys
DO $$ BEGIN
  ALTER TABLE "procurement_workflows" ADD CONSTRAINT "procurement_workflows_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "procurement_workflow_stages" ADD CONSTRAINT "procurement_workflow_stages_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "procurement_workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "procurement_workflow_stages" ADD CONSTRAINT "procurement_workflow_stages_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "procurement_workflow_stages" ADD CONSTRAINT "procurement_workflow_stages_escalateToId_fkey" FOREIGN KEY ("escalateToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "approval_delegations" ADD CONSTRAINT "approval_delegations_delegatorId_fkey" FOREIGN KEY ("delegatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "approval_delegations" ADD CONSTRAINT "approval_delegations_delegateId_fkey" FOREIGN KEY ("delegateId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "requisitions" ADD CONSTRAINT "requisitions_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "procurement_workflows"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

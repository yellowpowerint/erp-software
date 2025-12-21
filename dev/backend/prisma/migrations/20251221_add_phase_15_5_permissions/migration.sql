DO $$ BEGIN
  CREATE TYPE "PermissionAction" AS ENUM ('GRANT', 'REVOKE', 'MODIFY', 'TEMPLATE_APPLIED', 'BULK_UPDATE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "document_permissions" ADD COLUMN IF NOT EXISTS "canSign" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "document_user_permissions" (
  "id" TEXT NOT NULL,
  "documentId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "canView" BOOLEAN NOT NULL DEFAULT true,
  "canEdit" BOOLEAN NOT NULL DEFAULT false,
  "canDelete" BOOLEAN NOT NULL DEFAULT false,
  "canShare" BOOLEAN NOT NULL DEFAULT false,
  "canSign" BOOLEAN NOT NULL DEFAULT false,
  "grantedById" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "document_user_permissions_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "document_user_permissions" ADD CONSTRAINT "document_user_permissions_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "document_user_permissions" ADD CONSTRAINT "document_user_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "document_user_permissions" ADD CONSTRAINT "document_user_permissions_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "document_user_permissions_documentId_userId_key" ON "document_user_permissions"("documentId", "userId");
CREATE INDEX IF NOT EXISTS "document_user_permissions_userId_idx" ON "document_user_permissions"("userId");

CREATE TABLE IF NOT EXISTS "document_department_permissions" (
  "id" TEXT NOT NULL,
  "documentId" TEXT NOT NULL,
  "department" TEXT NOT NULL,
  "canView" BOOLEAN NOT NULL DEFAULT true,
  "canEdit" BOOLEAN NOT NULL DEFAULT false,
  "canDelete" BOOLEAN NOT NULL DEFAULT false,
  "canShare" BOOLEAN NOT NULL DEFAULT false,
  "canSign" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "document_department_permissions_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "document_department_permissions" ADD CONSTRAINT "document_department_permissions_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "document_department_permissions_documentId_department_key" ON "document_department_permissions"("documentId", "department");

CREATE TABLE IF NOT EXISTS "document_category_permissions" (
  "id" TEXT NOT NULL,
  "category" "DocumentCategory" NOT NULL,
  "role" "UserRole" NOT NULL,
  "canView" BOOLEAN NOT NULL DEFAULT false,
  "canEdit" BOOLEAN NOT NULL DEFAULT false,
  "canDelete" BOOLEAN NOT NULL DEFAULT false,
  "canShare" BOOLEAN NOT NULL DEFAULT false,
  "canSign" BOOLEAN NOT NULL DEFAULT false,
  "canUpload" BOOLEAN NOT NULL DEFAULT false,
  "setById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "document_category_permissions_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "document_category_permissions" ADD CONSTRAINT "document_category_permissions_setById_fkey" FOREIGN KEY ("setById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "document_category_permissions_category_role_key" ON "document_category_permissions"("category", "role");

CREATE TABLE IF NOT EXISTS "document_permission_templates" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "category" "DocumentCategory",
  "module" TEXT,
  "roles" JSONB NOT NULL,
  "departments" JSONB,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "document_permission_templates_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "document_permission_templates" ADD CONSTRAINT "document_permission_templates_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "document_permission_templates_name_key" ON "document_permission_templates"("name");

CREATE TABLE IF NOT EXISTS "document_permission_logs" (
  "id" TEXT NOT NULL,
  "documentId" TEXT,
  "category" "DocumentCategory",
  "action" "PermissionAction" NOT NULL,
  "performedById" TEXT NOT NULL,
  "targetUserId" TEXT,
  "targetRole" "UserRole",
  "targetDepartment" TEXT,
  "oldPermissions" JSONB,
  "newPermissions" JSONB NOT NULL,
  "reason" TEXT,
  "ipAddress" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "document_permission_logs_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "document_permission_logs" ADD CONSTRAINT "document_permission_logs_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "document_permission_logs" ADD CONSTRAINT "document_permission_logs_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "document_permission_logs" ADD CONSTRAINT "document_permission_logs_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "document_permission_logs_documentId_idx" ON "document_permission_logs"("documentId");
CREATE INDEX IF NOT EXISTS "document_permission_logs_performedById_idx" ON "document_permission_logs"("performedById");
CREATE INDEX IF NOT EXISTS "document_permission_logs_createdAt_idx" ON "document_permission_logs"("createdAt");

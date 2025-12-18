-- CreateEnum
CREATE TYPE "DocumentAction" AS ENUM ('VIEWED', 'DOWNLOADED', 'EDITED', 'DELETED', 'SHARED', 'SIGNED', 'PERMISSION_CHANGED', 'SECURITY_UPDATED');

-- AlterTable
ALTER TABLE "documents" ADD COLUMN "signatures" TEXT[];
ALTER TABLE "documents" ADD COLUMN "security" JSONB;

-- CreateTable
CREATE TABLE "document_signatures" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "signerId" TEXT NOT NULL,
    "signatureData" TEXT NOT NULL,
    "signatureHash" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,
    "isValid" BOOLEAN NOT NULL DEFAULT true,
    "revokedAt" TIMESTAMP(3),
    "revokedById" TEXT,
    "revokeReason" TEXT,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_signatures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_access_logs" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" "DocumentAction" NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "metadata" JSONB,
    "accessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_access_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_security" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "isPasswordProtected" BOOLEAN NOT NULL DEFAULT false,
    "passwordHash" TEXT,
    "hasWatermark" BOOLEAN NOT NULL DEFAULT false,
    "watermarkText" TEXT,
    "isEncrypted" BOOLEAN NOT NULL DEFAULT false,
    "encryptionKey" TEXT,
    "expiresAt" TIMESTAMP(3),
    "maxDownloads" INTEGER,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "requireSignature" BOOLEAN NOT NULL DEFAULT false,
    "allowPrint" BOOLEAN NOT NULL DEFAULT true,
    "allowCopy" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_security_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "document_signatures_documentId_idx" ON "document_signatures"("documentId");

-- CreateIndex
CREATE INDEX "document_signatures_signerId_idx" ON "document_signatures"("signerId");

-- CreateIndex
CREATE INDEX "document_signatures_signedAt_idx" ON "document_signatures"("signedAt");

-- CreateIndex
CREATE INDEX "document_access_logs_documentId_idx" ON "document_access_logs"("documentId");

-- CreateIndex
CREATE INDEX "document_access_logs_userId_idx" ON "document_access_logs"("userId");

-- CreateIndex
CREATE INDEX "document_access_logs_accessedAt_idx" ON "document_access_logs"("accessedAt");

-- CreateIndex
CREATE UNIQUE INDEX "document_security_documentId_key" ON "document_security"("documentId");

-- AddForeignKey
ALTER TABLE "document_signatures" ADD CONSTRAINT "document_signatures_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_signatures" ADD CONSTRAINT "document_signatures_signerId_fkey" FOREIGN KEY ("signerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_signatures" ADD CONSTRAINT "document_signatures_revokedById_fkey" FOREIGN KEY ("revokedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_access_logs" ADD CONSTRAINT "document_access_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_security" ADD CONSTRAINT "document_security_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_security" ADD CONSTRAINT "document_security_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

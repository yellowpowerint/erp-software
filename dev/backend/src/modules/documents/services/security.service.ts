import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { randomBytes, createCipheriv, createDecipheriv } from "crypto";
import * as bcrypt from "bcrypt";

export interface DocumentSecurityDto {
  isPasswordProtected?: boolean;
  password?: string;
  hasWatermark?: boolean;
  watermarkText?: string;
  isEncrypted?: boolean;
  expiresAt?: Date;
  maxDownloads?: number;
  requireSignature?: boolean;
  allowPrint?: boolean;
  allowCopy?: boolean;
}

export interface AccessLogDto {
  action:
    | "VIEWED"
    | "DOWNLOADED"
    | "EDITED"
    | "DELETED"
    | "SHARED"
    | "SIGNED"
    | "PERMISSION_CHANGED"
    | "SECURITY_UPDATED";
  metadata?: any;
}

@Injectable()
export class SecurityService {
  private readonly ENCRYPTION_ALGORITHM = "aes-256-cbc";
  private readonly ENCRYPTION_KEY =
    process.env.DOCUMENT_ENCRYPTION_KEY || randomBytes(32).toString("hex");

  constructor(private prisma: PrismaService) {}

  async setDocumentSecurity(
    documentId: string,
    userId: string,
    securityDto: DocumentSecurityDto,
  ) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: { security: true },
    });

    if (!document) {
      throw new NotFoundException("Document not found");
    }

    let passwordHash: string | null = null;
    if (securityDto.isPasswordProtected && securityDto.password) {
      passwordHash = await bcrypt.hash(securityDto.password, 10);
    }

    let encryptionKey: string | null = null;
    if (securityDto.isEncrypted) {
      encryptionKey = this.generateEncryptionKey();
    }

    const securityData = {
      documentId,
      isPasswordProtected: securityDto.isPasswordProtected ?? false,
      passwordHash,
      hasWatermark: securityDto.hasWatermark ?? false,
      watermarkText: securityDto.watermarkText,
      isEncrypted: securityDto.isEncrypted ?? false,
      encryptionKey,
      expiresAt: securityDto.expiresAt,
      maxDownloads: securityDto.maxDownloads,
      requireSignature: securityDto.requireSignature ?? false,
      allowPrint: securityDto.allowPrint ?? true,
      allowCopy: securityDto.allowCopy ?? true,
      createdById: userId,
    };

    let security;
    if (document.security) {
      security = await this.prisma.documentSecurity.update({
        where: { id: document.security.id },
        data: securityData,
      });
    } else {
      security = await this.prisma.documentSecurity.create({
        data: securityData,
      });
    }

    return security;
  }

  async getDocumentSecurity(documentId: string) {
    const security = await this.prisma.documentSecurity.findUnique({
      where: { documentId },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!security) {
      return null;
    }

    const { passwordHash, encryptionKey, ...safeSecurityData } = security;

    return {
      ...safeSecurityData,
      hasPassword: !!passwordHash,
      hasEncryption: !!encryptionKey,
    };
  }

  async verifyDocumentPassword(
    documentId: string,
    password: string,
  ): Promise<boolean> {
    const security = await this.prisma.documentSecurity.findUnique({
      where: { documentId },
    });

    if (!security || !security.isPasswordProtected || !security.passwordHash) {
      return true;
    }

    return bcrypt.compare(password, security.passwordHash);
  }

  async checkDocumentAccess(
    documentId: string,
    userId: string,
  ): Promise<{
    canAccess: boolean;
    reason?: string;
    requiresPassword?: boolean;
    requiresSignature?: boolean;
    isExpired?: boolean;
    downloadLimitReached?: boolean;
  }> {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: { security: true },
    });

    if (!document) {
      return { canAccess: false, reason: "Document not found" };
    }

    const security = document.security;

    if (!security) {
      return { canAccess: true };
    }

    if (security.expiresAt && new Date() > security.expiresAt) {
      return {
        canAccess: false,
        reason: "Document has expired",
        isExpired: true,
      };
    }

    if (
      security.maxDownloads &&
      security.downloadCount >= security.maxDownloads
    ) {
      return {
        canAccess: false,
        reason: "Download limit reached",
        downloadLimitReached: true,
      };
    }

    if (security.requireSignature) {
      const signature = await this.prisma.documentSignature.findFirst({
        where: {
          documentId,
          signerId: userId,
          isValid: true,
        },
      });

      if (!signature) {
        return {
          canAccess: false,
          reason: "Document requires signature",
          requiresSignature: true,
        };
      }
    }

    if (security.isPasswordProtected) {
      return {
        canAccess: false,
        reason: "Document is password protected",
        requiresPassword: true,
      };
    }

    return { canAccess: true };
  }

  async logDocumentAccess(
    documentId: string,
    userId: string,
    accessLogDto: AccessLogDto,
    ipAddress: string,
    userAgent: string,
  ) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException("Document not found");
    }

    const accessLog = await this.prisma.documentAccessLog.create({
      data: {
        documentId,
        userId,
        action: accessLogDto.action,
        ipAddress,
        userAgent,
        metadata: accessLogDto.metadata || {},
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (accessLogDto.action === "DOWNLOADED") {
      await this.incrementDownloadCount(documentId);
    }

    return accessLog;
  }

  async getDocumentAccessLogs(
    documentId: string,
    filters?: {
      action?: string;
      userId?: string;
      startDate?: Date;
      endDate?: Date;
    },
  ) {
    const where: any = { documentId };

    if (filters?.action) {
      where.action = filters.action;
    }

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.startDate || filters?.endDate) {
      where.accessedAt = {};
      if (filters.startDate) {
        where.accessedAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.accessedAt.lte = filters.endDate;
      }
    }

    return this.prisma.documentAccessLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { accessedAt: "desc" },
    });
  }

  async getUserAccessLogs(
    userId: string,
    filters?: {
      action?: string;
      startDate?: Date;
      endDate?: Date;
    },
  ) {
    const where: any = { userId };

    if (filters?.action) {
      where.action = filters.action;
    }

    if (filters?.startDate || filters?.endDate) {
      where.accessedAt = {};
      if (filters.startDate) {
        where.accessedAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.accessedAt.lte = filters.endDate;
      }
    }

    return this.prisma.documentAccessLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { accessedAt: "desc" },
      take: 100,
    });
  }

  async removeDocumentSecurity(
    documentId: string,
    userId: string,
    userRole: string,
  ) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: { security: true },
    });

    if (!document) {
      throw new NotFoundException("Document not found");
    }

    if (!document.security) {
      throw new BadRequestException("Document has no security settings");
    }

    if (
      document.uploadedById !== userId &&
      !["SUPER_ADMIN", "CEO", "CFO"].includes(userRole)
    ) {
      throw new ForbiddenException(
        "You do not have permission to remove security settings",
      );
    }

    await this.prisma.documentSecurity.delete({
      where: { id: document.security.id },
    });

    return { message: "Security settings removed successfully" };
  }

  private async incrementDownloadCount(documentId: string) {
    const security = await this.prisma.documentSecurity.findUnique({
      where: { documentId },
    });

    if (security) {
      await this.prisma.documentSecurity.update({
        where: { id: security.id },
        data: {
          downloadCount: {
            increment: 1,
          },
        },
      });
    }
  }

  private generateEncryptionKey(): string {
    return randomBytes(32).toString("hex");
  }

  encryptData(data: string, key: string): string {
    const iv = randomBytes(16);
    const cipher = createCipheriv(
      this.ENCRYPTION_ALGORITHM,
      Buffer.from(key, "hex"),
      iv,
    );
    let encrypted = cipher.update(data, "utf8", "hex");
    encrypted += cipher.final("hex");
    return iv.toString("hex") + ":" + encrypted;
  }

  decryptData(encryptedData: string, key: string): string {
    const parts = encryptedData.split(":");
    const iv = Buffer.from(parts[0], "hex");
    const encrypted = parts[1];
    const decipher = createDecipheriv(
      this.ENCRYPTION_ALGORITHM,
      Buffer.from(key, "hex"),
      iv,
    );
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }
}

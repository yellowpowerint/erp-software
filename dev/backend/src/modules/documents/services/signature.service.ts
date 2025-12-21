import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { createHash } from "crypto";
import { DocumentPermissionsService } from "./document-permissions.service";

export interface SignDocumentDto {
  signatureData: string; // Base64 encoded signature image
  signatureType?: "DRAWN" | "TYPED" | "UPLOADED" | "CERTIFICATE";
  location?: string; // GPS coordinates
  reason?: string;
  metadata?: any;
}

export interface VerifySignatureDto {
  signatureId: string;
  documentId: string;
}

@Injectable()
export class SignatureService {
  constructor(
    private prisma: PrismaService,
    private readonly documentPermissionsService: DocumentPermissionsService,
  ) {}

  async signDocument(
    documentId: string,
    userId: string,
    signatureDto: SignDocumentDto,
    ipAddress: string,
    userAgent: string,
  ) {
    await this.documentPermissionsService.assertHasPermission(
      documentId,
      userId,
      "sign",
    );

    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: { security: true },
    });

    if (!document) {
      throw new NotFoundException("Document not found");
    }

    if (document.security?.requireSignature) {
      const existingSignature = await this.prisma.documentSignature.findFirst({
        where: {
          documentId,
          signerId: userId,
          isValid: true,
        },
      });

      if (existingSignature) {
        throw new BadRequestException("You have already signed this document");
      }
    }

    const signedAt = new Date();
    const signatureHash = this.generateSignatureHash(
      signatureDto.signatureData,
      userId,
      documentId,
      signedAt,
    );

    const signature = await this.prisma.documentSignature.create({
      data: {
        documentId,
        signerId: userId,
        signatureData: signatureDto.signatureData,
        signatureType: signatureDto.signatureType || "DRAWN",
        signatureHash,
        ipAddress,
        userAgent,
        location: signatureDto.location,
        reason: signatureDto.reason,
        metadata: signatureDto.metadata || {},
        signedAt,
      },
      include: {
        signer: {
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

    await this.logAccess(documentId, userId, "SIGNED", ipAddress, userAgent, {
      signatureId: signature.id,
      reason: signatureDto.reason,
    });

    return signature;
  }

  async getDocumentSignatures(documentId: string) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException("Document not found");
    }

    return this.prisma.documentSignature.findMany({
      where: { documentId },
      include: {
        signer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        revokedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { signedAt: "desc" },
    });
  }

  async verifySignature(signatureId: string, documentId: string) {
    const signature = await this.prisma.documentSignature.findUnique({
      where: { id: signatureId },
      include: {
        signer: {
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

    if (!signature) {
      throw new NotFoundException("Signature not found");
    }

    if (signature.documentId !== documentId) {
      throw new BadRequestException(
        "Signature does not belong to this document",
      );
    }

    const expectedHash = this.generateSignatureHash(
      signature.signatureData,
      signature.signerId,
      documentId,
      signature.signedAt,
    );

    const isValid =
      signature.signatureHash === expectedHash &&
      signature.isValid &&
      !signature.revokedAt;

    return {
      signature,
      isValid,
      verifiedAt: new Date(),
      hashMatch: signature.signatureHash === expectedHash,
      notRevoked: !signature.revokedAt,
      markedValid: signature.isValid,
    };
  }

  async revokeSignature(
    signatureId: string,
    userId: string,
    reason: string,
    userRole: string,
  ) {
    const signature = await this.prisma.documentSignature.findUnique({
      where: { id: signatureId },
    });

    if (!signature) {
      throw new NotFoundException("Signature not found");
    }

    if (
      signature.signerId !== userId &&
      !["SUPER_ADMIN", "CEO", "CFO"].includes(userRole)
    ) {
      throw new ForbiddenException(
        "You do not have permission to revoke this signature",
      );
    }

    if (signature.revokedAt) {
      throw new BadRequestException("Signature has already been revoked");
    }

    const revokedSignature = await this.prisma.documentSignature.update({
      where: { id: signatureId },
      data: {
        isValid: false,
        revokedAt: new Date(),
        revokedById: userId,
        revokeReason: reason,
      },
      include: {
        signer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        revokedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return revokedSignature;
  }

  async checkSignatureRequirement(
    documentId: string,
    userId: string,
    _userRole: string,
  ) {
    await this.documentPermissionsService.assertHasPermission(
      documentId,
      userId,
      "view",
    );

    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: { security: true },
    });

    if (!document) {
      throw new NotFoundException("Document not found");
    }

    if (!document.security?.requireSignature) {
      return { required: false, signed: false };
    }

    const signature = await this.prisma.documentSignature.findFirst({
      where: {
        documentId,
        signerId: userId,
        isValid: true,
      },
    });

    return {
      required: true,
      signed: !!signature,
      signature: signature || null,
    };
  }

  private generateSignatureHash(
    signatureData: string,
    userId: string,
    documentId: string,
    signedAt: Date,
  ): string {
    const timestamp = signedAt.toISOString();
    const data = `${signatureData}:${userId}:${documentId}:${timestamp}`;
    return createHash("sha256").update(data).digest("hex");
  }

  private async logAccess(
    documentId: string,
    userId: string,
    action: any,
    ipAddress: string,
    userAgent: string,
    metadata?: any,
  ) {
    await this.prisma.documentAccessLog.create({
      data: {
        documentId,
        userId,
        action,
        ipAddress,
        userAgent,
        metadata: metadata || {},
      },
    });
  }
}

import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { DocumentsService } from "../documents.service";
import { DocumentPermissionsService } from "./document-permissions.service";
import { UserRole } from "@prisma/client";
import * as crypto from "crypto";

@Injectable()
export class DocumentSharingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly documentsService: DocumentsService,
    private readonly documentPermissionsService: DocumentPermissionsService,
  ) {}

  async shareDocument(
    documentId: string,
    data: {
      sharedWithId?: string;
      expiresAt?: string;
      canEdit?: boolean;
      canDownload?: boolean;
      generatePublicLink?: boolean;
    },
    user: { userId: string; role: UserRole },
  ) {
    const document = await this.documentsService.findOne(
      documentId,
      user.userId,
      user.role,
    );

    await this.assertCanShare(documentId, user.userId, user.role);

    if (!data.sharedWithId && !data.generatePublicLink) {
      throw new BadRequestException(
        "sharedWithId or generatePublicLink is required",
      );
    }

    const expiresAt = data.expiresAt ? new Date(data.expiresAt) : undefined;
    if (expiresAt && Number.isNaN(expiresAt.getTime())) {
      throw new BadRequestException("Invalid expiresAt date");
    }

    const shareLink = data.generatePublicLink
      ? crypto.randomBytes(16).toString("hex")
      : undefined;

    const share = await this.prisma.documentShare.create({
      data: {
        documentId,
        sharedById: user.userId,
        sharedWithId: data.sharedWithId,
        shareLink,
        expiresAt,
        canEdit: data.canEdit ?? false,
        canDownload: data.canDownload ?? true,
      },
      include: {
        document: true,
        sharedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        sharedWith: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    return {
      ...share,
      publicUrl: share.shareLink ? `/api/share/${share.shareLink}` : null,
      documentName: document.originalName,
    };
  }

  async getSharedWithMe(userId: string) {
    const now = new Date();
    return this.prisma.documentShare.findMany({
      where: {
        sharedWithId: userId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      include: {
        document: {
          include: {
            uploadedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            metadata: true,
          },
        },
        sharedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getSharedByMe(userId: string) {
    return this.prisma.documentShare.findMany({
      where: { sharedById: userId },
      include: {
        document: {
          include: {
            uploadedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            metadata: true,
          },
        },
        sharedWith: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async revokeShare(shareId: string, user: { userId: string; role: UserRole }) {
    const existing = await this.prisma.documentShare.findUnique({
      where: { id: shareId },
      select: { id: true, sharedById: true },
    });

    if (!existing) {
      throw new NotFoundException("Share not found");
    }

    if (
      user.role !== UserRole.SUPER_ADMIN &&
      existing.sharedById !== user.userId
    ) {
      throw new ForbiddenException("You can only revoke shares you created");
    }

    await this.prisma.documentShare.delete({ where: { id: shareId } });
    return { success: true };
  }

  async getShareByToken(shareToken: string) {
    const now = new Date();

    const share = await this.prisma.documentShare.findFirst({
      where: {
        shareLink: shareToken,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      include: {
        document: true,
        sharedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!share) {
      throw new NotFoundException("Share link not found or expired");
    }

    await this.prisma.documentShare.update({
      where: { id: share.id },
      data: { accessCount: { increment: 1 } },
    });

    return share;
  }

  private async assertCanShare(
    documentId: string,
    userId: string,
    _userRole: UserRole,
  ) {
    await this.documentPermissionsService.assertHasPermission(
      documentId,
      userId,
      "share",
    );
  }
}

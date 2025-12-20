import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { DocumentsService } from '../documents.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class DocumentPresenceService {
  private readonly activeWindowMs = 2 * 60 * 1000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly documentsService: DocumentsService,
  ) {}

  async heartbeat(documentId: string, userId: string, userRole: UserRole) {
    await this.documentsService.findOne(documentId, userId, userRole);

    const now = new Date();

    await this.prisma.documentPresence.upsert({
      where: { documentId_userId: { documentId, userId } },
      create: { documentId, userId, lastSeenAt: now },
      update: { lastSeenAt: now },
    });

    return { success: true, lastSeenAt: now };
  }

  async listViewers(documentId: string, userId: string, userRole: UserRole) {
    await this.documentsService.findOne(documentId, userId, userRole);

    const threshold = new Date(Date.now() - this.activeWindowMs);

    const viewers = await this.prisma.documentPresence.findMany({
      where: {
        documentId,
        lastSeenAt: { gt: threshold },
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
      },
      orderBy: { lastSeenAt: 'desc' },
      take: 25,
    });

    return viewers.map((v) => ({
      user: v.user,
      lastSeenAt: v.lastSeenAt,
    }));
  }
}

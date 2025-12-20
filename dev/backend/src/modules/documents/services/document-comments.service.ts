import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { DocumentsService } from '../documents.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { UserRole, UserStatus } from '@prisma/client';

@Injectable()
export class DocumentCommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly documentsService: DocumentsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async listComments(documentId: string, userId: string, userRole: UserRole) {
    await this.documentsService.findOne(documentId, userId, userRole);

    const comments = await this.prisma.documentComment.findMany({
      where: { documentId },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
        resolvedBy: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const byId = new Map<string, any>();
    for (const c of comments) {
      byId.set(c.id, { ...c, replies: [] as any[] });
    }

    const roots: any[] = [];
    for (const c of comments) {
      const node = byId.get(c.id);
      if (c.parentId) {
        const parent = byId.get(c.parentId);
        if (parent) parent.replies.push(node);
        else roots.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  async addComment(
    documentId: string,
    data: { content: string; pageNumber?: number; positionX?: number; positionY?: number },
    user: { userId: string; role: UserRole },
  ) {
    const content = (data.content || '').trim();
    if (!content) {
      throw new BadRequestException('Comment content is required');
    }

    const document = await this.documentsService.findOne(documentId, user.userId, user.role);

    const comment = await this.prisma.documentComment.create({
      data: {
        documentId,
        authorId: user.userId,
        content,
        pageNumber: data.pageNumber,
        positionX: data.positionX,
        positionY: data.positionY,
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
        resolvedBy: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
      },
    });

    await this.handleMentions(content, comment.id, document.id, document.originalName, comment.author);

    return comment;
  }

  async replyToComment(
    parentCommentId: string,
    data: { content: string; pageNumber?: number; positionX?: number; positionY?: number },
    user: { userId: string; role: UserRole },
  ) {
    const content = (data.content || '').trim();
    if (!content) {
      throw new BadRequestException('Reply content is required');
    }

    const parent = await this.prisma.documentComment.findUnique({
      where: { id: parentCommentId },
      select: { id: true, documentId: true, pageNumber: true, positionX: true, positionY: true },
    });

    if (!parent) {
      throw new NotFoundException('Parent comment not found');
    }

    const document = await this.documentsService.findOne(parent.documentId, user.userId, user.role);

    const reply = await this.prisma.documentComment.create({
      data: {
        documentId: parent.documentId,
        authorId: user.userId,
        content,
        parentId: parentCommentId,
        pageNumber: data.pageNumber ?? parent.pageNumber ?? undefined,
        positionX: data.positionX ?? parent.positionX ?? undefined,
        positionY: data.positionY ?? parent.positionY ?? undefined,
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
        resolvedBy: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
      },
    });

    await this.handleMentions(content, reply.id, document.id, document.originalName, reply.author);

    return reply;
  }

  async updateComment(
    commentId: string,
    data: { content: string },
    user: { userId: string; role: UserRole },
  ) {
    const content = (data.content || '').trim();
    if (!content) {
      throw new BadRequestException('Comment content is required');
    }

    const existing = await this.prisma.documentComment.findUnique({
      where: { id: commentId },
      select: { id: true, documentId: true, authorId: true },
    });

    if (!existing) {
      throw new NotFoundException('Comment not found');
    }

    await this.documentsService.findOne(existing.documentId, user.userId, user.role);

    if (user.role !== UserRole.SUPER_ADMIN && existing.authorId !== user.userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    const updated = await this.prisma.documentComment.update({
      where: { id: commentId },
      data: { content },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
        resolvedBy: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
      },
    });

    const document = await this.prisma.document.findUnique({
      where: { id: existing.documentId },
      select: { id: true, originalName: true },
    });

    if (document) {
      await this.handleMentions(content, updated.id, document.id, document.originalName, updated.author);
    }

    return updated;
  }

  async deleteComment(commentId: string, user: { userId: string; role: UserRole }) {
    const existing = await this.prisma.documentComment.findUnique({
      where: { id: commentId },
      select: { id: true, documentId: true, authorId: true },
    });

    if (!existing) {
      throw new NotFoundException('Comment not found');
    }

    await this.documentsService.findOne(existing.documentId, user.userId, user.role);

    if (user.role !== UserRole.SUPER_ADMIN && existing.authorId !== user.userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.prisma.documentComment.delete({ where: { id: commentId } });

    return { success: true };
  }

  async resolveComment(
    commentId: string,
    data: { resolved?: boolean },
    user: { userId: string; role: UserRole },
  ) {
    const existing = await this.prisma.documentComment.findUnique({
      where: { id: commentId },
      select: { id: true, documentId: true },
    });

    if (!existing) {
      throw new NotFoundException('Comment not found');
    }

    await this.documentsService.findOne(existing.documentId, user.userId, user.role);

    const resolved = data.resolved ?? true;

    return this.prisma.documentComment.update({
      where: { id: commentId },
      data: {
        isResolved: resolved,
        resolvedById: resolved ? user.userId : null,
        resolvedAt: resolved ? new Date() : null,
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
        resolvedBy: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
      },
    });
  }

  private async handleMentions(
    content: string,
    commentId: string,
    documentId: string,
    documentName: string,
    author: { id: string; firstName: string; lastName: string; email: string },
  ) {
    const regex = /@([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g;
    const emails = new Set<string>();

    let match: RegExpExecArray | null;
    while ((match = regex.exec(content)) !== null) {
      if (match[1]) emails.add(match[1].toLowerCase());
    }

    if (emails.size === 0) return;

    const mentionedUsers = await this.prisma.user.findMany({
      where: {
        email: { in: Array.from(emails) },
        status: UserStatus.ACTIVE,
      },
      select: { id: true, email: true },
    });

    const notifications = mentionedUsers
      .filter((u) => u.id !== author.id)
      .map((u) => ({
        userId: u.id,
        type: 'MENTION' as const,
        title: 'You were mentioned',
        message: `${author.firstName} ${author.lastName} mentioned you in a document comment: ${documentName}`,
        referenceType: 'document_comment',
        referenceId: `${documentId}:${commentId}`,
      }));

    if (notifications.length > 0) {
      await this.notificationsService.createBulkNotifications(notifications);
    }
  }
}

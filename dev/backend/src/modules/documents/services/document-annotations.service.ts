import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { DocumentsService } from '../documents.service';
import { AnnotationType, UserRole } from '@prisma/client';

@Injectable()
export class DocumentAnnotationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly documentsService: DocumentsService,
  ) {}

  async listAnnotations(documentId: string, userId: string, userRole: UserRole) {
    await this.documentsService.findOne(documentId, userId, userRole);

    return this.prisma.documentAnnotation.findMany({
      where: { documentId },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
      },
      orderBy: [{ pageNumber: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async addAnnotation(
    documentId: string,
    data: {
      type: AnnotationType;
      pageNumber: number;
      coordinates: any;
      content?: string;
      color?: string;
    },
    user: { userId: string; role: UserRole },
  ) {
    if (!data.type) {
      throw new BadRequestException('Annotation type is required');
    }
    if (!Number.isFinite(data.pageNumber) || data.pageNumber < 1) {
      throw new BadRequestException('pageNumber must be a positive integer');
    }
    if (!data.coordinates) {
      throw new BadRequestException('coordinates are required');
    }

    await this.documentsService.assertCanEdit(documentId, user.userId, user.role);

    return this.prisma.documentAnnotation.create({
      data: {
        documentId,
        authorId: user.userId,
        type: data.type,
        pageNumber: data.pageNumber,
        coordinates: data.coordinates,
        content: data.content,
        color: data.color,
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
      },
    });
  }

  async updateAnnotation(
    annotationId: string,
    data: { coordinates?: any; content?: string; color?: string },
    user: { userId: string; role: UserRole },
  ) {
    const existing = await this.prisma.documentAnnotation.findUnique({
      where: { id: annotationId },
      select: { id: true, documentId: true, authorId: true },
    });

    if (!existing) {
      throw new NotFoundException('Annotation not found');
    }

    await this.documentsService.assertCanEdit(existing.documentId, user.userId, user.role);

    if (user.role !== UserRole.SUPER_ADMIN && existing.authorId !== user.userId) {
      throw new ForbiddenException('You can only edit your own annotations');
    }

    return this.prisma.documentAnnotation.update({
      where: { id: annotationId },
      data: {
        coordinates: data.coordinates,
        content: data.content,
        color: data.color,
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
      },
    });
  }

  async deleteAnnotation(annotationId: string, user: { userId: string; role: UserRole }) {
    const existing = await this.prisma.documentAnnotation.findUnique({
      where: { id: annotationId },
      select: { id: true, documentId: true, authorId: true },
    });

    if (!existing) {
      throw new NotFoundException('Annotation not found');
    }

    await this.documentsService.assertCanEdit(existing.documentId, user.userId, user.role);

    if (user.role !== UserRole.SUPER_ADMIN && existing.authorId !== user.userId) {
      throw new ForbiddenException('You can only delete your own annotations');
    }

    await this.prisma.documentAnnotation.delete({ where: { id: annotationId } });
    return { success: true };
  }
}

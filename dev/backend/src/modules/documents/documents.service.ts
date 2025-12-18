import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { StorageService } from './services/storage.service';
import { FileUploadService } from './services/file-upload.service';
import { DocumentCategory, UserRole } from '@prisma/client';

export interface CreateDocumentDto {
  category: DocumentCategory;
  module: string;
  referenceId?: string;
  description?: string;
  tags?: string[];
}

export interface UpdateDocumentDto {
  description?: string;
  tags?: string[];
  category?: DocumentCategory;
}

export interface DocumentSearchFilters {
  category?: DocumentCategory;
  module?: string;
  referenceId?: string;
  tags?: string[];
  uploadedById?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    private fileUploadService: FileUploadService,
  ) {}

  async uploadDocument(
    file: Express.Multer.File,
    createDto: CreateDocumentDto,
    userId: string,
  ) {
    this.fileUploadService.validateFile(file);

    const uploadResult = await this.storageService.uploadFile(file, createDto.module);

    const document = await this.prisma.document.create({
      data: {
        fileName: uploadResult.key,
        originalName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        fileUrl: uploadResult.url,
        category: createDto.category,
        module: createDto.module,
        referenceId: createDto.referenceId,
        description: createDto.description,
        tags: createDto.tags || [],
        uploadedById: userId,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Create initial metadata
    await this.prisma.documentMetadata.create({
      data: {
        documentId: document.id,
        pageCount: this.fileUploadService.isPdfFile(file.mimetype) ? null : null,
      },
    });

    this.logger.log(`Document uploaded: ${document.id} by user ${userId}`);

    return document;
  }

  async uploadMultipleDocuments(
    files: Express.Multer.File[],
    createDto: CreateDocumentDto,
    userId: string,
  ) {
    this.fileUploadService.validateMultipleFiles(files);

    const uploadPromises = files.map(file => 
      this.uploadDocument(file, createDto, userId)
    );

    const documents = await Promise.all(uploadPromises);

    this.logger.log(`${documents.length} documents uploaded by user ${userId}`);

    return documents;
  }

  async findAll(filters: DocumentSearchFilters = {}, userId: string, userRole: UserRole) {
    const where: any = {};
    const baseConditions: any = {};

    if (filters.category) {
      baseConditions.category = filters.category;
    }

    if (filters.module) {
      baseConditions.module = filters.module;
    }

    if (filters.referenceId) {
      baseConditions.referenceId = filters.referenceId;
    }

    if (filters.uploadedById) {
      baseConditions.uploadedById = filters.uploadedById;
    }

    if (filters.tags && filters.tags.length > 0) {
      baseConditions.tags = {
        hasSome: filters.tags,
      };
    }

    if (filters.startDate || filters.endDate) {
      baseConditions.createdAt = {};
      if (filters.startDate) {
        baseConditions.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        baseConditions.createdAt.lte = filters.endDate;
      }
    }

    // Build search conditions
    const searchConditions: any[] = [];
    if (filters.search) {
      searchConditions.push(
        { originalName: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { tags: { hasSome: [filters.search] } }
      );
    }

    // Apply permission filtering (SUPER_ADMIN sees all)
    if (userRole === UserRole.SUPER_ADMIN) {
      // Admin sees everything - just apply base conditions and search
      Object.assign(where, baseConditions);
      if (searchConditions.length > 0) {
        where.OR = searchConditions;
      }
    } else {
      // Non-admin: must be owner OR have view permission
      const permissionConditions = [
        { uploadedById: userId },
        {
          permissions: {
            some: {
              role: userRole,
              canView: true,
            },
          },
        },
      ];

      // Combine: (base filters) AND (owner OR permission) AND (search if present)
      Object.assign(where, baseConditions);
      
      if (searchConditions.length > 0) {
        // Must satisfy: permission AND search
        where.AND = [
          { OR: permissionConditions },
          { OR: searchConditions },
        ];
      } else {
        // Just permission check
        where.OR = permissionConditions;
      }
    }

    const documents = await this.prisma.document.findMany({
      where,
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
        permissions: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return documents;
  }

  async findOne(id: string, userId: string, userRole: UserRole) {
    const document = await this.prisma.document.findUnique({
      where: { id },
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
        permissions: true,
        versions: {
          include: {
            uploadedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: {
            versionNumber: 'desc',
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Check permissions
    await this.checkViewPermission(document, userId, userRole);

    return document;
  }

  async update(id: string, updateDto: UpdateDocumentDto, userId: string, userRole: UserRole) {
    const document = await this.findOne(id, userId, userRole);

    // Check edit permission
    await this.checkEditPermission(document, userId, userRole);

    const updated = await this.prisma.document.update({
      where: { id },
      data: {
        description: updateDto.description,
        tags: updateDto.tags,
        category: updateDto.category,
      },
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
    });

    this.logger.log(`Document updated: ${id} by user ${userId}`);

    return updated;
  }

  async delete(id: string, userId: string, userRole: UserRole) {
    const document = await this.findOne(id, userId, userRole);

    // Check delete permission
    await this.checkDeletePermission(document, userId, userRole);

    // Delete file from storage
    await this.storageService.deleteFile(
      document.fileName,
      document.fileUrl.includes('s3.amazonaws.com') ? 's3' as any : 'local' as any,
    );

    // Delete document and related records (cascade)
    await this.prisma.document.delete({
      where: { id },
    });

    this.logger.log(`Document deleted: ${id} by user ${userId}`);

    return { message: 'Document deleted successfully' };
  }

  async getDownloadUrl(id: string, userId: string, userRole: UserRole) {
    const document = await this.findOne(id, userId, userRole);

    const provider = document.fileUrl.includes('s3.amazonaws.com') ? 's3' : 'local';
    const url = await this.storageService.getSignedDownloadUrl(
      document.fileName,
      provider as any,
      3600,
    );

    return { url, filename: document.originalName };
  }

  async searchDocuments(query: string, userId: string, userRole: UserRole) {
    return this.findAll({ search: query }, userId, userRole);
  }

  async getDocumentsByModule(module: string, referenceId: string, userId: string, userRole: UserRole) {
    return this.findAll({ module, referenceId }, userId, userRole);
  }

  async getRecentDocuments(userId: string, userRole: UserRole, limit: number = 10) {
    const documents = await this.findAll({}, userId, userRole);
    return documents.slice(0, limit);
  }

  async getMyUploads(userId: string) {
    return this.prisma.document.findMany({
      where: {
        uploadedById: userId,
      },
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
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getStatistics(userId: string, userRole: UserRole) {
    const documents = await this.findAll({}, userId, userRole);

    const totalSize = documents.reduce((sum, doc) => sum + doc.fileSize, 0);
    const categoryCounts = documents.reduce((acc, doc) => {
      acc[doc.category] = (acc[doc.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalDocuments: documents.length,
      totalSize,
      totalSizeMB: this.fileUploadService.getFileSizeInMB(totalSize),
      categoryCounts,
      recentUploads: documents.slice(0, 5),
    };
  }

  async getStorageUsage(userId: string, userRole: UserRole) {
    const documents = await this.findAll({}, userId, userRole);

    const byModule = documents.reduce((acc, doc) => {
      if (!acc[doc.module]) {
        acc[doc.module] = { count: 0, size: 0 };
      }
      acc[doc.module].count++;
      acc[doc.module].size += doc.fileSize;
      return acc;
    }, {} as Record<string, { count: number; size: number }>);

    const byUser = documents.reduce((acc, doc) => {
      const userName = `${doc.uploadedBy.firstName} ${doc.uploadedBy.lastName}`;
      if (!acc[userName]) {
        acc[userName] = { count: 0, size: 0, userId: doc.uploadedById };
      }
      acc[userName].count++;
      acc[userName].size += doc.fileSize;
      return acc;
    }, {} as Record<string, { count: number; size: number; userId: string }>);

    const totalSize = documents.reduce((sum, doc) => sum + doc.fileSize, 0);

    return {
      totalSize,
      totalSizeMB: this.fileUploadService.getFileSizeInMB(totalSize),
      totalDocuments: documents.length,
      byModule,
      byUser,
    };
  }

  async batchDelete(documentIds: string[], userId: string, userRole: UserRole) {
    const results = {
      deleted: [] as string[],
      failed: [] as { id: string; error: string }[],
    };

    for (const id of documentIds) {
      try {
        await this.delete(id, userId, userRole);
        results.deleted.push(id);
      } catch (error: any) {
        results.failed.push({
          id,
          error: error.message || 'Failed to delete document',
        });
      }
    }

    this.logger.log(`Batch delete: ${results.deleted.length} deleted, ${results.failed.length} failed by user ${userId}`);

    return results;
  }

  async batchAddTags(documentIds: string[], tags: string[], userId: string, userRole: UserRole) {
    const results = {
      updated: [] as string[],
      failed: [] as { id: string; error: string }[],
    };

    for (const id of documentIds) {
      try {
        const document = await this.findOne(id, userId, userRole);
        await this.checkEditPermission(document, userId, userRole);

        const existingTags = document.tags || [];
        const newTags = [...new Set([...existingTags, ...tags])];

        await this.prisma.document.update({
          where: { id },
          data: { tags: newTags },
        });

        results.updated.push(id);
      } catch (error: any) {
        results.failed.push({
          id,
          error: error.message || 'Failed to update tags',
        });
      }
    }

    this.logger.log(`Batch tag: ${results.updated.length} updated, ${results.failed.length} failed by user ${userId}`);

    return results;
  }

  async getDocumentsForDownload(documentIds: string[], userId: string, userRole: UserRole) {
    const documents = [];

    for (const id of documentIds) {
      try {
        const document = await this.findOne(id, userId, userRole);
        documents.push(document);
      } catch (error) {
        this.logger.warn(`Failed to fetch document ${id} for download: ${error.message}`);
      }
    }

    return documents;
  }

  private async checkViewPermission(document: any, userId: string, userRole: UserRole) {
    if (userRole === UserRole.SUPER_ADMIN || document.uploadedById === userId) {
      return;
    }

    const hasPermission = document.permissions.some(
      (p: any) => p.role === userRole && p.canView,
    );

    if (!hasPermission) {
      throw new ForbiddenException('You do not have permission to view this document');
    }
  }

  private async checkEditPermission(document: any, userId: string, userRole: UserRole) {
    if (userRole === UserRole.SUPER_ADMIN || document.uploadedById === userId) {
      return;
    }

    const hasPermission = document.permissions.some(
      (p: any) => p.role === userRole && p.canEdit,
    );

    if (!hasPermission) {
      throw new ForbiddenException('You do not have permission to edit this document');
    }
  }

  private async checkDeletePermission(document: any, userId: string, userRole: UserRole) {
    if (userRole === UserRole.SUPER_ADMIN || document.uploadedById === userId) {
      return;
    }

    const hasPermission = document.permissions.some(
      (p: any) => p.role === userRole && p.canDelete,
    );

    if (!hasPermission) {
      throw new ForbiddenException('You do not have permission to delete this document');
    }
  }

  // ===== Version Management Methods (Phase 15.3) =====

  async getVersionHistory(documentId: string, userId: string, userRole: UserRole) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: {
        permissions: true,
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException(`Document ${documentId} not found`);
    }

    await this.checkViewPermission(document, userId, userRole);

    const versions = await this.prisma.documentVersion.findMany({
      where: { documentId },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { versionNumber: 'desc' },
    });

    return versions;
  }

  async getSpecificVersion(documentId: string, versionNumber: number, userId: string, userRole: UserRole) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: { permissions: true },
    });

    if (!document) {
      throw new NotFoundException(`Document ${documentId} not found`);
    }

    await this.checkViewPermission(document, userId, userRole);

    const version = await this.prisma.documentVersion.findUnique({
      where: {
        documentId_versionNumber: {
          documentId,
          versionNumber,
        },
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!version) {
      throw new NotFoundException(`Version ${versionNumber} not found for document ${documentId}`);
    }

    return version;
  }

  async uploadNewVersion(
    documentId: string,
    file: Express.Multer.File,
    changeNotes: string | undefined,
    userId: string,
    userRole: UserRole,
  ) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: { permissions: true },
    });

    if (!document) {
      throw new NotFoundException(`Document ${documentId} not found`);
    }

    await this.checkEditPermission(document, userId, userRole);

    this.fileUploadService.validateFile(file);

    // Upload new file
    const uploadResult = await this.storageService.uploadFile(file, document.module);

    // Create version record for the current document state
    await this.prisma.documentVersion.create({
      data: {
        documentId: document.id,
        versionNumber: document.version,
        fileName: document.fileName,
        fileUrl: document.fileUrl,
        fileSize: document.fileSize,
        uploadedById: document.uploadedById,
        changeNotes: 'Previous version archived',
      },
    });

    // Update document with new version
    const updatedDocument = await this.prisma.document.update({
      where: { id: documentId },
      data: {
        fileName: uploadResult.key,
        originalName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        fileUrl: uploadResult.url,
        version: document.version + 1,
        updatedAt: new Date(),
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        versions: {
          include: {
            uploadedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: { versionNumber: 'desc' },
        },
      },
    });

    this.logger.log(`New version ${updatedDocument.version} uploaded for document ${documentId} by user ${userId}`);

    return updatedDocument;
  }

  async restoreVersion(
    documentId: string,
    versionNumber: number,
    userId: string,
    userRole: UserRole,
  ) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: { permissions: true },
    });

    if (!document) {
      throw new NotFoundException(`Document ${documentId} not found`);
    }

    await this.checkEditPermission(document, userId, userRole);

    const versionToRestore = await this.prisma.documentVersion.findUnique({
      where: {
        documentId_versionNumber: {
          documentId,
          versionNumber,
        },
      },
    });

    if (!versionToRestore) {
      throw new NotFoundException(`Version ${versionNumber} not found for document ${documentId}`);
    }

    // Create version record for current state before restoring
    await this.prisma.documentVersion.create({
      data: {
        documentId: document.id,
        versionNumber: document.version,
        fileName: document.fileName,
        fileUrl: document.fileUrl,
        fileSize: document.fileSize,
        uploadedById: document.uploadedById,
        changeNotes: `Backup before restoring to version ${versionNumber}`,
      },
    });

    // Restore the old version as the current document
    const restoredDocument = await this.prisma.document.update({
      where: { id: documentId },
      data: {
        fileName: versionToRestore.fileName,
        fileUrl: versionToRestore.fileUrl,
        fileSize: versionToRestore.fileSize,
        version: document.version + 1,
        updatedAt: new Date(),
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        versions: {
          include: {
            uploadedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: { versionNumber: 'desc' },
        },
      },
    });

    this.logger.log(`Version ${versionNumber} restored for document ${documentId} by user ${userId}`);

    return restoredDocument;
  }

  async compareVersions(
    documentId: string,
    fromVersion: number,
    toVersion: number,
    userId: string,
    userRole: UserRole,
  ) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: { permissions: true },
    });

    if (!document) {
      throw new NotFoundException(`Document ${documentId} not found`);
    }

    await this.checkViewPermission(document, userId, userRole);

    const fromVersionData = await this.prisma.documentVersion.findUnique({
      where: {
        documentId_versionNumber: {
          documentId,
          versionNumber: fromVersion,
        },
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    const toVersionData = await this.prisma.documentVersion.findUnique({
      where: {
        documentId_versionNumber: {
          documentId,
          versionNumber: toVersion,
        },
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!fromVersionData) {
      throw new NotFoundException(`Version ${fromVersion} not found`);
    }

    if (!toVersionData) {
      throw new NotFoundException(`Version ${toVersion} not found`);
    }

    return {
      documentId,
      from: fromVersionData,
      to: toVersionData,
      differences: {
        fileName: fromVersionData.fileName !== toVersionData.fileName,
        fileSize: fromVersionData.fileSize !== toVersionData.fileSize,
        uploadedBy: fromVersionData.uploadedById !== toVersionData.uploadedById,
        changeNotes: fromVersionData.changeNotes !== toVersionData.changeNotes,
      },
    };
  }
}

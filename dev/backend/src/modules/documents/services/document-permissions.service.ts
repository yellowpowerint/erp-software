import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  DocumentCategory,
  UserRole,
} from '@prisma/client';

const PermissionAction = {
  GRANT: 'GRANT',
  REVOKE: 'REVOKE',
  MODIFY: 'MODIFY',
  TEMPLATE_APPLIED: 'TEMPLATE_APPLIED',
  BULK_UPDATE: 'BULK_UPDATE',
} as const;

type PermissionAction = (typeof PermissionAction)[keyof typeof PermissionAction];

export type DocumentPermissionKey = 'view' | 'edit' | 'delete' | 'share' | 'sign' | 'download';

export interface EffectiveDocumentPermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
  canSign: boolean;
  canDownload: boolean;
}

export interface PermissionFlags {
  canView?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canShare?: boolean;
  canSign?: boolean;
  canUpload?: boolean;
}

@Injectable()
export class DocumentPermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  private prismaAny() {
    return this.prisma as any;
  }

  private all(): EffectiveDocumentPermissions {
    return {
      canView: true,
      canEdit: true,
      canDelete: true,
      canShare: true,
      canSign: true,
      canDownload: true,
    };
  }

  private none(): EffectiveDocumentPermissions {
    return {
      canView: false,
      canEdit: false,
      canDelete: false,
      canShare: false,
      canSign: false,
      canDownload: false,
    };
  }

  private merge(a: EffectiveDocumentPermissions, b: Partial<EffectiveDocumentPermissions>): EffectiveDocumentPermissions {
    return {
      canView: a.canView || !!b.canView,
      canEdit: a.canEdit || !!b.canEdit,
      canDelete: a.canDelete || !!b.canDelete,
      canShare: a.canShare || !!b.canShare,
      canSign: a.canSign || !!b.canSign,
      canDownload: a.canDownload || !!b.canDownload,
    };
  }

  async getEffectivePermissions(documentId: string, userId: string): Promise<EffectiveDocumentPermissions> {
    const [user, document] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, department: true },
      }),
      this.prisma.document.findUnique({
        where: { id: documentId },
        select: {
          id: true,
          uploadedById: true,
          category: true,
          permissions: true,
        },
      }),
    ]);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (user.role === UserRole.SUPER_ADMIN || document.uploadedById === userId) {
      return this.all();
    }

    const now = new Date();

    const [userPermission, departmentPermission, categoryPermission, share] = await Promise.all([
      this.prismaAny().documentUserPermission.findUnique({
        where: {
          documentId_userId: {
            documentId,
            userId,
          },
        },
      }),
      user.department
        ? this.prismaAny().documentDepartmentPermission.findFirst({
            where: {
              documentId,
              department: user.department,
            },
          })
        : null,
      this.prismaAny().documentCategoryPermission.findUnique({
        where: {
          category_role: {
            category: document.category,
            role: user.role,
          },
        },
      }),
      this.prisma.documentShare.findFirst({
        where: {
          documentId,
          sharedWithId: userId,
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
        select: { canEdit: true, canDownload: true },
      }),
    ]);

    let effective = this.none();
    let hasNonShareView = false;

    const rolePermission = document.permissions.find((p) => p.role === user.role);
    if (rolePermission) {
      hasNonShareView = hasNonShareView || !!rolePermission.canView;
      effective = this.merge(effective, {
        canView: rolePermission.canView,
        canEdit: rolePermission.canEdit,
        canDelete: rolePermission.canDelete,
        canShare: rolePermission.canShare,
        canSign: (rolePermission as any).canSign,
      });
    }

    if (userPermission) {
      const isExpired = userPermission.expiresAt && userPermission.expiresAt.getTime() <= now.getTime();
      if (!isExpired) {
        hasNonShareView = hasNonShareView || !!userPermission.canView;
        effective = this.merge(effective, {
          canView: userPermission.canView,
          canEdit: userPermission.canEdit,
          canDelete: userPermission.canDelete,
          canShare: userPermission.canShare,
          canSign: userPermission.canSign,
        });
      }
    }

    if (departmentPermission) {
      hasNonShareView = hasNonShareView || !!departmentPermission.canView;
      effective = this.merge(effective, {
        canView: departmentPermission.canView,
        canEdit: departmentPermission.canEdit,
        canDelete: departmentPermission.canDelete,
        canShare: departmentPermission.canShare,
        canSign: departmentPermission.canSign,
      });
    }

    if (categoryPermission) {
      hasNonShareView = hasNonShareView || !!categoryPermission.canView;
      effective = this.merge(effective, {
        canView: categoryPermission.canView,
        canEdit: categoryPermission.canEdit,
        canDelete: categoryPermission.canDelete,
        canShare: categoryPermission.canShare,
        canSign: categoryPermission.canSign,
      });
    }

    if (share) {
      effective = this.merge(effective, {
        canView: true,
        canDownload: share.canDownload,
        canEdit: share.canEdit,
      });
    }

    if (effective.canView && hasNonShareView) {
      effective.canDownload = true;
    }

    return effective;
  }

  async assertHasPermission(documentId: string, userId: string, permission: DocumentPermissionKey) {
    const perms = await this.getEffectivePermissions(documentId, userId);

    const allowed =
      (permission === 'view' && perms.canView) ||
      (permission === 'edit' && perms.canEdit) ||
      (permission === 'delete' && perms.canDelete) ||
      (permission === 'share' && perms.canShare) ||
      (permission === 'sign' && perms.canSign) ||
      (permission === 'download' && perms.canDownload);

    if (!allowed) {
      throw new ForbiddenException('You do not have permission to perform this action');
    }
  }

  async getDocumentPermissions(documentId: string, userId: string) {
    await this.assertHasPermission(documentId, userId, 'view');

    const [roles, users, departments] = await Promise.all([
      this.prisma.documentPermission.findMany({ where: { documentId }, orderBy: { role: 'asc' } }),
      this.prismaAny().documentUserPermission.findMany({
        where: { documentId },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, role: true, department: true } },
          grantedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prismaAny().documentDepartmentPermission.findMany({ where: { documentId }, orderBy: { department: 'asc' } }),
    ]);

    return {
      roles,
      users,
      departments,
    };
  }

  private normalizeReason(reason?: unknown): string | undefined {
    if (typeof reason !== 'string') return undefined;
    const trimmed = reason.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  async grantUserPermission(params: {
    documentId: string;
    targetUserId: string;
    permissions: PermissionFlags;
    grantedById: string;
    expiresAt?: Date;
    reason?: string;
    ipAddress: string;
  }) {
    const { documentId, targetUserId, permissions, grantedById, expiresAt, ipAddress } = params;

    await this.assertHasPermission(documentId, grantedById, 'share');

    const existing = await this.prismaAny().documentUserPermission.findUnique({
      where: { documentId_userId: { documentId, userId: targetUserId } },
    });

    const updated = await this.prismaAny().documentUserPermission.upsert({
      where: { documentId_userId: { documentId, userId: targetUserId } },
      create: {
        documentId,
        userId: targetUserId,
        canView: permissions.canView ?? true,
        canEdit: permissions.canEdit ?? false,
        canDelete: permissions.canDelete ?? false,
        canShare: permissions.canShare ?? false,
        canSign: permissions.canSign ?? false,
        grantedById,
        expiresAt,
      },
      update: {
        canView: permissions.canView ?? undefined,
        canEdit: permissions.canEdit ?? undefined,
        canDelete: permissions.canDelete ?? undefined,
        canShare: permissions.canShare ?? undefined,
        canSign: permissions.canSign ?? undefined,
        expiresAt,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, role: true, department: true } },
        grantedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    await this.logPermissionChange({
      action: existing ? PermissionAction.MODIFY : PermissionAction.GRANT,
      documentId,
      performedById: grantedById,
      targetUserId,
      oldPermissions: existing
        ? {
            canView: existing.canView,
            canEdit: existing.canEdit,
            canDelete: existing.canDelete,
            canShare: existing.canShare,
            canSign: existing.canSign,
            expiresAt: existing.expiresAt,
          }
        : null,
      newPermissions: {
        canView: updated.canView,
        canEdit: updated.canEdit,
        canDelete: updated.canDelete,
        canShare: updated.canShare,
        canSign: updated.canSign,
        expiresAt: updated.expiresAt,
      },
      reason: this.normalizeReason(params.reason),
      ipAddress,
    });

    return updated;
  }

  async revokeUserPermission(params: {
    documentId: string;
    targetUserId: string;
    performedById: string;
    reason?: string;
    ipAddress: string;
  }) {
    const { documentId, targetUserId, performedById, ipAddress } = params;

    await this.assertHasPermission(documentId, performedById, 'share');

    const existing = await this.prismaAny().documentUserPermission.findUnique({
      where: { documentId_userId: { documentId, userId: targetUserId } },
    });

    if (!existing) {
      throw new NotFoundException('User permission not found');
    }

    await this.prismaAny().documentUserPermission.delete({
      where: { documentId_userId: { documentId, userId: targetUserId } },
    });

    await this.logPermissionChange({
      action: PermissionAction.REVOKE,
      documentId,
      performedById,
      targetUserId,
      oldPermissions: {
        canView: existing.canView,
        canEdit: existing.canEdit,
        canDelete: existing.canDelete,
        canShare: existing.canShare,
        canSign: existing.canSign,
        expiresAt: existing.expiresAt,
      },
      newPermissions: { revoked: true },
      reason: this.normalizeReason(params.reason),
      ipAddress,
    });

    return { success: true };
  }

  async grantRolePermission(params: {
    documentId: string;
    role: UserRole;
    permissions: PermissionFlags;
    performedById: string;
    reason?: string;
    ipAddress: string;
  }) {
    const { documentId, role, permissions, performedById, ipAddress } = params;

    await this.assertHasPermission(documentId, performedById, 'share');

    const existing = await this.prisma.documentPermission.findUnique({
      where: { documentId_role: { documentId, role } },
    });

    const updated = await this.prismaAny().documentPermission.upsert({
      where: { documentId_role: { documentId, role } },
      create: {
        documentId,
        role,
        canView: permissions.canView ?? false,
        canEdit: permissions.canEdit ?? false,
        canDelete: permissions.canDelete ?? false,
        canShare: permissions.canShare ?? false,
        canSign: permissions.canSign ?? false,
      },
      update: {
        canView: permissions.canView ?? undefined,
        canEdit: permissions.canEdit ?? undefined,
        canDelete: permissions.canDelete ?? undefined,
        canShare: permissions.canShare ?? undefined,
        canSign: permissions.canSign ?? undefined,
      },
    });

    await this.logPermissionChange({
      action: existing ? PermissionAction.MODIFY : PermissionAction.GRANT,
      documentId,
      performedById,
      targetRole: role,
      oldPermissions: existing
        ? {
            canView: existing.canView,
            canEdit: existing.canEdit,
            canDelete: existing.canDelete,
            canShare: existing.canShare,
            canSign: (existing as any).canSign,
          }
        : null,
      newPermissions: {
        canView: updated.canView,
        canEdit: updated.canEdit,
        canDelete: updated.canDelete,
        canShare: updated.canShare,
        canSign: (updated as any).canSign,
      },
      reason: this.normalizeReason(params.reason),
      ipAddress,
    });

    return updated;
  }

  async revokeRolePermission(params: {
    documentId: string;
    role: UserRole;
    performedById: string;
    reason?: string;
    ipAddress: string;
  }) {
    const { documentId, role, performedById, ipAddress } = params;

    await this.assertHasPermission(documentId, performedById, 'share');

    const existing = await this.prisma.documentPermission.findUnique({
      where: { documentId_role: { documentId, role } },
    });

    if (!existing) {
      throw new NotFoundException('Role permission not found');
    }

    await this.prismaAny().documentPermission.delete({
      where: { documentId_role: { documentId, role } },
    });

    await this.logPermissionChange({
      action: PermissionAction.REVOKE,
      documentId,
      performedById,
      targetRole: role,
      oldPermissions: {
        canView: existing.canView,
        canEdit: existing.canEdit,
        canDelete: existing.canDelete,
        canShare: existing.canShare,
        canSign: (existing as any).canSign,
      },
      newPermissions: { revoked: true },
      reason: this.normalizeReason(params.reason),
      ipAddress,
    });

    return { success: true };
  }

  async grantDepartmentPermission(params: {
    documentId: string;
    department: string;
    permissions: PermissionFlags;
    performedById: string;
    reason?: string;
    ipAddress: string;
  }) {
    const { documentId, department, permissions, performedById, ipAddress } = params;

    const normalizedDepartment = (department || '').trim();
    if (!normalizedDepartment) {
      throw new BadRequestException('department is required');
    }

    await this.assertHasPermission(documentId, performedById, 'share');

    const existing = await this.prismaAny().documentDepartmentPermission.findUnique({
      where: { documentId_department: { documentId, department: normalizedDepartment } },
    });

    const updated = await this.prismaAny().documentDepartmentPermission.upsert({
      where: { documentId_department: { documentId, department: normalizedDepartment } },
      create: {
        documentId,
        department: normalizedDepartment,
        canView: permissions.canView ?? true,
        canEdit: permissions.canEdit ?? false,
        canDelete: permissions.canDelete ?? false,
        canShare: permissions.canShare ?? false,
        canSign: permissions.canSign ?? false,
      },
      update: {
        canView: permissions.canView ?? undefined,
        canEdit: permissions.canEdit ?? undefined,
        canDelete: permissions.canDelete ?? undefined,
        canShare: permissions.canShare ?? undefined,
        canSign: permissions.canSign ?? undefined,
      },
    });

    await this.logPermissionChange({
      action: existing ? PermissionAction.MODIFY : PermissionAction.GRANT,
      documentId,
      performedById,
      targetDepartment: normalizedDepartment,
      oldPermissions: existing
        ? {
            canView: existing.canView,
            canEdit: existing.canEdit,
            canDelete: existing.canDelete,
            canShare: existing.canShare,
            canSign: existing.canSign,
          }
        : null,
      newPermissions: {
        canView: updated.canView,
        canEdit: updated.canEdit,
        canDelete: updated.canDelete,
        canShare: updated.canShare,
        canSign: updated.canSign,
      },
      reason: this.normalizeReason(params.reason),
      ipAddress,
    });

    return updated;
  }

  async revokeDepartmentPermission(params: {
    documentId: string;
    department: string;
    performedById: string;
    reason?: string;
    ipAddress: string;
  }) {
    const { documentId, department, performedById, ipAddress } = params;

    const normalizedDepartment = (department || '').trim();
    if (!normalizedDepartment) {
      throw new BadRequestException('department is required');
    }

    await this.assertHasPermission(documentId, performedById, 'share');

    const existing = await this.prismaAny().documentDepartmentPermission.findUnique({
      where: { documentId_department: { documentId, department: normalizedDepartment } },
    });

    if (!existing) {
      throw new NotFoundException('Department permission not found');
    }

    await this.prismaAny().documentDepartmentPermission.delete({
      where: { documentId_department: { documentId, department: normalizedDepartment } },
    });

    await this.logPermissionChange({
      action: PermissionAction.REVOKE,
      documentId,
      performedById,
      targetDepartment: normalizedDepartment,
      oldPermissions: {
        canView: existing.canView,
        canEdit: existing.canEdit,
        canDelete: existing.canDelete,
        canShare: existing.canShare,
        canSign: existing.canSign,
      },
      newPermissions: { revoked: true },
      reason: this.normalizeReason(params.reason),
      ipAddress,
    });

    return { success: true };
  }

  async listCategoryPermissions() {
    return this.prismaAny().documentCategoryPermission.findMany({
      include: {
        setBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: [{ category: 'asc' }, { role: 'asc' }],
    });
  }

  async setCategoryPermission(params: {
    category: DocumentCategory;
    role: UserRole;
    permissions: PermissionFlags;
    setById: string;
    reason?: string;
    ipAddress: string;
  }) {
    const { category, role, permissions, setById, ipAddress } = params;

    const existing = await this.prismaAny().documentCategoryPermission.findUnique({
      where: { category_role: { category, role } },
    });

    const updated = await this.prismaAny().documentCategoryPermission.upsert({
      where: { category_role: { category, role } },
      create: {
        category,
        role,
        canView: permissions.canView ?? false,
        canEdit: permissions.canEdit ?? false,
        canDelete: permissions.canDelete ?? false,
        canShare: permissions.canShare ?? false,
        canSign: permissions.canSign ?? false,
        canUpload: permissions.canUpload ?? false,
        setById,
      },
      update: {
        canView: permissions.canView ?? undefined,
        canEdit: permissions.canEdit ?? undefined,
        canDelete: permissions.canDelete ?? undefined,
        canShare: permissions.canShare ?? undefined,
        canSign: permissions.canSign ?? undefined,
        canUpload: permissions.canUpload ?? undefined,
        setById,
      },
      include: {
        setBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    await this.prismaAny().documentPermissionLog.create({
      data: {
        category,
        action: existing ? PermissionAction.MODIFY : PermissionAction.GRANT,
        performedById: setById,
        targetRole: role,
        oldPermissions: existing,
        newPermissions: {
          canView: updated.canView,
          canEdit: updated.canEdit,
          canDelete: updated.canDelete,
          canShare: updated.canShare,
          canSign: updated.canSign,
          canUpload: updated.canUpload,
        },
        reason: this.normalizeReason(params.reason),
        ipAddress,
      },
    });

    return updated;
  }

  async deleteCategoryPermission(params: { id: string; performedById: string; ipAddress: string; reason?: string }) {
    const existing = await this.prismaAny().documentCategoryPermission.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      throw new NotFoundException('Category permission not found');
    }

    await this.prismaAny().documentCategoryPermission.delete({ where: { id: params.id } });

    await this.prismaAny().documentPermissionLog.create({
      data: {
        category: existing.category,
        action: PermissionAction.REVOKE,
        performedById: params.performedById,
        targetRole: existing.role,
        oldPermissions: existing,
        newPermissions: { revoked: true },
        reason: this.normalizeReason(params.reason),
        ipAddress: params.ipAddress,
      },
    });

    return { success: true };
  }

  async listTemplates() {
    return this.prismaAny().documentPermissionTemplate.findMany({
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createTemplate(params: {
    name: string;
    description?: string;
    category?: DocumentCategory;
    module?: string;
    roles: any;
    departments?: any;
    isDefault?: boolean;
    createdById: string;
  }) {
    const name = (params.name || '').trim();
    if (!name) {
      throw new BadRequestException('name is required');
    }

    return this.prismaAny().documentPermissionTemplate.create({
      data: {
        name,
        description: params.description,
        category: params.category,
        module: params.module,
        roles: params.roles,
        departments: params.departments,
        isDefault: params.isDefault ?? false,
        createdById: params.createdById,
      },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }

  async updateTemplate(id: string, params: {
    name?: string;
    description?: string;
    category?: DocumentCategory | null;
    module?: string | null;
    roles?: any;
    departments?: any;
    isDefault?: boolean;
  }) {
    const existing = await this.prismaAny().documentPermissionTemplate.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Template not found');
    }

    const name = params.name !== undefined ? params.name.trim() : undefined;

    return this.prismaAny().documentPermissionTemplate.update({
      where: { id },
      data: {
        name,
        description: params.description,
        category: params.category === undefined ? undefined : params.category,
        module: params.module === undefined ? undefined : params.module,
        roles: params.roles,
        departments: params.departments,
        isDefault: params.isDefault,
      },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }

  async deleteTemplate(id: string) {
    const existing = await this.prismaAny().documentPermissionTemplate.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Template not found');
    }

    await this.prismaAny().documentPermissionTemplate.delete({ where: { id } });
    return { success: true };
  }

  async applyTemplateToDocument(params: {
    documentId: string;
    templateId: string;
    performedById: string;
    reason?: string;
    ipAddress: string;
  }) {
    const { documentId, templateId, performedById, ipAddress } = params;

    await this.assertHasPermission(documentId, performedById, 'share');

    const [template, document] = await Promise.all([
      this.prismaAny().documentPermissionTemplate.findUnique({ where: { id: templateId } }),
      this.prisma.document.findUnique({ where: { id: documentId }, select: { id: true, category: true, module: true } }),
    ]);

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const roleEntries = Array.isArray(template.roles) ? template.roles : [];
    const departmentEntries = Array.isArray(template.departments) ? template.departments : [];

    const oldRolePermissions = await this.prisma.documentPermission.findMany({ where: { documentId } });
    const oldDeptPermissions = await this.prismaAny().documentDepartmentPermission.findMany({ where: { documentId } });

    await this.prisma.$transaction(async (tx) => {
      await (tx as any).documentPermission.deleteMany({ where: { documentId } });
      await (tx as any).documentDepartmentPermission.deleteMany({ where: { documentId } });

      for (const entry of roleEntries) {
        if (!entry || !entry.role || !entry.permissions) continue;
        await (tx as any).documentPermission.create({
          data: {
            documentId,
            role: entry.role,
            canView: !!entry.permissions.canView,
            canEdit: !!entry.permissions.canEdit,
            canDelete: !!entry.permissions.canDelete,
            canShare: !!entry.permissions.canShare,
            canSign: !!entry.permissions.canSign,
          },
        });
      }

      for (const entry of departmentEntries) {
        if (!entry || !entry.department || !entry.permissions) continue;
        await (tx as any).documentDepartmentPermission.create({
          data: {
            documentId,
            department: String(entry.department),
            canView: entry.permissions.canView !== undefined ? !!entry.permissions.canView : true,
            canEdit: !!entry.permissions.canEdit,
            canDelete: !!entry.permissions.canDelete,
            canShare: !!entry.permissions.canShare,
            canSign: !!entry.permissions.canSign,
          },
        });
      }

      await (tx as any).documentPermissionLog.create({
        data: {
          documentId,
          action: PermissionAction.TEMPLATE_APPLIED,
          performedById,
          oldPermissions: {
            roles: oldRolePermissions,
            departments: oldDeptPermissions,
          },
          newPermissions: {
            templateId,
            roles: roleEntries,
            departments: departmentEntries,
          },
          reason: this.normalizeReason(params.reason),
          ipAddress,
        },
      });
    });

    return { success: true };
  }

  async bulkGrantUser(params: {
    documentIds: string[];
    targetUserId: string;
    permissions: PermissionFlags;
    performedById: string;
    expiresAt?: Date;
    reason?: string;
    ipAddress: string;
  }) {
    if (!Array.isArray(params.documentIds) || params.documentIds.length === 0) {
      throw new BadRequestException('documentIds is required');
    }

    const results: any[] = [];

    for (const documentId of params.documentIds) {
      try {
        const granted = await this.grantUserPermission({
          documentId,
          targetUserId: params.targetUserId,
          permissions: params.permissions,
          grantedById: params.performedById,
          expiresAt: params.expiresAt,
          reason: params.reason,
          ipAddress: params.ipAddress,
        });
        results.push({ documentId, success: true, granted });
      } catch (error: any) {
        results.push({ documentId, success: false, error: error?.message || 'Failed' });
      }
    }

    await this.prismaAny().documentPermissionLog.create({
      data: {
        action: PermissionAction.BULK_UPDATE,
        performedById: params.performedById,
        targetUserId: params.targetUserId,
        newPermissions: {
          documentIds: params.documentIds,
          permissions: params.permissions,
          expiresAt: params.expiresAt,
        },
        reason: this.normalizeReason(params.reason),
        ipAddress: params.ipAddress,
      },
    });

    return { success: true, results };
  }

  async bulkRevokeUser(params: {
    documentIds: string[];
    targetUserId: string;
    performedById: string;
    reason?: string;
    ipAddress: string;
  }) {
    if (!Array.isArray(params.documentIds) || params.documentIds.length === 0) {
      throw new BadRequestException('documentIds is required');
    }

    const results: any[] = [];

    for (const documentId of params.documentIds) {
      try {
        const revoked = await this.revokeUserPermission({
          documentId,
          targetUserId: params.targetUserId,
          performedById: params.performedById,
          reason: params.reason,
          ipAddress: params.ipAddress,
        });
        results.push({ documentId, success: true, revoked });
      } catch (error: any) {
        results.push({ documentId, success: false, error: error?.message || 'Failed' });
      }
    }

    await this.prismaAny().documentPermissionLog.create({
      data: {
        action: PermissionAction.BULK_UPDATE,
        performedById: params.performedById,
        targetUserId: params.targetUserId,
        newPermissions: {
          documentIds: params.documentIds,
          revoked: true,
        },
        reason: this.normalizeReason(params.reason),
        ipAddress: params.ipAddress,
      },
    });

    return { success: true, results };
  }

  async getPermissionHistory(documentId: string, userId: string) {
    await this.assertHasPermission(documentId, userId, 'view');

    return this.prismaAny().documentPermissionLog.findMany({
      where: { documentId },
      include: {
        performedBy: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
        targetUser: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAuditLog(params: { performedById?: string; userId: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: params.userId }, select: { role: true } });
    if (!user) throw new NotFoundException('User not found');

    const allowedRoles: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.CEO, UserRole.CFO, UserRole.IT_MANAGER];
    if (!allowedRoles.includes(user.role)) {
      throw new ForbiddenException('Not authorized');
    }

    return this.prismaAny().documentPermissionLog.findMany({
      where: params.performedById ? { performedById: params.performedById } : undefined,
      include: {
        performedBy: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
        targetUser: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
        document: { select: { id: true, originalName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
  }

  private async logPermissionChange(params: {
    action: PermissionAction;
    documentId?: string;
    category?: DocumentCategory;
    performedById: string;
    targetUserId?: string;
    targetRole?: UserRole;
    targetDepartment?: string;
    oldPermissions: any;
    newPermissions: any;
    reason?: string;
    ipAddress: string;
  }) {
    await this.prismaAny().documentPermissionLog.create({
      data: {
        documentId: params.documentId,
        category: params.category,
        action: params.action,
        performedById: params.performedById,
        targetUserId: params.targetUserId,
        targetRole: params.targetRole,
        targetDepartment: params.targetDepartment,
        oldPermissions: params.oldPermissions ?? undefined,
        newPermissions: params.newPermissions,
        reason: params.reason,
        ipAddress: params.ipAddress,
      },
    });
  }
}

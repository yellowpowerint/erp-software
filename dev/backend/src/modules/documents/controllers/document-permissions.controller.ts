import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import {
  DocumentPermissionsService,
  DocumentPermissionKey,
  PermissionFlags,
} from "../services/document-permissions.service";
import { DocumentCategory, UserRole } from "@prisma/client";

@Controller("documents")
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentPermissionsController {
  constructor(
    private readonly permissionsService: DocumentPermissionsService,
  ) {}

  private static readonly adminRoles: UserRole[] = [
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.IT_MANAGER,
  ];

  @Get(":id/permissions")
  async getDocumentPermissions(
    @Param("id") documentId: string,
    @Request() req: any,
  ) {
    const data = await this.permissionsService.getDocumentPermissions(
      documentId,
      req.user.userId,
    );
    return { success: true, data };
  }

  @Post(":id/permissions/user")
  async grantUser(
    @Param("id") documentId: string,
    @Body()
    body: {
      userId: string;
      permissions: PermissionFlags;
      expiresAt?: string;
      reason?: string;
    },
    @Request() req: any,
  ) {
    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : undefined;

    const result = await this.permissionsService.grantUserPermission({
      documentId,
      targetUserId: body.userId,
      permissions: body.permissions || {},
      grantedById: req.user.userId,
      expiresAt,
      reason: body.reason,
      ipAddress: req.ip || req.connection?.remoteAddress || "unknown",
    });

    return { success: true, data: result };
  }

  @Put(":id/permissions/user/:userId")
  async updateUser(
    @Param("id") documentId: string,
    @Param("userId") userId: string,
    @Body()
    body: { permissions: PermissionFlags; expiresAt?: string; reason?: string },
    @Request() req: any,
  ) {
    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : undefined;

    const result = await this.permissionsService.grantUserPermission({
      documentId,
      targetUserId: userId,
      permissions: body.permissions || {},
      grantedById: req.user.userId,
      expiresAt,
      reason: body.reason,
      ipAddress: req.ip || req.connection?.remoteAddress || "unknown",
    });

    return { success: true, data: result };
  }

  @Delete(":id/permissions/user/:userId")
  async revokeUser(
    @Param("id") documentId: string,
    @Param("userId") userId: string,
    @Body() body: { reason?: string },
    @Request() req: any,
  ) {
    const result = await this.permissionsService.revokeUserPermission({
      documentId,
      targetUserId: userId,
      performedById: req.user.userId,
      reason: body?.reason,
      ipAddress: req.ip || req.connection?.remoteAddress || "unknown",
    });

    return { success: true, data: result };
  }

  @Post(":id/permissions/role")
  async grantRole(
    @Param("id") documentId: string,
    @Body()
    body: { role: UserRole; permissions: PermissionFlags; reason?: string },
    @Request() req: any,
  ) {
    const result = await this.permissionsService.grantRolePermission({
      documentId,
      role: body.role,
      permissions: body.permissions || {},
      performedById: req.user.userId,
      reason: body.reason,
      ipAddress: req.ip || req.connection?.remoteAddress || "unknown",
    });

    return { success: true, data: result };
  }

  @Delete(":id/permissions/role/:role")
  async revokeRole(
    @Param("id") documentId: string,
    @Param("role") role: UserRole,
    @Body() body: { reason?: string },
    @Request() req: any,
  ) {
    const result = await this.permissionsService.revokeRolePermission({
      documentId,
      role,
      performedById: req.user.userId,
      reason: body?.reason,
      ipAddress: req.ip || req.connection?.remoteAddress || "unknown",
    });

    return { success: true, data: result };
  }

  @Post(":id/permissions/department")
  async grantDepartment(
    @Param("id") documentId: string,
    @Body()
    body: { department: string; permissions: PermissionFlags; reason?: string },
    @Request() req: any,
  ) {
    const result = await this.permissionsService.grantDepartmentPermission({
      documentId,
      department: body.department,
      permissions: body.permissions || {},
      performedById: req.user.userId,
      reason: body.reason,
      ipAddress: req.ip || req.connection?.remoteAddress || "unknown",
    });

    return { success: true, data: result };
  }

  @Delete(":id/permissions/department/:department")
  async revokeDepartment(
    @Param("id") documentId: string,
    @Param("department") department: string,
    @Body() body: { reason?: string },
    @Request() req: any,
  ) {
    const result = await this.permissionsService.revokeDepartmentPermission({
      documentId,
      department,
      performedById: req.user.userId,
      reason: body?.reason,
      ipAddress: req.ip || req.connection?.remoteAddress || "unknown",
    });

    return { success: true, data: result };
  }

  @Get("permissions/categories")
  @Roles(...DocumentPermissionsController.adminRoles)
  async listCategoryPermissions() {
    const data = await this.permissionsService.listCategoryPermissions();
    return { success: true, data };
  }

  @Post("permissions/categories")
  @Roles(...DocumentPermissionsController.adminRoles)
  async setCategoryPermission(
    @Body()
    body: {
      category: DocumentCategory;
      role: UserRole;
      permissions: PermissionFlags;
      reason?: string;
    },
    @Request() req: any,
  ) {
    const data = await this.permissionsService.setCategoryPermission({
      category: body.category,
      role: body.role,
      permissions: body.permissions || {},
      setById: req.user.userId,
      reason: body.reason,
      ipAddress: req.ip || req.connection?.remoteAddress || "unknown",
    });

    return { success: true, data };
  }

  @Put("permissions/categories/:id")
  @Roles(...DocumentPermissionsController.adminRoles)
  async updateCategoryPermission(
    @Param("id") id: string,
    @Body() body: { permissions: PermissionFlags; reason?: string },
    @Request() req: any,
  ) {
    const existing = await this.permissionsService.listCategoryPermissions();
    const current = existing.find((p) => p.id === id);
    if (!current) {
      return { success: false, message: "Category permission not found" };
    }

    const data = await this.permissionsService.setCategoryPermission({
      category: current.category,
      role: current.role,
      permissions: body.permissions || {},
      setById: req.user.userId,
      reason: body.reason,
      ipAddress: req.ip || req.connection?.remoteAddress || "unknown",
    });

    return { success: true, data };
  }

  @Delete("permissions/categories/:id")
  @Roles(...DocumentPermissionsController.adminRoles)
  async deleteCategoryPermission(
    @Param("id") id: string,
    @Body() body: { reason?: string },
    @Request() req: any,
  ) {
    const data = await this.permissionsService.deleteCategoryPermission({
      id,
      performedById: req.user.userId,
      ipAddress: req.ip || req.connection?.remoteAddress || "unknown",
      reason: body?.reason,
    });

    return { success: true, data };
  }

  @Get("permissions/templates")
  @Roles(...DocumentPermissionsController.adminRoles)
  async listTemplates() {
    const data = await this.permissionsService.listTemplates();
    return { success: true, data };
  }

  @Post("permissions/templates")
  @Roles(...DocumentPermissionsController.adminRoles)
  async createTemplate(
    @Body()
    body: {
      name: string;
      description?: string;
      category?: DocumentCategory;
      module?: string;
      roles: any;
      departments?: any;
      isDefault?: boolean;
    },
    @Request() req: any,
  ) {
    const data = await this.permissionsService.createTemplate({
      ...body,
      createdById: req.user.userId,
    });

    return { success: true, data };
  }

  @Put("permissions/templates/:id")
  @Roles(...DocumentPermissionsController.adminRoles)
  async updateTemplate(@Param("id") id: string, @Body() body: any) {
    const data = await this.permissionsService.updateTemplate(id, body);
    return { success: true, data };
  }

  @Delete("permissions/templates/:id")
  @Roles(...DocumentPermissionsController.adminRoles)
  async deleteTemplate(@Param("id") id: string) {
    const data = await this.permissionsService.deleteTemplate(id);
    return { success: true, data };
  }

  @Post(":id/permissions/apply-template/:templateId")
  async applyTemplate(
    @Param("id") documentId: string,
    @Param("templateId") templateId: string,
    @Body() body: { reason?: string },
    @Request() req: any,
  ) {
    const data = await this.permissionsService.applyTemplateToDocument({
      documentId,
      templateId,
      performedById: req.user.userId,
      reason: body?.reason,
      ipAddress: req.ip || req.connection?.remoteAddress || "unknown",
    });

    return { success: true, data };
  }

  @Post("permissions/bulk-grant")
  @Roles(...DocumentPermissionsController.adminRoles)
  async bulkGrant(
    @Body()
    body: {
      documentIds: string[];
      userId: string;
      permissions: PermissionFlags;
      expiresAt?: string;
      reason?: string;
    },
    @Request() req: any,
  ) {
    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : undefined;

    const data = await this.permissionsService.bulkGrantUser({
      documentIds: body.documentIds,
      targetUserId: body.userId,
      permissions: body.permissions || {},
      performedById: req.user.userId,
      expiresAt,
      reason: body.reason,
      ipAddress: req.ip || req.connection?.remoteAddress || "unknown",
    });

    return { success: true, data };
  }

  @Post("permissions/bulk-revoke")
  @Roles(...DocumentPermissionsController.adminRoles)
  async bulkRevoke(
    @Body() body: { documentIds: string[]; userId: string; reason?: string },
    @Request() req: any,
  ) {
    const data = await this.permissionsService.bulkRevokeUser({
      documentIds: body.documentIds,
      targetUserId: body.userId,
      performedById: req.user.userId,
      reason: body.reason,
      ipAddress: req.ip || req.connection?.remoteAddress || "unknown",
    });

    return { success: true, data };
  }

  @Get(":id/my-permissions")
  async myPermissions(@Param("id") documentId: string, @Request() req: any) {
    const data = await this.permissionsService.getEffectivePermissions(
      documentId,
      req.user.userId,
    );
    return { success: true, data };
  }

  @Post(":id/check-permission")
  async checkPermission(
    @Param("id") documentId: string,
    @Body() body: { permission: DocumentPermissionKey },
    @Request() req: any,
  ) {
    const perms = await this.permissionsService.getEffectivePermissions(
      documentId,
      req.user.userId,
    );

    const allowed =
      (body.permission === "view" && perms.canView) ||
      (body.permission === "edit" && perms.canEdit) ||
      (body.permission === "delete" && perms.canDelete) ||
      (body.permission === "share" && perms.canShare) ||
      (body.permission === "sign" && perms.canSign) ||
      (body.permission === "download" && perms.canDownload);

    return { success: true, data: { allowed, permissions: perms } };
  }

  @Get(":id/permission-history")
  async permissionHistory(
    @Param("id") documentId: string,
    @Request() req: any,
  ) {
    const data = await this.permissionsService.getPermissionHistory(
      documentId,
      req.user.userId,
    );
    return { success: true, data };
  }

  @Get("permissions/audit-log")
  @Roles(...DocumentPermissionsController.adminRoles)
  async auditLog(@Request() req: any) {
    const data = await this.permissionsService.getAuditLog({
      userId: req.user.userId,
    });
    return { success: true, data };
  }
}

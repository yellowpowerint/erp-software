import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Request,
  Res,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { Response } from "express";
import { UserRole } from "@prisma/client";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { CsvService } from "./csv.service";
import { CsvAuditService } from "./csv-audit.service";
import { BatchImportService } from "./batch-import.service";
import { MigrationService } from "./migration.service";
import { ScheduledExportService } from "./scheduled-export.service";
import { PrismaService } from "../../common/prisma/prisma.service";

@Controller("csv")
@UseGuards(JwtAuthGuard, RolesGuard)
export class CsvController {
  constructor(
    private readonly csvService: CsvService,
    private readonly csvAuditService: CsvAuditService,
    private readonly batchImportService: BatchImportService,
    private readonly migrationService: MigrationService,
    private readonly scheduledExportService: ScheduledExportService,
    private readonly prisma: PrismaService,
  ) {}

  @Post("upload")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.DEPARTMENT_HEAD,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.IT_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.SAFETY_OFFICER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.EMPLOYEE,
  )
  @UseInterceptors(FileInterceptor("file"))
  async uploadForValidation(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { module?: string },
  ) {
    if (!file) {
      throw new BadRequestException("file is required");
    }

    return this.csvService.uploadForValidation(file, body.module);
  }

  @Post("import/:module")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.DEPARTMENT_HEAD,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.IT_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.SAFETY_OFFICER,
    UserRole.WAREHOUSE_MANAGER,
  )
  @UseInterceptors(FileInterceptor("file"))
  async startImport(
    @Param("module") module: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { mappings?: string; context?: string },
    @Request() req: any,
  ) {
    if (!file) {
      throw new BadRequestException("file is required");
    }

    const mappings = body.mappings
      ? this.csvService.parseJson(body.mappings, "mappings")
      : undefined;
    const context = body.context
      ? this.csvService.parseJson(body.context, "context")
      : undefined;
    const job = await this.csvService.createImportJob(
      module,
      file,
      req.user.userId,
      mappings,
      context,
    );
    return { success: true, data: job };
  }

  @Get("import/:jobId")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.DEPARTMENT_HEAD,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.IT_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.SAFETY_OFFICER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.EMPLOYEE,
  )
  async getImportJob(@Param("jobId") jobId: string, @Request() req: any) {
    const job = await this.csvService.getImportJob(jobId, req.user.userId);
    return { success: true, data: job };
  }

  @Get("import/:jobId/errors")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.DEPARTMENT_HEAD,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.IT_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.SAFETY_OFFICER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.EMPLOYEE,
  )
  async getImportErrors(@Param("jobId") jobId: string, @Request() req: any) {
    const errors = await this.csvService.getImportJobErrors(
      jobId,
      req.user.userId,
    );
    return { success: true, data: errors };
  }

  @Post("import/:jobId/cancel")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.DEPARTMENT_HEAD,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.IT_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.SAFETY_OFFICER,
    UserRole.WAREHOUSE_MANAGER,
  )
  async cancelImport(@Param("jobId") jobId: string, @Request() req: any) {
    const result = await this.csvService.cancelImportJob(
      jobId,
      req.user.userId,
    );
    return { success: true, data: result };
  }

  @Post("export/:module")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.DEPARTMENT_HEAD,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.IT_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.SAFETY_OFFICER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.EMPLOYEE,
  )
  async startExport(
    @Param("module") module: string,
    @Body()
    body: {
      filters?: any;
      columns: string[];
      fileName?: string;
      context?: any;
    },
    @Request() req: any,
  ) {
    const job = await this.csvService.createExportJob(
      module,
      body.filters || {},
      body.columns,
      req.user.userId,
      body.fileName,
      body.context,
    );
    return { success: true, data: job };
  }

  @Get("export/:jobId")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.DEPARTMENT_HEAD,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.IT_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.SAFETY_OFFICER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.EMPLOYEE,
  )
  async getExportJob(@Param("jobId") jobId: string, @Request() req: any) {
    const job = await this.csvService.getExportJob(jobId, req.user.userId);
    return { success: true, data: job };
  }

  @Get("export/:jobId/download")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.DEPARTMENT_HEAD,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.IT_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.SAFETY_OFFICER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.EMPLOYEE,
  )
  async downloadExport(
    @Param("jobId") jobId: string,
    @Request() req: any,
    @Res() res: Response,
  ) {
    const url = await this.csvService.getExportDownloadUrl(
      jobId,
      req.user.userId,
    );
    res.redirect(url);
  }

  @Post("export/:module/preview")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.DEPARTMENT_HEAD,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.IT_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.SAFETY_OFFICER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.EMPLOYEE,
  )
  async previewExport(
    @Param("module") module: string,
    @Body()
    body: { filters?: any; columns: string[]; limit?: number; context?: any },
  ) {
    const result = await this.csvService.previewExport(module, {
      filters: body.filters || {},
      columns: body.columns,
      limit: body.limit,
      context: body.context,
    });
    return { success: true, data: result };
  }

  @Get("templates/:module")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.DEPARTMENT_HEAD,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.IT_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.SAFETY_OFFICER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.EMPLOYEE,
  )
  async getTemplates(@Param("module") module: string) {
    const templates = await this.csvService.getTemplates(module);
    return { success: true, data: templates };
  }

  @Post("templates")
  @Roles(UserRole.SUPER_ADMIN, UserRole.CEO, UserRole.IT_MANAGER)
  async createTemplate(
    @Body()
    body: {
      name: string;
      module: string;
      description?: string;
      columns: any;
      isDefault?: boolean;
    },
    @Request() req: any,
  ) {
    const template = await this.csvService.createTemplate(
      body,
      req.user.userId,
    );
    return { success: true, data: template };
  }

  @Put("templates/:id")
  @Roles(UserRole.SUPER_ADMIN, UserRole.CEO, UserRole.IT_MANAGER)
  async updateTemplate(
    @Param("id") id: string,
    @Body()
    body: {
      name?: string;
      description?: string;
      columns?: any;
      isDefault?: boolean;
    },
    @Request() req: any,
  ) {
    const template = await this.csvService.updateTemplate(
      id,
      body,
      req.user.userId,
    );
    return { success: true, data: template };
  }

  @Delete("templates/:id")
  @Roles(UserRole.SUPER_ADMIN, UserRole.CEO, UserRole.IT_MANAGER)
  async deleteTemplate(@Param("id") id: string, @Request() req: any) {
    const result = await this.csvService.deleteTemplate(id, req.user.userId);
    return { success: true, data: result };
  }

  @Public()
  @Get("templates/:module/sample")
  async downloadSampleTemplate(
    @Param("module") module: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const template = await this.csvService.getSampleTemplate(module);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${module}-sample.csv`,
    );
    res.send(template);
  }

  @Get("history/imports")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.DEPARTMENT_HEAD,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.IT_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.SAFETY_OFFICER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.EMPLOYEE,
  )
  async importHistory(@Request() req: any) {
    const jobs = await this.csvService.listImportHistory(req.user.userId);
    return { success: true, data: jobs };
  }

  @Get("history/exports")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.DEPARTMENT_HEAD,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.IT_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.SAFETY_OFFICER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.EMPLOYEE,
  )
  async exportHistory(@Request() req: any) {
    const jobs = await this.csvService.listExportHistory(req.user.userId);
    return { success: true, data: jobs };
  }

  @Post("batch/import")
  @Roles(UserRole.SUPER_ADMIN, UserRole.CEO, UserRole.IT_MANAGER)
  @UseInterceptors(FilesInterceptor("files"))
  async batchImport(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: { entries?: string },
    @Request() req: any,
  ) {
    if (!files?.length) {
      throw new BadRequestException("files is required");
    }

    const entries = body.entries
      ? this.csvService.parseJson(body.entries, "entries")
      : [];
    if (!Array.isArray(entries) || entries.length !== files.length) {
      throw new BadRequestException(
        "entries must be an array matching files length",
      );
    }

    const batch = await (this.prisma as any).csvBatch.create({
      data: {
        createdById: req.user.userId,
        status: "PENDING",
        totalJobs: files.length,
      },
    });

    const jobs = [] as any[];
    for (let i = 0; i < files.length; i++) {
      const e = entries[i] || {};
      const module = String(e.module || "").trim();
      if (!module) {
        throw new BadRequestException("Each entry must include module");
      }

      const mappings = e.mappings ?? undefined;
      const context = e.context ?? undefined;

      const job = await this.csvService.createImportJob(
        module,
        files[i],
        req.user.userId,
        mappings,
        context,
      );
      const updated = await (this.prisma as any).importJob.update({
        where: { id: job.id },
        data: { batchId: batch.id },
      });
      jobs.push(updated);
    }

    return { success: true, data: { batch, jobs } };
  }

  @Get("batch/:batchId")
  @Roles(UserRole.SUPER_ADMIN, UserRole.CEO, UserRole.IT_MANAGER)
  async getBatch(@Param("batchId") batchId: string, @Request() req: any) {
    const batch = await (this.prisma as any).csvBatch.findUnique({
      where: { id: batchId },
    });
    if (!batch) {
      throw new BadRequestException("Batch not found");
    }

    const adminRoles: UserRole[] = [
      UserRole.SUPER_ADMIN,
      UserRole.CEO,
      UserRole.IT_MANAGER,
    ];

    if (batch.createdById !== req.user.userId) {
      // allow admins to view
      const user = await this.prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { role: true },
      });
      if (!user || !adminRoles.includes(user.role)) {
        throw new BadRequestException("Batch not found");
      }
    }

    const jobs = await (this.prisma as any).importJob.findMany({
      where: { batchId },
      orderBy: { createdAt: "asc" },
    });

    const completedJobs = jobs.filter((j: any) =>
      ["COMPLETED", "FAILED", "CANCELLED"].includes(j.status),
    ).length;
    const failedJobs = jobs.filter((j: any) => j.status === "FAILED").length;

    return {
      success: true,
      data: { ...batch, completedJobs, failedJobs, jobs },
    };
  }

  @Post("schedule")
  @Roles(UserRole.SUPER_ADMIN, UserRole.CEO, UserRole.IT_MANAGER)
  async scheduleImport(
    @Body() body: { jobId: string; scheduledTime: string },
    @Request() req: any,
  ) {
    if (!body?.jobId || !body?.scheduledTime) {
      throw new BadRequestException("jobId and scheduledTime are required");
    }

    const job = await this.csvService.getImportJob(body.jobId, req.user.userId);
    const scheduledAt = new Date(body.scheduledTime);
    if (Number.isNaN(scheduledAt.getTime())) {
      throw new BadRequestException("scheduledTime must be a valid datetime");
    }

    const updated = await this.batchImportService.scheduleImport(
      job.id,
      scheduledAt,
    );
    return { success: true, data: updated };
  }

  @Post("backup/export")
  @Roles(UserRole.SUPER_ADMIN, UserRole.IT_MANAGER)
  async exportBackup() {
    const result = await this.migrationService.exportFullBackup();
    return { success: true, data: result };
  }

  @Post("backup/validate")
  @Roles(UserRole.SUPER_ADMIN, UserRole.IT_MANAGER)
  @UseInterceptors(FileInterceptor("file"))
  async validateBackup(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("file is required");
    }
    const result = await this.migrationService.validateBackupIntegrity(file);
    return { success: true, data: result };
  }

  @Post("backup/import")
  @Roles(UserRole.SUPER_ADMIN, UserRole.IT_MANAGER)
  @UseInterceptors(FileInterceptor("file"))
  async importBackup(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { overwrite?: string },
  ) {
    if (!file) {
      throw new BadRequestException("file is required");
    }
    const overwrite = String(body?.overwrite || "").toLowerCase() === "true";
    const result = await this.migrationService.importFullBackup(file, {
      overwrite,
    });
    return { success: true, data: result };
  }

  @Get("audit/:jobId")
  @Roles(UserRole.SUPER_ADMIN, UserRole.CEO, UserRole.IT_MANAGER)
  async auditTrail(@Param("jobId") jobId: string) {
    const logs = await this.csvAuditService.getAuditTrail(jobId);
    return { success: true, data: logs };
  }

  @Post("rollback/:jobId")
  @Roles(UserRole.SUPER_ADMIN, UserRole.CEO, UserRole.IT_MANAGER)
  async rollback(@Param("jobId") jobId: string, @Request() req: any) {
    const result = await this.csvService.rollbackImport(jobId, req.user.userId);
    return { success: true, data: result };
  }

  @Get("stats")
  @Roles(UserRole.SUPER_ADMIN, UserRole.CEO, UserRole.IT_MANAGER)
  async stats(@Request() req: any) {
    const adminRoles: UserRole[] = [
      UserRole.SUPER_ADMIN,
      UserRole.CEO,
      UserRole.IT_MANAGER,
    ];
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { role: true },
    });
    const isAdmin = !!user && adminRoles.includes(user.role);
    const result = await this.csvAuditService.getStats(
      req.user.userId,
      isAdmin,
    );
    return { success: true, data: result };
  }

  @Post("scheduled-exports")
  @Roles(UserRole.SUPER_ADMIN, UserRole.CEO, UserRole.CFO, UserRole.IT_MANAGER)
  async createScheduledExport(
    @Body()
    body: {
      name: string;
      module: string;
      filters?: any;
      columns: string[];
      context?: any;
      schedule: string;
      recipients: string[];
      format?: string;
      isActive?: boolean;
    },
    @Request() req: any,
  ) {
    const created = await this.scheduledExportService.createScheduledExport(
      body,
      req.user.userId,
    );
    return { success: true, data: created };
  }

  @Get("scheduled-exports")
  @Roles(UserRole.SUPER_ADMIN, UserRole.CEO, UserRole.CFO, UserRole.IT_MANAGER)
  async listScheduledExports(@Request() req: any) {
    const rows = await this.scheduledExportService.listScheduledExports(
      req.user.userId,
    );
    return { success: true, data: rows };
  }

  @Post("scheduled-exports/:id/active")
  @Roles(UserRole.SUPER_ADMIN, UserRole.CEO, UserRole.CFO, UserRole.IT_MANAGER)
  async setScheduledExportActive(
    @Param("id") id: string,
    @Body() body: { isActive: boolean },
    @Request() req: any,
  ) {
    const updated = await this.scheduledExportService.setActive(
      id,
      !!body.isActive,
      req.user.userId,
    );
    return { success: true, data: updated };
  }

  @Get("scheduled-exports/:id/runs")
  @Roles(UserRole.SUPER_ADMIN, UserRole.CEO, UserRole.CFO, UserRole.IT_MANAGER)
  async scheduledExportRuns(@Param("id") id: string, @Request() req: any) {
    const runs = await this.scheduledExportService.getRuns(id, req.user.userId);
    return { success: true, data: runs };
  }
}

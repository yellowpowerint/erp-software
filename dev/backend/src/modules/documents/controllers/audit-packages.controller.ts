import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole } from "@prisma/client";
import { AuditPackagesService } from "../services/audit-packages.service";

@Controller("documents/audit-packages")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditPackagesController {
  constructor(private readonly auditPackagesService: AuditPackagesService) {}

  @Post("jobs")
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
  async startJob(
    @Body() body: { title: string; spec: any },
    @Request() req: any,
  ) {
    const job = await this.auditPackagesService.startJob({
      title: body?.title,
      spec: body?.spec,
      createdById: req.user.userId,
    });

    return { success: true, data: job };
  }

  @Get("jobs")
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
  async listJobs(@Request() req: any) {
    const jobs = await this.auditPackagesService.listJobs(req.user.userId);
    return { success: true, data: jobs };
  }

  @Get("jobs/:jobId")
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
  async getJob(@Param("jobId") jobId: string, @Request() req: any) {
    const job = await this.auditPackagesService.getJob(jobId, req.user.userId);
    return { success: true, data: job };
  }

  @Delete("jobs/:jobId")
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
  async cancelJob(@Param("jobId") jobId: string, @Request() req: any) {
    const result = await this.auditPackagesService.cancelJob(
      jobId,
      req.user.userId,
    );
    return { success: true, data: result };
  }
}

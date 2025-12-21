import { Controller, Post, Get, Delete, Param, UseGuards, Request, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { DocumentFinalizeService, FinalizeJobOptions } from '../services/document-finalize.service';

@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentFinalizeController {
  constructor(private readonly finalizeService: DocumentFinalizeService) {}

  @Post(':id/finalize/jobs')
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
  async start(@Param('id') documentId: string, @Body() body: FinalizeJobOptions, @Request() req: any) {
    const job = await this.finalizeService.startFinalize(documentId, req.user.userId, body);
    return { success: true, data: job };
  }

  @Get('finalize/jobs/:jobId')
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
  async getJob(@Param('jobId') jobId: string, @Request() req: any) {
    const job = await this.finalizeService.getJob(jobId, req.user.userId);
    return { success: true, data: job };
  }

  @Get(':id/finalize-jobs')
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
  async listJobs(@Param('id') documentId: string, @Request() req: any) {
    const jobs = await this.finalizeService.listDocumentJobs(documentId, req.user.userId);
    return { success: true, data: jobs };
  }

  @Delete('finalize/jobs/:jobId')
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
  async cancel(@Param('jobId') jobId: string, @Request() req: any) {
    const result = await this.finalizeService.cancelJob(jobId, req.user.userId);
    return { success: true, data: result };
  }
}

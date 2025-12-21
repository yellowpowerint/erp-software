import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { DocumentConversionService } from '../services/document-conversion.service';

@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentConversionController {
  constructor(private readonly conversionService: DocumentConversionService) {}

  @Post(':id/convert-to-pdf')
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
  async convertToPdf(@Param('id') documentId: string, @Request() req: any) {
    const job = await this.conversionService.startConvertToPdf(documentId, req.user.userId);
    return { success: true, data: job };
  }

  @Get('conversion/jobs/:jobId')
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
    const job = await this.conversionService.getJob(jobId, req.user.userId);
    return { success: true, data: job };
  }

  @Get(':id/conversion-jobs')
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
    const jobs = await this.conversionService.listDocumentJobs(documentId, req.user.userId);
    return { success: true, data: jobs };
  }

  @Delete('conversion/jobs/:jobId')
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
    const result = await this.conversionService.cancelJob(jobId, req.user.userId);
    return { success: true, data: result };
  }
}

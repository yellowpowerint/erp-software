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
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CsvService } from './csv.service';

@Controller('csv')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CsvController {
  constructor(private readonly csvService: CsvService) {}

  @Post('upload')
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
  @UseInterceptors(FileInterceptor('file'))
  async uploadForValidation(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { module?: string },
  ) {
    if (!file) {
      throw new BadRequestException('file is required');
    }

    return this.csvService.uploadForValidation(file, body.module);
  }

  @Post('import/:module')
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
  @UseInterceptors(FileInterceptor('file'))
  async startImport(
    @Param('module') module: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { mappings?: string; context?: string },
    @Request() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('file is required');
    }

    const mappings = body.mappings ? this.csvService.parseJson(body.mappings, 'mappings') : undefined;
    const context = body.context ? this.csvService.parseJson(body.context, 'context') : undefined;
    const job = await this.csvService.createImportJob(module, file, req.user.userId, mappings, context);
    return { success: true, data: job };
  }

  @Get('import/:jobId')
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
  async getImportJob(@Param('jobId') jobId: string, @Request() req: any) {
    const job = await this.csvService.getImportJob(jobId, req.user.userId);
    return { success: true, data: job };
  }

  @Get('import/:jobId/errors')
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
  async getImportErrors(@Param('jobId') jobId: string, @Request() req: any) {
    const errors = await this.csvService.getImportJobErrors(jobId, req.user.userId);
    return { success: true, data: errors };
  }

  @Post('import/:jobId/cancel')
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
  async cancelImport(@Param('jobId') jobId: string, @Request() req: any) {
    const result = await this.csvService.cancelImportJob(jobId, req.user.userId);
    return { success: true, data: result };
  }

  @Post('export/:module')
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
    @Param('module') module: string,
    @Body() body: { filters?: any; columns: string[]; fileName?: string; context?: any },
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

  @Get('export/:jobId')
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
  async getExportJob(@Param('jobId') jobId: string, @Request() req: any) {
    const job = await this.csvService.getExportJob(jobId, req.user.userId);
    return { success: true, data: job };
  }

  @Get('export/:jobId/download')
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
  async downloadExport(@Param('jobId') jobId: string, @Request() req: any, @Res() res: Response) {
    const url = await this.csvService.getExportDownloadUrl(jobId, req.user.userId);
    res.redirect(url);
  }

  @Get('templates/:module')
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
  async getTemplates(@Param('module') module: string) {
    const templates = await this.csvService.getTemplates(module);
    return { success: true, data: templates };
  }

  @Post('templates')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CEO, UserRole.IT_MANAGER)
  async createTemplate(
    @Body() body: { name: string; module: string; description?: string; columns: any; isDefault?: boolean },
    @Request() req: any,
  ) {
    const template = await this.csvService.createTemplate(body, req.user.userId);
    return { success: true, data: template };
  }

  @Put('templates/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CEO, UserRole.IT_MANAGER)
  async updateTemplate(
    @Param('id') id: string,
    @Body() body: { name?: string; description?: string; columns?: any; isDefault?: boolean },
    @Request() req: any,
  ) {
    const template = await this.csvService.updateTemplate(id, body, req.user.userId);
    return { success: true, data: template };
  }

  @Delete('templates/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CEO, UserRole.IT_MANAGER)
  async deleteTemplate(@Param('id') id: string, @Request() req: any) {
    const result = await this.csvService.deleteTemplate(id, req.user.userId);
    return { success: true, data: result };
  }

  @Public()
  @Get('templates/:module/sample')
  async downloadSampleTemplate(@Param('module') module: string, @Res({ passthrough: true }) res: Response) {
    const template = await this.csvService.getSampleTemplate(module);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${module}-sample.csv`);
    res.send(template);
  }

  @Get('history/imports')
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

  @Get('history/exports')
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
}

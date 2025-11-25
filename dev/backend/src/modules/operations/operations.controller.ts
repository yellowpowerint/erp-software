import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { OperationsService, CreateProductionLogDto, CreateShiftDto, CreateFieldReportDto } from './operations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('operations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OperationsController {
  constructor(private readonly operationsService: OperationsService) {}

  // Production Logs
  @Post('production-logs')
  @Roles('SUPER_ADMIN', 'OPERATIONS_MANAGER', 'EMPLOYEE')
  createProductionLog(@Body() dto: CreateProductionLogDto, @Request() req: any) {
    return this.operationsService.createProductionLog({ ...dto, createdById: req.user.id });
  }

  @Get('production-logs')
  getProductionLogs(
    @Query('projectId') projectId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('shiftType') shiftType?: string,
  ) {
    return this.operationsService.getProductionLogs(
      projectId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      shiftType,
    );
  }

  @Get('production-logs/:id')
  getProductionLogById(@Param('id') id: string) {
    return this.operationsService.getProductionLogById(id);
  }

  @Put('production-logs/:id')
  @Roles('SUPER_ADMIN', 'OPERATIONS_MANAGER')
  updateProductionLog(@Param('id') id: string, @Body() data: Partial<CreateProductionLogDto>) {
    return this.operationsService.updateProductionLog(id, data);
  }

  @Delete('production-logs/:id')
  @Roles('SUPER_ADMIN', 'OPERATIONS_MANAGER')
  deleteProductionLog(@Param('id') id: string) {
    return this.operationsService.deleteProductionLog(id);
  }

  // Shifts
  @Post('shifts')
  @Roles('SUPER_ADMIN', 'OPERATIONS_MANAGER')
  createShift(@Body() dto: CreateShiftDto) {
    return this.operationsService.createShift(dto);
  }

  @Get('shifts')
  getShifts(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('shiftType') shiftType?: string,
  ) {
    return this.operationsService.getShifts(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      shiftType,
    );
  }

  @Get('shifts/:id')
  getShiftById(@Param('id') id: string) {
    return this.operationsService.getShiftById(id);
  }

  @Put('shifts/:id')
  @Roles('SUPER_ADMIN', 'OPERATIONS_MANAGER')
  updateShift(@Param('id') id: string, @Body() data: Partial<CreateShiftDto>) {
    return this.operationsService.updateShift(id, data);
  }

  @Delete('shifts/:id')
  @Roles('SUPER_ADMIN', 'OPERATIONS_MANAGER')
  deleteShift(@Param('id') id: string) {
    return this.operationsService.deleteShift(id);
  }

  // Field Reports
  @Post('field-reports')
  @Roles('SUPER_ADMIN', 'OPERATIONS_MANAGER', 'EMPLOYEE')
  createFieldReport(@Body() dto: CreateFieldReportDto) {
    return this.operationsService.createFieldReport(dto);
  }

  @Get('field-reports')
  getFieldReports(
    @Query('projectId') projectId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.operationsService.getFieldReports(
      projectId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('field-reports/:id')
  getFieldReportById(@Param('id') id: string) {
    return this.operationsService.getFieldReportById(id);
  }

  @Put('field-reports/:id')
  @Roles('SUPER_ADMIN', 'OPERATIONS_MANAGER')
  updateFieldReport(@Param('id') id: string, @Body() data: Partial<CreateFieldReportDto>) {
    return this.operationsService.updateFieldReport(id, data);
  }

  @Delete('field-reports/:id')
  @Roles('SUPER_ADMIN', 'OPERATIONS_MANAGER')
  deleteFieldReport(@Param('id') id: string) {
    return this.operationsService.deleteFieldReport(id);
  }

  // Statistics
  @Get('stats')
  getOperationsStats() {
    return this.operationsService.getOperationsStats();
  }
}

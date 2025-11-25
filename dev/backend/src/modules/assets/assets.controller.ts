import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AssetsService, CreateAssetDto, UpdateAssetDto, CreateMaintenanceLogDto } from './assets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('assets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'CEO', 'OPERATIONS_MANAGER')
  createAsset(@Body() dto: CreateAssetDto) {
    return this.assetsService.createAsset(dto);
  }

  @Get()
  getAssets(@Query('category') category?: string, @Query('status') status?: string) {
    return this.assetsService.getAssets(category, status);
  }

  @Get('stats')
  getAssetStats() {
    return this.assetsService.getAssetStats();
  }

  @Get('maintenance-due')
  getMaintenanceDue() {
    return this.assetsService.getMaintenanceDue();
  }

  @Get(':id')
  getAssetById(@Param('id') id: string) {
    return this.assetsService.getAssetById(id);
  }

  @Put(':id')
  @Roles('SUPER_ADMIN', 'CEO', 'OPERATIONS_MANAGER')
  updateAsset(@Param('id') id: string, @Body() dto: UpdateAssetDto) {
    return this.assetsService.updateAsset(id, dto);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'CEO')
  deleteAsset(@Param('id') id: string) {
    return this.assetsService.deleteAsset(id);
  }

  @Post(':id/maintenance')
  @Roles('SUPER_ADMIN', 'CEO', 'OPERATIONS_MANAGER', 'WAREHOUSE_MANAGER')
  addMaintenanceLog(@Param('id') id: string, @Body() dto: CreateMaintenanceLogDto) {
    return this.assetsService.addMaintenanceLog(id, dto);
  }

  @Get('maintenance/logs')
  getMaintenanceLogs(@Query('assetId') assetId?: string) {
    return this.assetsService.getMaintenanceLogs(assetId);
  }
}

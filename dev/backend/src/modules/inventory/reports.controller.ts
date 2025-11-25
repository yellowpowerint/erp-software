import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { InventoryReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('inventory/reports')
@UseGuards(JwtAuthGuard)
export class InventoryReportsController {
  constructor(private readonly reportsService: InventoryReportsService) {}

  @Get('valuation')
  getStockValuation(@Query('warehouseId') warehouseId?: string) {
    return this.reportsService.getStockValuation(warehouseId);
  }

  @Get('movements')
  getStockMovementReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('warehouseId') warehouseId?: string,
  ) {
    return this.reportsService.getStockMovementReport(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      warehouseId,
    );
  }

  @Get('usage-patterns')
  getUsagePatterns(@Query('days') days?: string) {
    return this.reportsService.getUsagePatterns(
      days ? parseInt(days) : 30,
    );
  }

  @Get('expiring')
  getExpiringItems(@Query('days') days?: string) {
    return this.reportsService.getExpiringItems(
      days ? parseInt(days) : 30,
    );
  }

  @Get('reorder-suggestions')
  getReorderSuggestions() {
    return this.reportsService.getReorderSuggestions();
  }

  @Get('trends')
  getInventoryTrends() {
    return this.reportsService.getInventoryTrends();
  }
}

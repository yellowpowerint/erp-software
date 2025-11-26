import { Controller, Get, Param, Query } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  // Project Summary
  @Get('project-summary/:id')
  getProjectSummary(@Param('id') id: string) {
    return this.aiService.generateProjectSummary(id);
  }

  // Procurement Advisor
  @Get('procurement-advisor')
  getProcurementAdvice(
    @Query('category') category?: string,
    @Query('minBudget') minBudget?: string,
    @Query('maxBudget') maxBudget?: string,
  ) {
    return this.aiService.generateProcurementAdvice({
      category,
      budgetRange:
        minBudget && maxBudget
          ? { min: parseFloat(minBudget), max: parseFloat(maxBudget) }
          : undefined,
    });
  }

  // Dashboard Insights
  @Get('dashboard-insights')
  getDashboardInsights() {
    return this.aiService.getDashboardInsights();
  }

  // Maintenance Predictor
  @Get('maintenance-predictor')
  getMaintenancePredictions() {
    return this.aiService.predictMaintenanceNeeds();
  }
}

import { Controller, Get, Post, Put, Delete, Param, Query, Body } from '@nestjs/common';
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

  // Knowledge Engine - Documents
  @Get('knowledge/documents')
  getDocuments(
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('category') category?: string,
  ) {
    return this.aiService.getDocuments({ type, status, category });
  }

  @Get('knowledge/documents/:id')
  getDocumentById(@Param('id') id: string) {
    return this.aiService.getDocumentById(id);
  }

  @Post('knowledge/documents')
  createDocument(@Body() body: any) {
    return this.aiService.createDocument(body);
  }

  @Put('knowledge/documents/:id')
  updateDocument(@Param('id') id: string, @Body() body: any) {
    return this.aiService.updateDocument(id, body);
  }

  @Delete('knowledge/documents/:id')
  deleteDocument(@Param('id') id: string) {
    return this.aiService.deleteDocument(id);
  }

  // Knowledge Engine - Search & Q&A
  @Get('knowledge/search')
  searchDocuments(@Query('q') query: string) {
    return this.aiService.searchDocuments(query);
  }

  @Post('knowledge/ask')
  askQuestion(@Body('question') question: string) {
    return this.aiService.askQuestion(question);
  }

  @Get('knowledge/stats')
  getKnowledgeBaseStats() {
    return this.aiService.getKnowledgeBaseStats();
  }
}

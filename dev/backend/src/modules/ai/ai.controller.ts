import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
  BadRequestException,
} from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { AiService } from "./ai.service";

@Controller("ai")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  // Project Summary
  @Get("project-summary/:id")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.DEPARTMENT_HEAD,
  )
  getProjectSummary(@Param("id") id: string) {
    return this.aiService.generateProjectSummary(id);
  }

  // Procurement Advisor
  @Get("procurement-advisor")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.ACCOUNTANT,
  )
  getProcurementAdvice(
    @Query("category") category?: string,
    @Query("minBudget") minBudget?: string,
    @Query("maxBudget") maxBudget?: string,
  ) {
    // Validate budget range if provided
    if (minBudget || maxBudget) {
      const min = minBudget ? parseFloat(minBudget) : undefined;
      const max = maxBudget ? parseFloat(maxBudget) : undefined;
      
      if ((min !== undefined && isNaN(min)) || (max !== undefined && isNaN(max))) {
        throw new BadRequestException('Budget values must be valid numbers');
      }
      
      if (min !== undefined && max !== undefined && min > max) {
        throw new BadRequestException('minBudget cannot be greater than maxBudget');
      }
      
      return this.aiService.generateProcurementAdvice({
        category,
        budgetRange: min !== undefined && max !== undefined ? { min, max } : undefined,
      });
    }
    
    return this.aiService.generateProcurementAdvice({ category });
  }

  // Dashboard Insights
  @Get("dashboard-insights")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.DEPARTMENT_HEAD,
  )
  getDashboardInsights() {
    return this.aiService.getDashboardInsights();
  }

  // Maintenance Predictor
  @Get("maintenance-predictor")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
  )
  getMaintenancePredictions() {
    return this.aiService.predictMaintenanceNeeds();
  }

  // Knowledge Engine - Documents
  @Get("knowledge/documents")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.DEPARTMENT_HEAD,
    UserRole.IT_MANAGER,
  )
  getDocuments(
    @Query("type") type?: string,
    @Query("status") status?: string,
    @Query("category") category?: string,
  ) {
    return this.aiService.getDocuments({ type, status, category });
  }

  @Get("knowledge/documents/:id")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.DEPARTMENT_HEAD,
    UserRole.IT_MANAGER,
  )
  getDocumentById(@Param("id") id: string) {
    return this.aiService.getDocumentById(id);
  }

  @Post("knowledge/documents")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.DEPARTMENT_HEAD,
    UserRole.IT_MANAGER,
  )
  createDocument(@Body() body: any, @Request() req: any) {
    if (!body.title || !body.content) {
      throw new BadRequestException('Title and content are required');
    }
    return this.aiService.createDocument({
      ...body,
      uploadedBy: req.user.userId,
    });
  }

  @Put("knowledge/documents/:id")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.DEPARTMENT_HEAD,
    UserRole.IT_MANAGER,
  )
  updateDocument(@Param("id") id: string, @Body() body: any) {
    return this.aiService.updateDocument(id, body);
  }

  @Delete("knowledge/documents/:id")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.IT_MANAGER,
  )
  deleteDocument(@Param("id") id: string) {
    return this.aiService.deleteDocument(id);
  }

  // Knowledge Engine - Search & Q&A
  @Get("knowledge/search")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.DEPARTMENT_HEAD,
    UserRole.IT_MANAGER,
  )
  searchDocuments(@Query("q") query: string) {
    if (!query || query.trim().length === 0) {
      throw new BadRequestException('Search query is required');
    }
    return this.aiService.searchDocuments(query);
  }

  @Post("knowledge/ask")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.DEPARTMENT_HEAD,
    UserRole.IT_MANAGER,
  )
  askQuestion(@Body("question") question: string) {
    if (!question || question.trim().length === 0) {
      throw new BadRequestException('Question is required');
    }
    return this.aiService.askQuestion(question);
  }

  @Get("knowledge/stats")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.IT_MANAGER,
  )
  getKnowledgeBaseStats() {
    return this.aiService.getKnowledgeBaseStats();
  }

  // Safety Assistant
  @Post("safety/report-incident")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.SAFETY_OFFICER,
    UserRole.DEPARTMENT_HEAD,
  )
  reportIncident(@Body() body: any) {
    if (!body.type || !body.description) {
      throw new BadRequestException('Incident type and description are required');
    }
    return this.aiService.reportIncident(body);
  }

  @Get("safety/incidents")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.SAFETY_OFFICER,
    UserRole.DEPARTMENT_HEAD,
  )
  getIncidents(
    @Query("type") type?: string,
    @Query("severity") severity?: string,
    @Query("status") status?: string,
  ) {
    return this.aiService.getIncidents({ type, severity, status });
  }

  @Get("safety/incidents/:id")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.SAFETY_OFFICER,
    UserRole.DEPARTMENT_HEAD,
  )
  getIncidentById(@Param("id") id: string) {
    return this.aiService.getIncidentById(id);
  }

  @Post("safety/analyze/:id")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.SAFETY_OFFICER,
  )
  analyzeIncident(@Param("id") id: string) {
    return this.aiService.analyzeIncident(id);
  }

  @Get("safety/stats")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.SAFETY_OFFICER,
  )
  getSafetyStats() {
    return this.aiService.getSafetyStats();
  }
}

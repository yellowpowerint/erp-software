import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Response } from "express";
import {
  ProjectsService,
  CreateProjectDto,
  UpdateProjectDto,
  CreateMilestoneDto,
  CreateTaskDto,
} from "./projects.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../auth/guards/roles.guard";
import { CsvService } from "../csv/csv.service";

@Controller("projects")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly csvService: CsvService,
  ) {}

  @Post()
  @Roles("SUPER_ADMIN", "CEO", "OPERATIONS_MANAGER")
  createProject(@Body() dto: CreateProjectDto) {
    return this.projectsService.createProject(dto);
  }

  @Get()
  getProjects(
    @Query("status") status?: string,
    @Query("priority") priority?: string,
  ) {
    return this.projectsService.getProjects(status, priority);
  }

  @Get("stats")
  getProjectStats() {
    return this.projectsService.getProjectStats();
  }

  @Get(":id")
  getProjectById(@Param("id") id: string) {
    return this.projectsService.getProjectById(id);
  }

  @Get(":id/timeline")
  getProjectTimeline(@Param("id") id: string) {
    return this.projectsService.getProjectTimeline(id);
  }

  @Put(":id")
  @Roles("SUPER_ADMIN", "CEO", "OPERATIONS_MANAGER")
  updateProject(@Param("id") id: string, @Body() dto: UpdateProjectDto) {
    return this.projectsService.updateProject(id, dto);
  }

  @Delete(":id")
  @Roles("SUPER_ADMIN", "CEO")
  deleteProject(@Param("id") id: string) {
    return this.projectsService.deleteProject(id);
  }

  // Milestones
  @Post(":id/milestones")
  @Roles("SUPER_ADMIN", "CEO", "OPERATIONS_MANAGER")
  createMilestone(@Param("id") id: string, @Body() dto: CreateMilestoneDto) {
    return this.projectsService.createMilestone(id, dto);
  }

  @Put("milestones/:milestoneId")
  @Roles("SUPER_ADMIN", "CEO", "OPERATIONS_MANAGER")
  updateMilestone(
    @Param("milestoneId") milestoneId: string,
    @Body() data: any,
  ) {
    return this.projectsService.updateMilestone(milestoneId, data);
  }

  @Delete("milestones/:milestoneId")
  @Roles("SUPER_ADMIN", "CEO", "OPERATIONS_MANAGER")
  deleteMilestone(@Param("milestoneId") milestoneId: string) {
    return this.projectsService.deleteMilestone(milestoneId);
  }

  // Tasks
  @Post(":id/tasks")
  @Roles("SUPER_ADMIN", "CEO", "OPERATIONS_MANAGER")
  createTask(@Param("id") id: string, @Body() dto: CreateTaskDto) {
    return this.projectsService.createTask(id, dto);
  }

  @Put("tasks/:taskId")
  @Roles("SUPER_ADMIN", "CEO", "OPERATIONS_MANAGER")
  updateTask(@Param("taskId") taskId: string, @Body() data: any) {
    return this.projectsService.updateTask(taskId, data);
  }

  @Delete("tasks/:taskId")
  @Roles("SUPER_ADMIN", "CEO", "OPERATIONS_MANAGER")
  deleteTask(@Param("taskId") taskId: string) {
    return this.projectsService.deleteTask(taskId);
  }

  // ==================== CSV: Projects ====================

  @Post("import")
  @Roles("SUPER_ADMIN", "CEO", "OPERATIONS_MANAGER")
  @UseInterceptors(FileInterceptor("file"))
  async importProjects(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { mappings?: string; duplicateStrategy?: string },
    @Request() req: any,
  ) {
    if (!file) {
      throw new BadRequestException("file is required");
    }

    const mappings = body.mappings ? this.csvService.parseJson(body.mappings, "mappings") : undefined;
    const context = { duplicateStrategy: body.duplicateStrategy };
    const job = await this.csvService.createImportJob("projects", file, req.user.userId, mappings, context);
    return { success: true, data: job };
  }

  @Get("import/sample")
  async downloadProjectsSample(@Res({ passthrough: true }) res: Response) {
    const template = await this.csvService.getSampleTemplate("projects");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=projects-sample.csv`);
    return template;
  }

  @Get("export")
  async exportProjects(
    @Query("status") status: string | undefined,
    @Query("priority") priority: string | undefined,
    @Query("columns") columns: string | undefined,
    @Request() req: any,
  ) {
    const cols = columns
      ? String(columns)
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean)
      : [
          "projectCode",
          "name",
          "status",
          "priority",
          "location",
          "startDate",
          "endDate",
          "estimatedBudget",
          "actualCost",
          "progress",
          "managerId",
          "createdAt",
        ];

    const filters: any = {};
    if (status) filters.status = status;
    if (priority) filters.priority = priority;

    const job = await this.csvService.createExportJob("projects", filters, cols, req.user.userId, undefined);
    return { success: true, data: job };
  }

  // ==================== CSV: Project Tasks ====================

  @Post(":id/tasks/import")
  @Roles("SUPER_ADMIN", "CEO", "OPERATIONS_MANAGER")
  @UseInterceptors(FileInterceptor("file"))
  async importProjectTasks(
    @Param("id") projectId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { mappings?: string },
    @Request() req: any,
  ) {
    if (!file) {
      throw new BadRequestException("file is required");
    }

    const mappings = body.mappings ? this.csvService.parseJson(body.mappings, "mappings") : undefined;
    const context = { projectId };
    const job = await this.csvService.createImportJob("project_tasks", file, req.user.userId, mappings, context);
    return { success: true, data: job };
  }

  @Get(":id/tasks/export")
  async exportProjectTasks(
    @Param("id") projectId: string,
    @Query("columns") columns: string | undefined,
    @Request() req: any,
  ) {
    const cols = columns
      ? String(columns)
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean)
      : ["title", "description", "status", "assignedTo", "dueDate", "order", "createdAt"];

    const job = await this.csvService.createExportJob(
      "project_tasks",
      {},
      cols,
      req.user.userId,
      undefined,
      { projectId },
    );
    return { success: true, data: job };
  }
}

import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ProjectsService, CreateProjectDto, UpdateProjectDto, CreateMilestoneDto, CreateTaskDto } from './projects.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'CEO', 'OPERATIONS_MANAGER')
  createProject(@Body() dto: CreateProjectDto) {
    return this.projectsService.createProject(dto);
  }

  @Get()
  getProjects(@Query('status') status?: string, @Query('priority') priority?: string) {
    return this.projectsService.getProjects(status, priority);
  }

  @Get('stats')
  getProjectStats() {
    return this.projectsService.getProjectStats();
  }

  @Get(':id')
  getProjectById(@Param('id') id: string) {
    return this.projectsService.getProjectById(id);
  }

  @Get(':id/timeline')
  getProjectTimeline(@Param('id') id: string) {
    return this.projectsService.getProjectTimeline(id);
  }

  @Put(':id')
  @Roles('SUPER_ADMIN', 'CEO', 'OPERATIONS_MANAGER')
  updateProject(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projectsService.updateProject(id, dto);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'CEO')
  deleteProject(@Param('id') id: string) {
    return this.projectsService.deleteProject(id);
  }

  // Milestones
  @Post(':id/milestones')
  @Roles('SUPER_ADMIN', 'CEO', 'OPERATIONS_MANAGER')
  createMilestone(@Param('id') id: string, @Body() dto: CreateMilestoneDto) {
    return this.projectsService.createMilestone(id, dto);
  }

  @Put('milestones/:milestoneId')
  @Roles('SUPER_ADMIN', 'CEO', 'OPERATIONS_MANAGER')
  updateMilestone(@Param('milestoneId') milestoneId: string, @Body() data: any) {
    return this.projectsService.updateMilestone(milestoneId, data);
  }

  @Delete('milestones/:milestoneId')
  @Roles('SUPER_ADMIN', 'CEO', 'OPERATIONS_MANAGER')
  deleteMilestone(@Param('milestoneId') milestoneId: string) {
    return this.projectsService.deleteMilestone(milestoneId);
  }

  // Tasks
  @Post(':id/tasks')
  @Roles('SUPER_ADMIN', 'CEO', 'OPERATIONS_MANAGER')
  createTask(@Param('id') id: string, @Body() dto: CreateTaskDto) {
    return this.projectsService.createTask(id, dto);
  }

  @Put('tasks/:taskId')
  @Roles('SUPER_ADMIN', 'CEO', 'OPERATIONS_MANAGER')
  updateTask(@Param('taskId') taskId: string, @Body() data: any) {
    return this.projectsService.updateTask(taskId, data);
  }

  @Delete('tasks/:taskId')
  @Roles('SUPER_ADMIN', 'CEO', 'OPERATIONS_MANAGER')
  deleteTask(@Param('taskId') taskId: string) {
    return this.projectsService.deleteTask(taskId);
  }
}

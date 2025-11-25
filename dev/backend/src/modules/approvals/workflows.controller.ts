import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { WorkflowsService, CreateWorkflowDto } from './workflows.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('workflows')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  // Create workflow (admin only)
  @Post()
  @Roles('SUPER_ADMIN', 'CEO')
  createWorkflow(@Body() dto: CreateWorkflowDto) {
    return this.workflowsService.createWorkflow(dto);
  }

  // Get all workflows
  @Get()
  @Roles('SUPER_ADMIN', 'CEO', 'CFO')
  getWorkflows(@Query('type') type?: string) {
    return this.workflowsService.getWorkflows(type);
  }

  // Get workflow by ID
  @Get(':id')
  getWorkflowById(@Param('id') id: string) {
    return this.workflowsService.getWorkflowById(id);
  }

  // Get workflow instance for an item
  @Get('instance/:itemType/:itemId')
  getWorkflowInstance(
    @Param('itemType') itemType: string,
    @Param('itemId') itemId: string,
  ) {
    return this.workflowsService.getWorkflowInstance(itemType, itemId);
  }

  // Get current stage approvers
  @Get('approvers/:itemType/:itemId')
  getCurrentStageApprovers(
    @Param('itemType') itemType: string,
    @Param('itemId') itemId: string,
  ) {
    return this.workflowsService.getCurrentStageApprovers(itemType, itemId);
  }

  // Check if user can approve
  @Get('can-approve/:itemType/:itemId')
  canUserApprove(
    @Param('itemType') itemType: string,
    @Param('itemId') itemId: string,
    @CurrentUser() user: any,
  ) {
    return this.workflowsService.canUserApprove(itemType, itemId, user.role);
  }

  // Update workflow
  @Put(':id')
  @Roles('SUPER_ADMIN', 'CEO')
  updateWorkflow(@Param('id') id: string, @Body() dto: Partial<CreateWorkflowDto>) {
    return this.workflowsService.updateWorkflow(id, dto);
  }

  // Delete workflow
  @Delete(':id')
  @Roles('SUPER_ADMIN', 'CEO')
  deleteWorkflow(@Param('id') id: string) {
    return this.workflowsService.deleteWorkflow(id);
  }

  // Seed default workflows
  @Post('seed')
  @Roles('SUPER_ADMIN')
  seedDefaultWorkflows() {
    return this.workflowsService.seedDefaultWorkflows();
  }
}

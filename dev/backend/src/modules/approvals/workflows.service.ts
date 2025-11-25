import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

export interface CreateWorkflowDto {
  name: string;
  description?: string;
  type: string;
  isActive?: boolean;
  stages: {
    stageOrder: number;
    stageName: string;
    approverRoles: string[];
    requiresAll: boolean;
  }[];
}

@Injectable()
export class WorkflowsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  // Create a new workflow
  async createWorkflow(dto: CreateWorkflowDto) {
    return this.prisma.approvalWorkflow.create({
      data: {
        name: dto.name,
        description: dto.description,
        type: dto.type as any,
        stages: {
          create: dto.stages,
        },
      },
      include: {
        stages: {
          orderBy: {
            stageOrder: 'asc',
          },
        },
      },
    });
  }

  // Get all workflows
  async getWorkflows(type?: string) {
    return this.prisma.approvalWorkflow.findMany({
      where: type ? { type: type as any } : {},
      include: {
        stages: {
          orderBy: {
            stageOrder: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Get workflow by ID
  async getWorkflowById(id: string) {
    const workflow = await this.prisma.approvalWorkflow.findUnique({
      where: { id },
      include: {
        stages: {
          orderBy: {
            stageOrder: 'asc',
          },
        },
      },
    });

    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }

    return workflow;
  }

  // Get active workflow for a type
  async getActiveWorkflowForType(type: string) {
    return this.prisma.approvalWorkflow.findFirst({
      where: {
        type: type as any,
        isActive: true,
      },
      include: {
        stages: {
          orderBy: {
            stageOrder: 'asc',
          },
        },
      },
    });
  }

  // Initialize workflow instance for an item
  async initializeWorkflow(itemType: string, itemId: string, workflowId: string) {
    // Check if instance already exists
    const existing = await this.prisma.workflowInstance.findUnique({
      where: {
        itemType_itemId: {
          itemType,
          itemId,
        },
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.workflowInstance.create({
      data: {
        workflowId,
        itemType,
        itemId,
        currentStage: 1,
        status: 'PENDING',
      },
      include: {
        workflow: {
          include: {
            stages: {
              orderBy: {
                stageOrder: 'asc',
              },
            },
          },
        },
      },
    });
  }

  // Get workflow instance
  async getWorkflowInstance(itemType: string, itemId: string) {
    return this.prisma.workflowInstance.findUnique({
      where: {
        itemType_itemId: {
          itemType,
          itemId,
        },
      },
      include: {
        workflow: {
          include: {
            stages: {
              orderBy: {
                stageOrder: 'asc',
              },
            },
          },
        },
        stageActions: {
          include: {
            stage: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
  }

  // Process approval at current stage
  async processApproval(
    itemType: string,
    itemId: string,
    approverId: string,
    action: 'APPROVED' | 'REJECTED',
    comments?: string,
  ) {
    const instance = await this.getWorkflowInstance(itemType, itemId);

    if (!instance) {
      throw new NotFoundException('Workflow instance not found');
    }

    if (instance.status !== 'PENDING') {
      throw new BadRequestException('Workflow is not pending');
    }

    // Get current stage
    const currentStage = instance.workflow.stages.find(
      (s) => s.stageOrder === instance.currentStage,
    );

    if (!currentStage) {
      throw new BadRequestException('Invalid stage');
    }

    // Record the stage action
    await this.prisma.stageAction.create({
      data: {
        instanceId: instance.id,
        stageId: currentStage.id,
        approverId,
        action: action as any,
        comments,
      },
    });

    // If rejected, mark workflow as rejected
    if (action === 'REJECTED') {
      await this.prisma.workflowInstance.update({
        where: { id: instance.id },
        data: { status: 'REJECTED' },
      });
      return { status: 'REJECTED', nextStage: null };
    }

    // If approved, check if there are more stages
    const nextStageOrder = instance.currentStage + 1;
    const nextStage = instance.workflow.stages.find(
      (s) => s.stageOrder === nextStageOrder,
    );

    if (nextStage) {
      // Move to next stage
      await this.prisma.workflowInstance.update({
        where: { id: instance.id },
        data: { currentStage: nextStageOrder },
      });
      return { status: 'PENDING', nextStage: nextStage.stageName };
    } else {
      // No more stages, approve the workflow
      await this.prisma.workflowInstance.update({
        where: { id: instance.id },
        data: { status: 'APPROVED' },
      });
      return { status: 'APPROVED', nextStage: null };
    }
  }

  // Get approvers for current stage
  async getCurrentStageApprovers(itemType: string, itemId: string) {
    const instance = await this.getWorkflowInstance(itemType, itemId);

    if (!instance) {
      return [];
    }

    const currentStage = instance.workflow.stages.find(
      (s) => s.stageOrder === instance.currentStage,
    );

    if (!currentStage) {
      return [];
    }

    // Get users with the required roles
    const approvers = await this.prisma.user.findMany({
      where: {
        role: { in: currentStage.approverRoles as any },
        status: 'ACTIVE',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
    });

    return approvers;
  }

  // Check if user can approve at current stage
  async canUserApprove(itemType: string, itemId: string, userRole: string) {
    const instance = await this.getWorkflowInstance(itemType, itemId);

    if (!instance || instance.status !== 'PENDING') {
      return false;
    }

    const currentStage = instance.workflow.stages.find(
      (s) => s.stageOrder === instance.currentStage,
    );

    if (!currentStage) {
      return false;
    }

    return currentStage.approverRoles.includes(userRole);
  }

  // Update workflow
  async updateWorkflow(id: string, dto: Partial<CreateWorkflowDto>) {
    return this.prisma.approvalWorkflow.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        isActive: dto.isActive !== undefined ? dto.isActive : undefined,
      },
      include: {
        stages: {
          orderBy: {
            stageOrder: 'asc',
          },
        },
      },
    });
  }

  // Delete workflow
  async deleteWorkflow(id: string) {
    return this.prisma.approvalWorkflow.delete({
      where: { id },
    });
  }

  // Seed default workflows
  async seedDefaultWorkflows() {
    const workflows = [
      {
        name: 'Standard Invoice Approval',
        description: 'Two-level approval: CFO → CEO',
        type: 'INVOICE',
        stages: [
          {
            stageOrder: 1,
            stageName: 'CFO Review',
            approverRoles: ['CFO', 'ACCOUNTANT'],
            requiresAll: false,
          },
          {
            stageOrder: 2,
            stageName: 'CEO Final Approval',
            approverRoles: ['CEO'],
            requiresAll: false,
          },
        ],
      },
      {
        name: 'Purchase Request Approval',
        description: 'Three-level approval: Dept Head → Procurement → CFO',
        type: 'PURCHASE_REQUEST',
        stages: [
          {
            stageOrder: 1,
            stageName: 'Department Head Review',
            approverRoles: ['DEPARTMENT_HEAD'],
            requiresAll: false,
          },
          {
            stageOrder: 2,
            stageName: 'Procurement Review',
            approverRoles: ['PROCUREMENT_OFFICER'],
            requiresAll: false,
          },
          {
            stageOrder: 3,
            stageName: 'CFO Final Approval',
            approverRoles: ['CFO', 'CEO'],
            requiresAll: false,
          },
        ],
      },
      {
        name: 'IT Request Approval',
        description: 'Two-level approval: IT Manager → CFO',
        type: 'IT_REQUEST',
        stages: [
          {
            stageOrder: 1,
            stageName: 'IT Manager Review',
            approverRoles: ['IT_MANAGER'],
            requiresAll: false,
          },
          {
            stageOrder: 2,
            stageName: 'CFO Budget Approval',
            approverRoles: ['CFO', 'CEO'],
            requiresAll: false,
          },
        ],
      },
      {
        name: 'Payment Request Approval',
        description: 'Two-level approval: Accountant → CFO',
        type: 'PAYMENT_REQUEST',
        stages: [
          {
            stageOrder: 1,
            stageName: 'Accountant Verification',
            approverRoles: ['ACCOUNTANT'],
            requiresAll: false,
          },
          {
            stageOrder: 2,
            stageName: 'CFO Authorization',
            approverRoles: ['CFO', 'CEO'],
            requiresAll: false,
          },
        ],
      },
    ];

    const created = [];
    for (const workflow of workflows) {
      const existing = await this.prisma.approvalWorkflow.findFirst({
        where: { name: workflow.name },
      });

      if (!existing) {
        const result = await this.createWorkflow(workflow);
        created.push(result);
      }
    }

    return created;
  }
}

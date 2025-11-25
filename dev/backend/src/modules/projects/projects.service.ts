import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface CreateProjectDto {
  projectCode: string;
  name: string;
  description?: string;
  status?: string;
  priority?: string;
  location?: string;
  startDate: string;
  endDate?: string;
  estimatedBudget?: number;
  managerId?: string;
  notes?: string;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
  status?: string;
  priority?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  estimatedBudget?: number;
  actualCost?: number;
  progress?: number;
  managerId?: string;
  notes?: string;
}

export interface CreateMilestoneDto {
  name: string;
  description?: string;
  dueDate: string;
  order?: number;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  status?: string;
  assignedTo?: string;
  dueDate?: string;
  order?: number;
}

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async createProject(dto: CreateProjectDto) {
    const existing = await this.prisma.project.findUnique({
      where: { projectCode: dto.projectCode },
    });

    if (existing) {
      throw new BadRequestException('Project code already exists');
    }

    return this.prisma.project.create({
      data: {
        projectCode: dto.projectCode,
        name: dto.name,
        description: dto.description,
        status: dto.status as any || 'PLANNING',
        priority: dto.priority as any || 'MEDIUM',
        location: dto.location,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        estimatedBudget: dto.estimatedBudget,
        managerId: dto.managerId,
        notes: dto.notes,
      },
      include: {
        milestones: true,
        tasks: true,
      },
    });
  }

  async getProjects(status?: string, priority?: string) {
    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;

    return this.prisma.project.findMany({
      where,
      include: {
        _count: {
          select: {
            milestones: true,
            tasks: true,
          },
        },
      },
      orderBy: {
        startDate: 'desc',
      },
    });
  }

  async getProjectById(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        milestones: {
          orderBy: {
            order: 'asc',
          },
        },
        tasks: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async updateProject(id: string, dto: UpdateProjectDto) {
    await this.getProjectById(id);

    return this.prisma.project.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        status: dto.status as any,
        priority: dto.priority as any,
        location: dto.location,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        estimatedBudget: dto.estimatedBudget,
        actualCost: dto.actualCost,
        progress: dto.progress,
        managerId: dto.managerId,
        notes: dto.notes,
      },
      include: {
        milestones: true,
        tasks: true,
      },
    });
  }

  async deleteProject(id: string) {
    await this.getProjectById(id);
    return this.prisma.project.delete({ where: { id } });
  }

  async getProjectStats() {
    const [totalProjects, activeProjects, completedProjects, onHoldProjects] = await Promise.all([
      this.prisma.project.count(),
      this.prisma.project.count({ where: { status: 'ACTIVE' } }),
      this.prisma.project.count({ where: { status: 'COMPLETED' } }),
      this.prisma.project.count({ where: { status: 'ON_HOLD' } }),
    ]);

    const projects = await this.prisma.project.findMany({
      select: { estimatedBudget: true, actualCost: true },
    });

    const totalBudget = projects.reduce((sum, p) => sum + (p.estimatedBudget || 0), 0);
    const totalSpent = projects.reduce((sum, p) => sum + (p.actualCost || 0), 0);

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      onHoldProjects,
      totalBudget,
      totalSpent,
    };
  }

  // Milestones
  async createMilestone(projectId: string, dto: CreateMilestoneDto) {
    await this.getProjectById(projectId);

    return this.prisma.milestone.create({
      data: {
        projectId,
        name: dto.name,
        description: dto.description,
        dueDate: new Date(dto.dueDate),
        order: dto.order || 0,
      },
    });
  }

  async updateMilestone(id: string, data: Partial<CreateMilestoneDto> & { isCompleted?: boolean }) {
    const milestone = await this.prisma.milestone.findUnique({ where: { id } });
    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }

    return this.prisma.milestone.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        isCompleted: data.isCompleted,
        completedAt: data.isCompleted ? new Date() : null,
        order: data.order,
      },
    });
  }

  async deleteMilestone(id: string) {
    const milestone = await this.prisma.milestone.findUnique({ where: { id } });
    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }
    return this.prisma.milestone.delete({ where: { id } });
  }

  // Tasks
  async createTask(projectId: string, dto: CreateTaskDto) {
    await this.getProjectById(projectId);

    return this.prisma.task.create({
      data: {
        projectId,
        title: dto.title,
        description: dto.description,
        status: dto.status as any || 'PENDING',
        assignedTo: dto.assignedTo,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        order: dto.order || 0,
      },
    });
  }

  async updateTask(id: string, data: Partial<CreateTaskDto> & { isCompleted?: boolean }) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return this.prisma.task.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        status: data.status as any,
        assignedTo: data.assignedTo,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        isCompleted: data.isCompleted,
        completedAt: data.isCompleted ? new Date() : null,
        order: data.order,
      },
    });
  }

  async deleteTask(id: string) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return this.prisma.task.delete({ where: { id } });
  }

  async getProjectTimeline(id: string) {
    const project = await this.getProjectById(id);
    
    const milestones = project.milestones.map(m => ({
      id: m.id,
      name: m.name,
      date: m.dueDate,
      isCompleted: m.isCompleted,
      type: 'milestone',
    }));

    const tasks = project.tasks.map(t => ({
      id: t.id,
      name: t.title,
      date: t.dueDate,
      isCompleted: t.isCompleted,
      assignedTo: t.assignedTo,
      type: 'task',
    }));

    const timeline = [...milestones, ...tasks].sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    return {
      project: {
        id: project.id,
        name: project.name,
        startDate: project.startDate,
        endDate: project.endDate,
        progress: project.progress,
      },
      timeline,
    };
  }
}

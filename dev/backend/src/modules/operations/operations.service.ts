import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface CreateProductionLogDto {
  projectId?: string;
  date: string;
  shiftType: string;
  activityType: string;
  location?: string;
  quantity: number;
  unit: string;
  equipmentUsed?: string;
  operatorName?: string;
  notes?: string;
  createdById: string;
}

export interface CreateShiftDto {
  date: string;
  shiftType: string;
  startTime: string;
  endTime: string;
  supervisor?: string;
  crew?: string[];
  location?: string;
  notes?: string;
}

export interface CreateFieldReportDto {
  projectId?: string;
  reportDate: string;
  location: string;
  reportedBy: string;
  title: string;
  description: string;
  findings?: string;
  recommendations?: string;
  priority?: string;
  attachments?: string[];
}

@Injectable()
export class OperationsService {
  constructor(private prisma: PrismaService) {}

  // Production Logs
  async createProductionLog(dto: CreateProductionLogDto) {
    return this.prisma.productionLog.create({
      data: {
        projectId: dto.projectId,
        date: new Date(dto.date),
        shiftType: dto.shiftType as any,
        activityType: dto.activityType as any,
        location: dto.location,
        quantity: dto.quantity,
        unit: dto.unit,
        equipmentUsed: dto.equipmentUsed,
        operatorName: dto.operatorName,
        notes: dto.notes,
        createdById: dto.createdById,
      },
      include: {
        project: {
          select: {
            projectCode: true,
            name: true,
          },
        },
      },
    });
  }

  async getProductionLogs(
    projectId?: string,
    startDate?: Date,
    endDate?: Date,
    shiftType?: string,
  ) {
    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }
    if (shiftType) where.shiftType = shiftType;

    return this.prisma.productionLog.findMany({
      where,
      include: {
        project: {
          select: {
            projectCode: true,
            name: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
      take: 100,
    });
  }

  async getProductionLogById(id: string) {
    const log = await this.prisma.productionLog.findUnique({
      where: { id },
      include: {
        project: true,
      },
    });

    if (!log) {
      throw new NotFoundException('Production log not found');
    }

    return log;
  }

  async updateProductionLog(id: string, data: Partial<CreateProductionLogDto>) {
    await this.getProductionLogById(id);

    return this.prisma.productionLog.update({
      where: { id },
      data: {
        quantity: data.quantity,
        unit: data.unit,
        equipmentUsed: data.equipmentUsed,
        operatorName: data.operatorName,
        notes: data.notes,
      },
    });
  }

  async deleteProductionLog(id: string) {
    await this.getProductionLogById(id);
    return this.prisma.productionLog.delete({ where: { id } });
  }

  // Shifts
  async createShift(dto: CreateShiftDto) {
    return this.prisma.shift.create({
      data: {
        date: new Date(dto.date),
        shiftType: dto.shiftType as any,
        startTime: dto.startTime,
        endTime: dto.endTime,
        supervisor: dto.supervisor,
        crew: dto.crew || [],
        location: dto.location,
        notes: dto.notes,
      },
    });
  }

  async getShifts(startDate?: Date, endDate?: Date, shiftType?: string) {
    const where: any = {};
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }
    if (shiftType) where.shiftType = shiftType;

    return this.prisma.shift.findMany({
      where,
      orderBy: {
        date: 'desc',
      },
    });
  }

  async getShiftById(id: string) {
    const shift = await this.prisma.shift.findUnique({ where: { id } });
    if (!shift) {
      throw new NotFoundException('Shift not found');
    }
    return shift;
  }

  async updateShift(id: string, data: Partial<CreateShiftDto>) {
    await this.getShiftById(id);

    return this.prisma.shift.update({
      where: { id },
      data: {
        supervisor: data.supervisor,
        crew: data.crew,
        location: data.location,
        notes: data.notes,
      },
    });
  }

  async deleteShift(id: string) {
    await this.getShiftById(id);
    return this.prisma.shift.delete({ where: { id } });
  }

  // Field Reports
  async createFieldReport(dto: CreateFieldReportDto) {
    return this.prisma.fieldReport.create({
      data: {
        projectId: dto.projectId,
        reportDate: new Date(dto.reportDate),
        location: dto.location,
        reportedBy: dto.reportedBy,
        title: dto.title,
        description: dto.description,
        findings: dto.findings,
        recommendations: dto.recommendations,
        priority: dto.priority || 'MEDIUM',
        attachments: dto.attachments || [],
      },
      include: {
        project: {
          select: {
            projectCode: true,
            name: true,
          },
        },
      },
    });
  }

  async getFieldReports(
    projectId?: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (startDate || endDate) {
      where.reportDate = {};
      if (startDate) where.reportDate.gte = startDate;
      if (endDate) where.reportDate.lte = endDate;
    }

    return this.prisma.fieldReport.findMany({
      where,
      include: {
        project: {
          select: {
            projectCode: true,
            name: true,
          },
        },
      },
      orderBy: {
        reportDate: 'desc',
      },
    });
  }

  async getFieldReportById(id: string) {
    const report = await this.prisma.fieldReport.findUnique({
      where: { id },
      include: {
        project: true,
      },
    });

    if (!report) {
      throw new NotFoundException('Field report not found');
    }

    return report;
  }

  async updateFieldReport(id: string, data: Partial<CreateFieldReportDto>) {
    await this.getFieldReportById(id);

    return this.prisma.fieldReport.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        findings: data.findings,
        recommendations: data.recommendations,
        priority: data.priority,
      },
    });
  }

  async deleteFieldReport(id: string) {
    await this.getFieldReportById(id);
    return this.prisma.fieldReport.delete({ where: { id } });
  }

  // Statistics
  async getOperationsStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalProductionLogs, todayLogs, activeShifts, totalFieldReports] = await Promise.all([
      this.prisma.productionLog.count(),
      this.prisma.productionLog.count({
        where: {
          date: { gte: today },
        },
      }),
      this.prisma.shift.count({
        where: {
          date: { gte: today },
        },
      }),
      this.prisma.fieldReport.count(),
    ]);

    // Get production summary
    const recentLogs = await this.prisma.productionLog.findMany({
      where: {
        date: { gte: today },
      },
      select: {
        quantity: true,
        activityType: true,
      },
    });

    const productionByActivity = recentLogs.reduce((acc, log) => {
      const activity = log.activityType;
      acc[activity] = (acc[activity] || 0) + log.quantity;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalProductionLogs,
      todayLogs,
      activeShifts,
      totalFieldReports,
      productionByActivity,
    };
  }

  // Production Report
  async getProductionReport(startDate?: Date, endDate?: Date) {
    const where: any = {};
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    const logs = await this.prisma.productionLog.findMany({
      where,
      select: {
        date: true,
        activityType: true,
        quantity: true,
        unit: true,
        shiftType: true,
      },
      orderBy: { date: 'asc' },
    });

    // Aggregate by activity type
    const byActivity = logs.reduce((acc, log) => {
      const activity = log.activityType;
      if (!acc[activity]) {
        acc[activity] = { activity, totalQuantity: 0, count: 0 };
      }
      acc[activity].totalQuantity += log.quantity;
      acc[activity].count++;
      return acc;
    }, {} as Record<string, any>);

    // Aggregate by shift type
    const byShift = logs.reduce((acc, log) => {
      const shift = log.shiftType;
      if (!acc[shift]) {
        acc[shift] = { shift, totalQuantity: 0, count: 0 };
      }
      acc[shift].totalQuantity += log.quantity;
      acc[shift].count++;
      return acc;
    }, {} as Record<string, any>);

    // Daily production trend
    const dailyProduction = logs.reduce((acc, log) => {
      const date = log.date.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, quantity: 0, count: 0 };
      }
      acc[date].quantity += log.quantity;
      acc[date].count++;
      return acc;
    }, {} as Record<string, any>);

    return {
      totalLogs: logs.length,
      totalProduction: logs.reduce((sum, log) => sum + log.quantity, 0),
      byActivity: Object.values(byActivity),
      byShift: Object.values(byShift),
      dailyProduction: Object.values(dailyProduction),
    };
  }

  // Equipment Utilization Report
  async getEquipmentUtilizationReport(startDate?: Date, endDate?: Date) {
    const where: any = {};
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    const logs = await this.prisma.productionLog.findMany({
      where: {
        ...where,
        equipmentUsed: { not: null },
      },
      select: {
        equipmentUsed: true,
        quantity: true,
        date: true,
      },
    });

    const equipmentStats = logs.reduce((acc, log) => {
      const equipment = log.equipmentUsed || 'Unknown';
      if (!acc[equipment]) {
        acc[equipment] = {
          equipment,
          usageCount: 0,
          totalProduction: 0,
          lastUsed: log.date,
        };
      }
      acc[equipment].usageCount++;
      acc[equipment].totalProduction += log.quantity;
      if (log.date > acc[equipment].lastUsed) {
        acc[equipment].lastUsed = log.date;
      }
      return acc;
    }, {} as Record<string, any>);

    return {
      totalEquipment: Object.keys(equipmentStats).length,
      equipment: Object.values(equipmentStats).sort(
        (a: any, b: any) => b.usageCount - a.usageCount,
      ),
    };
  }

  // Shift Performance Report
  async getShiftPerformanceReport(startDate?: Date, endDate?: Date) {
    const where: any = {};
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    const shifts = await this.prisma.shift.findMany({
      where,
      select: {
        date: true,
        shiftType: true,
        supervisor: true,
        crew: true,
      },
    });

    const logs = await this.prisma.productionLog.findMany({
      where,
      select: {
        date: true,
        shiftType: true,
        quantity: true,
      },
    });

    // Match production to shifts
    const shiftPerformance = shifts.map((shift) => {
      const production = logs.filter(
        (log) =>
          log.date.toISOString().split('T')[0] ===
            shift.date.toISOString().split('T')[0] &&
          log.shiftType === shift.shiftType,
      );

      const totalProduction = production.reduce((sum, p) => sum + p.quantity, 0);

      return {
        date: shift.date,
        shiftType: shift.shiftType,
        supervisor: shift.supervisor,
        crewSize: shift.crew.length,
        totalProduction,
        productionPerCrew: shift.crew.length > 0 ? totalProduction / shift.crew.length : 0,
      };
    });

    // Aggregate by shift type
    const byShiftType = shiftPerformance.reduce((acc, shift) => {
      const type = shift.shiftType;
      if (!acc[type]) {
        acc[type] = {
          shiftType: type,
          totalShifts: 0,
          totalProduction: 0,
          avgProduction: 0,
        };
      }
      acc[type].totalShifts++;
      acc[type].totalProduction += shift.totalProduction;
      return acc;
    }, {} as Record<string, any>);

    // Calculate averages
    Object.values(byShiftType).forEach((type: any) => {
      type.avgProduction = type.totalProduction / type.totalShifts;
    });

    return {
      totalShifts: shifts.length,
      shiftPerformance: shiftPerformance.sort((a, b) => b.totalProduction - a.totalProduction),
      byShiftType: Object.values(byShiftType),
    };
  }

  // Project Progress Report
  async getProjectProgressReport() {
    const projects = await this.prisma.project.findMany({
      where: {
        status: { in: ['PLANNING', 'ACTIVE', 'ON_HOLD'] },
      },
      include: {
        productionLogs: {
          select: {
            quantity: true,
            activityType: true,
          },
        },
        fieldReports: {
          select: {
            id: true,
            priority: true,
          },
        },
        _count: {
          select: {
            milestones: true,
            tasks: true,
          },
        },
      },
    });

    return projects.map((project) => ({
      projectCode: project.projectCode,
      name: project.name,
      status: project.status,
      progress: project.progress,
      productionLogs: project.productionLogs.length,
      totalProduction: project.productionLogs.reduce((sum, log) => sum + log.quantity, 0),
      fieldReports: project.fieldReports.length,
      criticalReports: project.fieldReports.filter((r) => r.priority === 'CRITICAL').length,
      milestones: project._count.milestones,
      tasks: project._count.tasks,
    }));
  }
}

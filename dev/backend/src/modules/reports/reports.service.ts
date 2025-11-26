import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  // ==================== Dashboard Analytics ====================

  async getDashboardAnalytics() {
    const [
      // Inventory
      totalInventory,
      lowStock,
      // Assets
      totalAssets,
      activeAssets,
      // Projects
      totalProjects,
      activeProjects,
      // Finance
      totalBudgets,
      totalExpenses,
      // HR
      totalEmployees,
      activeEmployees,
      // Safety
      pendingInspections,
      upcomingTrainings,
    ] = await Promise.all([
      this.prisma.stockItem.count(),
      this.prisma.stockItem.count({ where: { currentQuantity: { lte: 10 } } }),
      this.prisma.asset.count(),
      this.prisma.asset.count({ where: { status: 'ACTIVE' } }),
      this.prisma.project.count(),
      this.prisma.project.count({ where: { status: { in: ['PLANNING', 'ACTIVE'] } } }),
      this.prisma.budget.count(),
      this.prisma.expense.count(),
      this.prisma.employee.count(),
      this.prisma.employee.count({ where: { status: 'ACTIVE' } }),
      this.prisma.safetyInspection.count({ where: { status: { in: ['SCHEDULED', 'IN_PROGRESS'] } } }),
      this.prisma.safetyTraining.count({ where: { status: 'SCHEDULED', scheduledDate: { gte: new Date() } } }),
    ]);

    return {
      inventory: { total: totalInventory, lowStock },
      assets: { total: totalAssets, active: activeAssets },
      projects: { total: totalProjects, active: activeProjects },
      finance: { totalBudgets, totalExpenses },
      hr: { total: totalEmployees, active: activeEmployees },
      safety: { pendingInspections, upcomingTrainings },
    };
  }

  // ==================== Financial Reports ====================

  async getFinancialSummary(startDate?: Date, endDate?: Date) {
    const where: any = {};
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    const [expenses, budgets] = await Promise.all([
      this.prisma.expense.findMany({ where, orderBy: { createdAt: 'desc' } }),
      this.prisma.budget.findMany({ orderBy: { createdAt: 'desc' } }),
    ]);

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalBudget = budgets.reduce((sum, bud) => sum + bud.allocatedAmount, 0);
    const totalSpent = budgets.reduce((sum, bud) => sum + bud.spentAmount, 0);

    const expensesByCategory = expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>);

    const expensesByMonth = expenses.reduce((acc, exp) => {
      const month = new Date(exp.createdAt).toISOString().slice(0, 7);
      acc[month] = (acc[month] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>);

    return {
      summary: {
        totalExpenses,
        totalBudget,
        totalSpent,
        budgetRemaining: totalBudget - totalSpent,
        utilizationRate: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
      },
      expensesByCategory: Object.entries(expensesByCategory).map(([category, amount]) => ({
        category,
        amount,
        percentage: (amount / totalExpenses) * 100,
      })),
      expensesByMonth: Object.entries(expensesByMonth).map(([month, amount]) => ({
        month,
        amount,
      })),
      recentExpenses: expenses.slice(0, 10),
    };
  }

  async getBudgetAnalysis() {
    const budgets = await this.prisma.budget.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return budgets.map(budget => ({
      ...budget,
      remaining: budget.allocatedAmount - budget.spentAmount,
      utilizationRate: (budget.spentAmount / budget.allocatedAmount) * 100,
      status: budget.spentAmount >= budget.allocatedAmount 
        ? 'OVER_BUDGET' 
        : budget.spentAmount >= budget.allocatedAmount * 0.9 
        ? 'NEAR_LIMIT' 
        : 'ON_TRACK',
    }));
  }

  // ==================== Operational Reports ====================

  async getInventoryReport() {
    const [items, lowStock, outOfStock] = await Promise.all([
      this.prisma.stockItem.findMany({ orderBy: { currentQuantity: 'asc' } }),
      this.prisma.stockItem.count({ where: { currentQuantity: { lte: 10 } } }),
      this.prisma.stockItem.count({ where: { currentQuantity: { equals: 0 } } }),
    ]);

    const totalValue = items.reduce((sum, item) => sum + ((item.unitPrice || 0) * item.currentQuantity), 0);
    
    const itemsByCategory = items.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      summary: {
        totalItems: items.length,
        lowStock,
        outOfStock,
        totalValue,
      },
      itemsByCategory: Object.entries(itemsByCategory).map(([category, count]) => ({
        category,
        count,
      })),
      lowStockItems: items.filter(item => item.currentQuantity <= item.reorderLevel).slice(0, 20),
    };
  }

  async getAssetReport() {
    const assets = await this.prisma.asset.findMany({
      orderBy: { purchaseDate: 'desc' },
    });

    const totalValue = assets.reduce((sum, asset) => sum + asset.purchasePrice, 0);
    
    const assetsByStatus = assets.reduce((acc, asset) => {
      acc[asset.status] = (acc[asset.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const assetsByCategory = assets.reduce((acc, asset) => {
      acc[asset.category] = (acc[asset.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      summary: {
        totalAssets: assets.length,
        totalValue,
        active: assetsByStatus['ACTIVE'] || 0,
        maintenance: assetsByStatus['MAINTENANCE'] || 0,
        retired: assetsByStatus['RETIRED'] || 0,
      },
      assetsByStatus: Object.entries(assetsByStatus).map(([status, count]) => ({
        status,
        count,
      })),
      assetsByCategory: Object.entries(assetsByCategory).map(([category, count]) => ({
        category,
        count,
      })),
      recentAssets: assets.slice(0, 10),
    };
  }

  async getProjectReport(status?: string) {
    const where: any = {};
    if (status) where.status = status;

    const projects = await this.prisma.project.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const projectsByStatus = projects.reduce((acc, proj) => {
      acc[proj.status] = (acc[proj.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalBudget = projects.length;
    const onTimeProjects = projects.filter(proj => {
      if (!proj.endDate) return true;
      return new Date(proj.endDate) >= new Date();
    }).length;

    return {
      summary: {
        totalProjects: projects.length,
        totalBudget,
        onTime: onTimeProjects,
        delayed: projects.length - onTimeProjects,
      },
      projectsByStatus: Object.entries(projectsByStatus).map(([status, count]) => ({
        status,
        count,
      })),
      projects: projects.slice(0, 20),
    };
  }

  // ==================== HR Reports ====================

  async getHRReport() {
    const [employees, attendances, leaveRequests, trainings] = await Promise.all([
      this.prisma.employee.findMany(),
      this.prisma.attendance.findMany({
        where: {
          date: {
            gte: new Date(new Date().setDate(new Date().getDate() - 30)),
          },
        },
      }),
      this.prisma.leaveRequest.findMany({
        where: { status: 'APPROVED' },
      }),
      this.prisma.safetyTraining.findMany({
        where: { completed: true },
      }),
    ]);

    const employeesByDepartment = employees.reduce((acc, emp) => {
      acc[emp.department] = (acc[emp.department] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const employeesByStatus = employees.reduce((acc, emp) => {
      acc[emp.status] = (acc[emp.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const averageAttendanceRate = attendances.length > 0
      ? (attendances.filter(a => a.status === 'PRESENT').length / attendances.length) * 100
      : 0;

    return {
      summary: {
        totalEmployees: employees.length,
        activeEmployees: employeesByStatus['ACTIVE'] || 0,
        averageAttendanceRate: Math.round(averageAttendanceRate),
        approvedLeaves: leaveRequests.length,
        completedTrainings: trainings.length,
      },
      employeesByDepartment: Object.entries(employeesByDepartment).map(([department, count]) => ({
        department,
        count,
      })),
      employeesByStatus: Object.entries(employeesByStatus).map(([status, count]) => ({
        status,
        count,
      })),
    };
  }

  // ==================== Safety Reports ====================

  async getSafetyReport(startDate?: Date, endDate?: Date) {
    const where: any = {};
    if (startDate || endDate) {
      where.scheduledDate = {};
      if (startDate) where.scheduledDate.gte = startDate;
      if (endDate) where.scheduledDate.lte = endDate;
    }

    const [inspections, trainings, certifications, drills] = await Promise.all([
      this.prisma.safetyInspection.findMany({ where }),
      this.prisma.safetyTraining.findMany({ where }),
      this.prisma.safetyCertification.findMany(),
      this.prisma.safetyDrill.findMany({ where }),
    ]);

    const inspectionsByStatus = inspections.reduce((acc, insp) => {
      acc[insp.status] = (acc[insp.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const passedInspections = inspections.filter(i => i.passed === true).length;
    const failedInspections = inspections.filter(i => i.passed === false).length;
    const passRate = inspections.length > 0 ? (passedInspections / inspections.length) * 100 : 0;

    const completedTrainings = trainings.filter(t => t.completed).length;
    const totalParticipants = trainings.reduce((sum, t) => sum + (t.completedBy?.length || 0), 0);

    const activeCertifications = certifications.filter(c => c.status === 'ACTIVE').length;
    const expiringCertifications = certifications.filter(c => c.status === 'EXPIRING_SOON').length;

    const completedDrills = drills.filter(d => d.completed).length;
    const averageDrillRating = drills.length > 0
      ? drills.reduce((sum, d) => sum + (d.successRating || 0), 0) / drills.length
      : 0;

    return {
      summary: {
        totalInspections: inspections.length,
        passedInspections,
        failedInspections,
        inspectionPassRate: Math.round(passRate),
        completedTrainings,
        totalTrainingParticipants: totalParticipants,
        activeCertifications,
        expiringCertifications,
        completedDrills,
        averageDrillRating: Math.round(averageDrillRating),
      },
      inspectionsByStatus: Object.entries(inspectionsByStatus).map(([status, count]) => ({
        status,
        count,
      })),
    };
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class AiService {
  constructor(private prisma: PrismaService) {}

  // ==================== Project Summaries ====================

  async generateProjectSummary(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        milestones: true,
        tasks: true,
        productionLogs: {
          orderBy: { date: 'desc' },
          take: 10,
        },
        fieldReports: {
          where: { priority: 'CRITICAL' },
          orderBy: { reportDate: 'desc' },
          take: 5,
        },
        expenses: {
          where: { status: 'APPROVED' },
        },
        budgets: true,
      },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Calculate statistics
    const completedMilestones = project.milestones.filter(
      (m) => m.isCompleted === true,
    ).length;
    const totalMilestones = project.milestones.length;
    const completedTasks = project.tasks.filter(
      (t) => t.status === 'COMPLETED',
    ).length;
    const totalTasks = project.tasks.length;
    const totalExpenses = project.expenses.reduce(
      (sum, e) => sum + e.amount,
      0,
    );
    const totalProduction = project.productionLogs.reduce(
      (sum, p) => sum + p.quantity,
      0,
    );

    // Generate AI summary (simulated - in production, call OpenAI API)
    const summary = {
      projectId: project.id,
      projectName: project.name,
      projectCode: project.projectCode,
      status: project.status,
      progress: project.progress,
      overallHealth: this.calculateProjectHealth(project),
      summary: this.generateTextSummary(project, {
        completedMilestones,
        totalMilestones,
        completedTasks,
        totalTasks,
        totalExpenses,
        totalProduction,
      }),
      insights: this.generateInsights(project, {
        completedMilestones,
        totalMilestones,
        completedTasks,
        totalTasks,
        totalExpenses,
        totalProduction,
      }),
      recommendations: this.generateRecommendations(project),
      risks: this.identifyRisks(project),
      nextSteps: this.suggestNextSteps(project),
      statistics: {
        milestones: {
          completed: completedMilestones,
          total: totalMilestones,
          percentage:
            totalMilestones > 0
              ? Math.round((completedMilestones / totalMilestones) * 100)
              : 0,
        },
        tasks: {
          completed: completedTasks,
          total: totalTasks,
          percentage:
            totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        },
        budget: {
          estimated: project.estimatedBudget || 0,
          actual: project.actualCost,
          expenses: totalExpenses,
          variance: (project.estimatedBudget || 0) - project.actualCost,
        },
        production: {
          totalProduction,
          recentLogs: project.productionLogs.length,
        },
        reports: {
          criticalIssues: project.fieldReports.length,
        },
      },
    };

    return summary;
  }

  private calculateProjectHealth(project: any): string {
    const progress = project.progress;
    const budgetVariance =
      ((project.estimatedBudget || 0) - project.actualCost) /
      (project.estimatedBudget || 1);

    if (progress >= 90 && budgetVariance >= 0) return 'EXCELLENT';
    if (progress >= 70 && budgetVariance >= -0.1) return 'GOOD';
    if (progress >= 50 && budgetVariance >= -0.2) return 'FAIR';
    if (progress >= 30) return 'AT_RISK';
    return 'CRITICAL';
  }

  private generateTextSummary(project: any, stats: any): string {
    const healthDescriptions = {
      EXCELLENT:
        'The project is performing exceptionally well, ahead of schedule and within budget.',
      GOOD: 'The project is progressing well with minor deviations from the plan.',
      FAIR: 'The project is progressing but requires attention to stay on track.',
      AT_RISK:
        'The project is facing challenges and needs immediate management attention.',
      CRITICAL:
        'The project is in critical condition and requires urgent intervention.',
    };

    const health = this.calculateProjectHealth(project);

    return `${project.name} (${project.projectCode}) is currently ${project.status.toLowerCase()} with ${project.progress}% completion. ${healthDescriptions[health as keyof typeof healthDescriptions]} ${stats.completedMilestones} of ${stats.totalMilestones} milestones have been completed, and ${stats.completedTasks} of ${stats.totalTasks} tasks are done. The project has spent ${project.actualCost.toLocaleString()} against an estimated budget of ${(project.estimatedBudget || 0).toLocaleString()}.`;
  }

  private generateInsights(project: any, stats: any): string[] {
    const insights: string[] = [];

    // Progress insights
    if (project.progress >= 75) {
      insights.push('Project is in advanced stage of completion.');
    } else if (project.progress < 30) {
      insights.push('Project is in early phase and requires close monitoring.');
    }

    // Budget insights
    const budgetVariance =
      (project.estimatedBudget || 0) - project.actualCost;
    if (budgetVariance < 0) {
      insights.push(
        `Project is over budget by ${Math.abs(budgetVariance).toLocaleString()}. Cost management required.`,
      );
    } else if (budgetVariance > (project.estimatedBudget || 0) * 0.2) {
      insights.push(
        'Project is significantly under budget. Consider expanding scope.',
      );
    }

    // Task completion insights
    const taskCompletion = (stats.completedTasks / stats.totalTasks) * 100;
    if (taskCompletion < project.progress - 10) {
      insights.push(
        'Task completion is lagging behind overall progress. Review task assignments.',
      );
    }

    // Critical issues
    if (stats.reports?.criticalIssues > 0) {
      insights.push(
        `${stats.reports.criticalIssues} critical field reports require immediate attention.`,
      );
    }

    return insights;
  }

  private generateRecommendations(project: any): string[] {
    const recommendations: string[] = [];
    const totalMilestones = project.milestones.length;

    if (project.status === 'ACTIVE' && project.progress < 50) {
      recommendations.push(
        'Consider increasing resource allocation to accelerate progress.',
      );
    }

    if (project.actualCost > (project.estimatedBudget || 0) * 0.9) {
      recommendations.push(
        'Budget is nearly exhausted. Conduct cost review and consider budget adjustment.',
      );
    }

    if (project.fieldReports.length > 0) {
      recommendations.push(
        'Address critical field reports to prevent project delays.',
      );
    }

    if (totalMilestones > 0 && project.milestones.filter((m) => !m.isCompleted).length > totalMilestones * 0.3) {
      recommendations.push(
        'Focus on completing pending milestones to maintain project momentum.',
      );
    }

    recommendations.push(
      'Schedule regular stakeholder updates to maintain transparency.',
    );

    return recommendations;
  }

  private identifyRisks(project: any): Array<{ level: string; description: string }> {
    const risks: Array<{ level: string; description: string }> = [];

    // Budget risk
    if (project.actualCost > (project.estimatedBudget || 0)) {
      risks.push({
        level: 'HIGH',
        description: 'Project has exceeded estimated budget',
      });
    }

    // Timeline risk
    const now = new Date();
    const endDate = new Date(project.endDate);
    const daysRemaining = Math.ceil(
      (endDate.getTime() - now.getTime()) / (1000 * 3600 * 24),
    );

    if (daysRemaining < 30 && project.progress < 80) {
      risks.push({
        level: 'HIGH',
        description: 'Project timeline at risk - less than 30 days remaining',
      });
    }

    // Critical issues risk
    if (project.fieldReports.length >= 3) {
      risks.push({
        level: 'MEDIUM',
        description: 'Multiple critical field reports indicate ongoing issues',
      });
    }

    if (risks.length === 0) {
      risks.push({
        level: 'LOW',
        description: 'No significant risks identified at this time',
      });
    }

    return risks;
  }

  private suggestNextSteps(project: any): string[] {
    const steps: string[] = [];

    if (project.progress < 25) {
      steps.push('Complete project setup and initial planning phase');
      steps.push('Assign resources to critical path tasks');
    } else if (project.progress < 75) {
      steps.push('Monitor milestone completion rates');
      steps.push('Address any blocked tasks or milestones');
      steps.push('Conduct mid-project review with stakeholders');
    } else {
      steps.push('Begin project closeout procedures');
      steps.push('Document lessons learned');
      steps.push('Plan transition and handover activities');
    }

    steps.push('Update project documentation and progress reports');

    return steps;
  }

  // ==================== Procurement Advisor ====================

  async generateProcurementAdvice(filters?: {
    category?: string;
    budgetRange?: { min: number; max: number };
  }) {
    // Get inventory low stock items (items below reorder level)
    const lowStockItems = await this.prisma.stockItem.findMany({
      where: {},
      include: {
        warehouse: true,
      },
      take: 50,
    }).then(items => items.filter(item => item.currentQuantity <= item.reorderLevel));

    // Get recent expenses by category
    const expenses = await this.prisma.expense.findMany({
      where: {
        status: 'APPROVED',
        category: filters?.category as any,
      },
      orderBy: { expenseDate: 'desc' },
      take: 50,
    });

    // Get suppliers with ratings
    const suppliers = await this.prisma.supplier.findMany({
      where: { isActive: true },
      include: {
        payments: {
          where: { status: 'COMPLETED' },
        },
      },
    });

    const advice = {
      urgentPurchases: this.identifyUrgentPurchases(lowStockItems),
      supplierRecommendations: this.recommendSuppliers(suppliers),
      costSavingOpportunities: this.identifyCostSavings(expenses),
      budgetAlerts: await this.generateBudgetAlerts(filters?.category),
      seasonalRecommendations: this.generateSeasonalRecommendations(),
      bulkPurchaseOpportunities: this.identifyBulkOpportunities(lowStockItems),
    };

    return advice;
  }

  private identifyUrgentPurchases(items: any[]): any[] {
    return items
      .filter((item) => item.currentQuantity <= item.reorderLevel)
      .map((item) => ({
        itemCode: item.itemCode,
        name: item.name,
        category: item.category,
        currentQuantity: item.currentQuantity,
        reorderLevel: item.reorderLevel,
        urgency: 'HIGH',
        estimatedCost: item.unitPrice * item.reorderLevel * 1.2, // 20% buffer
        warehouse: item.warehouse?.name,
      }));
  }

  private recommendSuppliers(suppliers: any[]): any[] {
    return suppliers
      .map((supplier) => ({
        supplierCode: supplier.supplierCode,
        name: supplier.name,
        rating: supplier.rating || 0,
        totalPayments: supplier.payments.length,
        totalSpent: supplier.payments.reduce(
          (sum: number, p: any) => sum + p.amount,
          0,
        ),
        paymentTerms: supplier.paymentTerms,
        category: supplier.category,
      }))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 10);
  }

  private identifyCostSavings(expenses: any[]): string[] {
    const savings: string[] = [];

    // Group expenses by category
    const byCategory = expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>);

    // Identify high-spend categories
    const sortedCategories = Object.entries(byCategory).sort(
      ([, a], [, b]) => (b as number) - (a as number),
    );

    if (sortedCategories.length > 0) {
      const [topCategory, topAmount] = sortedCategories[0];
      savings.push(
        `${topCategory} represents the highest expense category. Consider negotiating bulk discounts.`,
      );
    }

    savings.push(
      'Review supplier contracts for potential renegotiation opportunities.',
    );
    savings.push(
      'Consider consolidating suppliers to achieve volume discounts.',
    );

    return savings;
  }

  private async generateBudgetAlerts(category?: string): Promise<string[]> {
    const budgets = await this.prisma.budget.findMany({
      where: {
        category: category as any,
        endDate: { gte: new Date() },
      },
    });

    const alerts: string[] = [];

    budgets.forEach((budget) => {
      const utilization =
        (budget.spentAmount / budget.allocatedAmount) * 100;
      if (utilization > 90) {
        alerts.push(
          `${budget.name}: ${utilization.toFixed(1)}% utilized - approaching limit`,
        );
      }
    });

    return alerts;
  }

  private generateSeasonalRecommendations(): string[] {
    const month = new Date().getMonth();
    const recommendations: string[] = [];

    // Simple seasonal advice
    if (month >= 5 && month <= 8) {
      // Rainy season in Ghana
      recommendations.push(
        'Rainy season: Stock up on waterproofing materials and drainage equipment',
      );
      recommendations.push(
        'Consider increasing fuel reserves as transportation may be affected',
      );
    } else {
      recommendations.push(
        'Dry season: Optimal time for major equipment purchases and installations',
      );
      recommendations.push('Plan for increased dust control measures');
    }

    return recommendations;
  }

  private identifyBulkOpportunities(items: any[]): string[] {
    const opportunities: string[] = [];

    const lowStockCount = items.filter(
      (item) => item.currentQuantity <= item.reorderLevel * 1.2,
    ).length;

    if (lowStockCount >= 5) {
      opportunities.push(
        `${lowStockCount} items are low on stock. Consider bulk ordering to reduce per-unit costs.`,
      );
    }

    opportunities.push(
      'Coordinate with other departments to consolidate purchase orders.',
    );

    return opportunities;
  }

  // ==================== General AI Insights ====================

  async getDashboardInsights() {
    const [projects, expenses, budgets, assets] = await Promise.all([
      this.prisma.project.count({ where: { status: 'ACTIVE' } }),
      this.prisma.expense.count({ where: { status: 'PENDING' } }),
      this.prisma.budget.findMany({
        where: { endDate: { gte: new Date() } },
      }),
      this.prisma.asset.count({ where: { status: 'MAINTENANCE' } }),
    ]);

    const insights: string[] = [];

    if (projects > 10) {
      insights.push(
        `You have ${projects} active projects. Consider prioritization to ensure resource optimization.`,
      );
    }

    if (expenses > 5) {
      insights.push(
        `${expenses} expenses pending approval. Timely approvals help maintain cash flow.`,
      );
    }

    const overbudget = budgets.filter(
      (b) => b.spentAmount > b.allocatedAmount,
    ).length;
    if (overbudget > 0) {
      insights.push(
        `${overbudget} budgets are over-allocated. Review and adjust budget planning.`,
      );
    }

    if (assets > 0) {
      insights.push(
        `${assets} assets in maintenance. Ensure maintenance schedules are optimized.`,
      );
    }

    return {
      summary: `System is managing ${projects} active projects with good operational health.`,
      insights,
      metrics: {
        activeProjects: projects,
        pendingExpenses: expenses,
        overbudgetCount: overbudget,
        assetsInMaintenance: assets,
      },
    };
  }
}

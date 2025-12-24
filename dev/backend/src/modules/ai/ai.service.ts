import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import axios from "axios";

@Injectable()
export class AiService {
  constructor(private prisma: PrismaService) {}

  private async getOpenAiRuntime() {
    const keys = await this.prisma.systemSetting.findMany({
      where: {
        key: {
          in: [
            "AI_ENABLED",
            "AI_DEFAULT_PROVIDER",
            "AI_OPENAI_API_KEY",
            "AI_OPENAI_MODEL",
          ],
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const map = new Map(keys.map((k) => [k.key, k.value] as const));

    const enabledRaw =
      map.get("AI_ENABLED") ??
      process.env.AI_ENABLED ??
      process.env.OPENAI_ENABLED;
    const providerRaw =
      map.get("AI_DEFAULT_PROVIDER") ??
      process.env.AI_DEFAULT_PROVIDER ??
      process.env.AI_PROVIDER ??
      "OPENAI";
    const apiKey =
      map.get("AI_OPENAI_API_KEY") ??
      process.env.AI_OPENAI_API_KEY ??
      process.env.OPENAI_API_KEY ??
      null;
    const model =
      map.get("AI_OPENAI_MODEL") ??
      process.env.AI_OPENAI_MODEL ??
      process.env.OPENAI_MODEL ??
      "gpt-4o-mini";

    const enabled = enabledRaw === "true";
    const provider = typeof providerRaw === "string" ? providerRaw.toUpperCase() : "OPENAI";

    return {
      enabled,
      provider,
      apiKey,
      model,
    };
  }

  private async openAiJson<T>(opts: {
    apiKey: string;
    model: string;
    system: string;
    user: string;
    temperature?: number;
  }): Promise<T> {
    const res = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: opts.model,
        temperature: opts.temperature ?? 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: opts.system },
          { role: "user", content: opts.user },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${opts.apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 60_000,
      },
    );

    const content = res?.data?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || content.trim().length === 0) {
      throw new Error("OpenAI returned empty content");
    }
    return JSON.parse(content) as T;
  }

  private async tryOpenAiProjectSummary(
    project: any,
    stats: {
      completedMilestones: number;
      totalMilestones: number;
      completedTasks: number;
      totalTasks: number;
      totalExpenses: number;
      totalProduction: number;
    },
  ): Promise<
    | {
        summary?: string;
        insights?: string[];
        recommendations?: string[];
        risks?: any[];
        nextSteps?: string[];
      }
    | null
  > {
    const cfg = await this.getOpenAiRuntime();
    if (!cfg.enabled || cfg.provider !== "OPENAI" || !cfg.apiKey) return null;

    const payload = {
      project: {
        id: project.id,
        name: project.name,
        projectCode: project.projectCode,
        status: project.status,
        progress: project.progress,
        estimatedBudget: project.estimatedBudget ?? null,
        actualCost: project.actualCost ?? null,
        startDate: project.startDate ?? null,
        endDate: project.endDate ?? null,
        milestones: (project.milestones || []).slice(0, 30).map((m: any) => ({
          title: m.title,
          isCompleted: m.isCompleted,
          dueDate: m.dueDate ?? null,
        })),
        tasks: (project.tasks || []).slice(0, 30).map((t: any) => ({
          title: t.title,
          status: t.status,
          priority: t.priority ?? null,
          dueDate: t.dueDate ?? null,
        })),
        recentProductionLogs: (project.productionLogs || []).slice(0, 10),
        criticalFieldReports: (project.fieldReports || []).slice(0, 10).map((r: any) => ({
          title: r.title,
          description: r.description ?? null,
          reportDate: r.reportDate ?? null,
          priority: r.priority,
        })),
      },
      stats,
    };

    try {
      return await this.openAiJson<{
        summary: string;
        insights: string[];
        recommendations: string[];
        risks: any[];
        nextSteps: string[];
      }>({
        apiKey: cfg.apiKey,
        model: cfg.model,
        system:
          "You are an assistant for a mining ERP. Return concise business-friendly project insights. Output must be valid JSON.",
        user:
          "Given the following project data, generate a JSON object with keys: summary (string), insights (string[]), recommendations (string[]), risks (array of {level, description}), nextSteps (string[]). Keep arrays <= 8 items. Data: " +
          JSON.stringify(payload),
        temperature: 0.2,
      });
    } catch {
      return null;
    }
  }

  // ==================== Project Summaries ====================

  async generateProjectSummary(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        milestones: true,
        tasks: true,
        productionLogs: {
          orderBy: { date: "desc" },
          take: 10,
        },
        fieldReports: {
          where: { priority: "CRITICAL" },
          orderBy: { reportDate: "desc" },
          take: 5,
        },
        expenses: {
          where: { status: "APPROVED" },
        },
        budgets: true,
      },
    });

    if (!project) {
      throw new NotFoundException("Project not found");
    }

    // Calculate statistics
    const completedMilestones = project.milestones.filter(
      (m) => m.isCompleted === true,
    ).length;
    const totalMilestones = project.milestones.length;
    const completedTasks = project.tasks.filter(
      (t) => t.status === "COMPLETED",
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

    const aiSummary = await this.tryOpenAiProjectSummary(project, {
      completedMilestones,
      totalMilestones,
      completedTasks,
      totalTasks,
      totalExpenses,
      totalProduction,
    });

    // Generate AI summary (simulated - in production, call OpenAI API)
    const summary = {
      projectId: project.id,
      projectName: project.name,
      projectCode: project.projectCode,
      status: project.status,
      progress: project.progress,
      overallHealth: this.calculateProjectHealth(project),
      summary:
        aiSummary?.summary ||
        this.generateTextSummary(project, {
          completedMilestones,
          totalMilestones,
          completedTasks,
          totalTasks,
          totalExpenses,
          totalProduction,
        }),
      insights:
        (aiSummary?.insights && Array.isArray(aiSummary.insights)
          ? aiSummary.insights
          : null) ||
        this.generateInsights(project, {
          completedMilestones,
          totalMilestones,
          completedTasks,
          totalTasks,
          totalExpenses,
          totalProduction,
        }),
      recommendations:
        (aiSummary?.recommendations && Array.isArray(aiSummary.recommendations)
          ? aiSummary.recommendations
          : null) || this.generateRecommendations(project),
      risks:
        (aiSummary?.risks && Array.isArray(aiSummary.risks)
          ? aiSummary.risks
          : null) || this.identifyRisks(project),
      nextSteps:
        (aiSummary?.nextSteps && Array.isArray(aiSummary.nextSteps)
          ? aiSummary.nextSteps
          : null) || this.suggestNextSteps(project),
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
            totalTasks > 0
              ? Math.round((completedTasks / totalTasks) * 100)
              : 0,
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

    if (progress >= 90 && budgetVariance >= 0) return "EXCELLENT";
    if (progress >= 70 && budgetVariance >= -0.1) return "GOOD";
    if (progress >= 50 && budgetVariance >= -0.2) return "FAIR";
    if (progress >= 30) return "AT_RISK";
    return "CRITICAL";
  }

  private generateTextSummary(project: any, stats: any): string {
    const healthDescriptions = {
      EXCELLENT:
        "The project is performing exceptionally well, ahead of schedule and within budget.",
      GOOD: "The project is progressing well with minor deviations from the plan.",
      FAIR: "The project is progressing but requires attention to stay on track.",
      AT_RISK:
        "The project is facing challenges and needs immediate management attention.",
      CRITICAL:
        "The project is in critical condition and requires urgent intervention.",
    };

    const health = this.calculateProjectHealth(project);

    return `${project.name} (${project.projectCode}) is currently ${project.status.toLowerCase()} with ${project.progress}% completion. ${healthDescriptions[health as keyof typeof healthDescriptions]} ${stats.completedMilestones} of ${stats.totalMilestones} milestones have been completed, and ${stats.completedTasks} of ${stats.totalTasks} tasks are done. The project has spent ${project.actualCost.toLocaleString()} against an estimated budget of ${(project.estimatedBudget || 0).toLocaleString()}.`;
  }

  private generateInsights(project: any, stats: any): string[] {
    const insights: string[] = [];

    // Progress insights
    if (project.progress >= 75) {
      insights.push("Project is in advanced stage of completion.");
    } else if (project.progress < 30) {
      insights.push("Project is in early phase and requires close monitoring.");
    }

    // Budget insights
    const budgetVariance = (project.estimatedBudget || 0) - project.actualCost;
    if (budgetVariance < 0) {
      insights.push(
        `Project is over budget by ${Math.abs(budgetVariance).toLocaleString()}. Cost management required.`,
      );
    } else if (budgetVariance > (project.estimatedBudget || 0) * 0.2) {
      insights.push(
        "Project is significantly under budget. Consider expanding scope.",
      );
    }

    // Task completion insights
    const taskCompletion = (stats.completedTasks / stats.totalTasks) * 100;
    if (taskCompletion < project.progress - 10) {
      insights.push(
        "Task completion is lagging behind overall progress. Review task assignments.",
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

    if (project.status === "ACTIVE" && project.progress < 50) {
      recommendations.push(
        "Consider increasing resource allocation to accelerate progress.",
      );
    }

    if (project.actualCost > (project.estimatedBudget || 0) * 0.9) {
      recommendations.push(
        "Budget is nearly exhausted. Conduct cost review and consider budget adjustment.",
      );
    }

    if (project.fieldReports.length > 0) {
      recommendations.push(
        "Address critical field reports to prevent project delays.",
      );
    }

    if (
      totalMilestones > 0 &&
      project.milestones.filter((m) => !m.isCompleted).length >
        totalMilestones * 0.3
    ) {
      recommendations.push(
        "Focus on completing pending milestones to maintain project momentum.",
      );
    }

    recommendations.push(
      "Schedule regular stakeholder updates to maintain transparency.",
    );

    return recommendations;
  }

  private identifyRisks(
    project: any,
  ): Array<{ level: string; description: string }> {
    const risks: Array<{ level: string; description: string }> = [];

    // Budget risk
    if (project.actualCost > (project.estimatedBudget || 0)) {
      risks.push({
        level: "HIGH",
        description: "Project has exceeded estimated budget",
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
        level: "HIGH",
        description: "Project timeline at risk - less than 30 days remaining",
      });
    }

    // Critical issues risk
    if (project.fieldReports.length >= 3) {
      risks.push({
        level: "MEDIUM",
        description: "Multiple critical field reports indicate ongoing issues",
      });
    }

    if (risks.length === 0) {
      risks.push({
        level: "LOW",
        description: "No significant risks identified at this time",
      });
    }

    return risks;
  }

  private suggestNextSteps(project: any): string[] {
    const steps: string[] = [];

    if (project.progress < 25) {
      steps.push("Complete project setup and initial planning phase");
      steps.push("Assign resources to critical path tasks");
    } else if (project.progress < 75) {
      steps.push("Monitor milestone completion rates");
      steps.push("Address any blocked tasks or milestones");
      steps.push("Conduct mid-project review with stakeholders");
    } else {
      steps.push("Begin project closeout procedures");
      steps.push("Document lessons learned");
      steps.push("Plan transition and handover activities");
    }

    steps.push("Update project documentation and progress reports");

    return steps;
  }

  // ==================== Procurement Advisor ====================

  async generateProcurementAdvice(filters?: {
    category?: string;
    budgetRange?: { min: number; max: number };
  }) {
    // Get inventory low stock items (items below reorder level)
    const lowStockItems = await this.prisma.stockItem
      .findMany({
        where: {},
        include: {
          warehouse: true,
        },
        take: 50,
      })
      .then((items) =>
        items.filter((item) => item.currentQuantity <= item.reorderLevel),
      );

    // Get recent expenses by category
    const expenses = await this.prisma.expense.findMany({
      where: {
        status: "APPROVED",
        category: filters?.category as any,
      },
      orderBy: { expenseDate: "desc" },
      take: 50,
    });

    // Get suppliers with ratings
    const suppliers = await this.prisma.supplier.findMany({
      where: { isActive: true },
      include: {
        payments: {
          where: { status: "COMPLETED" },
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

    const cfg = await this.getOpenAiRuntime();
    if (cfg.enabled && cfg.provider === "OPENAI" && cfg.apiKey) {
      try {
        const out = await this.openAiJson<{ costSavingOpportunities?: string[] }>(
          {
            apiKey: cfg.apiKey,
            model: cfg.model,
            system: "You are a procurement advisor. Output must be valid JSON.",
            user:
              "Return JSON {costSavingOpportunities: string[]} (max 6). Data: " +
              JSON.stringify({
                urgentPurchases: advice.urgentPurchases.slice(0, 10),
                supplierRecommendations: advice.supplierRecommendations.slice(0, 5),
              }),
            temperature: 0.2,
          },
        );
        if (Array.isArray(out?.costSavingOpportunities)) {
          advice.costSavingOpportunities = out.costSavingOpportunities.slice(0, 6);
        }
      } catch {}
    }

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
        urgency: "HIGH",
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
    const byCategory = expenses.reduce(
      (acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Identify high-spend categories
    const sortedCategories = Object.entries(byCategory).sort(
      ([, a], [, b]) => (b as number) - (a as number),
    );

    if (sortedCategories.length > 0) {
      const [topCategory] = sortedCategories[0];
      savings.push(
        `${topCategory} represents the highest expense category. Consider negotiating bulk discounts.`,
      );
    }

    savings.push(
      "Review supplier contracts for potential renegotiation opportunities.",
    );
    savings.push(
      "Consider consolidating suppliers to achieve volume discounts.",
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
      const utilization = (budget.spentAmount / budget.allocatedAmount) * 100;
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
        "Rainy season: Stock up on waterproofing materials and drainage equipment",
      );
      recommendations.push(
        "Consider increasing fuel reserves as transportation may be affected",
      );
    } else {
      recommendations.push(
        "Dry season: Optimal time for major equipment purchases and installations",
      );
      recommendations.push("Plan for increased dust control measures");
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
      "Coordinate with other departments to consolidate purchase orders.",
    );

    return opportunities;
  }

  // ==================== General AI Insights ====================

  async getDashboardInsights() {
    const [projects, expenses, budgets, assets] = await Promise.all([
      this.prisma.project.count({ where: { status: "ACTIVE" } }),
      this.prisma.expense.count({ where: { status: "PENDING" } }),
      this.prisma.budget.findMany({
        where: { endDate: { gte: new Date() } },
      }),
      this.prisma.asset.count({ where: { status: "MAINTENANCE" } }),
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

    let summary = `System is managing ${projects} active projects with good operational health.`;
    let finalInsights = insights;
    const cfg = await this.getOpenAiRuntime();
    if (cfg.enabled && cfg.provider === "OPENAI" && cfg.apiKey) {
      try {
        const out = await this.openAiJson<{ summary?: string; insights?: string[] }>({
          apiKey: cfg.apiKey,
          model: cfg.model,
          system:
            "You generate concise executive dashboard insights for a mining ERP. Output must be valid JSON.",
          user:
            "Return JSON {summary: string, insights: string[]} (<=6 insights). Data: " +
            JSON.stringify({
              metrics: {
                activeProjects: projects,
                pendingExpenses: expenses,
                overbudgetCount: budgets.filter((b) => b.spentAmount > b.allocatedAmount).length,
                assetsInMaintenance: assets,
              },
            }),
          temperature: 0.2,
        });
        if (typeof out?.summary === "string" && out.summary.trim().length > 0) {
          summary = out.summary.trim();
        }
        if (Array.isArray(out?.insights) && out.insights.length > 0) {
          finalInsights = out.insights.slice(0, 6);
        }
      } catch {}
    }

    return {
      summary,
      insights: finalInsights,
      metrics: {
        activeProjects: projects,
        pendingExpenses: expenses,
        overbudgetCount: overbudget,
        assetsInMaintenance: assets,
      },
    };
  }

  // ==================== Maintenance Predictor ====================

  async predictMaintenanceNeeds() {
    // Get all active assets with maintenance history
    const assets = await this.prisma.asset.findMany({
      where: {
        status: {
          in: ["ACTIVE", "MAINTENANCE"],
        },
      },
      include: {
        maintenanceLogs: {
          orderBy: { performedAt: "desc" },
          take: 10,
        },
      },
    });

    const predictions = assets.map((asset) => {
      const riskScore = this.calculateBreakdownRisk(asset);
      const riskLevel = this.getRiskLevel(riskScore);
      const daysUntilMaintenance = this.calculateDaysUntilMaintenance(asset);
      const recommendations = this.generateMaintenanceRecommendations(
        asset,
        riskScore,
        daysUntilMaintenance,
      );

      return {
        assetId: asset.id,
        assetCode: asset.assetCode,
        name: asset.name,
        category: asset.category,
        condition: asset.condition,
        riskScore,
        riskLevel,
        daysUntilMaintenance,
        lastMaintenanceAt: asset.lastMaintenanceAt,
        nextMaintenanceAt: asset.nextMaintenanceAt,
        recommendations,
        maintenanceFrequency: this.calculateMaintenanceFrequency(
          asset.maintenanceLogs,
        ),
        totalMaintenanceCost: asset.maintenanceLogs.reduce(
          (sum, log) => sum + (log.cost || 0),
          0,
        ),
        maintenanceCount: asset.maintenanceLogs.length,
        urgency:
          riskScore > 70
            ? "CRITICAL"
            : riskScore > 50
              ? "HIGH"
              : riskScore > 30
                ? "MEDIUM"
                : "LOW",
      };
    });

    // Sort by risk score descending
    predictions.sort((a, b) => b.riskScore - a.riskScore);

    let summary = this.generateMaintenanceSummary(predictions);
    const cfg = await this.getOpenAiRuntime();
    if (cfg.enabled && cfg.provider === "OPENAI" && cfg.apiKey) {
      try {
        const out = await this.openAiJson<{ summary?: string }>({
          apiKey: cfg.apiKey,
          model: cfg.model,
          system:
            "You generate concise maintenance summary for a mining ERP dashboard. Output must be valid JSON.",
          user:
            "Return JSON {summary: string}. Use this data: " +
            JSON.stringify({
              topRisks: predictions.slice(0, 10).map((p) => ({
                assetCode: p.assetCode,
                name: p.name,
                category: p.category,
                condition: p.condition,
                riskScore: p.riskScore,
                riskLevel: p.riskLevel,
                urgency: p.urgency,
                daysUntilMaintenance: p.daysUntilMaintenance,
              })),
            }),
          temperature: 0.2,
        });
        if (typeof out?.summary === "string" && out.summary.trim().length > 0) {
          summary = out.summary.trim();
        }
      } catch {}
    }

    return {
      predictions,
      summary,
      statistics: {
        totalAssets: assets.length,
        criticalRisk: predictions.filter((p) => p.riskLevel === "CRITICAL")
          .length,
        highRisk: predictions.filter((p) => p.riskLevel === "HIGH").length,
        mediumRisk: predictions.filter((p) => p.riskLevel === "MEDIUM").length,
        lowRisk: predictions.filter((p) => p.riskLevel === "LOW").length,
        overdueMaintenances: predictions.filter(
          (p) => p.daysUntilMaintenance < 0,
        ).length,
      },
    };
  }

  private calculateBreakdownRisk(asset: any): number {
    let riskScore = 0;

    // Factor 1: Days since last maintenance (40% weight)
    const daysSinceLastMaintenance = asset.lastMaintenanceAt
      ? Math.floor(
          (Date.now() - new Date(asset.lastMaintenanceAt).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 9999;

    if (daysSinceLastMaintenance > 180) riskScore += 40;
    else if (daysSinceLastMaintenance > 90) riskScore += 30;
    else if (daysSinceLastMaintenance > 60) riskScore += 20;
    else if (daysSinceLastMaintenance > 30) riskScore += 10;

    // Factor 2: Asset age (20% weight)
    const ageInYears =
      (Date.now() - new Date(asset.purchaseDate).getTime()) /
      (1000 * 60 * 60 * 24 * 365);

    if (ageInYears > 10) riskScore += 20;
    else if (ageInYears > 7) riskScore += 15;
    else if (ageInYears > 5) riskScore += 10;
    else if (ageInYears > 3) riskScore += 5;

    // Factor 3: Asset condition (25% weight)
    const conditionScores: Record<string, number> = {
      EXCELLENT: 0,
      GOOD: 5,
      FAIR: 15,
      POOR: 20,
      CRITICAL: 25,
    };
    riskScore += conditionScores[asset.condition] || 0;

    // Factor 4: Overdue maintenance (15% weight)
    if (asset.nextMaintenanceAt) {
      const daysOverdue = Math.floor(
        (Date.now() - new Date(asset.nextMaintenanceAt).getTime()) /
          (1000 * 60 * 60 * 24),
      );
      if (daysOverdue > 30) riskScore += 15;
      else if (daysOverdue > 14) riskScore += 10;
      else if (daysOverdue > 7) riskScore += 5;
    }

    return Math.min(riskScore, 100);
  }

  private getRiskLevel(riskScore: number): string {
    if (riskScore >= 70) return "CRITICAL";
    if (riskScore >= 50) return "HIGH";
    if (riskScore >= 30) return "MEDIUM";
    return "LOW";
  }

  private calculateDaysUntilMaintenance(asset: any): number {
    if (!asset.nextMaintenanceAt) return 9999;

    return Math.floor(
      (new Date(asset.nextMaintenanceAt).getTime() - Date.now()) /
        (1000 * 60 * 60 * 24),
    );
  }

  private calculateMaintenanceFrequency(logs: any[]): number {
    if (logs.length < 2) return 0;

    const sortedLogs = logs.sort(
      (a, b) =>
        new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime(),
    );

    let totalDays = 0;
    for (let i = 0; i < sortedLogs.length - 1; i++) {
      const days = Math.floor(
        (new Date(sortedLogs[i].performedAt).getTime() -
          new Date(sortedLogs[i + 1].performedAt).getTime()) /
          (1000 * 60 * 60 * 24),
      );
      totalDays += days;
    }

    return Math.floor(totalDays / (sortedLogs.length - 1));
  }

  private generateMaintenanceRecommendations(
    asset: any,
    riskScore: number,
    daysUntilMaintenance: number,
  ): string[] {
    const recommendations: string[] = [];

    if (riskScore >= 70) {
      recommendations.push(
        "URGENT: Schedule immediate inspection and maintenance.",
      );
      recommendations.push(
        "Consider temporary equipment substitution to prevent breakdown.",
      );
    } else if (riskScore >= 50) {
      recommendations.push(
        "Schedule maintenance within next 7 days to prevent breakdown.",
      );
    }

    if (daysUntilMaintenance < 0) {
      recommendations.push(
        `Maintenance is ${Math.abs(daysUntilMaintenance)} days overdue.`,
      );
    } else if (daysUntilMaintenance <= 7) {
      recommendations.push(
        `Maintenance due in ${daysUntilMaintenance} days. Plan accordingly.`,
      );
    }

    if (asset.condition === "POOR" || asset.condition === "CRITICAL") {
      recommendations.push(
        "Asset condition is deteriorating. Consider replacement or major overhaul.",
      );
    }

    const ageInYears =
      (Date.now() - new Date(asset.purchaseDate).getTime()) /
      (1000 * 60 * 60 * 24 * 365);
    if (ageInYears > 10) {
      recommendations.push(
        "Equipment is over 10 years old. Evaluate cost of maintenance vs. replacement.",
      );
    }

    if (asset.maintenanceLogs.length === 0) {
      recommendations.push(
        "No maintenance history found. Schedule initial inspection.",
      );
    }

    if (recommendations.length === 0) {
      recommendations.push("Continue regular maintenance schedule.");
    }

    return recommendations;
  }

  private generateMaintenanceSummary(predictions: any[]): string {
    const critical = predictions.filter(
      (p) => p.riskLevel === "CRITICAL",
    ).length;
    const high = predictions.filter((p) => p.riskLevel === "HIGH").length;
    const overdue = predictions.filter(
      (p) => p.daysUntilMaintenance < 0,
    ).length;

    if (critical > 0) {
      return `CRITICAL: ${critical} asset(s) at high risk of breakdown. Immediate action required.`;
    }

    if (high > 0) {
      return `WARNING: ${high} asset(s) require maintenance within 7 days.`;
    }

    if (overdue > 0) {
      return `ATTENTION: ${overdue} asset(s) have overdue maintenance schedules.`;
    }

    return `All assets are in good operational condition. Continue preventive maintenance.`;
  }

  // ==================== Knowledge Engine (RAG Q&A) ====================

  async getDocuments(filters?: {
    type?: string;
    status?: string;
    category?: string;
  }) {
    const where: any = {};
    if (filters?.type) where.type = filters.type;
    if (filters?.status) where.status = filters.status;
    if (filters?.category) where.category = filters.category;

    return this.prisma.knowledgeDocument.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  async getDocumentById(id: string) {
    return this.prisma.knowledgeDocument.findUnique({
      where: { id },
    });
  }

  async createDocument(data: {
    title: string;
    description?: string;
    type: string;
    content: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    category?: string;
    tags?: string[];
    version?: string;
    uploadedBy: string;
  }) {
    return this.prisma.knowledgeDocument.create({
      data: {
        ...data,
        type: data.type as any,
      },
    });
  }

  async updateDocument(
    id: string,
    data: {
      title?: string;
      description?: string;
      status?: string;
      content?: string;
      category?: string;
      tags?: string[];
      version?: string;
    },
  ) {
    return this.prisma.knowledgeDocument.update({
      where: { id },
      data: {
        ...data,
        status: data.status as any,
      },
    });
  }

  async deleteDocument(id: string) {
    return this.prisma.knowledgeDocument.delete({
      where: { id },
    });
  }

  async searchDocuments(query: string) {
    // Simple text search - in production, use full-text search or vector similarity
    return this.prisma.knowledgeDocument.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { content: { contains: query, mode: "insensitive" } },
          { category: { contains: query, mode: "insensitive" } },
        ],
        status: "ACTIVE",
      },
      take: 10,
    });
  }

  async askQuestion(question: string) {
    // Step 1: Search for relevant documents
    const relevantDocs = await this.searchDocuments(question);

    if (relevantDocs.length === 0) {
      return {
        answer:
          "I could not find any relevant information in the knowledge base to answer your question. Please try rephrasing your question or ensure relevant documents are uploaded.",
        sources: [],
        confidence: 0,
      };
    }

    const cfg = await this.getOpenAiRuntime();
    let answer: { text: string; confidence: number } | null = null;
    if (cfg.enabled && cfg.provider === "OPENAI" && cfg.apiKey) {
      const sourcesForPrompt = relevantDocs.slice(0, 6).map((d) => ({
        id: d.id,
        title: d.title,
        type: d.type,
        content: String(d.content || "").slice(0, 3500),
      }));

      try {
        const out = await this.openAiJson<{
          answer: string;
          confidence: number;
          relatedQuestions?: string[];
        }>({
          apiKey: cfg.apiKey,
          model: cfg.model,
          system:
            "You answer questions for a mining ERP knowledge base. Use only the provided documents. If unsure, say so. Output must be valid JSON.",
          user:
            "Question: " +
            question +
            "\n\nDocuments (each has id/title/type/content): " +
            JSON.stringify(sourcesForPrompt) +
            "\n\nReturn JSON: {answer: string, confidence: number (0-100), relatedQuestions?: string[] (<=5)}.",
          temperature: 0.2,
        });

        if (out?.answer && typeof out.answer === "string") {
          const conf = Number(out.confidence);
          answer = {
            text: out.answer,
            confidence: Number.isFinite(conf)
              ? Math.max(0, Math.min(100, conf))
              : 70,
          };
        }
      } catch {
        answer = null;
      }
    }

    if (!answer) {
      answer = this.generateAnswerFromDocuments(question, relevantDocs);
    }

    // Step 3: Return answer with source citations
    return {
      answer: answer.text,
      sources: relevantDocs.slice(0, 3).map((doc) => ({
        id: doc.id,
        title: doc.title,
        type: doc.type,
        excerpt: this.extractRelevantExcerpt(doc.content, question),
      })),
      confidence: answer.confidence,
      relatedQuestions: this.generateRelatedQuestions(question),
    };
  }

  private generateAnswerFromDocuments(
    question: string,
    documents: any[],
  ): { text: string; confidence: number } {
    // Simulated AI answer generation
    // In production, this would:
    // 1. Combine document contents as context
    // 2. Create a prompt: "Based on the following documents: [context], answer: [question]"
    // 3. Call OpenAI/Claude API
    // 4. Return the AI-generated answer

    const lowerQuestion = question.toLowerCase();

    // Safety-related questions
    if (
      lowerQuestion.includes("safety") ||
      lowerQuestion.includes("ppe") ||
      lowerQuestion.includes("protective equipment")
    ) {
      return {
        text: `Based on the safety documentation in our knowledge base, all personnel must wear appropriate Personal Protective Equipment (PPE) including hard hats, safety boots, high-visibility vests, and safety glasses when in operational areas. Additional equipment such as respirators, ear protection, or harnesses may be required depending on the specific task. All safety procedures must be followed as outlined in our Standard Operating Procedures (SOPs). Regular safety training and equipment inspections are mandatory.`,
        confidence: 85,
      };
    }

    // Maintenance-related questions
    if (
      lowerQuestion.includes("maintenance") ||
      lowerQuestion.includes("equipment") ||
      lowerQuestion.includes("repair")
    ) {
      return {
        text: `According to our maintenance manuals, all heavy equipment should undergo preventive maintenance every 250 operating hours or monthly, whichever comes first. Daily pre-operation inspections are mandatory and must be logged. Any equipment showing signs of wear, unusual sounds, or operational issues should be immediately taken out of service and reported to the maintenance supervisor. Maintenance records must be kept for the entire lifecycle of each piece of equipment.`,
        confidence: 90,
      };
    }

    // Operational procedures
    if (
      lowerQuestion.includes("procedure") ||
      lowerQuestion.includes("process") ||
      lowerQuestion.includes("how to")
    ) {
      return {
        text: `Based on our Standard Operating Procedures (SOPs), all operational activities must follow established protocols. This includes obtaining necessary approvals, conducting pre-operation safety checks, using appropriate equipment, following environmental guidelines, and maintaining accurate records. Each task should be performed by qualified personnel who have received proper training. Any deviations from standard procedures must be documented and approved by a supervisor.`,
        confidence: 80,
      };
    }

    // Regulatory and compliance
    if (
      lowerQuestion.includes("regulation") ||
      lowerQuestion.includes("compliance") ||
      lowerQuestion.includes("legal")
    ) {
      return {
        text: `Our operations must comply with all local and international mining regulations, including environmental protection laws, worker safety standards (OSHA), and mineral rights legislation. Regular audits are conducted to ensure compliance. All permits and licenses must be current and displayed. Environmental impact assessments must be conducted before starting new operations. Non-compliance can result in fines, operational shutdowns, or legal action.`,
        confidence: 75,
      };
    }

    // General answer based on document availability
    const docTypes = documents.map((d) => d.type).join(", ");
    return {
      text: `I found relevant information in our ${documents.length} document(s) (${docTypes}). The documents contain detailed information about your question. For the most accurate and complete answer, I recommend reviewing the source documents provided below. Key points from the documents suggest established procedures and guidelines are in place for this topic. Please refer to the specific documents for detailed instructions and requirements.`,
      confidence: 70,
    };
  }

  private extractRelevantExcerpt(content: string, question: string): string {
    // Extract a relevant snippet from the document
    // In production, use semantic search to find the most relevant paragraph
    const sentences = content.split(".").filter((s) => s.trim().length > 20);

    // Simple keyword matching
    const keywords = question
      .toLowerCase()
      .split(" ")
      .filter((w) => w.length > 3);

    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase();
      const matchCount = keywords.filter((k) =>
        lowerSentence.includes(k),
      ).length;

      if (matchCount > 0) {
        return sentence.trim() + ".";
      }
    }

    // Fallback to first substantial sentence
    return sentences[0]?.trim() + "." || content.substring(0, 200) + "...";
  }

  private generateRelatedQuestions(question: string): string[] {
    const lowerQuestion = question.toLowerCase();

    if (lowerQuestion.includes("safety")) {
      return [
        "What PPE is required for underground operations?",
        "How often are safety inspections conducted?",
        "What is the emergency evacuation procedure?",
      ];
    }

    if (lowerQuestion.includes("maintenance")) {
      return [
        "What is the maintenance schedule for heavy equipment?",
        "How do I report equipment malfunctions?",
        "Who approves major maintenance work?",
      ];
    }

    if (
      lowerQuestion.includes("procedure") ||
      lowerQuestion.includes("process")
    ) {
      return [
        "Where can I find the complete SOP manual?",
        "Who do I contact for procedure clarifications?",
        "How are procedures updated?",
      ];
    }

    return [
      "What documents are available in the knowledge base?",
      "How do I request additional information?",
      "Where can I find training materials?",
    ];
  }

  async getKnowledgeBaseStats() {
    const [totalDocs, activeDoc, docsByType] = await Promise.all([
      this.prisma.knowledgeDocument.count(),
      this.prisma.knowledgeDocument.count({ where: { status: "ACTIVE" } }),
      this.prisma.knowledgeDocument.groupBy({
        by: ["type"],
        _count: true,
      }),
    ]);

    return {
      totalDocuments: totalDocs,
      activeDocuments: activeDoc,
      documentsByType: docsByType.map((item) => ({
        type: item.type,
        count: item._count,
      })),
    };
  }

  // ==================== Safety Assistant ====================

  async reportIncident(data: {
    type: string;
    severity: string;
    location: string;
    incidentDate: Date;
    reportedBy: string;
    description: string;
    injuries?: string;
    witnesses?: string[];
    photoUrls?: string[];
  }) {
    const incidentCount = await this.prisma.safetyIncident.count();
    const incidentNumber = `INC-${Date.now()}-${incidentCount + 1}`;

    const incident = await this.prisma.safetyIncident.create({
      data: {
        incidentNumber,
        type: data.type as any,
        severity: data.severity as any,
        location: data.location,
        incidentDate: data.incidentDate,
        reportedBy: data.reportedBy,
        description: data.description,
        injuries: data.injuries,
        witnesses: data.witnesses || [],
        photoUrls: data.photoUrls || [],
      },
    });

    // Immediately run AI analysis
    const analysis = await this.analyzeIncident(incident.id);

    return {
      incident,
      analysis,
    };
  }

  async getIncidents(filters?: {
    type?: string;
    severity?: string;
    status?: string;
  }) {
    const where: any = {};
    if (filters?.type) where.type = filters.type;
    if (filters?.severity) where.severity = filters.severity;
    if (filters?.status) where.status = filters.status;

    return this.prisma.safetyIncident.findMany({
      where,
      orderBy: { incidentDate: "desc" },
    });
  }

  async getIncidentById(id: string) {
    return this.prisma.safetyIncident.findUnique({
      where: { id },
    });
  }

  async analyzeIncident(incidentId: string) {
    const incident = await this.prisma.safetyIncident.findUnique({
      where: { id: incidentId },
    });

    if (!incident) {
      throw new NotFoundException("Incident not found");
    }

    // AI Analysis
    let aiAnalysis = this.generateIncidentAnalysis(incident);
    let rootCause = this.identifyRootCause(incident);
    let correctiveActions = this.generateCorrectiveActions(incident);

    const cfg = await this.getOpenAiRuntime();
    if (cfg.enabled && cfg.provider === "OPENAI" && cfg.apiKey) {
      try {
        const out = await this.openAiJson<{
          analysis?: {
            summary: string;
            hazardsIdentified: string[];
            affectedAreas: string[];
            immediateActions: string[];
          };
          rootCause?: {
            analysis: string;
            contributingFactors: string[];
            recommendations: string[];
          };
          correctiveActions?: string[];
        }>({
          apiKey: cfg.apiKey,
          model: cfg.model,
          system:
            "You are a safety incident analyst for a mining company. Output must be valid JSON. Be specific and actionable.",
          user:
            "Given this incident, return JSON with keys: analysis {summary, hazardsIdentified[], affectedAreas[], immediateActions[]}, rootCause {analysis, contributingFactors[], recommendations[]}, correctiveActions[] (max 10). Incident: " +
            JSON.stringify({
              type: incident.type,
              severity: incident.severity,
              location: incident.location,
              incidentDate: incident.incidentDate,
              description: incident.description,
              injuries: incident.injuries ?? null,
              witnesses: incident.witnesses ?? [],
            }),
          temperature: 0.2,
        });

        if (out?.analysis?.summary) {
          aiAnalysis = {
            summary: String(out.analysis.summary),
            hazardsIdentified: Array.isArray(out.analysis.hazardsIdentified)
              ? out.analysis.hazardsIdentified.slice(0, 10)
              : aiAnalysis.hazardsIdentified,
            affectedAreas: Array.isArray(out.analysis.affectedAreas)
              ? out.analysis.affectedAreas.slice(0, 10)
              : aiAnalysis.affectedAreas,
            immediateActions: Array.isArray(out.analysis.immediateActions)
              ? out.analysis.immediateActions.slice(0, 10)
              : aiAnalysis.immediateActions,
          };
        }
        if (out?.rootCause?.analysis) {
          rootCause = {
            analysis: String(out.rootCause.analysis),
            contributingFactors: Array.isArray(out.rootCause.contributingFactors)
              ? out.rootCause.contributingFactors.slice(0, 10)
              : rootCause.contributingFactors,
            recommendations: Array.isArray(out.rootCause.recommendations)
              ? out.rootCause.recommendations.slice(0, 10)
              : rootCause.recommendations,
          };
        }
        if (Array.isArray(out?.correctiveActions) && out.correctiveActions.length > 0) {
          correctiveActions = out.correctiveActions.slice(0, 10);
        }
      } catch {}
    }
    const oshaReportable = this.determineOSHAReportability(incident);
    const oshaReport = oshaReportable
      ? this.generateOSHAReport(incident, aiAnalysis, rootCause)
      : null;

    // Update incident with AI analysis
    await this.prisma.safetyIncident.update({
      where: { id: incidentId },
      data: {
        aiAnalysis: aiAnalysis.summary,
        rootCause: rootCause.analysis,
        correctiveActions: correctiveActions.join("\n"),
        oshaReportable,
        oshaReport,
      },
    });

    return {
      analysis: aiAnalysis,
      rootCause,
      correctiveActions,
      oshaReportable,
      oshaReport,
    };
  }

  private generateIncidentAnalysis(incident: any): {
    summary: string;
    hazardsIdentified: string[];
    affectedAreas: string[];
    immediateActions: string[];
  } {
    const hazards: string[] = [];
    const areas: string[] = [];
    const actions: string[] = [];

    // Analyze based on incident type
    switch (incident.type) {
      case "INJURY":
        hazards.push("Physical hazard leading to personnel injury");
        hazards.push("Inadequate PPE usage or equipment failure");
        areas.push("Work safety protocols");
        areas.push("Training requirements");
        actions.push("Provide immediate medical attention");
        actions.push("Secure the area to prevent further injuries");
        actions.push("Document all evidence and witness statements");
        break;

      case "NEAR_MISS":
        hazards.push("Potential hazard identified before injury occurred");
        areas.push("Preventive measures");
        areas.push("Hazard identification procedures");
        actions.push("Investigate the root cause immediately");
        actions.push("Implement preventive controls");
        actions.push("Update safety protocols if needed");
        break;

      case "EQUIPMENT_DAMAGE":
        hazards.push("Equipment failure or operational error");
        hazards.push("Potential for operational disruption");
        areas.push("Equipment maintenance");
        areas.push("Operator training");
        actions.push("Isolate damaged equipment");
        actions.push("Assess repair vs replacement");
        actions.push("Review maintenance schedules");
        break;

      case "ENVIRONMENTAL":
        hazards.push("Environmental impact or contamination");
        hazards.push("Regulatory compliance risk");
        areas.push("Environmental controls");
        areas.push("Spill response procedures");
        actions.push("Contain and mitigate environmental impact");
        actions.push("Notify environmental authorities if required");
        actions.push("Implement cleanup procedures");
        break;

      case "FIRE":
        hazards.push("Fire hazard with potential for severe damage");
        hazards.push("Risk to personnel and assets");
        areas.push("Fire prevention systems");
        areas.push("Emergency response");
        actions.push("Ensure fire is completely extinguished");
        actions.push("Account for all personnel");
        actions.push("Investigate ignition source");
        break;

      case "CHEMICAL_SPILL":
        hazards.push("Chemical exposure hazard");
        hazards.push("Environmental contamination risk");
        areas.push("Chemical handling procedures");
        areas.push("Spill containment systems");
        actions.push("Evacuate affected area immediately");
        actions.push("Deploy spill containment measures");
        actions.push("Ensure proper PPE for cleanup crew");
        break;

      default:
        hazards.push("Unclassified safety hazard");
        areas.push("General safety procedures");
        actions.push("Investigate and document incident details");
    }

    // Severity-based recommendations
    if (incident.severity === "CRITICAL" || incident.severity === "FATAL") {
      actions.push("URGENT: Notify senior management immediately");
      actions.push("Consider temporary shutdown of affected operations");
      actions.push("Engage external safety consultants");
    }

    const summary = `Incident Type: ${incident.type}. Severity: ${incident.severity}. Location: ${incident.location}. This incident requires immediate attention and thorough investigation. ${hazards.length} primary hazards have been identified. ${areas.length} areas require review and potential improvement.`;

    return {
      summary,
      hazardsIdentified: hazards,
      affectedAreas: areas,
      immediateActions: actions,
    };
  }

  private identifyRootCause(incident: any): {
    analysis: string;
    contributingFactors: string[];
    recommendations: string[];
  } {
    const factors: string[] = [];
    const recommendations: string[] = [];

    // Common root cause analysis
    factors.push("Human factors: Training adequacy, fatigue, awareness");
    factors.push("Equipment factors: Maintenance status, age, suitability");
    factors.push(
      "Environmental factors: Lighting, weather, workspace conditions",
    );
    factors.push(
      "Procedural factors: SOPs followed, supervision, communication",
    );

    recommendations.push(
      "Conduct detailed investigation with all stakeholders",
    );
    recommendations.push(
      "Review and update relevant SOPs and training materials",
    );
    recommendations.push("Implement corrective actions to prevent recurrence");

    // Severity-specific analysis
    if (incident.severity === "CRITICAL" || incident.severity === "FATAL") {
      recommendations.push("Engage third-party safety investigation team");
      recommendations.push("Consider comprehensive safety audit");
    }

    const analysis = `Root cause analysis indicates multiple contributing factors across human, equipment, environmental, and procedural domains. A comprehensive investigation is recommended to identify the primary cause and implement effective preventive measures. Based on the ${incident.severity.toLowerCase()} severity, this incident requires thorough examination and swift corrective action.`;

    return {
      analysis,
      contributingFactors: factors,
      recommendations,
    };
  }

  private generateCorrectiveActions(incident: any): string[] {
    const actions: string[] = [];

    // Type-specific actions
    switch (incident.type) {
      case "INJURY":
        actions.push(
          "Mandatory refresher safety training for all personnel in affected area",
        );
        actions.push("Review and enhance PPE requirements");
        actions.push(
          "Implement additional supervision during high-risk operations",
        );
        actions.push("Establish buddy system for hazardous tasks");
        break;

      case "NEAR_MISS":
        actions.push("Share lessons learned across all teams");
        actions.push("Implement additional hazard identification checks");
        actions.push("Recognize and reward the reporting individual");
        break;

      case "EQUIPMENT_DAMAGE":
        actions.push("Immediate equipment inspection and testing");
        actions.push("Review maintenance schedules and procedures");
        actions.push("Additional operator training on equipment care");
        actions.push("Implement pre-operation inspection checklists");
        break;

      case "ENVIRONMENTAL":
        actions.push("Enhance spill containment systems");
        actions.push("Increase frequency of environmental inspections");
        actions.push("Update emergency response procedures");
        actions.push("Provide specialized environmental training");
        break;

      case "FIRE":
        actions.push("Inspect and test all fire suppression systems");
        actions.push("Conduct fire safety drills");
        actions.push("Review hot work permit procedures");
        actions.push("Enhance fire watch protocols");
        break;

      case "CHEMICAL_SPILL":
        actions.push("Review chemical storage and handling procedures");
        actions.push("Enhance secondary containment systems");
        actions.push("Update chemical spill response training");
        actions.push("Ensure adequate spill kit availability");
        break;
    }

    // Universal actions
    actions.push("Document all corrective actions and track completion");
    actions.push("Conduct follow-up inspection within 30 days");
    actions.push("Update incident database and trend analysis");

    return actions;
  }

  private determineOSHAReportability(incident: any): boolean {
    // Simplified OSHA reportability determination
    // In production, this would follow actual OSHA 300/301 criteria

    if (incident.severity === "FATAL") return true;
    if (incident.severity === "CRITICAL") return true;

    if (
      incident.type === "INJURY" &&
      (incident.severity === "SERIOUS" || incident.severity === "MODERATE")
    ) {
      return true;
    }

    if (incident.type === "ENVIRONMENTAL" && incident.severity === "SERIOUS") {
      return true;
    }

    return false;
  }

  private generateOSHAReport(
    incident: any,
    analysis: any,
    rootCause: any,
  ): string {
    const report = `
OSHA INCIDENT REPORT
====================

INCIDENT DETAILS
----------------
Incident Number: ${incident.incidentNumber}
Date of Incident: ${new Date(incident.incidentDate).toLocaleDateString()}
Time of Incident: ${new Date(incident.incidentDate).toLocaleTimeString()}
Location: ${incident.location}
Reported By: ${incident.reportedBy}

INCIDENT CLASSIFICATION
-----------------------
Type: ${incident.type}
Severity: ${incident.severity}
OSHA Recordable: Yes

DESCRIPTION OF INCIDENT
-----------------------
${incident.description}

INJURIES/ILLNESSES (if applicable)
----------------------------------
${incident.injuries || "No injuries reported"}

WITNESSES
---------
${incident.witnesses?.join(", ") || "None recorded"}

AI ANALYSIS SUMMARY
-------------------
${analysis.summary}

HAZARDS IDENTIFIED
------------------
${analysis.hazardsIdentified.map((h: string, i: number) => `${i + 1}. ${h}`).join("\n")}

ROOT CAUSE ANALYSIS
-------------------
${rootCause.analysis}

Contributing Factors:
${rootCause.contributingFactors.map((f: string, i: number) => `${i + 1}. ${f}`).join("\n")}

CORRECTIVE ACTIONS REQUIRED
----------------------------
${this.generateCorrectiveActions(incident)
  .map((a: string, i: number) => `${i + 1}. ${a}`)
  .join("\n")}

REGULATORY COMPLIANCE
---------------------
This incident meets OSHA reporting criteria and must be:
- Recorded in OSHA 300 Log within 7 calendar days
- Reported to OSHA within required timeframe based on severity
- Investigated thoroughly with findings documented
- Monitored for similar incidents (trend analysis)

REPORT GENERATED
----------------
Date: ${new Date().toLocaleString()}
Generated By: AI Safety Assistant
Status: PRELIMINARY - Requires human review and validation

This report is AI-generated and must be reviewed by qualified safety personnel before submission to OSHA.
`;

    return report;
  }

  async getSafetyStats() {
    const [
      totalIncidents,
      openIncidents,
      incidentsByType,
      incidentsBySeverity,
      oshaReportable,
    ] = await Promise.all([
      this.prisma.safetyIncident.count(),
      this.prisma.safetyIncident.count({
        where: {
          status: {
            in: ["REPORTED", "INVESTIGATING"],
          },
        },
      }),
      this.prisma.safetyIncident.groupBy({
        by: ["type"],
        _count: true,
      }),
      this.prisma.safetyIncident.groupBy({
        by: ["severity"],
        _count: true,
      }),
      this.prisma.safetyIncident.count({
        where: { oshaReportable: true },
      }),
    ]);

    return {
      totalIncidents,
      openIncidents,
      oshaReportable,
      incidentsByType: incidentsByType.map((item) => ({
        type: item.type,
        count: item._count,
      })),
      incidentsBySeverity: incidentsBySeverity.map((item) => ({
        severity: item.severity,
        count: item._count,
      })),
    };
  }
}

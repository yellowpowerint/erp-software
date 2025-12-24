import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import * as bcrypt from "bcrypt";
import { EmailService } from "../csv/email.service";

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    private prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  // Internal helper for system settings
  private async upsertSetting(key: string, value: string, isSecret = false) {
    return this.prisma.systemSetting.upsert({
      where: { key },
      update: { value, isSecret },
      create: { key, value, isSecret },
    });
  }

  private async getSetting(key: string): Promise<string | null> {
    try {
      const setting = await this.prisma.systemSetting.findUnique({ where: { key } });
      const value = setting?.value?.trim();
      return value && value.length > 0 ? value : null;
    } catch (err: any) {
      this.logger.error(
        `Failed to read system setting ${key}. Falling back to defaults.`,
        err?.stack || String(err),
      );
      return null;
    }
  }

  private safeJsonParse<T>(raw: string | null, fallback: T): T {
    if (!raw) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  // System Configuration
  async getSystemConfig() {
    const defaults = {
      companyName: "Mining Operations Ltd",
      companyEmail: "info@miningops.com",
      companyPhone: "+233 XX XXX XXXX",
      address: "Accra, Ghana",
      currency: "GHS",
      timezone: "Africa/Accra",
      dateFormat: "DD/MM/YYYY",
      fiscalYearStart: "01/01",
      features: {
        approvals: true,
        inventory: true,
        finance: true,
        hr: true,
        safety: true,
        ai: true,
        reports: true,
        modules: {} as Record<string, boolean>,
      },
      notifications: {
        email: true,
        sms: false,
        push: true,
      },
    };

    const [
      companyName,
      companyEmail,
      companyPhone,
      address,
      currency,
      timezone,
      dateFormat,
      fiscalYearStart,
      featuresJson,
      notificationsJson,
    ] = await Promise.all([
      this.getSetting("SYS_COMPANY_NAME"),
      this.getSetting("SYS_COMPANY_EMAIL"),
      this.getSetting("SYS_COMPANY_PHONE"),
      this.getSetting("SYS_ADDRESS"),
      this.getSetting("SYS_CURRENCY"),
      this.getSetting("SYS_TIMEZONE"),
      this.getSetting("SYS_DATE_FORMAT"),
      this.getSetting("SYS_FISCAL_YEAR_START"),
      this.getSetting("SYS_FEATURES_JSON"),
      this.getSetting("SYS_NOTIFICATIONS_JSON"),
    ]);

    const storedFeatures = this.safeJsonParse<Record<string, any>>(featuresJson, {});
    const storedNotifications = this.safeJsonParse<Record<string, any>>(notificationsJson, {});

    return {
      companyName: companyName ?? defaults.companyName,
      companyEmail: companyEmail ?? defaults.companyEmail,
      companyPhone: companyPhone ?? defaults.companyPhone,
      address: address ?? defaults.address,
      currency: currency ?? defaults.currency,
      timezone: timezone ?? defaults.timezone,
      dateFormat: dateFormat ?? defaults.dateFormat,
      fiscalYearStart: fiscalYearStart ?? defaults.fiscalYearStart,
      features: {
        ...defaults.features,
        ...storedFeatures,
        modules: {
          ...(defaults.features.modules || {}),
          ...(storedFeatures.modules || {}),
        },
      },
      notifications: {
        ...defaults.notifications,
        ...storedNotifications,
      },
    };
  }

  async updateSystemConfig(data: any) {
    if (!data || typeof data !== "object") {
      throw new BadRequestException("Invalid configuration payload");
    }

    const ops: Promise<unknown>[] = [];

    if (typeof data.companyName === "string") {
      ops.push(this.upsertSetting("SYS_COMPANY_NAME", data.companyName));
    }
    if (typeof data.companyEmail === "string") {
      ops.push(this.upsertSetting("SYS_COMPANY_EMAIL", data.companyEmail));
    }
    if (typeof data.companyPhone === "string") {
      ops.push(this.upsertSetting("SYS_COMPANY_PHONE", data.companyPhone));
    }
    if (typeof data.address === "string") {
      ops.push(this.upsertSetting("SYS_ADDRESS", data.address));
    }
    if (typeof data.currency === "string") {
      ops.push(this.upsertSetting("SYS_CURRENCY", data.currency));
    }
    if (typeof data.timezone === "string") {
      ops.push(this.upsertSetting("SYS_TIMEZONE", data.timezone));
    }
    if (typeof data.dateFormat === "string") {
      ops.push(this.upsertSetting("SYS_DATE_FORMAT", data.dateFormat));
    }
    if (typeof data.fiscalYearStart === "string") {
      ops.push(this.upsertSetting("SYS_FISCAL_YEAR_START", data.fiscalYearStart));
    }

    if (data.features && typeof data.features === "object") {
      ops.push(this.upsertSetting("SYS_FEATURES_JSON", JSON.stringify(data.features)));
    }

    if (data.notifications && typeof data.notifications === "object") {
      ops.push(
        this.upsertSetting("SYS_NOTIFICATIONS_JSON", JSON.stringify(data.notifications)),
      );
    }

    if (ops.length > 0) {
      await Promise.all(ops);
    }

    return this.getSystemConfig();
  }

  async getNotificationProvidersStatus() {
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD;
    const smtpFrom = process.env.SMTP_FROM;

    const emailConfigured = !!smtpHost && !!smtpUser && !!smtpPass;

    return {
      email: {
        configured: emailConfigured,
        fromConfigured: !!smtpFrom || !!smtpUser,
      },
      sms: {
        configured: false,
        provider: null,
      },
      push: {
        configured: false,
        provider: null,
      },
    };
  }

  async getUserNotificationPreferences(userId: string) {
    const raw = await this.getSetting(`NOTIF_PREF_${userId}`);
    const defaults = {
      email: {
        enabled: true,
        approvalRequests: true,
        approvalUpdates: true,
        systemAlerts: true,
        expenseApprovals: false,
        inventoryAlerts: true,
        safetyAlerts: true,
        weeklyReports: false,
      },
      sms: {
        enabled: false,
        criticalAlerts: false,
        approvalRequests: false,
        safetyEmergencies: false,
      },
      push: {
        enabled: true,
        approvalRequests: true,
        mentions: true,
        systemAlerts: false,
        taskReminders: true,
      },
    };

    const parsed = this.safeJsonParse<any>(raw, defaults);
    return {
      email: { ...defaults.email, ...(parsed?.email || {}) },
      sms: { ...defaults.sms, ...(parsed?.sms || {}) },
      push: { ...defaults.push, ...(parsed?.push || {}) },
    };
  }

  async updateUserNotificationPreferences(userId: string, prefs: any) {
    if (!prefs || typeof prefs !== "object") {
      throw new BadRequestException("Invalid notification preferences payload");
    }

    await this.upsertSetting(`NOTIF_PREF_${userId}`, JSON.stringify(prefs));
    return this.getUserNotificationPreferences(userId);
  }

  async sendTestEmail(userId: string, toEmail?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, firstName: true, lastName: true },
    });
    if (!user) throw new NotFoundException("User not found");

    const to = (toEmail || user.email || "").trim();
    if (!to) throw new BadRequestException("Recipient email is required");

    const name = `${user.firstName} ${user.lastName}`.trim();

    await this.emailService.sendEmail({
      to: [to],
      subject: "Test Email - Mining ERP Notifications",
      text: `Hello ${name || "there"},\n\nThis is a test email from Mining ERP notification settings.\n\nIf you received this, SMTP is configured correctly.`,
    });

    return { success: true };
  }

  // User Management
  async getAllUsers(filters?: {
    role?: string;
    status?: string;
    search?: string;
  }) {
    const where: any = {};

    const excludedEmails = [
      'itmanager@mining.com',
      'ceo@mining.com',
      'cfo@mining.com',
      'accountant@mining.com',
      'operations@mining.com',
      'warehouse@mining.com',
      'employee@mining.com',
      'admin@mining.com',
    ];

    where.NOT = [{ email: { in: excludedEmails } }];

    if (filters?.role) {
      where.role = filters.role;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: "insensitive" } },
        { lastName: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        department: true,
        position: true,
        managerId: true,
        reportsToTitles: true,
        modulePermissions: true,
        mustChangePassword: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return users;
  }

  async getUserById(userId: string) {
    return await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        department: true,
        position: true,
        managerId: true,
        reportsToTitles: true,
        modulePermissions: true,
        mustChangePassword: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
      },
    });
  }

  async updateUser(userId: string, data: any) {
    const updateData: any = {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      role: data.role,
      status: data.status,
      department: data.department,
      position: data.position,
      managerId: data.managerId,
      reportsToTitles: data.reportsToTitles,
      modulePermissions: data.modulePermissions,
      mustChangePassword: data.mustChangePassword,
    };

    // Remove undefined values
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    return await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        department: true,
        position: true,
        managerId: true,
        reportsToTitles: true,
        modulePermissions: true,
        mustChangePassword: true,
      },
    });
  }

  async createUser(data: any) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException("Email already exists");
    }

    const hashedPassword = await bcrypt.hash(
      data.password || "Password123!",
      10,
    );

    return await this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: data.role || "EMPLOYEE",
        status: data.status || "ACTIVE",
        department: data.department,
        position: data.position,
        managerId: data.managerId,
        reportsToTitles: data.reportsToTitles,
        modulePermissions: data.modulePermissions,
        mustChangePassword:
          typeof data.mustChangePassword === "boolean"
            ? data.mustChangePassword
            : true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        department: true,
        position: true,
        managerId: true,
        reportsToTitles: true,
        modulePermissions: true,
        mustChangePassword: true,
      },
    });
  }

  async deactivateUser(userId: string) {
    return await this.prisma.user.update({
      where: { id: userId },
      data: { status: "INACTIVE" },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
      },
    });
  }

  async activateUser(userId: string) {
    return await this.prisma.user.update({
      where: { id: userId },
      data: { status: "ACTIVE" },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
      },
    });
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new BadRequestException("Current password is incorrect");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword, mustChangePassword: false },
    });

    return {
      success: true,
      message: "Password changed successfully",
    };
  }

  async resetUserPassword(userId: string, newPassword: string) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword, mustChangePassword: true },
    });

    return {
      success: true,
      message: "Password reset successfully",
    };
  }

  // System Statistics
  async getSystemStats() {
    const [totalUsers, activeUsers, recentLogins, usersByRole] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { status: "ACTIVE" } }),
        this.prisma.user.count({
          where: {
            lastLogin: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        }),
        this.prisma.user.groupBy({
          by: ["role"],
          _count: true,
        }),
      ]);

    return {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      recentLogins,
      usersByRole: usersByRole.map((r) => ({
        role: r.role,
        count: r._count,
      })),
    };
  }

  async getAuditLogs(limit: number = 50) {
    const take = Math.max(1, Math.min(200, Number(limit) || 50));
    const logs = await this.prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take,
    });

    const userIds = Array.from(
      new Set(logs.map((l) => String(l.userId)).filter(Boolean)),
    );
    const users = userIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, firstName: true, lastName: true, email: true },
        })
      : [];
    const userById = new Map(users.map((u) => [u.id, u] as const));

    return {
      logs: logs.map((l) => {
        const u = userById.get(String(l.userId));
        const userName = u ? `${u.firstName} ${u.lastName}`.trim() : null;
        return {
          id: l.id,
          timestamp: l.createdAt,
          action: l.action,
          module: l.module,
          userId: l.userId,
          userName,
          userEmail: u?.email ?? null,
          details: l.details,
        };
      }),
      total: logs.length,
    };
  }

  async getDashboardOverview() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const startOfLast12Months = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const monthKey = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

    const [
      activeEmployees,
      activeProjects,
      openIncidents,
      pendingInvoices,
      pendingPurchaseRequests,
      pendingExpenses,
      pendingRequisitions,
      pendingPayments,
      productionLogs,
      expensesMtd,
      budgetsActive,
      totalStockItems,
      lowStockCount,
      outOfStockCount,
      lowStockItems,
      recentActivity,
    ] = await Promise.all([
      this.prisma.employee.count({ where: { status: "ACTIVE" } }),
      this.prisma.project.count({ where: { status: { in: ["PLANNING", "ACTIVE", "ON_HOLD"] } } }),
      this.prisma.safetyIncident.count({
        where: { status: { in: ["REPORTED", "INVESTIGATING"] } },
      }),
      this.prisma.invoice.count({ where: { status: "PENDING" } }),
      this.prisma.purchaseRequest.count({ where: { status: "PENDING" } }),
      this.prisma.expense.count({ where: { status: "PENDING" } }),
      this.prisma.requisition.count({ where: { status: "PENDING_APPROVAL" } }),
      this.prisma.financePayment.count({ where: { status: "PENDING" } }),
      this.prisma.productionLog.findMany({
        where: { date: { gte: startOfLast12Months, lte: now } },
        select: { date: true, quantity: true },
        orderBy: { date: "asc" },
      }),
      this.prisma.expense.groupBy({
        by: ["category"],
        where: { expenseDate: { gte: startOfMonth, lte: now } },
        _sum: { amount: true },
      }),
      this.prisma.budget.groupBy({
        by: ["category"],
        where: { startDate: { lte: now }, endDate: { gte: now } },
        _sum: { allocatedAmount: true },
      }),
      this.prisma.stockItem.count(),
      this.prisma.stockItem.count({ where: { currentQuantity: { lte: 10 } } }),
      this.prisma.stockItem.count({ where: { currentQuantity: { equals: 0 } } }),
      this.prisma.stockItem.findMany({
        where: { currentQuantity: { lte: 10 } },
        select: {
          id: true,
          itemCode: true,
          name: true,
          currentQuantity: true,
          reservedQuantity: true,
          reorderLevel: true,
          warehouse: { select: { id: true, code: true, name: true } },
        },
        take: 10,
        orderBy: { currentQuantity: "asc" },
      }),
      this.getAuditLogs(10),
    ]);

    const productionByMonthMap: Record<string, number> = {};
    for (let i = 0; i < 12; i++) {
      const d = new Date(startOfLast12Months.getFullYear(), startOfLast12Months.getMonth() + i, 1);
      productionByMonthMap[monthKey(d)] = 0;
    }
    for (const l of productionLogs) {
      const k = monthKey(new Date(l.date));
      if (productionByMonthMap[k] !== undefined) {
        productionByMonthMap[k] += Number(l.quantity) || 0;
      }
    }
    const productionByMonth = Object.entries(productionByMonthMap).map(
      ([month, production]) => ({ month, production }),
    );

    const budgetsByCategory = new Map(
      budgetsActive.map((b: any) => [String(b.category), Number(b._sum?.allocatedAmount ?? 0)] as const),
    );
    const expensesByCategory = expensesMtd
      .map((e: any) => {
        const cat = String(e.category);
        const amount = Number(e._sum?.amount ?? 0);
        const budget = Number(budgetsByCategory.get(cat) ?? 0);
        return { category: cat, amount, budget };
      })
      .sort((a, b) => b.amount - a.amount);

    const mtdProduction = productionLogs
      .filter((l) => new Date(l.date) >= startOfMonth)
      .reduce((sum, l) => sum + (Number(l.quantity) || 0), 0);

    const mtdExpensesTotal = expensesMtd.reduce(
      (sum: number, r: any) => sum + Number(r._sum?.amount ?? 0),
      0,
    );

    const pendingApprovals =
      pendingInvoices +
      pendingPurchaseRequests +
      pendingExpenses +
      pendingRequisitions +
      pendingPayments;

    return {
      generatedAt: now,
      currency: "GHS",
      kpis: {
        pendingApprovals,
        pendingInvoices,
        pendingPurchaseRequests,
        pendingExpenses,
        pendingRequisitions,
        pendingPayments,
        activeProjects,
        activeEmployees,
        openIncidents,
        totalStockItems,
        lowStockItems: lowStockCount,
        outOfStockItems: outOfStockCount,
        mtdProduction,
        mtdExpenses: mtdExpensesTotal,
        ytdProduction: productionLogs
          .filter((l) => new Date(l.date) >= startOfYear)
          .reduce((sum, l) => sum + (Number(l.quantity) || 0), 0),
      },
      productionByMonth,
      expensesByCategory,
      lowStockItems,
      recentActivity: recentActivity.logs,
    };
  }

  // AI Provider Settings (BYOK)
  async getAiSettings() {
    const keys = await this.prisma.systemSetting.findMany({
      where: {
        key: {
          in: [
            "AI_ENABLED",
            "AI_DEFAULT_PROVIDER",
            "AI_OPENAI_API_KEY",
            "AI_OPENAI_MODEL",
            "AI_CLAUDE_API_KEY",
            "AI_CLAUDE_MODEL",
          ],
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const map = new Map(keys.map((k) => [k.key, k] as const));

    const openaiKey = map.get("AI_OPENAI_API_KEY");
    const claudeKey = map.get("AI_CLAUDE_API_KEY");

    const enabled = map.get("AI_ENABLED")?.value === "true";
    const defaultProvider =
      (map.get("AI_DEFAULT_PROVIDER")?.value as "OPENAI" | "CLAUDE" | null) ||
      null;

    return {
      enabled,
      defaultProvider,
      openai: {
        configured: !!openaiKey,
        last4: openaiKey ? openaiKey.value.slice(-4) : null,
        model: map.get("AI_OPENAI_MODEL")?.value || null,
        updatedAt: openaiKey?.updatedAt || null,
      },
      claude: {
        configured: !!claudeKey,
        last4: claudeKey ? claudeKey.value.slice(-4) : null,
        model: map.get("AI_CLAUDE_MODEL")?.value || null,
        updatedAt: claudeKey?.updatedAt || null,
      },
    };
  }

  async updateAiSettings(data: {
    enabled?: boolean;
    defaultProvider?: "OPENAI" | "CLAUDE" | null;
    openai?: { apiKey?: string; model?: string | null };
    claude?: { apiKey?: string; model?: string | null };
  }) {
    const ops: Promise<unknown>[] = [];

    if (typeof data.enabled === "boolean") {
      ops.push(
        this.upsertSetting("AI_ENABLED", data.enabled ? "true" : "false"),
      );
    }

    if (data.defaultProvider !== undefined) {
      ops.push(
        this.upsertSetting("AI_DEFAULT_PROVIDER", data.defaultProvider ?? ""),
      );
    }

    if (data.openai?.apiKey && data.openai.apiKey.trim().length > 0) {
      ops.push(
        this.upsertSetting(
          "AI_OPENAI_API_KEY",
          data.openai.apiKey.trim(),
          true,
        ),
      );
    }

    if (data.openai && data.openai.model !== undefined) {
      ops.push(
        this.upsertSetting(
          "AI_OPENAI_MODEL",
          data.openai.model ? data.openai.model : "",
        ),
      );
    }

    if (data.claude?.apiKey && data.claude.apiKey.trim().length > 0) {
      ops.push(
        this.upsertSetting(
          "AI_CLAUDE_API_KEY",
          data.claude.apiKey.trim(),
          true,
        ),
      );
    }

    if (data.claude && data.claude.model !== undefined) {
      ops.push(
        this.upsertSetting(
          "AI_CLAUDE_MODEL",
          data.claude.model ? data.claude.model : "",
        ),
      );
    }

    if (ops.length > 0) {
      await Promise.all(ops);
    }

    return this.getAiSettings();
  }
}

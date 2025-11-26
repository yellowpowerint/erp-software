import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import * as bcrypt from "bcrypt";

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  // Internal helper for system settings
  private async upsertSetting(key: string, value: string, isSecret = false) {
    return this.prisma.systemSetting.upsert({
      where: { key },
      update: { value, isSecret },
      create: { key, value, isSecret },
    });
  }

  // System Configuration
  async getSystemConfig() {
    return {
      companyName: "Mining Operations Ltd",
      companyEmail: "info@miningops.com",
      companyPhone: "+233 XX XXX XXXX",
      address: "Accra, Ghana",
      currency: "GHS",
      timezone: "Africa/Accra",
      dateFormat: "DD/MM/YYYY",
      fiscalYearStart: "01/01",
      // Features
      features: {
        approvals: true,
        inventory: true,
        finance: true,
        hr: true,
        safety: true,
        ai: true,
        reports: true,
      },
      // Notifications
      notifications: {
        email: true,
        sms: false,
        push: true,
      },
    };
  }

  async updateSystemConfig(data: any) {
    // In a real system, this would update database settings
    return {
      success: true,
      message: "System configuration updated successfully",
      data,
    };
  }

  // User Management
  async getAllUsers(filters?: {
    role?: string;
    status?: string;
    search?: string;
  }) {
    const where: any = {};

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
      },
    });
  }

  async createUser(data: any) {
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
      throw new Error("User not found");
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new Error("Current password is incorrect");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
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
      data: { password: hashedPassword },
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

  // Audit Log (simplified)
  async getAuditLogs(limit: number = 50) {
    // In a real system, you'd have a dedicated audit log table
    // For now, we'll return recent user activities
    const logs = [
      {
        id: "1",
        timestamp: new Date(),
        action: "USER_LOGIN",
        userId: "system",
        details: "System audit log placeholder",
      },
    ];

    return {
      logs: logs.slice(0, limit),
      total: logs.length,
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

import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { EmailService } from "../csv/email.service";

export interface CreateNotificationDto {
  userId: string;
  type:
    | "APPROVAL_REQUEST"
    | "APPROVAL_APPROVED"
    | "APPROVAL_REJECTED"
    | "APPROVAL_INFO_REQUEST"
    | "SYSTEM_ALERT"
    | "MENTION";
  title: string;
  message: string;
  referenceId?: string;
  referenceType?: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  private safeJsonParse<T>(raw: string | null, fallback: T): T {
    if (!raw) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  private async getSetting(key: string): Promise<string | null> {
    const setting = await this.prisma.systemSetting.findUnique({ where: { key } });
    const value = setting?.value?.trim();
    return value && value.length > 0 ? value : null;
  }

  private async getGlobalChannelEnabled(channel: "email" | "sms" | "push") {
    const raw = await this.getSetting("SYS_NOTIFICATIONS_JSON");
    const parsed = this.safeJsonParse<any>(raw, null);
    const v = parsed?.[channel];
    return typeof v === "boolean" ? v : true;
  }

  private mapTypeToEmailPreferenceKey(type: CreateNotificationDto["type"]) {
    if (type === "APPROVAL_REQUEST") return "approvalRequests";
    if (
      type === "APPROVAL_APPROVED" ||
      type === "APPROVAL_REJECTED" ||
      type === "APPROVAL_INFO_REQUEST"
    ) {
      return "approvalUpdates";
    }
    if (type === "SYSTEM_ALERT") return "systemAlerts";
    return null;
  }

  private async shouldSendEmail(userId: string, type: CreateNotificationDto["type"]) {
    const smtpConfigured =
      !!process.env.SMTP_HOST &&
      !!process.env.SMTP_USER &&
      !!(process.env.SMTP_PASS || process.env.SMTP_PASSWORD);
    if (!smtpConfigured) return false;

    const globalEmailEnabled = await this.getGlobalChannelEnabled("email");
    if (!globalEmailEnabled) return false;

    const prefKey = this.mapTypeToEmailPreferenceKey(type);
    if (!prefKey) return false;

    const raw = await this.getSetting(`NOTIF_PREF_${userId}`);
    const prefs = this.safeJsonParse<any>(raw, null);
    const enabled = prefs?.email?.enabled;
    if (typeof enabled === "boolean" && !enabled) return false;

    const allowed = prefs?.email?.[prefKey];
    if (typeof allowed === "boolean") return allowed;

    return true;
  }

  private async trySendEmailNotification(n: CreateNotificationDto) {
    try {
      const should = await this.shouldSendEmail(n.userId, n.type);
      if (!should) return;

      const user = await this.prisma.user.findUnique({
        where: { id: n.userId },
        select: { email: true },
      });
      const to = (user?.email || "").trim();
      if (!to) return;

      await this.emailService.sendEmail({
        to: [to],
        subject: n.title,
        text: n.message,
      });
    } catch {
      return;
    }
  }

  async createNotification(data: CreateNotificationDto) {
    const created = await this.prisma.notification.create({
      data,
    });

    await this.trySendEmailNotification(data);
    return created;
  }

  async createBulkNotifications(notifications: CreateNotificationDto[]) {
    const res = await this.prisma.notification.createMany({
      data: notifications,
    });

    await Promise.all(notifications.map((n) => this.trySendEmailNotification(n)));
    return res;
  }

  async getUserNotifications(userId: string, unreadOnly: boolean = false) {
    return this.prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly ? { read: false } : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });
  }

  async markAsRead(notificationId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        read: true,
      },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
      },
    });
  }

  async deleteNotification(notificationId: string, userId: string) {
    return this.prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId,
      },
    });
  }

  // Helper: Get all users with specific role
  async getUsersByRole(roles: string[]) {
    return this.prisma.user.findMany({
      where: {
        role: { in: roles as any },
        status: "ACTIVE",
      },
      select: {
        id: true,
        role: true,
      },
    });
  }

  // Helper: Notify approvers for invoices
  async notifyInvoiceApprovers(
    invoiceId: string,
    invoiceNumber: string,
    amount: number,
    creatorName: string,
  ) {
    const approvers = await this.getUsersByRole(["CEO", "CFO", "ACCOUNTANT"]);

    const notifications: CreateNotificationDto[] = approvers.map(
      (approver) => ({
        userId: approver.id,
        type: "APPROVAL_REQUEST",
        title: "New Invoice Awaiting Approval",
        message: `${creatorName} submitted invoice ${invoiceNumber} for ₵${amount.toLocaleString()}`,
        referenceId: invoiceId,
        referenceType: "invoice",
      }),
    );

    if (notifications.length > 0) {
      await this.createBulkNotifications(notifications);
    }
  }

  // Helper: Notify approvers for purchase requests
  async notifyPurchaseRequestApprovers(
    requestId: string,
    requestNumber: string,
    title: string,
    creatorName: string,
  ) {
    const approvers = await this.getUsersByRole([
      "CEO",
      "CFO",
      "PROCUREMENT_OFFICER",
    ]);

    const notifications: CreateNotificationDto[] = approvers.map(
      (approver) => ({
        userId: approver.id,
        type: "APPROVAL_REQUEST",
        title: "New Purchase Request",
        message: `${creatorName} submitted purchase request "${title}" (${requestNumber})`,
        referenceId: requestId,
        referenceType: "purchase_request",
      }),
    );

    if (notifications.length > 0) {
      await this.createBulkNotifications(notifications);
    }
  }

  // Helper: Notify approvers for IT requests
  async notifyITRequestApprovers(
    requestId: string,
    requestNumber: string,
    title: string,
    creatorName: string,
  ) {
    const approvers = await this.getUsersByRole(["CEO", "CFO", "IT_MANAGER"]);

    const notifications: CreateNotificationDto[] = approvers.map(
      (approver) => ({
        userId: approver.id,
        type: "APPROVAL_REQUEST",
        title: "New IT Request",
        message: `${creatorName} submitted IT request "${title}" (${requestNumber})`,
        referenceId: requestId,
        referenceType: "it_request",
      }),
    );

    if (notifications.length > 0) {
      await this.createBulkNotifications(notifications);
    }
  }

  // Helper: Notify approvers for payment requests
  async notifyPaymentRequestApprovers(
    requestId: string,
    requestNumber: string,
    amount: number,
    creatorName: string,
  ) {
    const approvers = await this.getUsersByRole(["CEO", "CFO", "ACCOUNTANT"]);

    const notifications: CreateNotificationDto[] = approvers.map(
      (approver) => ({
        userId: approver.id,
        type: "APPROVAL_REQUEST",
        title: "New Payment Request",
        message: `${creatorName} submitted payment request ${requestNumber} for ₵${amount.toLocaleString()}`,
        referenceId: requestId,
        referenceType: "payment_request",
      }),
    );

    if (notifications.length > 0) {
      await this.createBulkNotifications(notifications);
    }
  }

  // Helper: Notify creator when approved/rejected
  async notifyCreatorOfApproval(
    creatorId: string,
    approved: boolean,
    itemType: string,
    itemNumber: string,
    approverName: string,
  ) {
    await this.createNotification({
      userId: creatorId,
      type: approved ? "APPROVAL_APPROVED" : "APPROVAL_REJECTED",
      title: approved ? `${itemType} Approved` : `${itemType} Rejected`,
      message: approved
        ? `Your ${itemType} ${itemNumber} was approved by ${approverName}`
        : `Your ${itemType} ${itemNumber} was rejected by ${approverName}`,
      referenceId: itemNumber,
      referenceType: itemType.toLowerCase().replace(" ", "_"),
    });
  }
}

import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";

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
  constructor(private prisma: PrismaService) {}

  async createNotification(data: CreateNotificationDto) {
    return this.prisma.notification.create({
      data,
    });
  }

  async createBulkNotifications(notifications: CreateNotificationDto[]) {
    return this.prisma.notification.createMany({
      data: notifications,
    });
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

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreatePaymentRequestDto, ApprovalActionDto } from './dto';

@Injectable()
export class PaymentRequestsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async createPaymentRequest(userId: string, dto: CreatePaymentRequestDto) {
    // Generate request number
    const count = await this.prisma.paymentRequest.count();
    const requestNumber = `PAY-${String(count + 1).padStart(6, '0')}`;

    const request = await this.prisma.paymentRequest.create({
      data: {
        requestNumber,
        paymentType: dto.paymentType as any,
        payeeName: dto.payeeName,
        payeeAccount: dto.payeeAccount,
        description: dto.description,
        amount: dto.amount,
        currency: dto.currency || 'GHS',
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        createdById: userId,
        attachmentUrl: dto.attachmentUrl,
        notes: dto.notes,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Send notifications to CFO and Accountants
    const creatorName = `${request.createdBy?.firstName || ''} ${request.createdBy?.lastName || ''}`;
    await this.notificationsService.notifyPaymentRequestApprovers(
      request.id,
      request.requestNumber,
      request.amount,
      creatorName,
    );

    return request;
  }

  async getPaymentRequests(userId: string, userRole: string) {
    // CFOs, CEOs, and Accountants see all
    // Others see only their own
    const canSeeAll = ['CEO', 'CFO', 'ACCOUNTANT', 'SUPER_ADMIN'].includes(userRole);

    return this.prisma.paymentRequest.findMany({
      where: canSeeAll ? {} : { createdById: userId },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        approvalHistory: {
          include: {
            approver: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getPaymentRequestById(id: string) {
    const request = await this.prisma.paymentRequest.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        approvalHistory: {
          include: {
            approver: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Payment request not found');
    }

    return request;
  }

  async approvePaymentRequest(requestId: string, userId: string, userRole: string, dto: ApprovalActionDto) {
    // Check if user can approve (CFO, CEO, ACCOUNTANT)
    const canApprove = ['CEO', 'CFO', 'ACCOUNTANT', 'SUPER_ADMIN'].includes(userRole);
    if (!canApprove) {
      throw new ForbiddenException('You do not have permission to approve payment requests');
    }

    // Get request
    const request = await this.getPaymentRequestById(requestId);
    if (request.status !== 'PENDING') {
      throw new ForbiddenException('Payment request is not pending approval');
    }

    // Create approval history
    await this.prisma.approvalHistory.create({
      data: {
        type: 'PAYMENT_REQUEST',
        referenceId: requestId,
        paymentRequestId: requestId,
        approverId: userId,
        action: 'APPROVED',
        comments: dto.comments,
      },
    });

    // Get approver info
    const approver = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });

    // Update request status
    const updatedRequest = await this.prisma.paymentRequest.update({
      where: { id: requestId },
      data: { status: 'APPROVED' },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        approvalHistory: {
          include: {
            approver: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });

    // Notify creator
    await this.notificationsService.notifyCreatorOfApproval(
      request.createdBy.id,
      true,
      'Payment Request',
      request.requestNumber,
      `${approver.firstName} ${approver.lastName}`,
    );

    return updatedRequest;
  }

  async rejectPaymentRequest(requestId: string, userId: string, userRole: string, dto: ApprovalActionDto) {
    // Check if user can reject (CFO, CEO, ACCOUNTANT)
    const canReject = ['CEO', 'CFO', 'ACCOUNTANT', 'SUPER_ADMIN'].includes(userRole);
    if (!canReject) {
      throw new ForbiddenException('You do not have permission to reject payment requests');
    }

    // Get request
    const request = await this.getPaymentRequestById(requestId);
    if (request.status !== 'PENDING') {
      throw new ForbiddenException('Payment request is not pending approval');
    }

    // Create approval history
    await this.prisma.approvalHistory.create({
      data: {
        type: 'PAYMENT_REQUEST',
        referenceId: requestId,
        paymentRequestId: requestId,
        approverId: userId,
        action: 'REJECTED',
        comments: dto.comments,
      },
    });

    // Get approver info
    const approver = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });

    // Update request status
    const updatedRequest = await this.prisma.paymentRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED' },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        approvalHistory: {
          include: {
            approver: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });

    // Notify creator of rejection
    await this.notificationsService.notifyCreatorOfApproval(
      request.createdBy.id,
      false,
      'Payment Request',
      request.requestNumber,
      `${approver.firstName} ${approver.lastName}`,
    );

    return updatedRequest;
  }
}

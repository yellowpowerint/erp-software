import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateInvoiceDto, CreatePurchaseRequestDto, ApprovalActionDto } from './dto';

@Injectable()
export class ApprovalsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  // Invoice Methods
  async createInvoice(userId: string, dto: CreateInvoiceDto) {
    // Generate invoice number
    const count = await this.prisma.invoice.count();
    const invoiceNumber = `INV-${String(count + 1).padStart(6, '0')}`;

    const invoice = await this.prisma.invoice.create({
      data: {
        invoiceNumber,
        supplierName: dto.supplierName,
        supplierEmail: dto.supplierEmail,
        description: dto.description,
        amount: dto.amount,
        currency: dto.currency || 'GHS',
        dueDate: new Date(dto.dueDate),
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

    // Send notifications to approvers
    const creatorName = `${invoice.createdBy.firstName} ${invoice.createdBy.lastName}`;
    await this.notificationsService.notifyInvoiceApprovers(
      invoice.id,
      invoice.invoiceNumber,
      invoice.amount,
      creatorName,
    );

    return invoice;
  }

  async getInvoices(userId: string, userRole: string) {
    // CEOs and CFOs see all invoices
    // Accountants see all invoices
    // Others see only their own
    const canSeeAll = ['CEO', 'CFO', 'ACCOUNTANT', 'SUPER_ADMIN'].includes(userRole);

    return this.prisma.invoice.findMany({
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

  async getInvoiceById(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
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

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  // Purchase Request Methods
  async createPurchaseRequest(userId: string, dto: CreatePurchaseRequestDto) {
    // Generate request number
    const count = await this.prisma.purchaseRequest.count();
    const requestNumber = `PR-${String(count + 1).padStart(6, '0')}`;

    const request = await this.prisma.purchaseRequest.create({
      data: {
        requestNumber,
        title: dto.title,
        description: dto.description,
        category: dto.category,
        quantity: dto.quantity,
        estimatedCost: dto.estimatedCost,
        currency: dto.currency || 'GHS',
        justification: dto.justification,
        urgency: dto.urgency || 'NORMAL',
        createdById: userId,
        attachmentUrl: dto.attachmentUrl,
        supplierSuggestion: dto.supplierSuggestion,
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

    // Send notifications to approvers
    const creatorName = `${request.createdBy.firstName} ${request.createdBy.lastName}`;
    await this.notificationsService.notifyPurchaseRequestApprovers(
      request.id,
      request.requestNumber,
      request.title,
      creatorName,
    );

    return request;
  }

  async getPurchaseRequests(userId: string, userRole: string) {
    // CEOs, CFOs, and Procurement Officers see all
    // Others see only their own
    const canSeeAll = ['CEO', 'CFO', 'PROCUREMENT_OFFICER', 'SUPER_ADMIN'].includes(userRole);

    return this.prisma.purchaseRequest.findMany({
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

  async getPurchaseRequestById(id: string) {
    const request = await this.prisma.purchaseRequest.findUnique({
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
      throw new NotFoundException('Purchase request not found');
    }

    return request;
  }

  // Approval Action Methods
  async approveInvoice(invoiceId: string, userId: string, userRole: string, dto: ApprovalActionDto) {
    // Check if user can approve (CFO, CEO, ACCOUNTANT)
    const canApprove = ['CEO', 'CFO', 'ACCOUNTANT', 'SUPER_ADMIN'].includes(userRole);
    if (!canApprove) {
      throw new ForbiddenException('You do not have permission to approve invoices');
    }

    // Get invoice
    const invoice = await this.getInvoiceById(invoiceId);
    if (invoice.status !== 'PENDING') {
      throw new ForbiddenException('Invoice is not pending approval');
    }

    // Create approval history
    await this.prisma.approvalHistory.create({
      data: {
        type: 'INVOICE',
        referenceId: invoiceId,
        invoiceId: invoiceId,
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

    // Update invoice status
    const updatedInvoice = await this.prisma.invoice.update({
      where: { id: invoiceId },
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
      invoice.createdBy.id,
      true,
      'Invoice',
      invoice.invoiceNumber,
      `${approver.firstName} ${approver.lastName}`,
    );

    return updatedInvoice;
  }

  async rejectInvoice(invoiceId: string, userId: string, userRole: string, dto: ApprovalActionDto) {
    // Check if user can reject (CFO, CEO, ACCOUNTANT)
    const canReject = ['CEO', 'CFO', 'ACCOUNTANT', 'SUPER_ADMIN'].includes(userRole);
    if (!canReject) {
      throw new ForbiddenException('You do not have permission to reject invoices');
    }

    // Get invoice
    const invoice = await this.getInvoiceById(invoiceId);
    if (invoice.status !== 'PENDING') {
      throw new ForbiddenException('Invoice is not pending approval');
    }

    // Create approval history
    await this.prisma.approvalHistory.create({
      data: {
        type: 'INVOICE',
        referenceId: invoiceId,
        invoiceId: invoiceId,
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

    // Update invoice status
    const updatedInvoice = await this.prisma.invoice.update({
      where: { id: invoiceId },
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
      invoice.createdBy.id,
      false,
      'Invoice',
      invoice.invoiceNumber,
      `${approver.firstName} ${approver.lastName}`,
    );

    return updatedInvoice;
  }

  async approvePurchaseRequest(requestId: string, userId: string, userRole: string, dto: ApprovalActionDto) {
    // Check if user can approve (CEO, CFO, PROCUREMENT_OFFICER)
    const canApprove = ['CEO', 'CFO', 'PROCUREMENT_OFFICER', 'SUPER_ADMIN'].includes(userRole);
    if (!canApprove) {
      throw new ForbiddenException('You do not have permission to approve purchase requests');
    }

    // Get request
    const request = await this.getPurchaseRequestById(requestId);
    if (request.status !== 'PENDING') {
      throw new ForbiddenException('Purchase request is not pending approval');
    }

    // Create approval history
    await this.prisma.approvalHistory.create({
      data: {
        type: 'PURCHASE_REQUEST',
        referenceId: requestId,
        purchaseRequestId: requestId,
        approverId: userId,
        action: 'APPROVED',
        comments: dto.comments,
      },
    });

    // Update request status
    return this.prisma.purchaseRequest.update({
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
  }

  async rejectPurchaseRequest(requestId: string, userId: string, userRole: string, dto: ApprovalActionDto) {
    // Check if user can reject (CEO, CFO, PROCUREMENT_OFFICER)
    const canReject = ['CEO', 'CFO', 'PROCUREMENT_OFFICER', 'SUPER_ADMIN'].includes(userRole);
    if (!canReject) {
      throw new ForbiddenException('You do not have permission to reject purchase requests');
    }

    // Get request
    const request = await this.getPurchaseRequestById(requestId);
    if (request.status !== 'PENDING') {
      throw new ForbiddenException('Purchase request is not pending approval');
    }

    // Create approval history
    await this.prisma.approvalHistory.create({
      data: {
        type: 'PURCHASE_REQUEST',
        referenceId: requestId,
        purchaseRequestId: requestId,
        approverId: userId,
        action: 'REJECTED',
        comments: dto.comments,
      },
    });

    // Update request status
    return this.prisma.purchaseRequest.update({
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
  }

  // Dashboard stats
  async getApprovalStats(userId: string, userRole: string) {
    const canSeeAll = ['CEO', 'CFO', 'SUPER_ADMIN'].includes(userRole);

    const [
      pendingInvoices,
      approvedInvoices,
      rejectedInvoices,
      pendingPurchaseRequests,
      approvedPurchaseRequests,
      rejectedPurchaseRequests,
    ] = await Promise.all([
      this.prisma.invoice.count({ where: canSeeAll ? { status: 'PENDING' } : { status: 'PENDING', createdById: userId } }),
      this.prisma.invoice.count({ where: canSeeAll ? { status: 'APPROVED' } : { status: 'APPROVED', createdById: userId } }),
      this.prisma.invoice.count({ where: canSeeAll ? { status: 'REJECTED' } : { status: 'REJECTED', createdById: userId } }),
      this.prisma.purchaseRequest.count({ where: canSeeAll ? { status: 'PENDING' } : { status: 'PENDING', createdById: userId } }),
      this.prisma.purchaseRequest.count({ where: canSeeAll ? { status: 'APPROVED' } : { status: 'APPROVED', createdById: userId } }),
      this.prisma.purchaseRequest.count({ where: canSeeAll ? { status: 'REJECTED' } : { status: 'REJECTED', createdById: userId } }),
    ]);

    return {
      invoices: {
        pending: pendingInvoices,
        approved: approvedInvoices,
        rejected: rejectedInvoices,
        total: pendingInvoices + approvedInvoices + rejectedInvoices,
      },
      purchaseRequests: {
        pending: pendingPurchaseRequests,
        approved: approvedPurchaseRequests,
        rejected: rejectedPurchaseRequests,
        total: pendingPurchaseRequests + approvedPurchaseRequests + rejectedPurchaseRequests,
      },
      totalPending: pendingInvoices + pendingPurchaseRequests,
    };
  }
}

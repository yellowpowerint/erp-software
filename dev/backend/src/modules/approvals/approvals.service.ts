import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { ITRequestsService } from "./it-requests.service";
import { PaymentRequestsService } from "./payment-requests.service";
import {
  CreateInvoiceDto,
  CreatePurchaseRequestDto,
  ApprovalActionDto,
  ApprovalsListQueryDto,
  RejectionActionDto,
} from "./dto";

type ApprovalListItem = {
  id: string;
  type: "INVOICE" | "PURCHASE_REQUEST" | "IT_REQUEST" | "PAYMENT_REQUEST";
  status: string;
  referenceNumber: string;
  title: string;
  requester: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  amount: number | null;
  currency: string | null;
  createdAt: Date;
};

type ApprovalsListResponse = {
  items: ApprovalListItem[];
  page: number;
  pageSize: number;
  total: number;
  hasNextPage: boolean;
};

type UnifiedApprovalType = "INVOICE" | "PURCHASE_REQUEST" | "IT_REQUEST" | "PAYMENT_REQUEST";

type UnifiedApprovalDetail = {
  id: string;
  type: UnifiedApprovalType;
  status: string;
  referenceNumber: string;
  title: string;
  description?: string | null;
  requester: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  amount: number | null;
  currency: string | null;
  createdAt: Date;
  attachmentUrl?: string | null;
  approvalHistory: any[];
};

@Injectable()
export class ApprovalsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private itRequestsService: ITRequestsService,
    private paymentRequestsService: PaymentRequestsService,
  ) {}

  async getApprovalsList(
    userId: string,
    userRole: string,
    query: ApprovalsListQueryDto,
  ): Promise<ApprovalsListResponse> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;
    const takePerType = Math.min(skip + pageSize, 200);

    const typeFilter = query.type ? String(query.type) : null;
    const statusFilter = query.status ? String(query.status) : null;

    const search = (query.search ?? "").trim();
    const hasSearch = search.length > 0;

    const invoiceCanSeeAll = ["CEO", "CFO", "ACCOUNTANT", "SUPER_ADMIN"].includes(userRole);
    const prCanSeeAll = ["CEO", "CFO", "PROCUREMENT_OFFICER", "SUPER_ADMIN"].includes(userRole);
    const itCanSeeAll = ["CEO", "CFO", "IT_MANAGER", "SUPER_ADMIN"].includes(userRole);
    const payCanSeeAll = ["CEO", "CFO", "ACCOUNTANT", "SUPER_ADMIN"].includes(userRole);

    const invoiceWhere: any = {
      ...(invoiceCanSeeAll ? {} : { createdById: userId }),
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(hasSearch
        ? {
            OR: [
              { invoiceNumber: { contains: search, mode: "insensitive" } },
              { supplierName: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
              { createdBy: { firstName: { contains: search, mode: "insensitive" } } },
              { createdBy: { lastName: { contains: search, mode: "insensitive" } } },
              { createdBy: { email: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const prWhere: any = {
      ...(prCanSeeAll ? {} : { createdById: userId }),
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(hasSearch
        ? {
            OR: [
              { requestNumber: { contains: search, mode: "insensitive" } },
              { title: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
              { category: { contains: search, mode: "insensitive" } },
              { createdBy: { firstName: { contains: search, mode: "insensitive" } } },
              { createdBy: { lastName: { contains: search, mode: "insensitive" } } },
              { createdBy: { email: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const itWhere: any = {
      ...(itCanSeeAll ? {} : { createdById: userId }),
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(hasSearch
        ? {
            OR: [
              { requestNumber: { contains: search, mode: "insensitive" } },
              { title: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
              { justification: { contains: search, mode: "insensitive" } },
              { createdBy: { firstName: { contains: search, mode: "insensitive" } } },
              { createdBy: { lastName: { contains: search, mode: "insensitive" } } },
              { createdBy: { email: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const payWhere: any = {
      ...(payCanSeeAll ? {} : { createdById: userId }),
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(hasSearch
        ? {
            OR: [
              { requestNumber: { contains: search, mode: "insensitive" } },
              { payeeName: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
              { createdBy: { firstName: { contains: search, mode: "insensitive" } } },
              { createdBy: { lastName: { contains: search, mode: "insensitive" } } },
              { createdBy: { email: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const wantInvoices = !typeFilter || typeFilter === "INVOICE";
    const wantPRs = !typeFilter || typeFilter === "PURCHASE_REQUEST";
    const wantITs = !typeFilter || typeFilter === "IT_REQUEST";
    const wantPays = !typeFilter || typeFilter === "PAYMENT_REQUEST";

    const [invoiceCount, prCount, itCount, payCount, invoices, prs, its, pays] = await Promise.all([
      wantInvoices ? this.prisma.invoice.count({ where: invoiceWhere }) : Promise.resolve(0),
      wantPRs ? this.prisma.purchaseRequest.count({ where: prWhere }) : Promise.resolve(0),
      wantITs ? this.prisma.iTRequest.count({ where: itWhere }) : Promise.resolve(0),
      wantPays ? this.prisma.paymentRequest.count({ where: payWhere }) : Promise.resolve(0),

      wantInvoices
        ? this.prisma.invoice.findMany({
            where: invoiceWhere,
            orderBy: { createdAt: "desc" },
            take: takePerType,
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
          })
        : Promise.resolve([]),
      wantPRs
        ? this.prisma.purchaseRequest.findMany({
            where: prWhere,
            orderBy: { createdAt: "desc" },
            take: takePerType,
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
          })
        : Promise.resolve([]),
      wantITs
        ? this.prisma.iTRequest.findMany({
            where: itWhere,
            orderBy: { createdAt: "desc" },
            take: takePerType,
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
          })
        : Promise.resolve([]),
      wantPays
        ? this.prisma.paymentRequest.findMany({
            where: payWhere,
            orderBy: { createdAt: "desc" },
            take: takePerType,
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
          })
        : Promise.resolve([]),
    ]);

    const items: ApprovalListItem[] = [];

    for (const inv of invoices as any[]) {
      items.push({
        id: inv.id,
        type: "INVOICE",
        status: inv.status,
        referenceNumber: inv.invoiceNumber,
        title: inv.description,
        requester: inv.createdBy,
        amount: typeof inv.amount === "number" ? inv.amount : null,
        currency: inv.currency ?? null,
        createdAt: inv.createdAt,
      });
    }

    for (const pr of prs as any[]) {
      items.push({
        id: pr.id,
        type: "PURCHASE_REQUEST",
        status: pr.status,
        referenceNumber: pr.requestNumber,
        title: pr.title,
        requester: pr.createdBy,
        amount: typeof pr.estimatedCost === "number" ? pr.estimatedCost : null,
        currency: pr.currency ?? null,
        createdAt: pr.createdAt,
      });
    }

    for (const it of its as any[]) {
      items.push({
        id: it.id,
        type: "IT_REQUEST",
        status: it.status,
        referenceNumber: it.requestNumber,
        title: it.title,
        requester: it.createdBy,
        amount: typeof it.estimatedCost === "number" ? it.estimatedCost : null,
        currency: it.currency ?? null,
        createdAt: it.createdAt,
      });
    }

    for (const pay of pays as any[]) {
      const title = pay.description || pay.payeeName || "Payment Request";
      items.push({
        id: pay.id,
        type: "PAYMENT_REQUEST",
        status: pay.status,
        referenceNumber: pay.requestNumber,
        title,
        requester: pay.createdBy,
        amount: typeof pay.amount === "number" ? pay.amount : null,
        currency: pay.currency ?? null,
        createdAt: pay.createdAt,
      });
    }

    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = invoiceCount + prCount + itCount + payCount;
    const pageItems = items.slice(skip, skip + pageSize);
    const hasNextPage = skip + pageSize < total;

    return {
      items: pageItems,
      page,
      pageSize,
      total,
      hasNextPage,
    };
  }

  private normalizeType(type: string): UnifiedApprovalType {
    const t = String(type || "").toUpperCase().trim();
    if (
      t === "INVOICE" ||
      t === "PURCHASE_REQUEST" ||
      t === "IT_REQUEST" ||
      t === "PAYMENT_REQUEST"
    ) {
      return t;
    }
    throw new NotFoundException("Approval type not found");
  }

  private assertCanView(
    type: UnifiedApprovalType,
    userId: string,
    userRole: string,
    createdById: string,
  ) {
    const canSeeAllByType: Record<UnifiedApprovalType, string[]> = {
      INVOICE: ["CEO", "CFO", "ACCOUNTANT", "SUPER_ADMIN"],
      PURCHASE_REQUEST: ["CEO", "CFO", "PROCUREMENT_OFFICER", "SUPER_ADMIN"],
      IT_REQUEST: ["CEO", "CFO", "IT_MANAGER", "SUPER_ADMIN"],
      PAYMENT_REQUEST: ["CEO", "CFO", "ACCOUNTANT", "SUPER_ADMIN"],
    };

    if (canSeeAllByType[type].includes(userRole)) return;
    if (createdById !== userId) {
      throw new ForbiddenException("You do not have access to this approval");
    }
  }

  async getApprovalDetail(
    userId: string,
    userRole: string,
    type: string,
    id: string,
  ): Promise<UnifiedApprovalDetail> {
    const t = this.normalizeType(type);

    if (t === "INVOICE") {
      const invoice = await this.getInvoiceById(id);
      this.assertCanView("INVOICE", userId, userRole, invoice.createdBy.id);
      return {
        id: invoice.id,
        type: "INVOICE",
        status: invoice.status,
        referenceNumber: invoice.invoiceNumber,
        title: invoice.description,
        description: invoice.notes ?? null,
        requester: invoice.createdBy,
        amount: typeof invoice.amount === "number" ? invoice.amount : null,
        currency: invoice.currency ?? null,
        createdAt: invoice.createdAt,
        attachmentUrl: invoice.attachmentUrl ?? null,
        approvalHistory: invoice.approvalHistory,
      };
    }

    if (t === "PURCHASE_REQUEST") {
      const pr = await this.getPurchaseRequestById(id);
      this.assertCanView("PURCHASE_REQUEST", userId, userRole, pr.createdBy.id);
      return {
        id: pr.id,
        type: "PURCHASE_REQUEST",
        status: pr.status,
        referenceNumber: pr.requestNumber,
        title: pr.title,
        description: pr.description ?? null,
        requester: pr.createdBy,
        amount: typeof pr.estimatedCost === "number" ? pr.estimatedCost : null,
        currency: pr.currency ?? null,
        createdAt: pr.createdAt,
        attachmentUrl: pr.attachmentUrl ?? null,
        approvalHistory: pr.approvalHistory,
      };
    }

    if (t === "IT_REQUEST") {
      const it = await this.itRequestsService.getITRequestById(id);
      this.assertCanView("IT_REQUEST", userId, userRole, it.createdBy.id);
      return {
        id: it.id,
        type: "IT_REQUEST",
        status: it.status,
        referenceNumber: it.requestNumber,
        title: it.title,
        description: it.description ?? null,
        requester: it.createdBy,
        amount: typeof it.estimatedCost === "number" ? it.estimatedCost : null,
        currency: it.currency ?? null,
        createdAt: it.createdAt,
        attachmentUrl: it.attachmentUrl ?? null,
        approvalHistory: it.approvalHistory,
      };
    }

    const pay = await this.paymentRequestsService.getPaymentRequestById(id);
    this.assertCanView("PAYMENT_REQUEST", userId, userRole, pay.createdBy.id);
    const title = pay.description || pay.payeeName || "Payment Request";
    return {
      id: pay.id,
      type: "PAYMENT_REQUEST",
      status: pay.status,
      referenceNumber: pay.requestNumber,
      title,
      description: pay.notes ?? null,
      requester: pay.createdBy,
      amount: typeof pay.amount === "number" ? pay.amount : null,
      currency: pay.currency ?? null,
      createdAt: pay.createdAt,
      attachmentUrl: pay.attachmentUrl ?? null,
      approvalHistory: pay.approvalHistory,
    };
  }

  async approveApproval(
    type: string,
    id: string,
    userId: string,
    userRole: string,
    dto: ApprovalActionDto,
  ) {
    const t = this.normalizeType(type);
    const detail = await this.getApprovalDetail(userId, userRole, t, id);
    if (detail.status !== "PENDING") {
      throw new ConflictException("This approval has already been actioned");
    }

    if (t === "INVOICE") return this.approveInvoice(id, userId, userRole, dto);
    if (t === "PURCHASE_REQUEST") return this.approvePurchaseRequest(id, userId, userRole, dto);
    if (t === "IT_REQUEST") return this.itRequestsService.approveITRequest(id, userId, userRole, dto);
    return this.paymentRequestsService.approvePaymentRequest(id, userId, userRole, dto);
  }

  async rejectApproval(
    type: string,
    id: string,
    userId: string,
    userRole: string,
    dto: RejectionActionDto,
  ) {
    const t = this.normalizeType(type);
    const detail = await this.getApprovalDetail(userId, userRole, t, id);
    if (detail.status !== "PENDING") {
      throw new ConflictException("This approval has already been actioned");
    }

    if (t === "INVOICE") return this.rejectInvoice(id, userId, userRole, dto);
    if (t === "PURCHASE_REQUEST") return this.rejectPurchaseRequest(id, userId, userRole, dto);
    if (t === "IT_REQUEST") return this.itRequestsService.rejectITRequest(id, userId, userRole, dto);
    return this.paymentRequestsService.rejectPaymentRequest(id, userId, userRole, dto);
  }

  // Invoice Methods
  async createInvoice(userId: string, dto: CreateInvoiceDto) {
    // Generate invoice number
    const count = await this.prisma.invoice.count();
    const invoiceNumber = `INV-${String(count + 1).padStart(6, "0")}`;

    const invoice = await this.prisma.invoice.create({
      data: {
        invoiceNumber,
        supplierName: dto.supplierName,
        supplierEmail: dto.supplierEmail,
        description: dto.description,
        amount: dto.amount,
        currency: dto.currency || "GHS",
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
    const canSeeAll = ["CEO", "CFO", "ACCOUNTANT", "SUPER_ADMIN"].includes(
      userRole,
    );

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
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
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
            createdAt: "desc",
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException("Invoice not found");
    }

    return invoice;
  }

  // Purchase Request Methods
  async createPurchaseRequest(userId: string, dto: CreatePurchaseRequestDto) {
    // Generate request number
    const count = await this.prisma.purchaseRequest.count();
    const requestNumber = `PR-${String(count + 1).padStart(6, "0")}`;

    const request = await this.prisma.purchaseRequest.create({
      data: {
        requestNumber,
        title: dto.title,
        description: dto.description,
        category: dto.category,
        quantity: dto.quantity,
        estimatedCost: dto.estimatedCost,
        currency: dto.currency || "GHS",
        justification: dto.justification,
        urgency: dto.urgency || "NORMAL",
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
    const canSeeAll = [
      "CEO",
      "CFO",
      "PROCUREMENT_OFFICER",
      "SUPER_ADMIN",
    ].includes(userRole);

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
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
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
            createdAt: "desc",
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException("Purchase request not found");
    }

    return request;
  }

  // Approval Action Methods
  async approveInvoice(
    invoiceId: string,
    userId: string,
    userRole: string,
    dto: ApprovalActionDto,
  ) {
    // Check if user can approve (CFO, CEO, ACCOUNTANT)
    const canApprove = ["CEO", "CFO", "ACCOUNTANT", "SUPER_ADMIN"].includes(
      userRole,
    );
    if (!canApprove) {
      throw new ForbiddenException(
        "You do not have permission to approve invoices",
      );
    }

    // Get invoice
    const invoice = await this.getInvoiceById(invoiceId);
    if (invoice.status !== "PENDING") {
      throw new ForbiddenException("Invoice is not pending approval");
    }

    // Create approval history
    await this.prisma.approvalHistory.create({
      data: {
        type: "INVOICE",
        referenceId: invoiceId,
        invoiceId: invoiceId,
        approverId: userId,
        action: "APPROVED",
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
      data: { status: "APPROVED" },
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
      "Invoice",
      invoice.invoiceNumber,
      `${approver.firstName} ${approver.lastName}`,
    );

    return updatedInvoice;
  }

  async rejectInvoice(
    invoiceId: string,
    userId: string,
    userRole: string,
    dto: ApprovalActionDto,
  ) {
    // Check if user can reject (CFO, CEO, ACCOUNTANT)
    const canReject = ["CEO", "CFO", "ACCOUNTANT", "SUPER_ADMIN"].includes(
      userRole,
    );
    if (!canReject) {
      throw new ForbiddenException(
        "You do not have permission to reject invoices",
      );
    }

    // Get invoice
    const invoice = await this.getInvoiceById(invoiceId);
    if (invoice.status !== "PENDING") {
      throw new ForbiddenException("Invoice is not pending approval");
    }

    // Create approval history
    await this.prisma.approvalHistory.create({
      data: {
        type: "INVOICE",
        referenceId: invoiceId,
        invoiceId: invoiceId,
        approverId: userId,
        action: "REJECTED",
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
      data: { status: "REJECTED" },
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
      "Invoice",
      invoice.invoiceNumber,
      `${approver.firstName} ${approver.lastName}`,
    );

    return updatedInvoice;
  }

  async approvePurchaseRequest(
    requestId: string,
    userId: string,
    userRole: string,
    dto: ApprovalActionDto,
  ) {
    // Check if user can approve (CEO, CFO, PROCUREMENT_OFFICER)
    const canApprove = [
      "CEO",
      "CFO",
      "PROCUREMENT_OFFICER",
      "SUPER_ADMIN",
    ].includes(userRole);
    if (!canApprove) {
      throw new ForbiddenException(
        "You do not have permission to approve purchase requests",
      );
    }

    // Get request
    const request = await this.getPurchaseRequestById(requestId);
    if (request.status !== "PENDING") {
      throw new ForbiddenException("Purchase request is not pending approval");
    }

    // Create approval history
    await this.prisma.approvalHistory.create({
      data: {
        type: "PURCHASE_REQUEST",
        referenceId: requestId,
        purchaseRequestId: requestId,
        approverId: userId,
        action: "APPROVED",
        comments: dto.comments,
      },
    });

    // Update request status
    return this.prisma.purchaseRequest.update({
      where: { id: requestId },
      data: { status: "APPROVED" },
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

  async rejectPurchaseRequest(
    requestId: string,
    userId: string,
    userRole: string,
    dto: ApprovalActionDto,
  ) {
    // Check if user can reject (CEO, CFO, PROCUREMENT_OFFICER)
    const canReject = [
      "CEO",
      "CFO",
      "PROCUREMENT_OFFICER",
      "SUPER_ADMIN",
    ].includes(userRole);
    if (!canReject) {
      throw new ForbiddenException(
        "You do not have permission to reject purchase requests",
      );
    }

    // Get request
    const request = await this.getPurchaseRequestById(requestId);
    if (request.status !== "PENDING") {
      throw new ForbiddenException("Purchase request is not pending approval");
    }

    // Create approval history
    await this.prisma.approvalHistory.create({
      data: {
        type: "PURCHASE_REQUEST",
        referenceId: requestId,
        purchaseRequestId: requestId,
        approverId: userId,
        action: "REJECTED",
        comments: dto.comments,
      },
    });

    // Update request status
    return this.prisma.purchaseRequest.update({
      where: { id: requestId },
      data: { status: "REJECTED" },
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
    const canSeeAll = ["CEO", "CFO", "SUPER_ADMIN"].includes(userRole);

    const [
      pendingInvoices,
      approvedInvoices,
      rejectedInvoices,
      pendingPurchaseRequests,
      approvedPurchaseRequests,
      rejectedPurchaseRequests,
    ] = await Promise.all([
      this.prisma.invoice.count({
        where: canSeeAll
          ? { status: "PENDING" }
          : { status: "PENDING", createdById: userId },
      }),
      this.prisma.invoice.count({
        where: canSeeAll
          ? { status: "APPROVED" }
          : { status: "APPROVED", createdById: userId },
      }),
      this.prisma.invoice.count({
        where: canSeeAll
          ? { status: "REJECTED" }
          : { status: "REJECTED", createdById: userId },
      }),
      this.prisma.purchaseRequest.count({
        where: canSeeAll
          ? { status: "PENDING" }
          : { status: "PENDING", createdById: userId },
      }),
      this.prisma.purchaseRequest.count({
        where: canSeeAll
          ? { status: "APPROVED" }
          : { status: "APPROVED", createdById: userId },
      }),
      this.prisma.purchaseRequest.count({
        where: canSeeAll
          ? { status: "REJECTED" }
          : { status: "REJECTED", createdById: userId },
      }),
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
        total:
          pendingPurchaseRequests +
          approvedPurchaseRequests +
          rejectedPurchaseRequests,
      },
      totalPending: pendingInvoices + pendingPurchaseRequests,
    };
  }
}

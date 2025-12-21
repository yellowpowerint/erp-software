import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  ApprovalStatus,
  Prisma,
  Priority,
  RequisitionStatus,
  UserRole,
} from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { StorageService } from "../documents/services/storage.service";
import {
  AddRequisitionItemDto,
  CreateRequisitionDto,
  UpdateRequisitionDto,
  UpdateRequisitionItemDto,
} from "./dto";

@Injectable()
export class RequisitionsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private storageService: StorageService,
  ) {}

  private canSeeAll(role: UserRole): boolean {
    return [
      UserRole.SUPER_ADMIN,
      UserRole.CEO,
      UserRole.CFO,
      UserRole.PROCUREMENT_OFFICER,
    ].includes(role);
  }

  private canManageOthers(role: UserRole): boolean {
    return [
      UserRole.SUPER_ADMIN,
      UserRole.CEO,
      UserRole.CFO,
      UserRole.PROCUREMENT_OFFICER,
      UserRole.OPERATIONS_MANAGER,
    ].includes(role);
  }

  private toDecimal(value: string): Prisma.Decimal {
    const n = Number(value);
    if (!Number.isFinite(n)) {
      throw new BadRequestException("Invalid number");
    }
    return new Prisma.Decimal(n);
  }

  private computeItemTotals(dto: AddRequisitionItemDto) {
    const qty = this.toDecimal(dto.quantity);
    const unitPrice = this.toDecimal(dto.estimatedPrice);
    const total = qty.mul(unitPrice);

    return { qty, unitPrice, total };
  }

  private async recomputeRequisitionTotal(
    tx: Prisma.TransactionClient,
    requisitionId: string,
  ) {
    const items = await tx.requisitionItem.findMany({
      where: { requisitionId },
      select: { totalPrice: true },
    });

    const total = items.reduce(
      (acc, i) => acc.add(i.totalPrice),
      new Prisma.Decimal(0),
    );

    await tx.requisition.update({
      where: { id: requisitionId },
      data: { totalEstimate: total },
    });

    return total;
  }

  private async generateRequisitionNumber(tx: Prisma.TransactionClient) {
    const year = new Date().getFullYear();
    const prefix = `REQ-${year}-`;

    const count = await tx.requisition.count({
      where: {
        requisitionNo: {
          startsWith: prefix,
        },
      },
    });

    return `${prefix}${String(count + 1).padStart(4, "0")}`;
  }

  private async assertAccess(
    requisitionId: string,
    userId: string,
    role: UserRole,
  ) {
    const requisition = await this.prisma.requisition.findUnique({
      where: { id: requisitionId },
      include: { approvalHistory: true },
    });

    if (!requisition) {
      throw new NotFoundException("Requisition not found");
    }

    const isOwner = requisition.requestedById === userId;
    const isApprover = requisition.approvalHistory.some(
      (a) => a.approverId === userId,
    );

    if (!this.canSeeAll(role) && !isOwner && !isApprover) {
      throw new ForbiddenException(
        "You do not have access to this requisition",
      );
    }

    return requisition;
  }

  private async pickStage1Approver(department: string) {
    const deptHead = await this.prisma.user.findFirst({
      where: {
        role: UserRole.DEPARTMENT_HEAD,
        department,
        status: "ACTIVE",
      },
      select: { id: true },
    });
    if (deptHead) return deptHead;

    const ops = await this.prisma.user.findFirst({
      where: { role: UserRole.OPERATIONS_MANAGER, status: "ACTIVE" },
      select: { id: true },
    });
    if (ops) return ops;

    const proc = await this.prisma.user.findFirst({
      where: { role: UserRole.PROCUREMENT_OFFICER, status: "ACTIVE" },
      select: { id: true },
    });
    if (proc) return proc;

    const cfo = await this.prisma.user.findFirst({
      where: { role: UserRole.CFO, status: "ACTIVE" },
      select: { id: true },
    });
    if (cfo) return cfo;

    const ceo = await this.prisma.user.findFirst({
      where: { role: UserRole.CEO, status: "ACTIVE" },
      select: { id: true },
    });
    if (ceo) return ceo;

    return null;
  }

  async createRequisition(dto: CreateRequisitionDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const requisitionNo = await this.generateRequisitionNumber(tx);

      const itemsData = (dto.items || []).map((item) => {
        const { qty, unitPrice, total } = this.computeItemTotals(item);

        return {
          itemName: item.itemName,
          description: item.description,
          category: item.category,
          quantity: qty,
          unit: item.unit,
          estimatedPrice: unitPrice,
          totalPrice: total,
          specifications: item.specifications,
          preferredVendor: item.preferredVendor,
          stockItemId: item.stockItemId,
          urgency: item.urgency || Priority.MEDIUM,
          notes: item.notes,
        };
      });

      const req = await tx.requisition.create({
        data: {
          requisitionNo,
          title: dto.title,
          description: dto.description,
          type: dto.type,
          priority: dto.priority || Priority.MEDIUM,
          status: RequisitionStatus.DRAFT,
          department: dto.department,
          projectId: dto.projectId,
          siteLocation: dto.siteLocation,
          requiredDate: new Date(dto.requiredDate),
          justification: dto.justification,
          currency: dto.currency || "GHS",
          requestedById: userId,
          items: itemsData.length > 0 ? { create: itemsData } : undefined,
        },
        include: {
          items: true,
          requestedBy: {
            select: { id: true, firstName: true, lastName: true, role: true },
          },
          project: { select: { id: true, name: true, projectCode: true } },
        },
      });

      await this.recomputeRequisitionTotal(tx, req.id);

      return req;
    });
  }

  async getRequisitions(filters: any, userId: string, role: UserRole) {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filters.limit) || 25));
    const skip = (page - 1) * limit;

    const where: Prisma.RequisitionWhereInput = {};

    if (!this.canSeeAll(role)) {
      where.requestedById = userId;
    }

    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.department) where.department = filters.department;
    if (filters.type) where.type = filters.type;
    if (filters.projectId) where.projectId = filters.projectId;

    if (filters.search) {
      where.OR = [
        { title: { contains: String(filters.search), mode: "insensitive" } },
        {
          requisitionNo: {
            contains: String(filters.search),
            mode: "insensitive",
          },
        },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.requisition.count({ where }),
      this.prisma.requisition.findMany({
        where,
        include: {
          requestedBy: {
            select: { id: true, firstName: true, lastName: true, role: true },
          },
          project: { select: { id: true, name: true, projectCode: true } },
          _count: { select: { items: true, attachments: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data,
    };
  }

  async getMyRequisitions(userId: string) {
    return this.prisma.requisition.findMany({
      where: { requestedById: userId },
      include: { _count: { select: { items: true, attachments: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async getPendingApprovals(userId: string) {
    return this.prisma.requisition.findMany({
      where: {
        approvalHistory: {
          some: {
            approverId: userId,
            status: ApprovalStatus.PENDING,
          },
        },
      },
      include: {
        requestedBy: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
        _count: { select: { items: true, attachments: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getStats(userId: string, role: UserRole) {
    const where: Prisma.RequisitionWhereInput = this.canSeeAll(role)
      ? {}
      : { requestedById: userId };

    const grouped = await this.prisma.requisition.groupBy({
      by: ["status"],
      where,
      _count: { _all: true },
    });

    const byStatus = grouped.reduce<Record<string, number>>((acc, g) => {
      acc[g.status] = g._count._all;
      return acc;
    }, {});

    const pendingApprovals = await this.prisma.requisition.count({
      where: {
        approvalHistory: {
          some: { approverId: userId, status: ApprovalStatus.PENDING },
        },
      },
    });

    return {
      total: Object.values(byStatus).reduce((a, b) => a + b, 0),
      byStatus,
      pendingApprovals,
    };
  }

  async getRequisitionById(id: string, userId: string, role: UserRole) {
    await this.assertAccess(id, userId, role);

    const requisition = await this.prisma.requisition.findUnique({
      where: { id },
      include: {
        items: true,
        attachments: {
          include: {
            uploadedBy: {
              select: { id: true, firstName: true, lastName: true, role: true },
            },
          },
          orderBy: { uploadedAt: "desc" },
        },
        requestedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        rejectedBy: {
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
          orderBy: { stage: "asc" },
        },
        project: { select: { id: true, name: true, projectCode: true } },
      },
    });

    if (!requisition) {
      throw new NotFoundException("Requisition not found");
    }

    return requisition;
  }

  async updateRequisition(
    id: string,
    dto: UpdateRequisitionDto,
    userId: string,
    role: UserRole,
  ) {
    const requisition = await this.prisma.requisition.findUnique({
      where: { id },
    });
    if (!requisition) throw new NotFoundException("Requisition not found");

    const isOwner = requisition.requestedById === userId;
    if (!isOwner && !this.canManageOthers(role)) {
      throw new ForbiddenException("Not allowed");
    }

    if (requisition.status !== RequisitionStatus.DRAFT) {
      throw new BadRequestException("Only draft requisitions can be updated");
    }

    return this.prisma.requisition.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        type: dto.type,
        priority: dto.priority,
        department: dto.department,
        projectId: dto.projectId,
        siteLocation: dto.siteLocation,
        requiredDate: dto.requiredDate ? new Date(dto.requiredDate) : undefined,
        justification: dto.justification,
        currency: dto.currency,
      },
      include: {
        items: true,
        attachments: true,
        approvalHistory: true,
      },
    });
  }

  async deleteRequisition(id: string, userId: string, role: UserRole) {
    const requisition = await this.prisma.requisition.findUnique({
      where: { id },
    });
    if (!requisition) throw new NotFoundException("Requisition not found");

    const isOwner = requisition.requestedById === userId;
    if (!isOwner && !this.canManageOthers(role)) {
      throw new ForbiddenException("Not allowed");
    }

    if (requisition.status !== RequisitionStatus.DRAFT) {
      throw new BadRequestException("Only draft requisitions can be deleted");
    }

    await this.prisma.requisition.delete({ where: { id } });
    return { success: true };
  }

  async submitRequisition(id: string, userId: string, role: UserRole) {
    const requisition = await this.prisma.requisition.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!requisition) throw new NotFoundException("Requisition not found");

    const isOwner = requisition.requestedById === userId;
    if (!isOwner && !this.canManageOthers(role)) {
      throw new ForbiddenException("Not allowed");
    }

    if (requisition.status !== RequisitionStatus.DRAFT) {
      throw new BadRequestException("Only draft requisitions can be submitted");
    }

    if (!requisition.items?.length) {
      throw new BadRequestException("Add at least one item before submitting");
    }

    const approver = await this.pickStage1Approver(requisition.department);
    if (!approver) {
      throw new BadRequestException("No approver found for this requisition");
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.requisitionApproval.upsert({
        where: {
          requisitionId_stage: {
            requisitionId: requisition.id,
            stage: 1,
          },
        },
        update: {
          approverId: approver.id,
          status: ApprovalStatus.PENDING,
          comments: null,
          actionAt: null,
        },
        create: {
          requisitionId: requisition.id,
          stage: 1,
          approverId: approver.id,
          status: ApprovalStatus.PENDING,
        },
      });

      return tx.requisition.update({
        where: { id: requisition.id },
        data: {
          status: RequisitionStatus.PENDING_APPROVAL,
          currentStage: 1,
        },
        include: {
          items: true,
          requestedBy: {
            select: { id: true, firstName: true, lastName: true, role: true },
          },
        },
      });
    });

    const requestor = await this.prisma.user.findUnique({
      where: { id: requisition.requestedById },
      select: { firstName: true, lastName: true },
    });

    const creatorName = requestor
      ? `${requestor.firstName} ${requestor.lastName}`
      : "A user";

    await this.notificationsService.createNotification({
      userId: approver.id,
      type: "APPROVAL_REQUEST",
      title: "New Requisition Awaiting Approval",
      message: `${creatorName} submitted requisition ${updated.requisitionNo} (${updated.title})`,
      referenceId: updated.id,
      referenceType: "requisition",
    });

    return updated;
  }

  async cancelRequisition(
    id: string,
    userId: string,
    role: UserRole,
    reason: string,
  ) {
    const requisition = await this.prisma.requisition.findUnique({
      where: { id },
    });
    if (!requisition) throw new NotFoundException("Requisition not found");

    const isOwner = requisition.requestedById === userId;
    if (!isOwner && !this.canManageOthers(role)) {
      throw new ForbiddenException("Not allowed");
    }

    if (
      [RequisitionStatus.CANCELLED, RequisitionStatus.COMPLETED].includes(
        requisition.status,
      )
    ) {
      throw new BadRequestException("Requisition cannot be cancelled");
    }

    return this.prisma.requisition.update({
      where: { id },
      data: {
        status: RequisitionStatus.CANCELLED,
        rejectedById: userId,
        rejectedAt: new Date(),
        rejectionReason: reason,
      },
    });
  }

  async addItem(
    requisitionId: string,
    dto: AddRequisitionItemDto,
    userId: string,
    role: UserRole,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const req = await tx.requisition.findUnique({
        where: { id: requisitionId },
      });
      if (!req) throw new NotFoundException("Requisition not found");

      const isOwner = req.requestedById === userId;
      if (!isOwner && !this.canManageOthers(role)) {
        throw new ForbiddenException("Not allowed");
      }

      if (req.status !== RequisitionStatus.DRAFT) {
        throw new BadRequestException("Items can only be modified on drafts");
      }

      const { qty, unitPrice, total } = this.computeItemTotals(dto);

      const item = await tx.requisitionItem.create({
        data: {
          requisitionId,
          itemName: dto.itemName,
          description: dto.description,
          category: dto.category,
          quantity: qty,
          unit: dto.unit,
          estimatedPrice: unitPrice,
          totalPrice: total,
          specifications: dto.specifications,
          preferredVendor: dto.preferredVendor,
          stockItemId: dto.stockItemId,
          urgency: dto.urgency || Priority.MEDIUM,
          notes: dto.notes,
        },
      });

      await this.recomputeRequisitionTotal(tx, requisitionId);
      return item;
    });
  }

  async updateItem(
    requisitionId: string,
    itemId: string,
    dto: UpdateRequisitionItemDto,
    userId: string,
    role: UserRole,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const req = await tx.requisition.findUnique({
        where: { id: requisitionId },
      });
      if (!req) throw new NotFoundException("Requisition not found");

      const isOwner = req.requestedById === userId;
      if (!isOwner && !this.canManageOthers(role)) {
        throw new ForbiddenException("Not allowed");
      }

      if (req.status !== RequisitionStatus.DRAFT) {
        throw new BadRequestException("Items can only be modified on drafts");
      }

      const existing = await tx.requisitionItem.findFirst({
        where: { id: itemId, requisitionId },
      });
      if (!existing) throw new NotFoundException("Item not found");

      const quantity = dto.quantity
        ? this.toDecimal(dto.quantity)
        : existing.quantity;
      const estimatedPrice = dto.estimatedPrice
        ? this.toDecimal(dto.estimatedPrice)
        : existing.estimatedPrice;

      const totalPrice = quantity.mul(estimatedPrice);

      const updated = await tx.requisitionItem.update({
        where: { id: itemId },
        data: {
          itemName: dto.itemName,
          description: dto.description,
          category: dto.category,
          quantity,
          unit: dto.unit,
          estimatedPrice,
          totalPrice,
          specifications: dto.specifications,
          preferredVendor: dto.preferredVendor,
          stockItemId: dto.stockItemId,
          urgency: dto.urgency,
          notes: dto.notes,
        },
      });

      await this.recomputeRequisitionTotal(tx, requisitionId);
      return updated;
    });
  }

  async deleteItem(
    requisitionId: string,
    itemId: string,
    userId: string,
    role: UserRole,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const req = await tx.requisition.findUnique({
        where: { id: requisitionId },
      });
      if (!req) throw new NotFoundException("Requisition not found");

      const isOwner = req.requestedById === userId;
      if (!isOwner && !this.canManageOthers(role)) {
        throw new ForbiddenException("Not allowed");
      }

      if (req.status !== RequisitionStatus.DRAFT) {
        throw new BadRequestException("Items can only be modified on drafts");
      }

      await tx.requisitionItem.deleteMany({
        where: { id: itemId, requisitionId },
      });

      await this.recomputeRequisitionTotal(tx, requisitionId);
      return { success: true };
    });
  }

  async uploadAttachment(
    requisitionId: string,
    file: Express.Multer.File,
    userId: string,
    role: UserRole,
  ) {
    if (!file) {
      throw new BadRequestException("File is required");
    }

    await this.assertAccess(requisitionId, userId, role);

    const upload = await this.storageService.uploadFile(file, "requisitions");

    return this.prisma.requisitionAttachment.create({
      data: {
        requisitionId,
        fileName: file.originalname,
        fileUrl: upload.url,
        fileType: file.mimetype,
        uploadedById: userId,
      },
    });
  }
}

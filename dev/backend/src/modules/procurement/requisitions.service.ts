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
  ProcurementApprovalType,
  RequisitionStatus,
  UserRole,
} from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { StorageService } from "../documents/services/storage.service";
import { ApprovalDelegationsService } from "./approval-delegations.service";
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
    private delegationsService: ApprovalDelegationsService,
  ) {}

  private canSeeAll(role: UserRole): boolean {
    return (
      [
        UserRole.SUPER_ADMIN,
        UserRole.CEO,
        UserRole.CFO,
        UserRole.PROCUREMENT_OFFICER,
      ] as UserRole[]
    ).includes(role);
  }

  private canManageOthers(role: UserRole): boolean {
    return (
      [
        UserRole.SUPER_ADMIN,
        UserRole.CEO,
        UserRole.CFO,
        UserRole.PROCUREMENT_OFFICER,
        UserRole.OPERATIONS_MANAGER,
      ] as UserRole[]
    ).includes(role);
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

    const delegatorIds = isApprover
      ? []
      : await this.getActiveDelegatorIds(userId);

    const isDelegateApprover =
      !isApprover &&
      delegatorIds.length > 0 &&
      requisition.approvalHistory.some((a) =>
        delegatorIds.includes(a.approverId),
      );

    if (
      !this.canSeeAll(role) &&
      !isOwner &&
      !isApprover &&
      !isDelegateApprover
    ) {
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

  private async getActiveDelegatorIds(
    delegateId: string,
    at: Date = new Date(),
  ) {
    const delegations = await this.prisma.approvalDelegation.findMany({
      where: {
        delegateId,
        isActive: true,
        startDate: { lte: at },
        endDate: { gte: at },
      },
      select: { delegatorId: true },
    });

    return delegations.map((d) => d.delegatorId);
  }

  private async getApplicableWorkflow(requisition: {
    type: any;
    totalEstimate: Prisma.Decimal | null;
  }) {
    const workflows = await this.prisma.procurementWorkflow.findMany({
      where: { isActive: true },
      include: { stages: { orderBy: { stageNumber: "asc" } } },
      orderBy: { createdAt: "desc" },
    });

    const amount = requisition.totalEstimate ?? new Prisma.Decimal(0);

    const matches = workflows.filter((w) => {
      if (w.type && w.type !== requisition.type) return false;
      if (w.minAmount && w.minAmount.greaterThan(amount)) return false;
      if (w.maxAmount && w.maxAmount.lessThan(amount)) return false;
      return true;
    });

    matches.sort((a, b) => {
      const aScore = a.type ? 1 : 0;
      const bScore = b.type ? 1 : 0;
      return bScore - aScore;
    });

    return matches[0] ?? null;
  }

  private async resolveStageApproverIds(stage: {
    approverId: string | null;
    approverRole: UserRole | null;
  }) {
    if (stage.approverId) return [stage.approverId];

    if (stage.approverRole) {
      const users = await this.prisma.user.findMany({
        where: { role: stage.approverRole, status: "ACTIVE" },
        select: { id: true },
      });
      return users.map((u) => u.id);
    }

    return [];
  }

  private async mapApproverIdsToNotificationRecipients(approverIds: string[]) {
    const out: string[] = [];
    for (const approverId of approverIds) {
      const delegateId =
        await this.delegationsService.resolveDelegate(approverId);
      out.push(delegateId ?? approverId);
    }
    return Array.from(new Set(out));
  }

  private async notifyApprovers(
    approverIds: string[],
    requisition: { id: string; requisitionNo: string; title: string },
    creatorName: string,
  ) {
    const recipients =
      await this.mapApproverIdsToNotificationRecipients(approverIds);

    await this.notificationsService.createBulkNotifications(
      recipients.map((id) => ({
        userId: id,
        type: "APPROVAL_REQUEST",
        title: "New Requisition Awaiting Approval",
        message: `${creatorName} submitted requisition ${requisition.requisitionNo} (${requisition.title})`,
        referenceId: requisition.id,
        referenceType: "requisition",
      })),
    );
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
    const delegatorIds = await this.getActiveDelegatorIds(userId);
    const approverIds = [userId, ...delegatorIds];

    return this.prisma.requisition.findMany({
      where: {
        approvalHistory: {
          some: {
            approverId: { in: approverIds },
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

    const delegatorIds = await this.getActiveDelegatorIds(userId);
    const approverIds = [userId, ...delegatorIds];

    const pendingApprovals = await this.prisma.requisition.count({
      where: {
        approvalHistory: {
          some: {
            approverId: { in: approverIds },
            status: ApprovalStatus.PENDING,
          },
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

    const updated = await this.prisma.$transaction(async (tx) => {
      const fullReq = await tx.requisition.findUnique({
        where: { id: requisition.id },
        select: { id: true, type: true, totalEstimate: true },
      });
      if (!fullReq) throw new NotFoundException("Requisition not found");

      const workflow = await this.getApplicableWorkflow(fullReq);

      // Clear any previous approvals on re-submission from DRAFT
      await tx.requisitionApproval.deleteMany({
        where: { requisitionId: requisition.id },
      });

      let workflowId: string | null = null;
      let stage1ApproverIds: string[] = [];

      if (workflow) {
        workflowId = workflow.id;
        const stage1 = workflow.stages.find((s) => s.stageNumber === 1);
        if (!stage1) {
          throw new BadRequestException("Workflow has no stage 1");
        }
        stage1ApproverIds = await this.resolveStageApproverIds({
          approverId: stage1.approverId,
          approverRole: stage1.approverRole,
        });
      } else {
        const approver = await this.pickStage1Approver(requisition.department);
        if (!approver) {
          throw new BadRequestException(
            "No approver found for this requisition",
          );
        }
        stage1ApproverIds = [approver.id];
      }

      if (!stage1ApproverIds.length) {
        throw new BadRequestException("No approvers found for stage 1");
      }

      await tx.requisitionApproval.createMany({
        data: stage1ApproverIds.map((approverId) => ({
          requisitionId: requisition.id,
          stage: 1,
          approverId,
          status: ApprovalStatus.PENDING,
        })),
        skipDuplicates: true,
      });

      return tx.requisition.update({
        where: { id: requisition.id },
        data: {
          status: RequisitionStatus.PENDING_APPROVAL,
          currentStage: 1,
          workflowId,
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

    const stage1Approvals = await this.prisma.requisitionApproval.findMany({
      where: {
        requisitionId: updated.id,
        stage: 1,
        status: ApprovalStatus.PENDING,
      },
      select: { approverId: true },
    });

    await this.notifyApprovers(
      stage1Approvals.map((a) => a.approverId),
      {
        id: updated.id,
        requisitionNo: updated.requisitionNo,
        title: updated.title,
      },
      creatorName,
    );

    return updated;
  }

  async approveRequisition(
    requisitionId: string,
    userId: string,
    role: UserRole,
    comments?: string,
  ) {
    await this.assertAccess(requisitionId, userId, role);

    const requisition = await this.prisma.requisition.findUnique({
      where: { id: requisitionId },
      select: {
        id: true,
        requisitionNo: true,
        title: true,
        requestedById: true,
        status: true,
        currentStage: true,
        workflowId: true,
      },
    });

    if (!requisition) throw new NotFoundException("Requisition not found");

    if (requisition.status !== RequisitionStatus.PENDING_APPROVAL) {
      throw new BadRequestException("Requisition is not pending approval");
    }

    const delegatorIds = await this.getActiveDelegatorIds(userId);
    const actingApproverIds = [userId, ...delegatorIds];

    const approvalRow = await this.prisma.requisitionApproval.findFirst({
      where: {
        requisitionId,
        stage: requisition.currentStage,
        approverId: { in: actingApproverIds },
        status: ApprovalStatus.PENDING,
      },
      select: { id: true },
    });

    if (!approvalRow) {
      throw new ForbiddenException(
        "You are not an approver for the current stage",
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.requisitionApproval.update({
        where: { id: approvalRow.id },
        data: {
          status: ApprovalStatus.APPROVED,
          comments: comments ?? null,
          actionAt: new Date(),
        },
      });

      // If requisition has no workflow, treat as single-step approval
      if (!requisition.workflowId) {
        await tx.requisitionApproval.updateMany({
          where: {
            requisitionId,
            stage: requisition.currentStage,
            status: ApprovalStatus.PENDING,
          },
          data: {
            status: ApprovalStatus.APPROVED,
            comments: "Stage completed",
            actionAt: new Date(),
          },
        });

        await tx.requisition.update({
          where: { id: requisitionId },
          data: {
            status: RequisitionStatus.APPROVED,
            approvedById: userId,
            approvedAt: new Date(),
          },
        });

        return { status: "APPROVED" as const };
      }

      const stage = await tx.procurementWorkflowStage.findFirst({
        where: {
          workflowId: requisition.workflowId,
          stageNumber: requisition.currentStage,
        },
        select: { approvalType: true },
      });

      if (!stage) {
        throw new BadRequestException("Workflow stage not found");
      }

      const stageApprovals = await tx.requisitionApproval.findMany({
        where: { requisitionId, stage: requisition.currentStage },
        select: { status: true },
      });

      const total = stageApprovals.length;
      const approvedCount = stageApprovals.filter(
        (a) => a.status === ApprovalStatus.APPROVED,
      ).length;

      let stageComplete = false;
      if (stage.approvalType === ProcurementApprovalType.SINGLE) {
        stageComplete = approvedCount >= 1;
      } else if (stage.approvalType === ProcurementApprovalType.ALL) {
        stageComplete = total > 0 && approvedCount === total;
      } else if (stage.approvalType === ProcurementApprovalType.MAJORITY) {
        stageComplete = total > 0 && approvedCount > total / 2;
      }

      if (!stageComplete) {
        return { status: "PENDING" as const };
      }

      // Close out remaining pending approvals at this stage
      await tx.requisitionApproval.updateMany({
        where: {
          requisitionId,
          stage: requisition.currentStage,
          status: ApprovalStatus.PENDING,
        },
        data: {
          status: ApprovalStatus.APPROVED,
          comments: "Stage completed",
          actionAt: new Date(),
        },
      });

      const nextStageNumber = requisition.currentStage + 1;

      const nextStage = await tx.procurementWorkflowStage.findFirst({
        where: {
          workflowId: requisition.workflowId,
          stageNumber: nextStageNumber,
        },
        select: {
          stageNumber: true,
          approverId: true,
          approverRole: true,
        },
      });

      if (!nextStage) {
        await tx.requisition.update({
          where: { id: requisitionId },
          data: {
            status: RequisitionStatus.APPROVED,
            approvedById: userId,
            approvedAt: new Date(),
          },
        });

        return { status: "APPROVED" as const };
      }

      let nextApproverIds: string[] = [];
      if (nextStage.approverId) {
        nextApproverIds = [nextStage.approverId];
      } else if (nextStage.approverRole) {
        const users = await tx.user.findMany({
          where: { role: nextStage.approverRole, status: "ACTIVE" },
          select: { id: true },
        });
        nextApproverIds = users.map((u) => u.id);
      }

      if (!nextApproverIds.length) {
        throw new BadRequestException("No approvers found for next stage");
      }

      await tx.requisitionApproval.createMany({
        data: nextApproverIds.map((approverId) => ({
          requisitionId,
          stage: nextStageNumber,
          approverId,
          status: ApprovalStatus.PENDING,
        })),
        skipDuplicates: true,
      });

      await tx.requisition.update({
        where: { id: requisitionId },
        data: {
          currentStage: nextStageNumber,
          status: RequisitionStatus.PENDING_APPROVAL,
        },
      });

      return { status: "ADVANCED" as const, nextStage: nextStageNumber };
    });

    if (result.status === "APPROVED") {
      await this.notificationsService.createNotification({
        userId: requisition.requestedById,
        type: "APPROVAL_APPROVED",
        title: "Requisition Approved",
        message: `Your requisition ${requisition.requisitionNo} (${requisition.title}) has been approved.`,
        referenceId: requisition.id,
        referenceType: "requisition",
      });
    }

    if (result.status === "ADVANCED") {
      const requestor = await this.prisma.user.findUnique({
        where: { id: requisition.requestedById },
        select: { firstName: true, lastName: true },
      });

      const creatorName = requestor
        ? `${requestor.firstName} ${requestor.lastName}`
        : "A user";

      const nextApprovals = await this.prisma.requisitionApproval.findMany({
        where: {
          requisitionId: requisition.id,
          stage: result.nextStage,
          status: ApprovalStatus.PENDING,
        },
        select: { approverId: true },
      });

      await this.notifyApprovers(
        nextApprovals.map((a) => a.approverId),
        {
          id: requisition.id,
          requisitionNo: requisition.requisitionNo,
          title: requisition.title,
        },
        creatorName,
      );
    }

    return result;
  }

  async rejectRequisition(
    requisitionId: string,
    userId: string,
    role: UserRole,
    reason: string,
  ) {
    await this.assertAccess(requisitionId, userId, role);

    const requisition = await this.prisma.requisition.findUnique({
      where: { id: requisitionId },
      select: {
        id: true,
        requisitionNo: true,
        title: true,
        requestedById: true,
        status: true,
        currentStage: true,
      },
    });

    if (!requisition) throw new NotFoundException("Requisition not found");

    if (requisition.status !== RequisitionStatus.PENDING_APPROVAL) {
      throw new BadRequestException("Requisition is not pending approval");
    }

    const delegatorIds = await this.getActiveDelegatorIds(userId);
    const actingApproverIds = [userId, ...delegatorIds];

    const approvalRow = await this.prisma.requisitionApproval.findFirst({
      where: {
        requisitionId,
        stage: requisition.currentStage,
        approverId: { in: actingApproverIds },
        status: ApprovalStatus.PENDING,
      },
      select: { id: true },
    });

    if (!approvalRow) {
      throw new ForbiddenException(
        "You are not an approver for the current stage",
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.requisitionApproval.update({
        where: { id: approvalRow.id },
        data: {
          status: ApprovalStatus.REJECTED,
          comments: reason,
          actionAt: new Date(),
        },
      });

      await tx.requisitionApproval.updateMany({
        where: {
          requisitionId,
          stage: requisition.currentStage,
          status: ApprovalStatus.PENDING,
        },
        data: {
          status: ApprovalStatus.REJECTED,
          comments: "Requisition rejected",
          actionAt: new Date(),
        },
      });

      await tx.requisition.update({
        where: { id: requisitionId },
        data: {
          status: RequisitionStatus.REJECTED,
          rejectedById: userId,
          rejectedAt: new Date(),
          rejectionReason: reason,
        },
      });
    });

    await this.notificationsService.createNotification({
      userId: requisition.requestedById,
      type: "APPROVAL_REJECTED",
      title: "Requisition Rejected",
      message: `Your requisition ${requisition.requisitionNo} (${requisition.title}) was rejected. Reason: ${reason}`,
      referenceId: requisition.id,
      referenceType: "requisition",
    });

    return { status: "REJECTED" as const };
  }

  async requestInfo(
    requisitionId: string,
    userId: string,
    role: UserRole,
    questions: string,
  ) {
    await this.assertAccess(requisitionId, userId, role);

    const requisition = await this.prisma.requisition.findUnique({
      where: { id: requisitionId },
      select: {
        id: true,
        requisitionNo: true,
        title: true,
        requestedById: true,
        status: true,
        currentStage: true,
      },
    });

    if (!requisition) throw new NotFoundException("Requisition not found");
    if (requisition.status !== RequisitionStatus.PENDING_APPROVAL) {
      throw new BadRequestException("Requisition is not pending approval");
    }

    const delegatorIds = await this.getActiveDelegatorIds(userId);
    const actingApproverIds = [userId, ...delegatorIds];

    const hasApproval = await this.prisma.requisitionApproval.findFirst({
      where: {
        requisitionId,
        stage: requisition.currentStage,
        approverId: { in: actingApproverIds },
        status: ApprovalStatus.PENDING,
      },
      select: { id: true },
    });

    if (!hasApproval) {
      throw new ForbiddenException(
        "You are not an approver for the current stage",
      );
    }

    await this.notificationsService.createNotification({
      userId: requisition.requestedById,
      type: "APPROVAL_INFO_REQUEST",
      title: "More Information Required",
      message: `More information was requested for requisition ${requisition.requisitionNo} (${requisition.title}): ${questions}`,
      referenceId: requisition.id,
      referenceType: "requisition",
    });

    return { success: true };
  }

  async escalateRequisition(
    requisitionId: string,
    userId: string,
    role: UserRole,
  ) {
    await this.assertAccess(requisitionId, userId, role);

    const requisition = await this.prisma.requisition.findUnique({
      where: { id: requisitionId },
      select: {
        id: true,
        requisitionNo: true,
        title: true,
        requestedById: true,
        status: true,
        currentStage: true,
        workflowId: true,
      },
    });

    if (!requisition) throw new NotFoundException("Requisition not found");
    if (requisition.status !== RequisitionStatus.PENDING_APPROVAL) {
      throw new BadRequestException("Requisition is not pending approval");
    }
    if (!requisition.workflowId) {
      throw new BadRequestException(
        "No workflow configured for this requisition",
      );
    }

    const delegatorIds = await this.getActiveDelegatorIds(userId);
    const actingApproverIds = [userId, ...delegatorIds];

    const hasApproval = await this.prisma.requisitionApproval.findFirst({
      where: {
        requisitionId,
        stage: requisition.currentStage,
        approverId: { in: actingApproverIds },
        status: ApprovalStatus.PENDING,
      },
      select: { id: true },
    });

    if (!hasApproval && !this.canManageOthers(role)) {
      throw new ForbiddenException("Not allowed");
    }

    const stage = await this.prisma.procurementWorkflowStage.findFirst({
      where: {
        workflowId: requisition.workflowId,
        stageNumber: requisition.currentStage,
      },
      select: { escalateToId: true },
    });

    if (!stage?.escalateToId) {
      throw new BadRequestException(
        "No escalation target configured for this stage",
      );
    }

    await this.prisma.requisitionApproval.createMany({
      data: [
        {
          requisitionId,
          stage: requisition.currentStage,
          approverId: stage.escalateToId,
          status: ApprovalStatus.PENDING,
        },
      ],
      skipDuplicates: true,
    });

    const requestor = await this.prisma.user.findUnique({
      where: { id: requisition.requestedById },
      select: { firstName: true, lastName: true },
    });

    const creatorName = requestor
      ? `${requestor.firstName} ${requestor.lastName}`
      : "A user";

    await this.notifyApprovers(
      [stage.escalateToId],
      {
        id: requisition.id,
        requisitionNo: requisition.requisitionNo,
        title: requisition.title,
      },
      creatorName,
    );

    return { success: true };
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
      (
        [
          RequisitionStatus.CANCELLED,
          RequisitionStatus.COMPLETED,
        ] as RequisitionStatus[]
      ).includes(requisition.status)
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

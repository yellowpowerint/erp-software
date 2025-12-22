import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, UserRole } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import {
  AwardRFQDto,
  CreateRFQDto,
  EvaluateRFQDto,
  InviteRFQVendorsDto,
  SubmitRFQResponseDto,
  UpdateRFQDto,
  UpdateRFQResponseDto,
} from "./dto";

const RFQ_STATUS = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
  CLOSED: "CLOSED",
  EVALUATING: "EVALUATING",
  AWARDED: "AWARDED",
  CANCELLED: "CANCELLED",
} as const;

const RFQ_RESPONSE_STATUS = {
  SUBMITTED: "SUBMITTED",
  UNDER_REVIEW: "UNDER_REVIEW",
  SHORTLISTED: "SHORTLISTED",
  SELECTED: "SELECTED",
  REJECTED: "REJECTED",
} as const;

@Injectable()
export class RFQsService {
  constructor(private prisma: PrismaService) {}

  private rfqClient() {
    return (this.prisma as any).rFQ ?? (this.prisma as any).rfq;
  }

  private rfqItemClient() {
    return (this.prisma as any).rFQItem ?? (this.prisma as any).rfqItem;
  }

  private rfqInviteClient() {
    return (this.prisma as any).rFQVendorInvite ?? (this.prisma as any).rfqVendorInvite;
  }

  private rfqResponseClient() {
    return (this.prisma as any).rFQResponse ?? (this.prisma as any).rfqResponse;
  }

  private rfqResponseItemClient() {
    return (this.prisma as any).rFQResponseItem ?? (this.prisma as any).rfqResponseItem;
  }

  private canManageRFQs(role: UserRole): boolean {
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

  private toDecimalOrNull(value?: string): Prisma.Decimal | null {
    if (value === undefined || value === null || value === "") return null;
    return this.toDecimal(value);
  }

  private async generateRFQNumber(tx: Prisma.TransactionClient) {
    const year = new Date().getFullYear();
    const prefix = `RFQ-${year}-`;

    const rfqClient = (tx as any).rFQ ?? (tx as any).rfq;
    const count = await rfqClient.count({
      where: { rfqNumber: { startsWith: prefix } },
    });

    return `${prefix}${String(count + 1).padStart(4, "0")}`;
  }

  async createRFQ(dto: CreateRFQDto, user: { userId: string; role: UserRole }) {
    if (!this.canManageRFQs(user.role)) {
      throw new ForbiddenException("Not allowed");
    }

    const deadline = new Date(dto.responseDeadline);
    if (Number.isNaN(deadline.getTime())) {
      throw new BadRequestException("Invalid responseDeadline");
    }

    if (dto.items?.length === 0) {
      throw new BadRequestException("RFQ must have at least one item");
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.requisitionId) {
        const req = await tx.requisition.findUnique({
          where: { id: dto.requisitionId },
          select: { id: true },
        });
        if (!req) throw new BadRequestException("Invalid requisitionId");
      }

      const rfqNumber = await this.generateRFQNumber(tx);

      const rfqClient = (tx as any).rFQ ?? (tx as any).rfq;
      const rfq = await rfqClient.create({
        data: {
          rfqNumber,
          title: dto.title,
          description: dto.description,
          requisitionId: dto.requisitionId ?? null,
          status: RFQ_STATUS.DRAFT,
          responseDeadline: deadline,
          validityPeriod: dto.validityPeriod ?? 30,
          deliveryLocation: dto.deliveryLocation,
          deliveryTerms: dto.deliveryTerms,
          paymentTerms: dto.paymentTerms,
          specialConditions: dto.specialConditions,
          siteAccess: dto.siteAccess,
          safetyRequirements: dto.safetyRequirements,
          technicalSpecs: dto.technicalSpecs,
          createdById: user.userId,
          items: {
            create: dto.items.map((i) => ({
              itemName: i.itemName,
              description: i.description,
              specifications: i.specifications,
              quantity: this.toDecimal(i.quantity),
              unit: i.unit,
              estimatedPrice: this.toDecimalOrNull(i.estimatedPrice) as any,
            })),
          },
        },
        include: { items: true },
      });

      return rfq;
    });
  }

  async listRFQs(query: any, user: { userId: string; role: UserRole; vendorId?: string }) {
    // Vendor portal users should use /rfqs/invited
    if (user.role === UserRole.VENDOR) {
      throw new ForbiddenException("Not allowed");
    }

    if (!this.canManageRFQs(user.role)) {
      throw new ForbiddenException("Not allowed");
    }

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.requisitionId) where.requisitionId = String(query.requisitionId);
    if (query.search) {
      const s = String(query.search);
      (where as any).OR = [
        { title: { contains: s, mode: "insensitive" } },
        { rfqNumber: { contains: s, mode: "insensitive" } },
      ];
    }

    return this.rfqClient().findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { items: true, invitedVendors: true, responses: true } },
      },
      take: 200,
    });
  }

  async getRFQById(id: string, user: { userId: string; role: UserRole; vendorId?: string }) {
    if (user.role === UserRole.VENDOR) {
      if (!user.vendorId) {
        throw new ForbiddenException("Vendor account not linked");
      }

      const invited = await this.rfqInviteClient().findFirst({
        where: { rfqId: id, vendorId: user.vendorId },
        select: { id: true },
      });

      if (!invited) {
        throw new ForbiddenException("Not invited");
      }
    } else {
      if (!this.canManageRFQs(user.role)) {
        throw new ForbiddenException("Not allowed");
      }
    }

    const rfq = await this.rfqClient().findUnique({
      where: { id },
      include: {
        items: true,
        requisition: { select: { id: true, requisitionNo: true, title: true, status: true } },
        invitedVendors: {
          include: { vendor: { select: { id: true, vendorCode: true, companyName: true, status: true } } },
          orderBy: { invitedAt: "desc" },
        },
        responses: {
          include: {
            vendor: { select: { id: true, vendorCode: true, companyName: true } },
            items: { include: { rfqItem: true } },
          },
          orderBy: { submittedAt: "desc" },
        },
        createdBy: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
    });

    if (!rfq) throw new NotFoundException("RFQ not found");
    return rfq;
  }

  async updateRFQ(id: string, dto: UpdateRFQDto, user: { userId: string; role: UserRole }) {
    if (!this.canManageRFQs(user.role)) {
      throw new ForbiddenException("Not allowed");
    }

    const existing = await this.rfqClient().findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!existing) throw new NotFoundException("RFQ not found");
    if (String(existing.status) !== RFQ_STATUS.DRAFT) {
      throw new BadRequestException("Only draft RFQs can be updated");
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.items) {
        const rfqItemClient = (tx as any).rFQItem ?? (tx as any).rfqItem;
        await rfqItemClient.deleteMany({ where: { rfqId: id } });
        await rfqItemClient.createMany({
          data: dto.items.map((i) => ({
            id: i.id,
            rfqId: id,
            itemName: i.itemName,
            description: i.description,
            specifications: i.specifications,
            quantity: this.toDecimal(i.quantity),
            unit: i.unit,
            estimatedPrice: this.toDecimalOrNull(i.estimatedPrice),
          })),
          skipDuplicates: true,
        });
      }

      const rfqClient = (tx as any).rFQ ?? (tx as any).rfq;
      return rfqClient.update({
        where: { id },
        data: {
          title: dto.title,
          description: dto.description,
          requisitionId: dto.requisitionId === undefined ? undefined : dto.requisitionId || null,
          responseDeadline: dto.responseDeadline ? new Date(dto.responseDeadline) : undefined,
          validityPeriod: dto.validityPeriod,
          deliveryLocation: dto.deliveryLocation,
          deliveryTerms: dto.deliveryTerms,
          paymentTerms: dto.paymentTerms,
          specialConditions: dto.specialConditions,
          siteAccess: dto.siteAccess,
          safetyRequirements: dto.safetyRequirements,
          technicalSpecs: dto.technicalSpecs,
        },
        include: { items: true },
      });
    });
  }

  async publishRFQ(id: string, user: { userId: string; role: UserRole }) {
    if (!this.canManageRFQs(user.role)) {
      throw new ForbiddenException("Not allowed");
    }

    const rfq = await this.rfqClient().findUnique({
      where: { id },
      select: { id: true, status: true, responseDeadline: true },
    });

    if (!rfq) throw new NotFoundException("RFQ not found");
    if (String(rfq.status) !== RFQ_STATUS.DRAFT) {
      throw new BadRequestException("Only draft RFQs can be published");
    }

    if (new Date(rfq.responseDeadline).getTime() <= Date.now()) {
      throw new BadRequestException("responseDeadline must be in the future");
    }

    return this.rfqClient().update({
      where: { id },
      data: {
        status: RFQ_STATUS.PUBLISHED,
        issueDate: new Date(),
      },
    });
  }

  async closeRFQ(id: string, user: { userId: string; role: UserRole }) {
    if (!this.canManageRFQs(user.role)) {
      throw new ForbiddenException("Not allowed");
    }

    const rfq = await this.rfqClient().findUnique({ where: { id }, select: { id: true } });
    if (!rfq) throw new NotFoundException("RFQ not found");

    return this.rfqClient().update({
      where: { id },
      data: { status: RFQ_STATUS.CLOSED },
    });
  }

  async inviteVendors(id: string, dto: InviteRFQVendorsDto, user: { userId: string; role: UserRole }) {
    if (!this.canManageRFQs(user.role)) {
      throw new ForbiddenException("Not allowed");
    }

    const rfq = await this.rfqClient().findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!rfq) throw new NotFoundException("RFQ not found");

    if (![RFQ_STATUS.DRAFT, RFQ_STATUS.PUBLISHED].includes(String(rfq.status) as any)) {
      throw new BadRequestException("RFQ is not open for invitations");
    }

    if (!dto.vendorIds?.length) {
      throw new BadRequestException("vendorIds must be non-empty");
    }

    await this.rfqInviteClient().createMany({
      data: dto.vendorIds.map((vendorId) => ({
        rfqId: id,
        vendorId,
      })),
      skipDuplicates: true,
    });

    return { success: true };
  }

  async listInvitedRFQs(user: { userId: string; role: UserRole; vendorId?: string }) {
    if (user.role !== UserRole.VENDOR) {
      throw new ForbiddenException("Not allowed");
    }

    if (!user.vendorId) {
      throw new ForbiddenException("Vendor account not linked");
    }

    return this.rfqClient().findMany({
      where: {
        invitedVendors: { some: { vendorId: user.vendorId } },
        status: { in: [RFQ_STATUS.PUBLISHED, RFQ_STATUS.EVALUATING, RFQ_STATUS.AWARDED, RFQ_STATUS.CLOSED] },
      },
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
        invitedVendors: {
          where: { vendorId: user.vendorId },
          take: 1,
        },
      },
      take: 200,
    });
  }

  private async computeResponseTotals(
    tx: Prisma.TransactionClient,
    rfqId: string,
    items: Array<{ rfqItemId: string; unitPrice: string }>,
  ) {
    const rfqItemClient = (tx as any).rFQItem ?? (tx as any).rfqItem;
    const rfqItems = await rfqItemClient.findMany({ where: { rfqId } });
    const byId = new Map<string, any>(rfqItems.map((i: any) => [i.id, i]));

    let total = new Prisma.Decimal(0);
    const computed = items.map((i) => {
      const rfqItem = byId.get(i.rfqItemId);
      if (!rfqItem) {
        throw new BadRequestException("Invalid rfqItemId");
      }
      const unitPrice = this.toDecimal(i.unitPrice);
      const lineTotal = new Prisma.Decimal(rfqItem.quantity).mul(unitPrice);
      total = total.add(lineTotal);
      return {
        rfqItemId: i.rfqItemId,
        unitPrice,
        totalPrice: lineTotal,
      };
    });

    return { total, computed };
  }

  async submitResponse(rfqId: string, dto: SubmitRFQResponseDto, user: { userId: string; role: UserRole; vendorId?: string }) {
    if (user.role !== UserRole.VENDOR) {
      throw new ForbiddenException("Not allowed");
    }

    if (!user.vendorId) {
      throw new ForbiddenException("Vendor account not linked");
    }

    const rfq = await this.rfqClient().findUnique({
      where: { id: rfqId },
      select: { id: true, status: true, responseDeadline: true },
    });

    if (!rfq) throw new NotFoundException("RFQ not found");
    if (String(rfq.status) !== RFQ_STATUS.PUBLISHED) {
      throw new BadRequestException("RFQ is not open for responses");
    }
    if (new Date(rfq.responseDeadline).getTime() < Date.now()) {
      throw new BadRequestException("RFQ response deadline has passed");
    }

    const invite = await this.rfqInviteClient().findFirst({
      where: { rfqId, vendorId: user.vendorId },
      select: { id: true },
    });

    if (!invite) {
      throw new ForbiddenException("Not invited");
    }

    if (!dto.items?.length) {
      throw new BadRequestException("Response must include at least one item");
    }

    return this.prisma.$transaction(async (tx) => {
      const rfqResponseClient = (tx as any).rFQResponse ?? (tx as any).rfqResponse;
      const existing = await rfqResponseClient.findFirst({
        where: { rfqId, vendorId: user.vendorId },
        select: { id: true },
      });

      if (existing) {
        throw new BadRequestException("Response already exists. Use update endpoint.");
      }

      const { total, computed } = await this.computeResponseTotals(tx, rfqId, dto.items);

      const response = await rfqResponseClient.create({
        data: {
          rfqId,
          vendorId: user.vendorId,
          status: RFQ_RESPONSE_STATUS.SUBMITTED,
          totalAmount: total,
          currency: dto.currency ?? "GHS",
          validUntil: new Date(dto.validUntil),
          deliveryDays: dto.deliveryDays,
          paymentTerms: dto.paymentTerms,
          warranty: dto.warranty,
          quotationDoc: dto.quotationDoc,
          technicalDoc: dto.technicalDoc,
          items: {
            create: computed.map((i, idx) => ({
              rfqItemId: i.rfqItemId,
              unitPrice: i.unitPrice,
              totalPrice: i.totalPrice,
              leadTimeDays: dto.items[idx].leadTimeDays ?? null,
              notes: dto.items[idx].notes,
            })),
          },
        },
        include: { items: true },
      });

      const rfqInviteClient = (tx as any).rFQVendorInvite ?? (tx as any).rfqVendorInvite;
      await rfqInviteClient.updateMany({
        where: { rfqId, vendorId: user.vendorId },
        data: { status: "RESPONDED" },
      });

      return response;
    });
  }

  async updateMyResponse(rfqId: string, dto: UpdateRFQResponseDto, user: { userId: string; role: UserRole; vendorId?: string }) {
    if (user.role !== UserRole.VENDOR) {
      throw new ForbiddenException("Not allowed");
    }

    if (!user.vendorId) {
      throw new ForbiddenException("Vendor account not linked");
    }

    const existing = await this.rfqResponseClient().findFirst({
      where: { rfqId, vendorId: user.vendorId },
      select: { id: true, status: true },
    });

    if (!existing) {
      throw new NotFoundException("Response not found");
    }

    if (["SELECTED", "REJECTED"].includes(String(existing.status))) {
      throw new BadRequestException("Response can no longer be updated");
    }

    return this.prisma.$transaction(async (tx) => {
      let totalAmount: Prisma.Decimal | undefined;
      if (dto.items) {
        const rfqResponseItemClient = (tx as any).rFQResponseItem ?? (tx as any).rfqResponseItem;
        await rfqResponseItemClient.deleteMany({ where: { responseId: existing.id } });
        const { total, computed } = await this.computeResponseTotals(tx, rfqId, dto.items);
        totalAmount = total;

        await rfqResponseItemClient.createMany({
          data: computed.map((c, idx) => ({
            responseId: existing.id,
            rfqItemId: c.rfqItemId,
            unitPrice: c.unitPrice,
            totalPrice: c.totalPrice,
            leadTimeDays: dto.items?.[idx].leadTimeDays ?? null,
            notes: dto.items?.[idx].notes,
          })),
        });
      }

      const rfqResponseClient = (tx as any).rFQResponse ?? (tx as any).rfqResponse;
      return rfqResponseClient.update({
        where: { id: existing.id },
        data: {
          currency: dto.currency,
          validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
          deliveryDays: dto.deliveryDays,
          paymentTerms: dto.paymentTerms,
          warranty: dto.warranty,
          quotationDoc: dto.quotationDoc,
          technicalDoc: dto.technicalDoc,
          totalAmount: totalAmount as any,
        },
        include: { items: { include: { rfqItem: true } } },
      });
    });
  }

  async evaluateResponses(rfqId: string, dto: EvaluateRFQDto, user: { userId: string; role: UserRole }) {
    if (!this.canManageRFQs(user.role)) {
      throw new ForbiddenException("Not allowed");
    }

    const rfq = await this.rfqClient().findUnique({
      where: { id: rfqId },
      select: { id: true },
    });

    if (!rfq) throw new NotFoundException("RFQ not found");

    await this.prisma.$transaction(async (tx) => {
      const rfqClient = (tx as any).rFQ ?? (tx as any).rfq;
      const rfqResponseClient = (tx as any).rFQResponse ?? (tx as any).rfqResponse;

      await rfqClient.update({
        where: { id: rfqId },
        data: { status: RFQ_STATUS.EVALUATING },
      });

      for (const e of dto.evaluations) {
        await rfqResponseClient.update({
          where: { id: e.responseId },
          data: {
            technicalScore: this.toDecimalOrNull(e.technicalScore) as any,
            commercialScore: this.toDecimalOrNull(e.commercialScore) as any,
            overallScore: this.toDecimalOrNull(e.overallScore) as any,
            evaluationNotes: e.evaluationNotes,
            status: e.status as any,
            evaluatedAt: new Date(),
          },
        });
      }
    });

    return { success: true };
  }

  async awardRFQ(rfqId: string, dto: AwardRFQDto, user: { userId: string; role: UserRole }) {
    if (!this.canManageRFQs(user.role)) {
      throw new ForbiddenException("Not allowed");
    }

    const response = await this.rfqResponseClient().findUnique({
      where: { id: dto.responseId },
      select: { id: true, rfqId: true },
    });

    if (!response || response.rfqId !== rfqId) {
      throw new BadRequestException("Invalid responseId");
    }

    await this.prisma.$transaction(async (tx) => {
      const rfqClient = (tx as any).rFQ ?? (tx as any).rfq;
      const rfqResponseClient = (tx as any).rFQResponse ?? (tx as any).rfqResponse;

      await rfqClient.update({
        where: { id: rfqId },
        data: {
          status: RFQ_STATUS.AWARDED,
          selectedResponseId: dto.responseId,
        },
      });

      await rfqResponseClient.updateMany({
        where: { rfqId, id: { not: dto.responseId } },
        data: { status: RFQ_RESPONSE_STATUS.REJECTED },
      });

      await rfqResponseClient.update({
        where: { id: dto.responseId },
        data: { status: RFQ_RESPONSE_STATUS.SELECTED },
      });
    });

    return { success: true };
  }
}

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, UserRole } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import {
  ApproveVendorInvoiceDto,
  CreateVendorInvoiceDto,
  DisputeVendorInvoiceDto,
  MatchVendorInvoiceDto,
} from "./dto";
import { ThreeWayMatchingService } from "./three-way-matching.service";

@Injectable()
export class InvoicesService {
  constructor(
    private prisma: PrismaService,
    private threeWayMatching: ThreeWayMatchingService,
  ) {}

  private canManageInvoices(role: UserRole): boolean {
    return (
      [
        UserRole.SUPER_ADMIN,
        UserRole.CEO,
        UserRole.CFO,
        UserRole.ACCOUNTANT,
        UserRole.PROCUREMENT_OFFICER,
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

  async createInvoice(dto: CreateVendorInvoiceDto, user: { userId: string; role: UserRole }) {
    if (!this.canManageInvoices(user.role)) throw new ForbiddenException("Not allowed");

    if (!dto.items?.length) {
      throw new BadRequestException("Invoice must have at least one item");
    }

    return this.prisma.$transaction(async (tx) => {
      const vendor = await tx.vendor.findUnique({ where: { id: dto.vendorId }, select: { id: true } });
      if (!vendor) throw new BadRequestException("Invalid vendorId");

      let po: any | null = null;
      if (dto.purchaseOrderId) {
        po = await (tx as any).purchaseOrder.findUnique({
          where: { id: dto.purchaseOrderId },
          include: { vendor: { select: { id: true } }, items: true },
        });
        if (!po) throw new BadRequestException("Invalid purchaseOrderId");
        if (po.vendorId !== dto.vendorId) {
          throw new BadRequestException("Invoice vendor must match PO vendor");
        }
      }

      const inv = await (tx as any).vendorInvoice.create({
        data: {
          invoiceNumber: dto.invoiceNumber,
          vendorId: dto.vendorId,
          purchaseOrderId: dto.purchaseOrderId ?? null,
          subtotal: this.toDecimal(dto.subtotal),
          taxAmount: dto.taxAmount ? this.toDecimal(dto.taxAmount) : new Prisma.Decimal(0),
          totalAmount: this.toDecimal(dto.totalAmount),
          currency: dto.currency ?? "GHS",
          invoiceDate: new Date(dto.invoiceDate),
          dueDate: new Date(dto.dueDate),
          invoiceDocument: dto.invoiceDocument,
          matchStatus: "PENDING",
          approvedForPayment: false,
          paidAmount: new Prisma.Decimal(0),
          paymentStatus: "UNPAID",
          items: {
            create: dto.items.map((i) => ({
              description: i.description,
              quantity: this.toDecimal(i.quantity),
              unitPrice: this.toDecimal(i.unitPrice),
              totalPrice: this.toDecimal(i.quantity).mul(this.toDecimal(i.unitPrice)),
              poItemId: i.poItemId ?? null,
            })),
          },
        },
        include: { items: true },
      });

      return inv;
    });
  }

  async listInvoices(query: any, user: { userId: string; role: UserRole; vendorId?: string }) {
    const where: any = {};

    if (user.role === UserRole.VENDOR) {
      if (!user.vendorId) throw new ForbiddenException("Vendor account not linked");
      where.vendorId = user.vendorId;
    } else {
      if (!this.canManageInvoices(user.role)) throw new ForbiddenException("Not allowed");
    }

    if (query.matchStatus) where.matchStatus = String(query.matchStatus);
    if (query.paymentStatus) where.paymentStatus = String(query.paymentStatus);
    if (query.vendorId && user.role !== UserRole.VENDOR) where.vendorId = String(query.vendorId);

    return (this.prisma as any).vendorInvoice.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        vendor: { select: { id: true, vendorCode: true, companyName: true } },
        purchaseOrder: { select: { id: true, poNumber: true } },
        _count: { select: { items: true, payments: true } },
      },
      take: 200,
    });
  }

  async getInvoiceById(id: string, user: { userId: string; role: UserRole; vendorId?: string }) {
    const inv = await (this.prisma as any).vendorInvoice.findUnique({
      where: { id },
      include: {
        vendor: { select: { id: true, vendorCode: true, companyName: true, email: true, phone: true } },
        purchaseOrder: {
          include: {
            vendor: { select: { id: true, vendorCode: true, companyName: true } },
            items: true,
          },
        },
        items: { include: { poItem: true } },
        payments: {
          include: { processedBy: { select: { id: true, firstName: true, lastName: true, role: true } } },
          orderBy: { paymentDate: "desc" },
        },
        matchedBy: { select: { id: true, firstName: true, lastName: true, role: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
    });

    if (!inv) throw new NotFoundException("Invoice not found");

    if (user.role === UserRole.VENDOR) {
      if (!user.vendorId) throw new ForbiddenException("Vendor account not linked");
      if (inv.vendorId !== user.vendorId) throw new ForbiddenException("Not allowed");
    } else {
      if (!this.canManageInvoices(user.role)) throw new ForbiddenException("Not allowed");
    }

    return inv;
  }

  async runMatching(
    invoiceId: string,
    dto: MatchVendorInvoiceDto,
    user: { userId: string; role: UserRole },
  ) {
    if (!this.canManageInvoices(user.role)) throw new ForbiddenException("Not allowed");

    const tolerancePercent = dto.tolerancePercent ?? 2;

    const result = await this.threeWayMatching.performThreeWayMatch(invoiceId, tolerancePercent);

    const priceVariance = result.variances.priceVariance;
    const quantityVariance = result.variances.quantityVariance;

    const matchStatus = result.isMatched
      ? "MATCHED"
      : result.status === "PARTIAL_MATCH"
        ? "PARTIAL_MATCH"
        : "MISMATCH";

    const updated = await (this.prisma as any).vendorInvoice.update({
      where: { id: invoiceId },
      data: {
        matchStatus,
        matchedAt: new Date(),
        matchedById: user.userId,
        priceVariance,
        quantityVariance,
        discrepancyNotes: result.notes,
        approvedForPayment: result.isMatched,
        approvedAt: result.isMatched ? new Date() : null,
        approvedById: result.isMatched ? user.userId : null,
      },
    });

    return { invoice: updated, match: result };
  }

  async approveInvoice(
    invoiceId: string,
    _dto: ApproveVendorInvoiceDto,
    user: { userId: string; role: UserRole },
  ) {
    const allowed: UserRole[] = [
      UserRole.SUPER_ADMIN,
      UserRole.CEO,
      UserRole.CFO,
      UserRole.ACCOUNTANT,
    ];

    if (!allowed.includes(user.role)) {
      throw new ForbiddenException("Not allowed");
    }

    const inv = await (this.prisma as any).vendorInvoice.findUnique({
      where: { id: invoiceId },
      select: { id: true, matchStatus: true, approvedForPayment: true },
    });

    if (!inv) throw new NotFoundException("Invoice not found");

    if (inv.approvedForPayment) return inv;

    if (String(inv.matchStatus) !== "MATCHED") {
      throw new BadRequestException("Invoice must be matched before approval");
    }

    return (this.prisma as any).vendorInvoice.update({
      where: { id: invoiceId },
      data: {
        approvedForPayment: true,
        approvedAt: new Date(),
        approvedById: user.userId,
      },
    });
  }

  async disputeInvoice(
    invoiceId: string,
    dto: DisputeVendorInvoiceDto,
    user: { userId: string; role: UserRole },
  ) {
    if (!this.canManageInvoices(user.role)) throw new ForbiddenException("Not allowed");

    const inv = await (this.prisma as any).vendorInvoice.findUnique({
      where: { id: invoiceId },
      select: { id: true },
    });

    if (!inv) throw new NotFoundException("Invoice not found");

    return (this.prisma as any).vendorInvoice.update({
      where: { id: invoiceId },
      data: {
        matchStatus: "DISPUTED",
        discrepancyNotes: dto.notes,
      },
    });
  }

  async pendingMatch(user: { userId: string; role: UserRole }) {
    if (!this.canManageInvoices(user.role)) throw new ForbiddenException("Not allowed");

    return (this.prisma as any).vendorInvoice.findMany({
      where: { matchStatus: "PENDING" },
      orderBy: { createdAt: "desc" },
      include: {
        vendor: { select: { id: true, vendorCode: true, companyName: true } },
        purchaseOrder: { select: { id: true, poNumber: true } },
      },
      take: 200,
    });
  }

  async discrepancies(user: { userId: string; role: UserRole }) {
    if (!this.canManageInvoices(user.role)) throw new ForbiddenException("Not allowed");

    return (this.prisma as any).vendorInvoice.findMany({
      where: { matchStatus: { in: ["MISMATCH", "PARTIAL_MATCH", "DISPUTED"] } },
      orderBy: { updatedAt: "desc" },
      include: {
        vendor: { select: { id: true, vendorCode: true, companyName: true } },
        purchaseOrder: { select: { id: true, poNumber: true } },
      },
      take: 200,
    });
  }
}

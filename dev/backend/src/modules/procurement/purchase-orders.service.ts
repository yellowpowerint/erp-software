import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, UserRole } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { PdfGeneratorService } from "../documents/services/pdf-generator.service";
import {
  CancelPurchaseOrderDto,
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
} from "./dto";

@Injectable()
export class PurchaseOrdersService {
  constructor(
    private prisma: PrismaService,
    private pdfGeneratorService: PdfGeneratorService,
  ) {}

  private canManagePOs(role: UserRole): boolean {
    return (
      [
        UserRole.SUPER_ADMIN,
        UserRole.CEO,
        UserRole.CFO,
        UserRole.PROCUREMENT_OFFICER,
        UserRole.OPERATIONS_MANAGER,
        UserRole.WAREHOUSE_MANAGER,
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

  private toDecimalOrZero(value?: string): Prisma.Decimal {
    if (value === undefined || value === null || value === "") {
      return new Prisma.Decimal(0);
    }
    return this.toDecimal(value);
  }

  private async generatePONumber(tx: Prisma.TransactionClient) {
    const year = new Date().getFullYear();
    const prefix = `PO-${year}-`;

    const poClient = (tx as any).purchaseOrder;
    const count = await poClient.count({
      where: { poNumber: { startsWith: prefix } },
    });

    return `${prefix}${String(count + 1).padStart(4, "0")}`;
  }

  private computeTotals(
    items: Array<{ quantity: string; unitPrice: string }>,
    extras: {
      taxAmount?: string;
      discountAmount?: string;
      shippingCost?: string;
    },
  ) {
    const subtotal = items.reduce((acc, i) => {
      const qty = this.toDecimal(i.quantity);
      const unitPrice = this.toDecimal(i.unitPrice);
      return acc.add(qty.mul(unitPrice));
    }, new Prisma.Decimal(0));

    const taxAmount = this.toDecimalOrZero(extras.taxAmount);
    const discountAmount = this.toDecimalOrZero(extras.discountAmount);
    const shippingCost = this.toDecimalOrZero(extras.shippingCost);

    const totalAmount = subtotal
      .add(taxAmount)
      .add(shippingCost)
      .sub(discountAmount);

    if (totalAmount.lessThan(0)) {
      throw new BadRequestException("Total amount cannot be negative");
    }

    return { subtotal, taxAmount, discountAmount, shippingCost, totalAmount };
  }

  async createPO(
    dto: CreatePurchaseOrderDto,
    user: { userId: string; role: UserRole },
  ) {
    if (!this.canManagePOs(user.role)) {
      throw new ForbiddenException("Not allowed");
    }

    if (!dto.items?.length) {
      throw new BadRequestException("PO must have at least one item");
    }

    return this.prisma.$transaction(async (tx) => {
      const vendor = await tx.vendor.findUnique({
        where: { id: dto.vendorId },
        select: { id: true },
      });
      if (!vendor) throw new BadRequestException("Invalid vendorId");

      if (dto.requisitionId) {
        const req = await tx.requisition.findUnique({
          where: { id: dto.requisitionId },
          select: { id: true },
        });
        if (!req) throw new BadRequestException("Invalid requisitionId");
      }

      if (dto.rfqResponseId) {
        const resp = await (tx as any).rFQResponse.findUnique({
          where: { id: dto.rfqResponseId },
          select: { id: true },
        });
        if (!resp) throw new BadRequestException("Invalid rfqResponseId");
      }

      const poNumber = await this.generatePONumber(tx);
      const totals = this.computeTotals(dto.items, dto);

      const poClient = (tx as any).purchaseOrder;
      const po = await poClient.create({
        data: {
          poNumber,
          vendorId: dto.vendorId,
          requisitionId: dto.requisitionId ?? null,
          rfqResponseId: dto.rfqResponseId ?? null,
          status: "DRAFT",
          subtotal: totals.subtotal,
          taxAmount: totals.taxAmount,
          discountAmount: totals.discountAmount,
          shippingCost: totals.shippingCost,
          totalAmount: totals.totalAmount,
          currency: dto.currency ?? "GHS",
          deliveryAddress: dto.deliveryAddress,
          deliverySite: dto.deliverySite,
          expectedDelivery: new Date(dto.expectedDelivery),
          deliveryTerms: dto.deliveryTerms,
          paymentTerms: dto.paymentTerms ?? 30,
          createdById: user.userId,
          items: {
            create: dto.items.map((i) => ({
              itemName: i.itemName,
              description: i.description,
              quantity: this.toDecimal(i.quantity),
              unit: i.unit,
              unitPrice: this.toDecimal(i.unitPrice),
              totalPrice: this.toDecimal(i.quantity).mul(
                this.toDecimal(i.unitPrice),
              ),
              stockItemId: i.stockItemId ?? null,
            })),
          },
        },
        include: { items: true },
      });

      return po;
    });
  }

  async listPOs(
    query: any,
    user: { userId: string; role: UserRole; vendorId?: string },
  ) {
    const where: any = {};

    if (user.role === UserRole.VENDOR) {
      if (!user.vendorId)
        throw new ForbiddenException("Vendor account not linked");
      where.vendorId = user.vendorId;
    } else {
      if (!this.canManagePOs(user.role))
        throw new ForbiddenException("Not allowed");
    }

    if (query.status) {
      // Handle comma-separated status values from mobile app
      const statuses = query.status.split(',').map((s: string) => s.trim());
      if (statuses.length === 1) {
        (where as any).status = statuses[0];
      } else {
        (where as any).status = { in: statuses };
      }
    }
    if (query.vendorId && user.role !== UserRole.VENDOR)
      where.vendorId = String(query.vendorId);

    return (this.prisma as any).purchaseOrder.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        vendor: { select: { id: true, vendorCode: true, companyName: true } },
        _count: { select: { items: true } },
      },
      take: 200,
    });
  }

  async getPOById(
    id: string,
    user: { userId: string; role: UserRole; vendorId?: string },
  ) {
    const po = await (this.prisma as any).purchaseOrder.findUnique({
      where: { id },
      include: {
        vendor: {
          select: {
            id: true,
            vendorCode: true,
            companyName: true,
            email: true,
            phone: true,
          },
        },
        items: true,
        requisition: { select: { id: true, requisitionNo: true, title: true } },
        rfqResponse: {
          include: {
            vendor: {
              select: { id: true, vendorCode: true, companyName: true },
            },
          },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
        approvedBy: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
      },
    });

    if (!po) throw new NotFoundException("Purchase order not found");

    if (user.role === UserRole.VENDOR) {
      if (!user.vendorId)
        throw new ForbiddenException("Vendor account not linked");
      if (po.vendorId !== user.vendorId)
        throw new ForbiddenException("Not allowed");
    } else {
      if (!this.canManagePOs(user.role))
        throw new ForbiddenException("Not allowed");
    }

    return po;
  }

  async updatePO(
    id: string,
    dto: UpdatePurchaseOrderDto,
    user: { userId: string; role: UserRole },
  ) {
    if (!this.canManagePOs(user.role))
      throw new ForbiddenException("Not allowed");

    const existing = await (this.prisma as any).purchaseOrder.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!existing) throw new NotFoundException("Purchase order not found");
    if (String(existing.status) !== "DRAFT") {
      throw new BadRequestException(
        "Only draft purchase orders can be updated",
      );
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.items) {
        const poiClient = (tx as any).purchaseOrderItem;
        await poiClient.deleteMany({ where: { purchaseOrderId: id } });
        await poiClient.createMany({
          data: dto.items.map((i) => ({
            id: i.id,
            purchaseOrderId: id,
            itemName: i.itemName,
            description: i.description,
            quantity: this.toDecimal(i.quantity),
            unit: i.unit,
            unitPrice: this.toDecimal(i.unitPrice),
            totalPrice: this.toDecimal(i.quantity).mul(
              this.toDecimal(i.unitPrice),
            ),
            stockItemId: i.stockItemId ?? null,
          })),
          skipDuplicates: true,
        });
      }

      const itemsForTotal = dto.items
        ? dto.items.map((i) => ({
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          }))
        : await (tx as any).purchaseOrderItem
            .findMany({
              where: { purchaseOrderId: id },
              select: { quantity: true, unitPrice: true },
            })
            .then((rows) =>
              rows.map((r) => ({
                quantity: String(r.quantity),
                unitPrice: String(r.unitPrice),
              })),
            );

      const totals = this.computeTotals(itemsForTotal, dto);

      return (tx as any).purchaseOrder.update({
        where: { id },
        data: {
          vendorId: dto.vendorId,
          requisitionId:
            dto.requisitionId === undefined
              ? undefined
              : dto.requisitionId || null,
          rfqResponseId:
            dto.rfqResponseId === undefined
              ? undefined
              : dto.rfqResponseId || null,
          currency: dto.currency,
          taxAmount: totals.taxAmount,
          discountAmount: totals.discountAmount,
          shippingCost: totals.shippingCost,
          subtotal: totals.subtotal,
          totalAmount: totals.totalAmount,
          deliveryAddress: dto.deliveryAddress,
          deliverySite: dto.deliverySite,
          expectedDelivery: dto.expectedDelivery
            ? new Date(dto.expectedDelivery)
            : undefined,
          deliveryTerms: dto.deliveryTerms,
          paymentTerms: dto.paymentTerms,
        },
        include: { items: true },
      });
    });
  }

  async approvePO(id: string, user: { userId: string; role: UserRole }) {
    if (!this.canManagePOs(user.role))
      throw new ForbiddenException("Not allowed");

    const po = await (this.prisma as any).purchaseOrder.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!po) throw new NotFoundException("Purchase order not found");
    if (
      !["DRAFT" as any, "PENDING_APPROVAL" as any].includes(po.status as any)
    ) {
      throw new BadRequestException(
        "Purchase order cannot be approved in its current status",
      );
    }

    return (this.prisma as any).purchaseOrder.update({
      where: { id },
      data: {
        status: "APPROVED",
        approvedById: user.userId,
        approvedAt: new Date(),
      },
    });
  }

  async sendPO(id: string, user: { userId: string; role: UserRole }) {
    if (!this.canManagePOs(user.role))
      throw new ForbiddenException("Not allowed");

    const po = await (this.prisma as any).purchaseOrder.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!po) throw new NotFoundException("Purchase order not found");
    if (String(po.status) !== "APPROVED") {
      throw new BadRequestException(
        "Only approved purchase orders can be sent",
      );
    }

    return (this.prisma as any).purchaseOrder.update({
      where: { id },
      data: { status: "SENT" },
    });
  }

  async cancelPO(
    id: string,
    _dto: CancelPurchaseOrderDto,
    user: { userId: string; role: UserRole },
  ) {
    if (!this.canManagePOs(user.role))
      throw new ForbiddenException("Not allowed");

    const po = await (this.prisma as any).purchaseOrder.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!po) throw new NotFoundException("Purchase order not found");

    if (["CANCELLED", "COMPLETED"].includes(String(po.status))) {
      throw new BadRequestException("Purchase order is already closed");
    }

    return (this.prisma as any).purchaseOrder.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
  }

  async createFromRFQResponse(
    responseId: string,
    user: { userId: string; role: UserRole },
  ) {
    if (!this.canManagePOs(user.role))
      throw new ForbiddenException("Not allowed");

    const response = await (this.prisma as any).rFQResponse.findUnique({
      where: { id: responseId },
      include: {
        rfq: { include: { requisition: true } },
        vendor: true,
        items: { include: { rfqItem: true } },
      },
    });

    if (!response) throw new NotFoundException("RFQ response not found");

    return this.prisma.$transaction(async (tx) => {
      const poNumber = await this.generatePONumber(tx);

      const items = response.items.map((ri: any) => ({
        itemName: ri.rfqItem.itemName,
        description: ri.rfqItem.description,
        quantity: String(ri.rfqItem.quantity),
        unit: ri.rfqItem.unit,
        unitPrice: String(ri.unitPrice),
        stockItemId: null,
      }));

      const totals = this.computeTotals(items, {
        taxAmount: "0",
        discountAmount: "0",
        shippingCost: "0",
      });

      return (tx as any).purchaseOrder.create({
        data: {
          poNumber,
          vendorId: response.vendorId,
          requisitionId: response.rfq?.requisitionId ?? null,
          rfqResponseId: response.id,
          status: "DRAFT",
          subtotal: totals.subtotal,
          taxAmount: totals.taxAmount,
          discountAmount: totals.discountAmount,
          shippingCost: totals.shippingCost,
          totalAmount: totals.totalAmount,
          currency: response.currency ?? "GHS",
          deliveryAddress: response.rfq.deliveryLocation,
          deliverySite: response.rfq.deliveryLocation,
          expectedDelivery: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          deliveryTerms: response.rfq.deliveryTerms,
          paymentTerms: response.vendor.paymentTerms ?? 30,
          createdById: user.userId,
          items: {
            create: items.map((i) => ({
              itemName: i.itemName,
              description: i.description,
              quantity: this.toDecimal(i.quantity),
              unit: i.unit,
              unitPrice: this.toDecimal(i.unitPrice),
              totalPrice: this.toDecimal(i.quantity).mul(
                this.toDecimal(i.unitPrice),
              ),
              stockItemId: null,
            })),
          },
        },
        include: { items: true },
      });
    });
  }

  async generatePOPdf(
    poId: string,
    user: { userId: string; role: UserRole; vendorId?: string },
  ) {
    // Ensure access before generating
    await this.getPOById(poId, user);
    return this.pdfGeneratorService.generatePurchaseOrderPDF(poId, {
      includeQRCode: true,
      qrCodeData: `PO-${poId}`,
    });
  }
}

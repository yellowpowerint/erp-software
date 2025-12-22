import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, UserRole } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import {
  AcceptGoodsReceiptDto,
  CreateGoodsReceiptDto,
  RejectGoodsReceiptDto,
  SubmitQualityInspectionDto,
  UpdateGoodsReceiptDto,
} from "./dto";

@Injectable()
export class GoodsReceiptsService {
  constructor(private prisma: PrismaService) {}

  private canManageReceiving(role: UserRole): boolean {
    return (
      [
        UserRole.SUPER_ADMIN,
        UserRole.CEO,
        UserRole.CFO,
        UserRole.PROCUREMENT_OFFICER,
        UserRole.OPERATIONS_MANAGER,
        UserRole.WAREHOUSE_MANAGER,
        UserRole.SAFETY_OFFICER,
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

  private async generateGRNNumber(tx: Prisma.TransactionClient) {
    const year = new Date().getFullYear();
    const prefix = `GRN-${year}-`;

    const grnClient = (tx as any).goodsReceipt;
    const count = await grnClient.count({
      where: { grnNumber: { startsWith: prefix } },
    });

    return `${prefix}${String(count + 1).padStart(4, "0")}`;
  }

  private async recomputePOStatus(tx: Prisma.TransactionClient, purchaseOrderId: string) {
    const po = await (tx as any).purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: { items: { select: { quantity: true, receivedQty: true } } },
    });

    if (!po) return;

    const allReceived = po.items.every((i: any) =>
      new Prisma.Decimal(i.receivedQty).greaterThanOrEqualTo(new Prisma.Decimal(i.quantity)),
    );

    const anyReceived = po.items.some((i: any) =>
      new Prisma.Decimal(i.receivedQty).greaterThan(new Prisma.Decimal(0)),
    );

    const nextStatus = allReceived
      ? "RECEIVED"
      : anyReceived
        ? "PARTIALLY_RECEIVED"
        : String(po.status);

    if (String(po.status) !== nextStatus) {
      await (tx as any).purchaseOrder.update({
        where: { id: purchaseOrderId },
        data: { status: nextStatus },
      });
    }
  }

  async createGRN(dto: CreateGoodsReceiptDto, user: { userId: string; role: UserRole }) {
    if (!this.canManageReceiving(user.role)) {
      throw new ForbiddenException("Not allowed");
    }

    if (!dto.items?.length) {
      throw new BadRequestException("GRN must have at least one item");
    }

    return this.prisma.$transaction(async (tx) => {
      const po = await (tx as any).purchaseOrder.findUnique({
        where: { id: dto.purchaseOrderId },
        include: { items: true },
      });
      if (!po) throw new BadRequestException("Invalid purchaseOrderId");

      if (["CANCELLED", "COMPLETED"].includes(String(po.status))) {
        throw new BadRequestException("Cannot receive goods for a closed PO");
      }

      const grnNumber = await this.generateGRNNumber(tx);

      const poItemsById = new Map<string, any>(po.items.map((i: any) => [i.id, i]));

      const itemsToCreate = dto.items.map((i) => {
        const poItem = poItemsById.get(i.poItemId);
        if (!poItem) throw new BadRequestException(`Invalid poItemId: ${i.poItemId}`);

        const receivedQty = this.toDecimal(i.receivedQty);
        if (receivedQty.lessThanOrEqualTo(0)) {
          throw new BadRequestException("receivedQty must be greater than 0");
        }

        const orderedQty = new Prisma.Decimal(poItem.quantity);
        const alreadyReceived = new Prisma.Decimal(poItem.receivedQty);
        const remaining = orderedQty.sub(alreadyReceived);

        if (receivedQty.greaterThan(remaining)) {
          throw new BadRequestException(
            `Received qty exceeds remaining qty for item ${poItem.itemName}`,
          );
        }

        return {
          poItemId: poItem.id,
          itemName: poItem.itemName,
          orderedQty,
          receivedQty,
          unit: poItem.unit,
          condition: i.condition || "GOOD",
          notes: i.notes,
        };
      });

      const grn = await (tx as any).goodsReceipt.create({
        data: {
          grnNumber,
          purchaseOrderId: dto.purchaseOrderId,
          receivedById: user.userId,
          warehouseId: dto.warehouseId ?? null,
          siteLocation: dto.siteLocation,
          deliveryNote: dto.deliveryNote,
          carrierName: dto.carrierName,
          vehicleNumber: dto.vehicleNumber,
          driverName: dto.driverName,
          status: "PENDING_INSPECTION",
          notes: dto.notes,
          items: { create: itemsToCreate },
        },
        include: { items: true },
      });

      for (const it of itemsToCreate) {
        await (tx as any).purchaseOrderItem.update({
          where: { id: it.poItemId },
          data: { receivedQty: { increment: it.receivedQty } },
        });
      }

      await this.recomputePOStatus(tx, dto.purchaseOrderId);

      return grn;
    });
  }

  async listGRNs(query: any, user: { userId: string; role: UserRole; vendorId?: string }) {
    const where: any = {};

    if (user.role === UserRole.VENDOR) {
      if (!user.vendorId) throw new ForbiddenException("Vendor account not linked");
      where.purchaseOrder = { vendorId: user.vendorId };
    } else {
      if (!this.canManageReceiving(user.role)) throw new ForbiddenException("Not allowed");
    }

    if (query.purchaseOrderId) where.purchaseOrderId = String(query.purchaseOrderId);
    if (query.status) where.status = String(query.status);

    return (this.prisma as any).goodsReceipt.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        purchaseOrder: {
          select: {
            id: true,
            poNumber: true,
            vendor: { select: { id: true, vendorCode: true, companyName: true } },
          },
        },
        receivedBy: { select: { id: true, firstName: true, lastName: true, role: true } },
        _count: { select: { items: true, inspections: true } },
      },
      take: 200,
    });
  }

  async getGRNById(id: string, user: { userId: string; role: UserRole; vendorId?: string }) {
    const grn = await (this.prisma as any).goodsReceipt.findUnique({
      where: { id },
      include: {
        purchaseOrder: {
          include: {
            vendor: { select: { id: true, vendorCode: true, companyName: true } },
          },
        },
        items: { include: { poItem: true } },
        inspections: {
          include: {
            inspector: { select: { id: true, firstName: true, lastName: true, role: true } },
          },
          orderBy: { inspectionDate: "desc" },
        },
        receivedBy: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
    });

    if (!grn) throw new NotFoundException("Goods receipt not found");

    if (user.role === UserRole.VENDOR) {
      if (!user.vendorId) throw new ForbiddenException("Vendor account not linked");
      if (grn.purchaseOrder.vendorId !== user.vendorId) throw new ForbiddenException("Not allowed");
    } else {
      if (!this.canManageReceiving(user.role)) throw new ForbiddenException("Not allowed");
    }

    return grn;
  }

  async updateGRN(
    id: string,
    dto: UpdateGoodsReceiptDto,
    user: { userId: string; role: UserRole },
  ) {
    if (!this.canManageReceiving(user.role)) throw new ForbiddenException("Not allowed");

    return this.prisma.$transaction(async (tx) => {
      const existing = await (tx as any).goodsReceipt.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!existing) throw new NotFoundException("Goods receipt not found");

      if (["ACCEPTED", "PARTIALLY_ACCEPTED", "REJECTED"].includes(String(existing.status))) {
        throw new BadRequestException("Cannot update a finalized goods receipt");
      }

      if (dto.items) {
        const po = await (tx as any).purchaseOrder.findUnique({
          where: { id: existing.purchaseOrderId },
          include: { items: true },
        });
        if (!po) throw new BadRequestException("Purchase order not found");

        const poItemsById = new Map<string, any>(po.items.map((i: any) => [i.id, i]));

        for (const oldItem of existing.items) {
          await (tx as any).purchaseOrderItem.update({
            where: { id: oldItem.poItemId },
            data: { receivedQty: { decrement: new Prisma.Decimal(oldItem.receivedQty) } },
          });
        }

        await (tx as any).goodsReceiptItem.deleteMany({ where: { goodsReceiptId: id } });

        const newItems = dto.items.map((i) => {
          const poItem = poItemsById.get(i.poItemId);
          if (!poItem) throw new BadRequestException(`Invalid poItemId: ${i.poItemId}`);

          const receivedQty = this.toDecimal(i.receivedQty);
          if (receivedQty.lessThanOrEqualTo(0)) {
            throw new BadRequestException("receivedQty must be greater than 0");
          }

          const orderedQty = new Prisma.Decimal(poItem.quantity);
          const alreadyReceived = new Prisma.Decimal(poItem.receivedQty);
          const remaining = orderedQty.sub(alreadyReceived);

          if (receivedQty.greaterThan(remaining)) {
            throw new BadRequestException(
              `Received qty exceeds remaining qty for item ${poItem.itemName}`,
            );
          }

          return {
            goodsReceiptId: id,
            poItemId: poItem.id,
            itemName: poItem.itemName,
            orderedQty,
            receivedQty,
            unit: poItem.unit,
            condition: i.condition || "GOOD",
            notes: i.notes,
          };
        });

        await (tx as any).goodsReceiptItem.createMany({ data: newItems });

        for (const it of newItems) {
          await (tx as any).purchaseOrderItem.update({
            where: { id: it.poItemId },
            data: { receivedQty: { increment: it.receivedQty } },
          });
        }

        await this.recomputePOStatus(tx, existing.purchaseOrderId);
      }

      return (tx as any).goodsReceipt.update({
        where: { id },
        data: {
          warehouseId: dto.warehouseId === undefined ? undefined : dto.warehouseId || null,
          siteLocation: dto.siteLocation,
          deliveryNote: dto.deliveryNote,
          carrierName: dto.carrierName,
          vehicleNumber: dto.vehicleNumber,
          driverName: dto.driverName,
          notes: dto.notes,
        },
        include: { items: true },
      });
    });
  }

  async submitInspection(
    goodsReceiptId: string,
    dto: SubmitQualityInspectionDto,
    user: { userId: string; role: UserRole },
  ) {
    if (!this.canManageReceiving(user.role)) throw new ForbiddenException("Not allowed");

    return this.prisma.$transaction(async (tx) => {
      const grn = await (tx as any).goodsReceipt.findUnique({
        where: { id: goodsReceiptId },
        select: { id: true, status: true },
      });
      if (!grn) throw new NotFoundException("Goods receipt not found");

      if (["ACCEPTED", "PARTIALLY_ACCEPTED", "REJECTED"].includes(String(grn.status))) {
        throw new BadRequestException("Cannot inspect a finalized goods receipt");
      }

      const inspection = await (tx as any).qualityInspection.create({
        data: {
          goodsReceiptId,
          inspectorId: user.userId,
          overallResult: dto.overallResult,
          qualityScore: dto.qualityScore ?? null,
          visualCheck: dto.visualCheck ?? false,
          quantityCheck: dto.quantityCheck ?? false,
          specCheck: dto.specCheck ?? false,
          documentCheck: dto.documentCheck ?? false,
          safetyCheck: dto.safetyCheck ?? false,
          findings: dto.findings,
          recommendations: dto.recommendations,
          photos: dto.photos ?? [],
        },
      });

      await (tx as any).goodsReceipt.update({
        where: { id: goodsReceiptId },
        data: { status: "INSPECTING" },
      });

      return inspection;
    });
  }

  async acceptGoods(
    goodsReceiptId: string,
    dto: AcceptGoodsReceiptDto,
    user: { userId: string; role: UserRole },
  ) {
    if (!this.canManageReceiving(user.role)) throw new ForbiddenException("Not allowed");

    return this.prisma.$transaction(async (tx) => {
      const grn = await (tx as any).goodsReceipt.findUnique({
        where: { id: goodsReceiptId },
        include: { items: true },
      });
      if (!grn) throw new NotFoundException("Goods receipt not found");

      if (["ACCEPTED", "PARTIALLY_ACCEPTED", "REJECTED"].includes(String(grn.status))) {
        throw new BadRequestException("Goods receipt is already finalized");
      }

      const itemById = new Map<string, any>(grn.items.map((i: any) => [i.id, i]));

      if (!dto.items?.length) {
        throw new BadRequestException("No acceptance items provided");
      }

      for (const i of dto.items) {
        const existingItem = itemById.get(i.goodsReceiptItemId);
        if (!existingItem) {
          throw new BadRequestException(`Invalid goodsReceiptItemId: ${i.goodsReceiptItemId}`);
        }

        const acceptedQty = this.toDecimal(i.acceptedQty);
        const rejectedQty = this.toDecimal(i.rejectedQty);
        const receivedQty = new Prisma.Decimal(existingItem.receivedQty);

        if (acceptedQty.lessThan(0) || rejectedQty.lessThan(0)) {
          throw new BadRequestException("acceptedQty/rejectedQty cannot be negative");
        }

        if (!acceptedQty.add(rejectedQty).equals(receivedQty)) {
          throw new BadRequestException(
            `acceptedQty + rejectedQty must equal receivedQty for item ${existingItem.itemName}`,
          );
        }

        await (tx as any).goodsReceiptItem.update({
          where: { id: i.goodsReceiptItemId },
          data: {
            acceptedQty,
            rejectedQty,
            notes: i.notes,
          },
        });
      }

      const updatedItems = await (tx as any).goodsReceiptItem.findMany({
        where: { goodsReceiptId },
        select: { receivedQty: true, acceptedQty: true, rejectedQty: true },
      });

      const allAccepted = updatedItems.every((i: any) =>
        new Prisma.Decimal(i.acceptedQty).equals(new Prisma.Decimal(i.receivedQty)),
      );
      const noneAccepted = updatedItems.every((i: any) =>
        new Prisma.Decimal(i.acceptedQty).equals(new Prisma.Decimal(0)),
      );

      const status = allAccepted
        ? "ACCEPTED"
        : noneAccepted
          ? "REJECTED"
          : "PARTIALLY_ACCEPTED";

      return (tx as any).goodsReceipt.update({
        where: { id: goodsReceiptId },
        data: { status },
        include: { items: true },
      });
    });
  }

  async rejectGoods(
    goodsReceiptId: string,
    dto: RejectGoodsReceiptDto,
    user: { userId: string; role: UserRole },
  ) {
    if (!this.canManageReceiving(user.role)) throw new ForbiddenException("Not allowed");

    return this.prisma.$transaction(async (tx) => {
      const grn = await (tx as any).goodsReceipt.findUnique({
        where: { id: goodsReceiptId },
        include: { items: true },
      });
      if (!grn) throw new NotFoundException("Goods receipt not found");

      if (["ACCEPTED", "PARTIALLY_ACCEPTED", "REJECTED"].includes(String(grn.status))) {
        throw new BadRequestException("Goods receipt is already finalized");
      }

      const itemById = new Map<string, any>(grn.items.map((i: any) => [i.id, i]));

      if (dto.items?.length) {
        for (const i of dto.items) {
          const existingItem = itemById.get(i.goodsReceiptItemId);
          if (!existingItem) {
            throw new BadRequestException(`Invalid goodsReceiptItemId: ${i.goodsReceiptItemId}`);
          }

          const rejectedQty = this.toDecimal(i.rejectedQty);
          const receivedQty = new Prisma.Decimal(existingItem.receivedQty);

          if (rejectedQty.lessThan(0) || rejectedQty.greaterThan(receivedQty)) {
            throw new BadRequestException("Invalid rejectedQty");
          }

          await (tx as any).goodsReceiptItem.update({
            where: { id: i.goodsReceiptItemId },
            data: {
              acceptedQty: new Prisma.Decimal(0),
              rejectedQty,
              notes: i.notes,
            },
          });
        }
      } else {
        for (const it of grn.items) {
          await (tx as any).goodsReceiptItem.update({
            where: { id: it.id },
            data: {
              acceptedQty: new Prisma.Decimal(0),
              rejectedQty: new Prisma.Decimal(it.receivedQty),
            },
          });
        }
      }

      const notes = dto.reason;

      return (tx as any).goodsReceipt.update({
        where: { id: goodsReceiptId },
        data: {
          status: "REJECTED",
          notes: grn.notes ? `${grn.notes}\n${notes}` : notes,
        },
        include: { items: true },
      });
    });
  }
}

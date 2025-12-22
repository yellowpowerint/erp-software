import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, RequisitionType, UserRole } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";

export interface AvailabilityLine {
  stockItemId: string;
  requestedQty: number;
  availableQty: number;
  reservedQty: number;
  currentQty: number;
  isAvailable: boolean;
}

export interface AvailabilityResult {
  ok: boolean;
  lines: AvailabilityLine[];
}

export interface SyncResult {
  processed: number;
  skippedAlreadySynced: number;
  skippedNotAccepted: number;
}

@Injectable()
export class InventoryIntegrationService {
  constructor(private prisma: PrismaService) {}

  private canManageInventoryIntegration(role: UserRole) {
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

  private toIntQuantityFromDecimalString(value: any): number {
    const n = Number(value);
    if (!Number.isFinite(n)) {
      throw new BadRequestException("Invalid quantity");
    }

    const rounded = Math.round(n);
    if (Math.abs(rounded - n) > 1e-9) {
      throw new BadRequestException(
        "Quantity must be a whole number to sync with inventory",
      );
    }

    if (rounded < 0)
      throw new BadRequestException("Quantity cannot be negative");
    return rounded;
  }

  async updateInventoryOnReceipt(grnId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const grn = await (tx as any).goodsReceipt.findUnique({
        where: { id: grnId },
        include: {
          items: true,
          purchaseOrder: { include: { items: true } },
        },
      });

      if (!grn) throw new NotFoundException("Goods receipt not found");

      if (grn.inventorySyncedAt) {
        return;
      }

      if (!["ACCEPTED", "PARTIALLY_ACCEPTED"].includes(String(grn.status))) {
        throw new BadRequestException(
          "Only accepted goods receipts can be synced to inventory",
        );
      }

      const poItemsById = new Map<string, any>(
        grn.purchaseOrder.items.map((i: any) => [i.id, i]),
      );

      for (const it of grn.items) {
        const acceptedQty = new Prisma.Decimal(it.acceptedQty);
        if (acceptedQty.lessThanOrEqualTo(0)) continue;

        const poItem = poItemsById.get(it.poItemId);
        const stockItemId = poItem?.stockItemId ?? null;
        if (!stockItemId) {
          continue;
        }

        const qtyInt = this.toIntQuantityFromDecimalString(String(acceptedQty));
        if (qtyInt <= 0) continue;

        const stockItem = await tx.stockItem.findUnique({
          where: { id: stockItemId },
          select: { id: true, warehouseId: true, currentQuantity: true },
        });

        if (!stockItem) {
          continue;
        }

        const previousQty = stockItem.currentQuantity;
        const newQty = previousQty + qtyInt;

        await tx.stockMovement.create({
          data: {
            itemId: stockItem.id,
            warehouseId: stockItem.warehouseId,
            movementType: "STOCK_IN",
            quantity: qtyInt,
            previousQty,
            newQty,
            unitPrice: null,
            totalValue: null,
            reference: `GRN:${grn.grnNumber}`,
            notes: `Auto stock-in from goods receipt ${grn.grnNumber}`,
            performedById: grn.receivedById,
          },
        });

        await tx.stockItem.update({
          where: { id: stockItem.id },
          data: {
            currentQuantity: newQty,
            lastRestockDate: new Date(),
          },
        });
      }

      await (tx as any).goodsReceipt.update({
        where: { id: grnId },
        data: { inventorySyncedAt: new Date() },
      });
    });
  }

  async syncProcurementWithInventory(limit: number = 50): Promise<SyncResult> {
    const toProcess = await (this.prisma as any).goodsReceipt.findMany({
      where: {
        inventorySyncedAt: null,
      },
      orderBy: { createdAt: "asc" },
      take: Math.min(500, Math.max(1, Number(limit) || 50)),
      select: { id: true, status: true },
    });

    let processed = 0;
    let skippedAlreadySynced = 0;
    let skippedNotAccepted = 0;

    for (const grn of toProcess) {
      if (!["ACCEPTED", "PARTIALLY_ACCEPTED"].includes(String(grn.status))) {
        skippedNotAccepted++;
        continue;
      }

      try {
        await this.updateInventoryOnReceipt(grn.id);
        processed++;
      } catch (e: any) {
        if (String(e?.message || "").includes("synced")) {
          skippedAlreadySynced++;
        }
        throw e;
      }
    }

    return { processed, skippedAlreadySynced, skippedNotAccepted };
  }

  async checkStockAvailability(
    items: Array<{ stockItemId?: string | null; quantity: any }>,
  ): Promise<AvailabilityResult> {
    const lines: AvailabilityLine[] = [];

    for (const it of items) {
      if (!it.stockItemId) continue;

      const requestedQty = this.toIntQuantityFromDecimalString(
        String(it.quantity),
      );

      const stock = await this.prisma.stockItem.findUnique({
        where: { id: it.stockItemId },
        select: { id: true, currentQuantity: true, reservedQuantity: true },
      });

      if (!stock) {
        lines.push({
          stockItemId: it.stockItemId,
          requestedQty,
          availableQty: 0,
          reservedQty: 0,
          currentQty: 0,
          isAvailable: false,
        });
        continue;
      }

      const availableQty = Math.max(
        0,
        stock.currentQuantity - stock.reservedQuantity,
      );

      lines.push({
        stockItemId: stock.id,
        requestedQty,
        availableQty,
        reservedQty: stock.reservedQuantity,
        currentQty: stock.currentQuantity,
        isAvailable: availableQty >= requestedQty,
      });
    }

    return { ok: lines.every((l) => l.isAvailable), lines };
  }

  async reserveStockForRequisition(
    requisitionId: string,
    user: { userId: string; role: UserRole },
  ) {
    if (!this.canManageInventoryIntegration(user.role)) {
      throw new ForbiddenException("Not allowed");
    }

    return this.prisma.$transaction(async (tx) => {
      const req = await tx.requisition.findUnique({
        where: { id: requisitionId },
        include: { items: true },
      });

      if (!req) throw new NotFoundException("Requisition not found");

      const availability = await this.checkStockAvailability(
        req.items.map((i) => ({
          stockItemId: i.stockItemId,
          quantity: i.quantity,
        })),
      );

      if (!availability.ok) {
        throw new BadRequestException("Insufficient stock to reserve");
      }

      for (const it of req.items) {
        if (!it.stockItemId) continue;
        const qty = this.toIntQuantityFromDecimalString(String(it.quantity));
        if (qty <= 0) continue;

        await tx.stockItem.update({
          where: { id: it.stockItemId },
          data: { reservedQuantity: { increment: qty } },
        });
      }

      return { success: true, requisitionId };
    });
  }

  async releaseReservedStock(
    requisitionId: string,
    user: { userId: string; role: UserRole },
  ) {
    if (!this.canManageInventoryIntegration(user.role)) {
      throw new ForbiddenException("Not allowed");
    }

    return this.prisma.$transaction(async (tx) => {
      const req = await tx.requisition.findUnique({
        where: { id: requisitionId },
        include: { items: true },
      });

      if (!req) throw new NotFoundException("Requisition not found");

      for (const it of req.items) {
        if (!it.stockItemId) continue;
        const qty = this.toIntQuantityFromDecimalString(String(it.quantity));
        if (qty <= 0) continue;

        const stock = await tx.stockItem.findUnique({
          where: { id: it.stockItemId },
          select: { reservedQuantity: true },
        });

        if (!stock) continue;
        const dec = Math.min(stock.reservedQuantity, qty);

        await tx.stockItem.update({
          where: { id: it.stockItemId },
          data: { reservedQuantity: { decrement: dec } },
        });
      }

      return { success: true, requisitionId };
    });
  }

  async generateReorderRequisition(
    stockItemId: string,
    user: { userId: string; role: UserRole },
  ) {
    if (!this.canManageInventoryIntegration(user.role)) {
      throw new ForbiddenException("Not allowed");
    }

    const stock = await this.prisma.stockItem.findUnique({
      where: { id: stockItemId },
      include: { warehouse: true },
    });

    if (!stock) throw new NotFoundException("Stock item not found");

    const suggestedQty = Math.max(
      (stock.maxStockLevel ?? stock.reorderLevel * 2) - stock.currentQuantity,
      Math.max(1, stock.reorderLevel),
    );

    const requiredDate = new Date();
    requiredDate.setDate(requiredDate.getDate() + 7);

    return (this.prisma as any).requisition.create({
      data: {
        requisitionNo: `AUTO-${new Date().getFullYear()}-${Math.random().toString(16).slice(2, 8).toUpperCase()}`,
        title: `Auto Reorder: ${stock.name}`,
        description: `Auto-generated reorder requisition for low stock item ${stock.itemCode}`,
        type: RequisitionType.STOCK_REPLENISHMENT,
        priority: "HIGH",
        status: "DRAFT",
        department: "WAREHOUSE",
        projectId: null,
        siteLocation: stock.warehouse.location || stock.warehouse.name,
        requiredDate,
        justification: "Auto reorder triggered by low stock threshold",
        currency: "GHS",
        requestedById: user.userId,
        items: {
          create: [
            {
              itemName: stock.name,
              description: stock.description,
              category: String(stock.category),
              quantity: new Prisma.Decimal(suggestedQty),
              unit: String(stock.unit),
              estimatedPrice: new Prisma.Decimal(stock.unitPrice ?? 0),
              totalPrice: new Prisma.Decimal(suggestedQty).mul(
                new Prisma.Decimal(stock.unitPrice ?? 0),
              ),
              specifications: null,
              preferredVendor: stock.supplier ?? null,
              stockItemId: stock.id,
              urgency: "HIGH",
              notes: `Auto reorder generated for stock item ${stock.itemCode}`,
            },
          ],
        },
      },
      include: { items: true },
    });
  }

  async getReorderAlerts() {
    const items = await this.prisma.stockItem.findMany({
      select: {
        id: true,
        itemCode: true,
        name: true,
        category: true,
        unit: true,
        currentQuantity: true,
        reservedQuantity: true,
        reorderLevel: true,
        maxStockLevel: true,
        unitPrice: true,
        warehouse: { select: { id: true, code: true, name: true } },
      },
      orderBy: [{ currentQuantity: "asc" }],
      take: 500,
    });

    return items
      .filter((i) => i.currentQuantity <= i.reorderLevel)
      .slice(0, 200);
  }
}

import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class ProcurementReportsService {
  constructor(private prisma: PrismaService) {}

  private toDecimal(v: any): Prisma.Decimal {
    if (v instanceof Prisma.Decimal) return v;
    const n = Number(v);
    return new Prisma.Decimal(Number.isFinite(n) ? n : 0);
  }

  private parseDateRange(query: any) {
    const start = query?.startDate ? new Date(query.startDate) : undefined;
    const end = query?.endDate ? new Date(query.endDate) : undefined;
    return { start, end };
  }

  async spendAnalysis(query: any) {
    const { start, end } = this.parseDateRange(query);

    const where: any = {};
    if (start || end) {
      where.invoiceDate = {};
      if (start) where.invoiceDate.gte = start;
      if (end) where.invoiceDate.lte = end;
    }

    const invoices = await (this.prisma as any).vendorInvoice.findMany({
      where,
      include: {
        vendor: { select: { id: true, vendorCode: true, companyName: true } },
        purchaseOrder: {
          select: { id: true, poNumber: true, deliverySite: true },
        },
        items: { select: { poItemId: true, totalPrice: true } },
      },
      take: 2000,
      orderBy: { invoiceDate: "desc" },
    });

    const totalSpend = invoices.reduce(
      (acc: Prisma.Decimal, i: any) => acc.add(this.toDecimal(i.totalAmount)),
      new Prisma.Decimal(0),
    );

    const spendByMonth: Record<string, Prisma.Decimal> = {};
    const spendByVendor: Record<string, Prisma.Decimal> = {};
    const spendBySite: Record<string, Prisma.Decimal> = {};

    for (const inv of invoices) {
      const month = new Date(inv.invoiceDate).toISOString().slice(0, 7);
      spendByMonth[month] = (spendByMonth[month] ?? new Prisma.Decimal(0)).add(
        this.toDecimal(inv.totalAmount),
      );

      spendByVendor[inv.vendorId] = (
        spendByVendor[inv.vendorId] ?? new Prisma.Decimal(0)
      ).add(this.toDecimal(inv.totalAmount));

      const site = inv.purchaseOrder?.deliverySite || "UNKNOWN";
      spendBySite[site] = (spendBySite[site] ?? new Prisma.Decimal(0)).add(
        this.toDecimal(inv.totalAmount),
      );
    }

    const vendorMap = new Map<string, any>();
    for (const inv of invoices) {
      if (inv.vendor) vendorMap.set(inv.vendorId, inv.vendor);
    }

    const spendByVendorArr = Object.entries(spendByVendor).map(
      ([vendorId, amount]) => ({
        vendorId,
        vendor: vendorMap.get(vendorId) ?? null,
        amount,
      }),
    );

    return {
      totalSpend,
      invoiceCount: invoices.length,
      spendByMonth: Object.entries(spendByMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, amount]) => ({ month, amount })),
      spendByVendor: spendByVendorArr,
      spendBySite: Object.entries(spendBySite).map(([site, amount]) => ({
        site,
        amount,
      })),
    };
  }

  async vendorPerformance(query: any) {
    const vendorId = query?.vendorId ? String(query.vendorId) : undefined;

    const vendors = vendorId
      ? await this.prisma.vendor.findMany({ where: { id: vendorId } })
      : await this.prisma.vendor.findMany({
          orderBy: { totalSpend: "desc" },
          take: 100,
        });

    return vendors.map((v) => ({
      vendorId: v.id,
      vendorCode: v.vendorCode,
      companyName: v.companyName,
      rating: v.rating,
      totalOrders: v.totalOrders,
      totalSpend: v.totalSpend,
      onTimeDelivery: v.onTimeDelivery,
      qualityScore: v.qualityScore,
      status: v.status,
    }));
  }

  async cycleTime(query: any) {
    const { start, end } = this.parseDateRange(query);

    const where: any = {
      status: { in: ["RECEIVED", "COMPLETED"] },
      requisitionId: { not: null },
    };

    if (start || end) {
      where.createdAt = {};
      if (start) where.createdAt.gte = start;
      if (end) where.createdAt.lte = end;
    }

    const pos = await (this.prisma as any).purchaseOrder.findMany({
      where,
      include: {
        requisition: { select: { createdAt: true } },
        receipts: {
          select: { receivedDate: true },
          orderBy: { receivedDate: "desc" },
          take: 1,
        },
      },
      take: 500,
    });

    const cycles = pos
      .filter((p: any) => p.requisition && p.receipts?.length)
      .map((p: any) => {
        const startMs = new Date(p.requisition.createdAt).getTime();
        const endMs = new Date(p.receipts[0].receivedDate).getTime();
        const days = Math.max(
          0,
          Math.round((endMs - startMs) / (1000 * 60 * 60 * 24)),
        );
        return days;
      });

    const avg = cycles.length
      ? cycles.reduce((a: number, b: number) => a + b, 0) / cycles.length
      : 0;

    return {
      sampleSize: cycles.length,
      avgCycleTimeDays: Math.round(avg * 10) / 10,
    };
  }

  async savings(query: any) {
    const { start, end } = this.parseDateRange(query);

    const where: any = { requisitionId: { not: null } };
    if (start || end) {
      where.createdAt = {};
      if (start) where.createdAt.gte = start;
      if (end) where.createdAt.lte = end;
    }

    const pos = await (this.prisma as any).purchaseOrder.findMany({
      where,
      include: {
        requisition: {
          select: {
            id: true,
            requisitionNo: true,
            totalEstimate: true,
            currency: true,
          },
        },
        vendor: { select: { id: true, vendorCode: true, companyName: true } },
      },
      take: 1000,
      orderBy: { createdAt: "desc" },
    });

    const lines = pos.map((po: any) => {
      const estimate = this.toDecimal(po.requisition?.totalEstimate ?? 0);
      const actual = this.toDecimal(po.totalAmount);
      const savings = estimate.sub(actual);
      return {
        requisitionId: po.requisition?.id,
        requisitionNo: po.requisition?.requisitionNo,
        poId: po.id,
        poNumber: po.poNumber,
        currency: po.currency,
        estimated: estimate,
        actual,
        savings,
        vendor: po.vendor,
      };
    });

    const totalSavings = lines.reduce(
      (acc: Prisma.Decimal, l: any) => acc.add(this.toDecimal(l.savings)),
      new Prisma.Decimal(0),
    );

    return { totalSavings, lines };
  }

  async compliance() {
    const [poTotal, poApproved, invoiceTotal, invoiceMatched] =
      await Promise.all([
        (this.prisma as any).purchaseOrder.count({
          where: { status: { not: "CANCELLED" } },
        }),
        (this.prisma as any).purchaseOrder.count({
          where: {
            status: {
              in: [
                "APPROVED",
                "SENT",
                "ACKNOWLEDGED",
                "PARTIALLY_RECEIVED",
                "RECEIVED",
                "COMPLETED",
              ],
            },
          },
        }),
        (this.prisma as any).vendorInvoice.count(),
        (this.prisma as any).vendorInvoice.count({
          where: { matchStatus: "MATCHED" },
        }),
      ]);

    return {
      poApprovalComplianceRate: poTotal > 0 ? (poApproved / poTotal) * 100 : 0,
      invoiceMatchRate:
        invoiceTotal > 0 ? (invoiceMatched / invoiceTotal) * 100 : 0,
      totals: { poTotal, poApproved, invoiceTotal, invoiceMatched },
    };
  }

  async pendingActions() {
    const [
      pendingRequisitions,
      pendingPOApprovals,
      pendingInvoiceMatches,
      duePayments,
    ] = await Promise.all([
      this.prisma.requisition.count({ where: { status: "PENDING_APPROVAL" } }),
      (this.prisma as any).purchaseOrder.count({
        where: { status: "PENDING_APPROVAL" },
      }),
      (this.prisma as any).vendorInvoice.count({
        where: { matchStatus: "PENDING" },
      }),
      (this.prisma as any).vendorInvoice.count({
        where: { paymentStatus: { in: ["OVERDUE"] } },
      }),
    ]);

    return {
      pendingRequisitions,
      pendingPOApprovals,
      pendingInvoiceMatches,
      duePayments,
    };
  }

  async equipmentProcurement(query: any) {
    const { start, end } = this.parseDateRange(query);

    const where: any = {
      poItem: {
        is: {
          stockItem: {
            is: {
              category: "EQUIPMENT",
            },
          },
        },
      },
      invoice: {
        is: {
          purchaseOrder: {
            is: {
              status: { not: "CANCELLED" },
            },
          },
        },
      },
    };

    if (start || end) {
      where.invoice.is.invoiceDate = {};
      if (start) where.invoice.is.invoiceDate.gte = start;
      if (end) where.invoice.is.invoiceDate.lte = end;
    }

    const items = await (this.prisma as any).vendorInvoiceItem.findMany({
      where,
      include: {
        invoice: {
          select: { id: true, invoiceNumber: true, invoiceDate: true },
        },
        poItem: { select: { id: true, itemName: true, stockItemId: true } },
      },
      take: 500,
      orderBy: { id: "desc" },
    });

    const totalSpend = items.reduce(
      (acc: Prisma.Decimal, it: any) => acc.add(this.toDecimal(it.totalPrice)),
      new Prisma.Decimal(0),
    );

    return { totalSpend, itemsCount: items.length, items };
  }

  async consumablesUsage(query: any) {
    const { start, end } = this.parseDateRange(query);

    const where: any = { movementType: "STOCK_OUT" };
    if (start || end) {
      where.createdAt = {};
      if (start) where.createdAt.gte = start;
      if (end) where.createdAt.lte = end;
    }

    const movements = await this.prisma.stockMovement.findMany({
      where,
      include: {
        item: {
          select: {
            id: true,
            itemCode: true,
            name: true,
            category: true,
            unit: true,
          },
        },
        warehouse: { select: { id: true, code: true, name: true } },
      },
      take: 1000,
      orderBy: { createdAt: "desc" },
    });

    const consumables = movements.filter(
      (m) =>
        m.item?.category === "CONSUMABLES" ||
        m.item?.category === "FUEL" ||
        m.item?.category === "CHEMICALS",
    );

    const byItem: Record<string, number> = {};
    for (const m of consumables) {
      byItem[m.itemId] = (byItem[m.itemId] ?? 0) + m.quantity;
    }

    return {
      movementsCount: consumables.length,
      usageByItem: Object.entries(byItem).map(([itemId, quantity]) => ({
        itemId,
        quantity,
      })),
      movements: consumables.slice(0, 200),
    };
  }

  async siteWiseSpend(query: any) {
    const report = await this.spendAnalysis(query);
    return report.spendBySite;
  }

  async safetyEquipment(query: any) {
    const { start, end } = this.parseDateRange(query);

    const where: any = {
      poItem: {
        is: {
          stockItem: {
            is: {
              category: "SAFETY_GEAR",
            },
          },
        },
      },
      invoice: {
        is: {
          purchaseOrder: {
            is: {
              status: { not: "CANCELLED" },
            },
          },
        },
      },
    };

    if (start || end) {
      where.invoice.is.invoiceDate = {};
      if (start) where.invoice.is.invoiceDate.gte = start;
      if (end) where.invoice.is.invoiceDate.lte = end;
    }

    const items = await (this.prisma as any).vendorInvoiceItem.findMany({
      where,
      include: {
        invoice: {
          select: { id: true, invoiceNumber: true, invoiceDate: true },
        },
        poItem: { select: { id: true, itemName: true, stockItemId: true } },
      },
      take: 500,
      orderBy: { id: "desc" },
    });

    const totalSpend = items.reduce(
      (acc: Prisma.Decimal, it: any) => acc.add(this.toDecimal(it.totalPrice)),
      new Prisma.Decimal(0),
    );

    return { totalSpend, itemsCount: items.length, items };
  }
}

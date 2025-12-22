import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class ProcurementDashboardService {
  constructor(private prisma: PrismaService) {}

  private toDecimal(v: any): Prisma.Decimal {
    if (v instanceof Prisma.Decimal) return v;
    const n = Number(v);
    return new Prisma.Decimal(Number.isFinite(n) ? n : 0);
  }

  async getDashboard() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const completedPOsForDeliveryRatePromise = (this.prisma as any).purchaseOrder.findMany(
      {
        where: {
          status: { in: ["RECEIVED", "COMPLETED"] },
          actualDelivery: { not: null },
          expectedDelivery: { not: null },
        },
        select: { actualDelivery: true, expectedDelivery: true },
        take: 1000,
      },
    );

    const [
      mtdInvoices,
      ytdInvoices,
      openRequisitions,
      pendingApprovals,
      openPOs,
      pendingDeliveries,
      unpaidInvoices,
      overduePayments,
      stockItemsForLowStock,
      overdueDeliveries,
      matchedInvoicesCount,
      totalInvoicesCount,
      completedPOsForDeliveryRate,
    ] = await Promise.all([
      (this.prisma as any).vendorInvoice.findMany({
        where: { invoiceDate: { gte: startOfMonth } },
        select: { totalAmount: true },
      }),
      (this.prisma as any).vendorInvoice.findMany({
        where: { invoiceDate: { gte: startOfYear } },
        select: { totalAmount: true },
      }),
      this.prisma.requisition.count({
        where: {
          status: { notIn: ["COMPLETED", "CANCELLED", "REJECTED"] },
        },
      }),
      this.prisma.requisition.count({ where: { status: "PENDING_APPROVAL" } }),
      (this.prisma as any).purchaseOrder.count({
        where: {
          status: {
            in: [
              "DRAFT",
              "PENDING_APPROVAL",
              "APPROVED",
              "SENT",
              "ACKNOWLEDGED",
              "PARTIALLY_RECEIVED",
            ],
          },
        },
      }),
      (this.prisma as any).purchaseOrder.count({
        where: {
          status: { in: ["SENT", "ACKNOWLEDGED", "PARTIALLY_RECEIVED"] },
        },
      }),
      (this.prisma as any).vendorInvoice.count({
        where: { paymentStatus: { in: ["UNPAID", "PARTIALLY_PAID", "OVERDUE"] } },
      }),
      (this.prisma as any).vendorInvoice.count({ where: { paymentStatus: "OVERDUE" } }),
      this.prisma.stockItem.findMany({
        select: {
          id: true,
          itemCode: true,
          name: true,
          currentQuantity: true,
          reservedQuantity: true,
          reorderLevel: true,
          warehouse: { select: { id: true, code: true, name: true } },
        },
        take: 200,
        orderBy: { currentQuantity: "asc" },
      }),
      (this.prisma as any).purchaseOrder.findMany({
        where: {
          expectedDelivery: { lt: now },
          status: { notIn: ["RECEIVED", "COMPLETED", "CANCELLED"] },
        },
        take: 10,
        orderBy: { expectedDelivery: "asc" },
        include: {
          vendor: { select: { id: true, vendorCode: true, companyName: true } },
        },
      }),
      (this.prisma as any).vendorInvoice.count({ where: { matchStatus: "MATCHED" } }),
      (this.prisma as any).vendorInvoice.count(),
      completedPOsForDeliveryRatePromise,
    ]);

    const totalSpendMTD = mtdInvoices.reduce(
      (acc: Prisma.Decimal, i: any) => acc.add(this.toDecimal(i.totalAmount)),
      new Prisma.Decimal(0),
    );
    const totalSpendYTD = ytdInvoices.reduce(
      (acc: Prisma.Decimal, i: any) => acc.add(this.toDecimal(i.totalAmount)),
      new Prisma.Decimal(0),
    );

    const invoiceMatchRate = totalInvoicesCount > 0 ? (matchedInvoicesCount / totalInvoicesCount) * 100 : 0;

    const completedPOCount = completedPOsForDeliveryRate.length;
    const onTimePOCount = completedPOsForDeliveryRate.filter((p: any) => {
      const actual = p.actualDelivery ? new Date(p.actualDelivery).getTime() : null;
      const expected = p.expectedDelivery ? new Date(p.expectedDelivery).getTime() : null;
      if (!actual || !expected) return false;
      return actual <= expected;
    }).length;

    const onTimeDeliveryRate = completedPOCount > 0 ? (onTimePOCount / completedPOCount) * 100 : 0;

    const lowStockItems = stockItemsForLowStock
      .filter((s: any) => s.currentQuantity <= s.reorderLevel)
      .slice(0, 10);

    const expiringContracts: any[] = [];

    return {
      totalSpendMTD,
      totalSpendYTD,
      openRequisitions,
      pendingApprovals,
      openPOs,
      pendingDeliveries,
      unpaidInvoices,
      overduePayments,
      spendByMonth: [],
      spendByCategory: [],
      spendBySite: [],
      topVendors: [],
      vendorPerformance: [],
      avgCycleTime: 0,
      onTimeDeliveryRate,
      invoiceMatchRate,
      expiringContracts,
      lowStockItems,
      overdueDeliveries,
    };
  }

  async getSpendAnalysis(filters: any) {
    const start = filters.startDate ? new Date(filters.startDate) : undefined;
    const end = filters.endDate ? new Date(filters.endDate) : undefined;

    const where: any = {};
    if (start || end) {
      where.invoiceDate = {};
      if (start) where.invoiceDate.gte = start;
      if (end) where.invoiceDate.lte = end;
    }

    const invoices = await (this.prisma as any).vendorInvoice.findMany({
      where,
      include: { vendor: { select: { id: true, vendorCode: true, companyName: true } }, purchaseOrder: true },
      take: 1000,
    });

    const totalSpend = invoices.reduce(
      (acc: Prisma.Decimal, inv: any) => acc.add(this.toDecimal(inv.totalAmount)),
      new Prisma.Decimal(0),
    );

    const byVendor: Record<string, Prisma.Decimal> = {};
    for (const inv of invoices) {
      const key = inv.vendorId;
      byVendor[key] = (byVendor[key] ?? new Prisma.Decimal(0)).add(this.toDecimal(inv.totalAmount));
    }

    return {
      totalSpend,
      invoiceCount: invoices.length,
      byVendor: Object.entries(byVendor).map(([vendorId, amount]) => ({ vendorId, amount })),
    };
  }

  async getVendorPerformance() {
    const vendors = await this.prisma.vendor.findMany({
      select: {
        id: true,
        vendorCode: true,
        companyName: true,
        totalOrders: true,
        totalSpend: true,
        onTimeDelivery: true,
        qualityScore: true,
        rating: true,
      },
      orderBy: { totalSpend: "desc" },
      take: 50,
    });

    return vendors.map((v) => ({
      vendorId: v.id,
      vendorCode: v.vendorCode,
      companyName: v.companyName,
      totalOrders: v.totalOrders,
      totalSpend: v.totalSpend,
      onTimeDelivery: v.onTimeDelivery,
      qualityScore: v.qualityScore,
      rating: v.rating,
    }));
  }
}

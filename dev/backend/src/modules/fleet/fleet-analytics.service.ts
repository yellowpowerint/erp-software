import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import {
  CompareCostsQueryDto,
  CreateFleetCostDto,
  DateRangeQueryDto,
  FleetCostsQueryDto,
} from "./dto";

function toDecimal(value: string): Prisma.Decimal {
  const n = Number(value);
  if (!Number.isFinite(n)) throw new BadRequestException("Invalid number");
  return new Prisma.Decimal(n);
}

function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function monthStart(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function yearStart(d: Date): Date {
  return new Date(d.getFullYear(), 0, 1);
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function decimal0(): Prisma.Decimal {
  return new Prisma.Decimal(0);
}

function decimalFromAny(v: any): Prisma.Decimal {
  return new Prisma.Decimal(v ?? 0);
}

@Injectable()
export class FleetAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  private canManageFleet(role: string): boolean {
    return (
      [
        "SUPER_ADMIN",
        "CEO",
        "CFO",
        "OPERATIONS_MANAGER",
        "WAREHOUSE_MANAGER",
      ] as string[]
    ).includes(String(role));
  }

  private assertCanManageFleet(role: string) {
    if (!this.canManageFleet(role)) {
      throw new ForbiddenException("Not allowed");
    }
  }

  private parseDateRange(query: DateRangeQueryDto): { from: Date; to: Date } {
    const now = new Date();
    const days = query.days ?? 30;

    if (query.from && query.to) {
      const from = new Date(query.from);
      const to = new Date(query.to);
      if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
        throw new BadRequestException("Invalid date range");
      }
      if (from.getTime() > to.getTime()) {
        throw new BadRequestException("from must be <= to");
      }
      return { from, to };
    }

    if (query.from && !query.to) {
      const from = new Date(query.from);
      if (Number.isNaN(from.getTime()))
        throw new BadRequestException("Invalid from");
      const to = now;
      if (from.getTime() > to.getTime()) {
        throw new BadRequestException("from must be <= to");
      }
      return { from, to };
    }

    if (!query.from && query.to) {
      const to = new Date(query.to);
      if (Number.isNaN(to.getTime()))
        throw new BadRequestException("Invalid to");
      const from = addDays(to, -Math.max(1, days));
      return { from, to };
    }

    const to = now;
    const from = addDays(now, -Math.max(1, days));
    return { from, to };
  }

  private async assertAssetExists(assetId: string) {
    const asset = await (this.prisma as any).fleetAsset.findUnique({
      where: { id: assetId },
      select: {
        id: true,
        assetCode: true,
        name: true,
        purchasePrice: true,
        currentValue: true,
      },
    });
    if (!asset) throw new NotFoundException("Fleet asset not found");
    return asset;
  }

  private groupMonthly(
    rows: Array<{ costDate: Date; amount: any }>,
    monthsBack = 12,
  ) {
    const now = new Date();
    const start = new Date(
      now.getFullYear(),
      now.getMonth() - (monthsBack - 1),
      1,
    );

    const buckets: Record<string, Prisma.Decimal> = {};
    for (let i = 0; i < monthsBack; i++) {
      const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      buckets[key] = decimal0();
    }

    for (const r of rows) {
      const d = new Date(r.costDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (buckets[key] !== undefined) {
        buckets[key] = buckets[key].add(decimalFromAny(r.amount));
      }
    }

    return Object.entries(buckets).map(([month, total]) => ({
      month,
      total: total.toString(),
    }));
  }

  async createCost(
    dto: CreateFleetCostDto,
    user: { userId: string; role: string },
  ) {
    this.assertCanManageFleet(user.role);
    await this.assertAssetExists(dto.assetId);

    const costDate = new Date(dto.costDate);
    if (Number.isNaN(costDate.getTime()))
      throw new BadRequestException("Invalid costDate");

    return (this.prisma as any).fleetCost.create({
      data: {
        assetId: dto.assetId,
        costDate,
        category: dto.category as any,
        description: dto.description,
        amount: toDecimal(dto.amount),
        currency: dto.currency?.trim() || "GHS",
        referenceType: dto.referenceType?.trim() || null,
        referenceId: dto.referenceId?.trim() || null,
        approvedById: dto.approvedById?.trim() || null,
        invoiceNumber: dto.invoiceNumber?.trim() || null,
        receiptUrl: dto.receiptUrl?.trim() || null,
        createdById: user.userId,
      },
      include: {
        asset: { select: { id: true, assetCode: true, name: true } },
        createdBy: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
        approvedBy: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
      },
    });
  }

  async listCosts(query: FleetCostsQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 25;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (query.assetId) where.assetId = query.assetId;
    if (query.category) where.category = query.category as any;

    if (query.from || query.to) {
      const range = this.parseDateRange({
        from: query.from,
        to: query.to,
        days: 30,
      });
      where.costDate = { gte: range.from, lte: range.to };
    }

    const [total, data] = await Promise.all([
      (this.prisma as any).fleetCost.count({ where }),
      (this.prisma as any).fleetCost.findMany({
        where,
        orderBy: { costDate: "desc" },
        skip,
        take: pageSize,
        include: {
          asset: { select: { id: true, assetCode: true, name: true } },
          createdBy: {
            select: { id: true, firstName: true, lastName: true, role: true },
          },
          approvedBy: {
            select: { id: true, firstName: true, lastName: true, role: true },
          },
        },
      }),
    ]);

    return {
      data,
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async getAssetCosts(assetId: string, query: DateRangeQueryDto) {
    await this.assertAssetExists(assetId);
    const range = this.parseDateRange(query);

    return (this.prisma as any).fleetCost.findMany({
      where: { assetId, costDate: { gte: range.from, lte: range.to } },
      orderBy: { costDate: "desc" },
      take: 1000,
    });
  }

  async getCostBreakdown(query: DateRangeQueryDto) {
    const range = this.parseDateRange(query);

    const rows = await (this.prisma as any).fleetCost.findMany({
      where: { costDate: { gte: range.from, lte: range.to } },
      select: { category: true, amount: true, costDate: true },
      take: 50000,
    });

    const byCategory: Record<string, Prisma.Decimal> = {};
    let total = decimal0();

    for (const r of rows) {
      const cat = String(r.category);
      const amt = decimalFromAny(r.amount);
      byCategory[cat] = (byCategory[cat] || decimal0()).add(amt);
      total = total.add(amt);
    }

    const costByCategory = Object.entries(byCategory)
      .map(([category, amount]) => ({ category, amount: amount.toString() }))
      .sort((a, b) => Number(b.amount) - Number(a.amount));

    return {
      from: range.from,
      to: range.to,
      total: total.toString(),
      costByCategory,
      costTrend: this.groupMonthly(
        rows.map((r: any) => ({ costDate: r.costDate, amount: r.amount })),
        12,
      ),
    };
  }

  async compareCosts(query: CompareCostsQueryDto) {
    const assetIds = String(query.assetIds || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (assetIds.length < 2) {
      throw new BadRequestException("assetIds must contain at least 2 IDs");
    }

    const range = this.parseDateRange({
      from: query.from,
      to: query.to,
      days: 90,
    });

    const costs = await (this.prisma as any).fleetCost.findMany({
      where: {
        assetId: { in: assetIds },
        costDate: { gte: range.from, lte: range.to },
      },
      select: { assetId: true, category: true, amount: true },
      take: 100000,
    });

    const totals: Record<string, Prisma.Decimal> = {};
    const byAsset: Record<string, Record<string, Prisma.Decimal>> = {};
    for (const id of assetIds) {
      totals[id] = decimal0();
      byAsset[id] = {};
    }

    for (const c of costs) {
      const assetId = String(c.assetId);
      const cat = String(c.category);
      const amt = decimalFromAny(c.amount);
      totals[assetId] = (totals[assetId] || decimal0()).add(amt);
      byAsset[assetId][cat] = (byAsset[assetId][cat] || decimal0()).add(amt);
    }

    const assets = await (this.prisma as any).fleetAsset.findMany({
      where: { id: { in: assetIds } },
      select: { id: true, assetCode: true, name: true },
    });
    const byId: Record<string, any> = {};
    for (const a of assets) byId[a.id] = a;

    return {
      from: range.from,
      to: range.to,
      assets: assetIds.map((id) => ({
        assetId: id,
        assetCode: byId[id]?.assetCode || id,
        name: byId[id]?.name || "",
        total: (totals[id] || decimal0()).toString(),
        byCategory: Object.entries(byAsset[id] || {})
          .map(([category, amount]) => ({
            category,
            amount: amount.toString(),
          }))
          .sort((a, b) => Number(b.amount) - Number(a.amount)),
      })),
    };
  }

  async getTco(assetId: string) {
    const asset = await this.assertAssetExists(assetId);

    const [fuelSum, maintSum, repairSum, otherSum] = await Promise.all([
      (this.prisma as any).fuelRecord.aggregate({
        where: { assetId },
        _sum: { totalCost: true },
      }),
      (this.prisma as any).maintenanceRecord.aggregate({
        where: { assetId, status: "COMPLETED" },
        _sum: { totalCost: true },
      }),
      (this.prisma as any).breakdownLog.aggregate({
        where: { assetId },
        _sum: { repairCost: true },
      }),
      (this.prisma as any).fleetCost.aggregate({
        where: { assetId },
        _sum: { amount: true },
      }),
    ]);

    const fuel = decimalFromAny(fuelSum?._sum?.totalCost);
    const maintenance = decimalFromAny(maintSum?._sum?.totalCost);
    const repairs = decimalFromAny(repairSum?._sum?.repairCost);
    const other = decimalFromAny(otherSum?._sum?.amount);

    const purchasePrice = decimalFromAny(asset.purchasePrice);
    const currentValue = asset.currentValue
      ? decimalFromAny(asset.currentValue)
      : purchasePrice;
    const depreciation = purchasePrice.sub(currentValue);
    const total = fuel
      .add(maintenance)
      .add(repairs)
      .add(other)
      .add(depreciation);

    return {
      assetId: asset.id,
      assetCode: asset.assetCode,
      name: asset.name,
      totals: {
        fuel: fuel.toString(),
        maintenance: maintenance.toString(),
        repairs: repairs.toString(),
        other: other.toString(),
        depreciation: depreciation.toString(),
      },
      total: total.toString(),
    };
  }

  async getDashboard() {
    const now = new Date();
    const mtdFrom = monthStart(now);
    const ytdFrom = yearStart(now);

    const [
      costsMtdAgg,
      costsYtdAgg,
      costsRowsYear,
      costsRowsMtd,
      lowFuelTanks,
      overdueMaintenance,
      upcomingMaintenance,
      activeBreakdowns,
      fuelAgg,
    ] = await Promise.all([
      (this.prisma as any).fleetCost.aggregate({
        where: { costDate: { gte: mtdFrom, lte: now } },
        _sum: { amount: true },
      }),
      (this.prisma as any).fleetCost.aggregate({
        where: { costDate: { gte: ytdFrom, lte: now } },
        _sum: { amount: true },
      }),
      (this.prisma as any).fleetCost.findMany({
        where: { costDate: { gte: addDays(now, -365), lte: now } },
        select: { costDate: true, amount: true },
        take: 100000,
      }),
      (this.prisma as any).fleetCost.findMany({
        where: { costDate: { gte: mtdFrom, lte: now } },
        select: { category: true, amount: true },
        take: 100000,
      }),
      (this.prisma as any).fuelTank
        .findMany({
          where: { status: "ACTIVE" },
          select: { currentLevel: true, reorderLevel: true },
          take: 20000,
        })
        .then(
          (tanks: any[]) =>
            tanks.filter((t) =>
              decimalFromAny(t.currentLevel).lessThanOrEqualTo(
                decimalFromAny(t.reorderLevel),
              ),
            ).length,
        ),
      (this.prisma as any).maintenanceSchedule.count({
        where: { isActive: true, nextDue: { lt: now } },
      }),
      (this.prisma as any).maintenanceSchedule.count({
        where: { isActive: true, nextDue: { gte: now, lte: addDays(now, 30) } },
      }),
      (this.prisma as any).breakdownLog.count({
        where: { status: { notIn: ["RESOLVED", "CLOSED"] } },
      }),
      (this.prisma as any).fuelRecord.aggregate({
        where: { transactionDate: { gte: mtdFrom, lte: now } },
        _sum: { quantity: true, totalCost: true },
      }),
    ]);

    const costByCategoryMap: Record<string, Prisma.Decimal> = {};
    for (const r of costsRowsMtd as any[]) {
      const cat = String(r.category);
      const amt = decimalFromAny(r.amount);
      costByCategoryMap[cat] = (costByCategoryMap[cat] || decimal0()).add(amt);
    }

    const costByCategory = Object.entries(costByCategoryMap)
      .map(([category, amount]) => ({ category, amount: amount.toString() }))
      .sort((a, b) => Number(b.amount) - Number(a.amount));

    return {
      totalCostMTD: decimalFromAny(costsMtdAgg?._sum?.amount).toString(),
      totalCostYTD: decimalFromAny(costsYtdAgg?._sum?.amount).toString(),
      costByCategory,
      costTrend: this.groupMonthly(
        (costsRowsYear as any[]).map((r) => ({
          costDate: r.costDate,
          amount: r.amount,
        })),
        12,
      ),
      lowFuelTanks,
      overdueMaintenance,
      upcomingMaintenance,
      activeBreakdowns,
      fuelCostMTD: decimalFromAny(fuelAgg?._sum?.totalCost).toString(),
      fuelQuantityMTD: decimalFromAny(fuelAgg?._sum?.quantity).toString(),
    };
  }

  async getUtilization(_query: DateRangeQueryDto) {
    const range = this.parseDateRange(_query);
    const periodHours =
      (range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60);

    const [assets, usage] = await Promise.all([
      (this.prisma as any).fleetAsset.findMany({
        select: { id: true, type: true },
      }),
      (this.prisma as any).usageLog.findMany({
        where: { date: { gte: range.from, lte: range.to } },
        select: { assetId: true, operatingHours: true, siteLocation: true },
        take: 200000,
      }),
    ]);

    const opByAsset: Record<string, Prisma.Decimal> = {};
    const opByType: Record<string, Prisma.Decimal> = {};
    const opBySite: Record<string, Prisma.Decimal> = {};

    for (const u of usage) {
      const h = decimalFromAny(u.operatingHours);
      const assetId = String(u.assetId);
      opByAsset[assetId] = (opByAsset[assetId] || decimal0()).add(h);
      const site = String(u.siteLocation || "Unknown");
      opBySite[site] = (opBySite[site] || decimal0()).add(h);
    }

    for (const a of assets) {
      const type = String(a.type);
      const h = opByAsset[String(a.id)] || decimal0();
      opByType[type] = (opByType[type] || decimal0()).add(h);
    }

    const assetCount = assets.length;
    const denom = Math.max(1, assetCount) * Math.max(1, periodHours);
    const totalHours = Object.values(opByAsset).reduce(
      (acc, v) => acc.add(v),
      decimal0(),
    );
    const overallUtilization = clamp01(Number(totalHours.toString()) / denom);

    const utilizationByType = Object.entries(opByType).map(([type, hours]) => {
      const typeCount = assets.filter(
        (a: any) => String(a.type) === type,
      ).length;
      const d = Math.max(1, typeCount) * Math.max(1, periodHours);
      const u = clamp01(Number(hours.toString()) / d);
      return { type, utilization: String(u), hours: hours.toString() };
    });

    const utilizationBySite = Object.entries(opBySite).map(([site, hours]) => {
      const d = Math.max(1, assetCount) * Math.max(1, periodHours);
      const u = clamp01(Number(hours.toString()) / d);
      return { site, utilization: String(u), hours: hours.toString() };
    });

    return {
      from: range.from,
      to: range.to,
      overallUtilization: String(overallUtilization),
      utilizationByType,
      utilizationBySite,
    };
  }

  async getPerformance(_query: DateRangeQueryDto) {
    const range = this.parseDateRange(_query);
    const periodHours =
      (range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60);

    const [assets, breakdowns] = await Promise.all([
      (this.prisma as any).fleetAsset.findMany({
        select: { id: true, assetCode: true, name: true },
      }),
      (this.prisma as any).breakdownLog.findMany({
        where: { breakdownDate: { gte: range.from, lte: range.to } },
        select: { assetId: true, actualDowntime: true },
        take: 200000,
      }),
    ]);

    const byAssetFailures: Record<string, number> = {};
    const byAssetDowntime: Record<string, Prisma.Decimal> = {};

    for (const b of breakdowns) {
      const id = String(b.assetId);
      byAssetFailures[id] = (byAssetFailures[id] || 0) + 1;
      const dt = decimalFromAny(b.actualDowntime);
      byAssetDowntime[id] = (byAssetDowntime[id] || decimal0()).add(dt);
    }

    return {
      from: range.from,
      to: range.to,
      assets: assets.map((a: any) => {
        const failures = byAssetFailures[a.id] || 0;
        const downtime = byAssetDowntime[a.id] || decimal0();
        const mtbf = failures > 0 ? periodHours / failures : periodHours;
        const mttr = failures > 0 ? Number(downtime.toString()) / failures : 0;
        const availability = clamp01(
          periodHours > 0 ? 1 - Number(downtime.toString()) / periodHours : 1,
        );
        return {
          assetId: a.id,
          assetCode: a.assetCode,
          name: a.name,
          failures,
          mtbfHours: String(mtbf),
          mttrHours: String(mttr),
          availabilityRate: String(availability),
        };
      }),
    };
  }
}

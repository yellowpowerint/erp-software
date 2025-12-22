import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import {
  CreateFuelRecordDto,
  FuelAnomaliesQueryDto,
  FuelConsumptionQueryDto,
  FuelEfficiencyQueryDto,
  FuelRecordsQueryDto,
  FuelReportGroupBy,
  FuelTransactionType,
} from "./dto/fuel.dto";
import {
  CreateFuelTankDto,
  FuelTankTransactionType,
  TankDispenseDto,
  TankRefillDto,
  TankTransactionsQueryDto,
  UpdateFuelTankDto,
} from "./dto/fuel-tank.dto";

function toDecimalOrNull(value?: string): Prisma.Decimal | null {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) throw new BadRequestException("Invalid number");
  return new Prisma.Decimal(n);
}

function toDecimal(value: string): Prisma.Decimal {
  const n = Number(value);
  if (!Number.isFinite(n)) throw new BadRequestException("Invalid number");
  return new Prisma.Decimal(n);
}

@Injectable()
export class FleetFuelService {
  constructor(private readonly prisma: PrismaService) {}

  private canManageFuel(role: string): boolean {
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

  private assertCanManageFuel(role: string) {
    if (!this.canManageFuel(role)) {
      throw new ForbiddenException("Not allowed");
    }
  }

  private async getAssetOrThrow(assetId: string) {
    const asset = await (this.prisma as any).fleetAsset.findUnique({
      where: { id: assetId },
      select: {
        id: true,
        fuelType: true,
        currentOdometer: true,
        currentHours: true,
        status: true,
      },
    });
    if (!asset) throw new NotFoundException("Fleet asset not found");
    return asset;
  }

  private async computeDerivedFields(params: {
    prismaClient?: any;
    assetId: string;
    transactionDate: Date;
    quantity: Prisma.Decimal;
    odometerReading: Prisma.Decimal | null;
    hoursReading: Prisma.Decimal | null;
  }) {
    const client = params.prismaClient ?? (this.prisma as any);
    const prev = await client.fuelRecord.findFirst({
      where: {
        assetId: params.assetId,
        transactionDate: { lt: params.transactionDate },
      },
      orderBy: { transactionDate: "desc" },
      select: {
        id: true,
        odometerReading: true,
        hoursReading: true,
        transactionDate: true,
      },
    });

    let distanceSinceLast: Prisma.Decimal | null = null;
    let hoursSinceLast: Prisma.Decimal | null = null;
    let fuelEfficiency: Prisma.Decimal | null = null;

    if (prev && params.odometerReading && prev.odometerReading) {
      const d = new Prisma.Decimal(params.odometerReading).sub(
        new Prisma.Decimal(prev.odometerReading),
      );
      if (d.greaterThanOrEqualTo(0)) {
        distanceSinceLast = d;
      }
    }

    if (prev && params.hoursReading && prev.hoursReading) {
      const h = new Prisma.Decimal(params.hoursReading).sub(
        new Prisma.Decimal(prev.hoursReading),
      );
      if (h.greaterThanOrEqualTo(0)) {
        hoursSinceLast = h;
      }
    }

    if (distanceSinceLast && distanceSinceLast.greaterThan(0)) {
      fuelEfficiency = params.quantity
        .div(distanceSinceLast)
        .mul(new Prisma.Decimal(100));
    } else if (hoursSinceLast && hoursSinceLast.greaterThan(0)) {
      fuelEfficiency = params.quantity.div(hoursSinceLast);
    }

    return {
      prevId: prev?.id || null,
      distanceSinceLast,
      hoursSinceLast,
      fuelEfficiency,
    };
  }

  async recordFuelTransaction(
    dto: CreateFuelRecordDto,
    user: { userId: string; role: string },
  ) {
    const asset = await this.getAssetOrThrow(dto.assetId);

    if (String(asset.fuelType) === "NONE") {
      throw new BadRequestException(
        "Asset fuelType is NONE; cannot record fuel",
      );
    }
    if (String(dto.fuelType) !== String(asset.fuelType)) {
      throw new BadRequestException(
        `fuelType mismatch. Asset fuelType is ${asset.fuelType}`,
      );
    }

    const quantity = toDecimal(dto.quantity);
    const unitPrice = toDecimal(dto.unitPrice);
    const totalCost = quantity.mul(unitPrice);

    const transactionDate = new Date(dto.transactionDate);

    const odometerReading = toDecimalOrNull(dto.odometerReading);
    const hoursReading = toDecimalOrNull(dto.hoursReading);

    if (odometerReading) {
      const current = new Prisma.Decimal(asset.currentOdometer || 0);
      if (odometerReading.lessThan(current)) {
        throw new BadRequestException(
          "odometerReading cannot be less than asset.currentOdometer",
        );
      }
    }

    if (hoursReading) {
      const current = new Prisma.Decimal(asset.currentHours || 0);
      if (hoursReading.lessThan(current)) {
        throw new BadRequestException(
          "hoursReading cannot be less than asset.currentHours",
        );
      }
    }

    const derived = await this.computeDerivedFields({
      assetId: dto.assetId,
      transactionDate,
      quantity,
      odometerReading,
      hoursReading,
    });

    const created = await (this.prisma as any).fuelRecord.create({
      data: {
        assetId: dto.assetId,
        transactionDate,
        transactionType: dto.transactionType as any,
        fuelType: dto.fuelType as any,
        quantity,
        unitPrice,
        totalCost,
        odometerReading,
        hoursReading,
        distanceSinceLast: derived.distanceSinceLast,
        hoursSinceLast: derived.hoursSinceLast,
        fuelEfficiency: derived.fuelEfficiency,
        fuelStation: dto.fuelStation ?? null,
        receiptNumber: dto.receiptNumber ?? null,
        siteLocation: dto.siteLocation,
        filledById: user.userId,
        approvedById: dto.approvedById ?? null,
        notes: dto.notes ?? null,
        receiptImage: dto.receiptImage ?? null,
      },
      include: {
        asset: {
          select: {
            id: true,
            assetCode: true,
            name: true,
            currentLocation: true,
          },
        },
        filledBy: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
        approvedBy: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
      },
    });

    const updates: any = {};
    if (odometerReading) updates.currentOdometer = odometerReading;
    if (hoursReading) updates.currentHours = hoursReading;
    if (Object.keys(updates).length > 0) {
      updates.lastOdometerUpdate = new Date();
      await (this.prisma as any).fleetAsset.update({
        where: { id: dto.assetId },
        data: updates,
      });
    }

    return created;
  }

  async listFuelRecords(query: FuelRecordsQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 25;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (query.assetId) where.assetId = query.assetId;
    if (query.siteLocation)
      where.siteLocation = {
        contains: query.siteLocation,
        mode: "insensitive",
      };
    if (query.fuelType) where.fuelType = query.fuelType as any;
    if (query.transactionType)
      where.transactionType = query.transactionType as any;

    if (query.from || query.to) {
      where.transactionDate = {};
      if (query.from) where.transactionDate.gte = new Date(query.from);
      if (query.to) where.transactionDate.lte = new Date(query.to);
    }

    const [total, data] = await Promise.all([
      (this.prisma as any).fuelRecord.count({ where }),
      (this.prisma as any).fuelRecord.findMany({
        where,
        orderBy: { transactionDate: "desc" },
        skip,
        take: pageSize,
        include: {
          asset: { select: { id: true, assetCode: true, name: true } },
          filledBy: {
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

  async getFuelHistory(assetId: string) {
    await this.getAssetOrThrow(assetId);
    return (this.prisma as any).fuelRecord.findMany({
      where: { assetId },
      orderBy: { transactionDate: "desc" },
      take: 200,
    });
  }

  async getFuelEfficiency(query: FuelEfficiencyQueryDto) {
    const where: any = {};

    if (query.assetId) where.assetId = query.assetId;

    if (query.from || query.to) {
      where.transactionDate = {};
      if (query.from) where.transactionDate.gte = new Date(query.from);
      if (query.to) where.transactionDate.lte = new Date(query.to);
    } else {
      const days = query.days ?? 30;
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      where.transactionDate = { gte: since };
    }

    const rows = await (this.prisma as any).fuelRecord.findMany({
      where,
      select: {
        id: true,
        assetId: true,
        transactionDate: true,
        quantity: true,
        totalCost: true,
        distanceSinceLast: true,
        hoursSinceLast: true,
        fuelEfficiency: true,
      },
      orderBy: { transactionDate: "desc" },
      take: 5000,
    });

    let totalLiters = new Prisma.Decimal(0);
    let totalCost = new Prisma.Decimal(0);

    let sumPer100 = new Prisma.Decimal(0);
    let countPer100 = 0;

    let sumPerHour = new Prisma.Decimal(0);
    let countPerHour = 0;

    for (const r of rows) {
      totalLiters = totalLiters.add(
        r.quantity ? new Prisma.Decimal(r.quantity) : new Prisma.Decimal(0),
      );
      totalCost = totalCost.add(
        r.totalCost ? new Prisma.Decimal(r.totalCost) : new Prisma.Decimal(0),
      );

      if (r.fuelEfficiency) {
        const eff = new Prisma.Decimal(r.fuelEfficiency);
        if (
          r.distanceSinceLast &&
          new Prisma.Decimal(r.distanceSinceLast).greaterThan(0)
        ) {
          sumPer100 = sumPer100.add(eff);
          countPer100 += 1;
        } else if (
          r.hoursSinceLast &&
          new Prisma.Decimal(r.hoursSinceLast).greaterThan(0)
        ) {
          sumPerHour = sumPerHour.add(eff);
          countPerHour += 1;
        }
      }
    }

    return {
      records: rows.length,
      totals: {
        liters: totalLiters.toString(),
        cost: totalCost.toString(),
      },
      averages: {
        lPer100km: countPer100
          ? sumPer100.div(new Prisma.Decimal(countPer100)).toString()
          : null,
        lPerHour: countPerHour
          ? sumPerHour.div(new Prisma.Decimal(countPerHour)).toString()
          : null,
      },
    };
  }

  async getFuelConsumptionReport(filters: FuelConsumptionQueryDto) {
    const where: any = {};

    if (filters.assetId) where.assetId = filters.assetId;
    if (filters.assetIds) {
      const ids = String(filters.assetIds)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (ids.length > 0) where.assetId = { in: ids };
    }
    if (filters.siteLocation)
      where.siteLocation = {
        contains: filters.siteLocation,
        mode: "insensitive",
      };

    if (filters.from || filters.to) {
      where.transactionDate = {};
      if (filters.from) where.transactionDate.gte = new Date(filters.from);
      if (filters.to) where.transactionDate.lte = new Date(filters.to);
    }

    const rows = await (this.prisma as any).fuelRecord.findMany({
      where,
      select: {
        assetId: true,
        siteLocation: true,
        fuelType: true,
        quantity: true,
        totalCost: true,
      },
      take: 10000,
    });

    let totalLiters = new Prisma.Decimal(0);
    let totalCost = new Prisma.Decimal(0);

    const groupBy = filters.groupBy ?? FuelReportGroupBy.ASSET;
    const grouped: Record<
      string,
      { liters: Prisma.Decimal; cost: Prisma.Decimal; count: number }
    > = {};

    for (const r of rows) {
      totalLiters = totalLiters.add(
        r.quantity ? new Prisma.Decimal(r.quantity) : new Prisma.Decimal(0),
      );
      totalCost = totalCost.add(
        r.totalCost ? new Prisma.Decimal(r.totalCost) : new Prisma.Decimal(0),
      );

      let key = "";
      if (groupBy === FuelReportGroupBy.SITE)
        key = String(r.siteLocation || "Unknown");
      else if (groupBy === FuelReportGroupBy.FUEL_TYPE)
        key = String(r.fuelType || "Unknown");
      else key = String(r.assetId || "Unknown");

      if (!grouped[key]) {
        grouped[key] = {
          liters: new Prisma.Decimal(0),
          cost: new Prisma.Decimal(0),
          count: 0,
        };
      }

      grouped[key].liters = grouped[key].liters.add(
        r.quantity ? new Prisma.Decimal(r.quantity) : new Prisma.Decimal(0),
      );
      grouped[key].cost = grouped[key].cost.add(
        r.totalCost ? new Prisma.Decimal(r.totalCost) : new Prisma.Decimal(0),
      );
      grouped[key].count += 1;
    }

    const groups = Object.entries(grouped).map(([key, v]) => ({
      key,
      count: v.count,
      liters: v.liters.toString(),
      cost: v.cost.toString(),
    }));

    return {
      total: {
        liters: totalLiters.toString(),
        cost: totalCost.toString(),
        records: rows.length,
      },
      groupBy,
      groups,
    };
  }

  async detectAnomalies(query: FuelAnomaliesQueryDto) {
    const days = query.days ?? 60;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const where: any = { transactionDate: { gte: since } };
    if (query.assetId) where.assetId = query.assetId;

    const rows = await (this.prisma as any).fuelRecord.findMany({
      where,
      select: {
        id: true,
        assetId: true,
        transactionDate: true,
        fuelEfficiency: true,
        distanceSinceLast: true,
        hoursSinceLast: true,
        quantity: true,
      },
      orderBy: { transactionDate: "desc" },
      take: 5000,
    });

    const byAsset: Record<string, Prisma.Decimal[]> = {};
    for (const r of rows) {
      if (!r.fuelEfficiency) continue;
      const eff = new Prisma.Decimal(r.fuelEfficiency);
      const a = String(r.assetId);
      if (!byAsset[a]) byAsset[a] = [];
      byAsset[a].push(eff);
    }

    const avgByAsset: Record<string, Prisma.Decimal> = {};
    for (const [assetId, list] of Object.entries(byAsset)) {
      if (!list.length) continue;
      const sum = list.reduce((acc, x) => acc.add(x), new Prisma.Decimal(0));
      avgByAsset[assetId] = sum.div(new Prisma.Decimal(list.length));
    }

    const anomalies: any[] = [];
    for (const r of rows) {
      if (!r.fuelEfficiency) continue;
      const avg = avgByAsset[String(r.assetId)];
      if (!avg) continue;
      const eff = new Prisma.Decimal(r.fuelEfficiency);

      const high = avg.mul(new Prisma.Decimal(1.5));
      const low = avg.mul(new Prisma.Decimal(0.5));

      if (eff.greaterThan(high) || eff.lessThan(low)) {
        anomalies.push({
          id: r.id,
          assetId: r.assetId,
          transactionDate: r.transactionDate,
          fuelEfficiency: eff.toString(),
          avgFuelEfficiency: avg.toString(),
          severity: eff.greaterThan(high)
            ? "HIGH_CONSUMPTION"
            : "LOW_CONSUMPTION",
          quantity: r.quantity
            ? new Prisma.Decimal(r.quantity).toString()
            : null,
          distanceSinceLast: r.distanceSinceLast
            ? new Prisma.Decimal(r.distanceSinceLast).toString()
            : null,
          hoursSinceLast: r.hoursSinceLast
            ? new Prisma.Decimal(r.hoursSinceLast).toString()
            : null,
        });
      }
    }

    return { days, records: rows.length, anomalies };
  }

  // Tanks

  async getTankLevels() {
    return (this.prisma as any).fuelTank.findMany({
      orderBy: [{ location: "asc" }, { name: "asc" }],
    });
  }

  async getLowTankAlerts() {
    const tanks = await (this.prisma as any).fuelTank.findMany({
      where: {
        status: "ACTIVE",
      },
      orderBy: [{ location: "asc" }, { name: "asc" }],
      take: 500,
    });

    const low = tanks.filter((t: any) => {
      const current = new Prisma.Decimal(t.currentLevel);
      const reorder = new Prisma.Decimal(t.reorderLevel);
      return current.lessThanOrEqualTo(reorder);
    });

    return low;
  }

  async createTank(
    dto: CreateFuelTankDto,
    user: { userId: string; role: string },
  ) {
    this.assertCanManageFuel(user.role);

    const capacity = toDecimal(dto.capacity);
    const currentLevel = toDecimal(dto.currentLevel);
    const reorderLevel = toDecimal(dto.reorderLevel);

    if (currentLevel.greaterThan(capacity)) {
      throw new BadRequestException("currentLevel cannot exceed capacity");
    }

    return (this.prisma as any).fuelTank.create({
      data: {
        name: dto.name,
        location: dto.location,
        fuelType: dto.fuelType as any,
        capacity,
        currentLevel,
        reorderLevel,
        status: dto.status?.trim() || "ACTIVE",
      },
    });
  }

  async updateTank(
    id: string,
    dto: UpdateFuelTankDto,
    user: { userId: string; role: string },
  ) {
    this.assertCanManageFuel(user.role);

    const existing = await (this.prisma as any).fuelTank.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException("Fuel tank not found");

    const data: any = {
      name: dto.name,
      location: dto.location,
      fuelType: dto.fuelType as any,
      capacity:
        dto.capacity !== undefined ? toDecimal(dto.capacity) : undefined,
      currentLevel:
        dto.currentLevel !== undefined
          ? toDecimal(dto.currentLevel)
          : undefined,
      reorderLevel:
        dto.reorderLevel !== undefined
          ? toDecimal(dto.reorderLevel)
          : undefined,
      status: dto.status,
    };

    Object.keys(data).forEach((k) =>
      data[k] === undefined ? delete data[k] : null,
    );

    if (
      data.capacity &&
      data.currentLevel &&
      data.currentLevel.greaterThan(data.capacity)
    ) {
      throw new BadRequestException("currentLevel cannot exceed capacity");
    }

    return (this.prisma as any).fuelTank.update({ where: { id }, data });
  }

  async recordTankRefill(
    tankId: string,
    dto: TankRefillDto,
    user: { userId: string; role: string },
  ) {
    this.assertCanManageFuel(user.role);

    const qty = toDecimal(dto.quantity);
    if (qty.lessThanOrEqualTo(0)) {
      throw new BadRequestException("quantity must be greater than 0");
    }

    return (this.prisma as any).$transaction(async (tx: any) => {
      const tank = await tx.fuelTank.findUnique({ where: { id: tankId } });
      if (!tank) throw new NotFoundException("Fuel tank not found");

      const before = new Prisma.Decimal(tank.currentLevel);
      const after = before.add(qty);
      const capacity = new Prisma.Decimal(tank.capacity);
      if (after.greaterThan(capacity)) {
        throw new BadRequestException("Refill would exceed tank capacity");
      }

      const now = new Date();

      const row = await tx.fuelTankTransaction.create({
        data: {
          tankId,
          transactionType: FuelTankTransactionType.REFILL as any,
          quantity: qty,
          balanceBefore: before,
          balanceAfter: after,
          assetId: null,
          reference: dto.reference ?? null,
          performedById: user.userId,
          transactionDate: now,
          notes: dto.notes ?? null,
        },
      });

      await tx.fuelTank.update({
        where: { id: tankId },
        data: {
          currentLevel: after,
          lastRefillDate: now,
          lastRefillQty: qty,
        },
      });

      return row;
    });
  }

  async recordTankDispense(
    tankId: string,
    dto: TankDispenseDto,
    user: { userId: string; role: string },
  ) {
    this.assertCanManageFuel(user.role);

    const qty = toDecimal(dto.quantity);
    if (qty.lessThanOrEqualTo(0)) {
      throw new BadRequestException("quantity must be greater than 0");
    }

    return (this.prisma as any).$transaction(async (tx: any) => {
      const tank = await tx.fuelTank.findUnique({ where: { id: tankId } });
      if (!tank) throw new NotFoundException("Fuel tank not found");

      let asset: any = null;
      if (dto.assetId) {
        asset = await tx.fleetAsset.findUnique({
          where: { id: dto.assetId },
          select: {
            id: true,
            fuelType: true,
            currentOdometer: true,
            currentHours: true,
          },
        });
        if (!asset) throw new NotFoundException("Fleet asset not found");
        if (String(asset.fuelType) !== String(tank.fuelType)) {
          throw new BadRequestException(
            `Tank fuelType (${tank.fuelType}) does not match asset fuelType (${asset.fuelType})`,
          );
        }
      }

      const before = new Prisma.Decimal(tank.currentLevel);
      const after = before.sub(qty);
      if (after.lessThan(0)) {
        throw new BadRequestException("Insufficient tank level");
      }

      const now = new Date();

      const row = await tx.fuelTankTransaction.create({
        data: {
          tankId,
          transactionType: FuelTankTransactionType.DISPENSE as any,
          quantity: qty,
          balanceBefore: before,
          balanceAfter: after,
          assetId: dto.assetId ?? null,
          reference: dto.reference ?? null,
          performedById: user.userId,
          transactionDate: now,
          notes: dto.notes ?? null,
        },
      });

      await tx.fuelTank.update({
        where: { id: tankId },
        data: {
          currentLevel: after,
        },
      });

      if (dto.assetId) {
        const unitPrice = dto.unitPrice
          ? toDecimal(dto.unitPrice)
          : new Prisma.Decimal(0);
        const totalCost = qty.mul(unitPrice);

        const derived = await this.computeDerivedFields({
          prismaClient: tx,
          assetId: dto.assetId,
          transactionDate: now,
          quantity: qty,
          odometerReading: null,
          hoursReading: null,
        });

        await tx.fuelRecord.create({
          data: {
            assetId: dto.assetId,
            transactionDate: now,
            transactionType: FuelTransactionType.TANK_DISPENSE as any,
            fuelType: tank.fuelType as any,
            quantity: qty,
            unitPrice,
            totalCost,
            odometerReading: null,
            hoursReading: null,
            distanceSinceLast: derived.distanceSinceLast,
            hoursSinceLast: derived.hoursSinceLast,
            fuelEfficiency: derived.fuelEfficiency,
            fuelStation: tank.name,
            receiptNumber: dto.reference ?? null,
            siteLocation: tank.location,
            filledById: user.userId,
            approvedById: null,
            notes: dto.notes ?? null,
            receiptImage: null,
          },
        });
      }

      return row;
    });
  }

  async getTankTransactions(tankId: string, query: TankTransactionsQueryDto) {
    const take = query.take ?? 200;

    const tank = await (this.prisma as any).fuelTank.findUnique({
      where: { id: tankId },
    });
    if (!tank) throw new NotFoundException("Fuel tank not found");

    return (this.prisma as any).fuelTankTransaction.findMany({
      where: { tankId },
      orderBy: { transactionDate: "desc" },
      take: Math.min(500, take),
      include: {
        performedBy: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
      },
    });
  }
}

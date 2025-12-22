import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import {
  AssignBreakdownDto,
  BreakdownQueryDto,
  BreakdownStatus,
  CreateBreakdownDto,
  ResolveBreakdownDto,
  UpdateBreakdownDto,
} from "./dto/breakdown.dto";
import {
  CreateUsageLogDto,
  UsageQueryDto,
  UsageSummaryQueryDto,
} from "./dto/usage.dto";
import {
  CreateFleetInspectionDto,
  DueInspectionsQueryDto,
  FleetInspectionQueryDto,
} from "./dto/fleet-inspection.dto";

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
export class FleetOperationsService {
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

  private async getAssetOrThrow(assetId: string) {
    const asset = await (this.prisma as any).fleetAsset.findUnique({
      where: { id: assetId },
      select: { id: true, status: true },
    });
    if (!asset) throw new NotFoundException("Fleet asset not found");
    return asset;
  }

  private async refreshAssetStatus(assetId: string) {
    const asset = await (this.prisma as any).fleetAsset.findUnique({
      where: { id: assetId },
      select: { id: true, status: true },
    });
    if (!asset) return;

    const currentStatus = String(asset.status);
    if (["DECOMMISSIONED", "SOLD"].includes(currentStatus)) return;

    const activeBreakdowns = await (this.prisma as any).breakdownLog.count({
      where: {
        assetId,
        status: { notIn: ["RESOLVED", "CLOSED"] },
      },
    });

    if (activeBreakdowns > 0) {
      await (this.prisma as any).fleetAsset.update({
        where: { id: assetId },
        data: { status: "BREAKDOWN" },
      });
      return;
    }

    const openMaintenance = await (this.prisma as any).maintenanceRecord.count({
      where: {
        assetId,
        status: { in: ["SCHEDULED", "IN_PROGRESS"] },
      },
    });

    await (this.prisma as any).fleetAsset.update({
      where: { id: assetId },
      data: { status: openMaintenance > 0 ? "IN_MAINTENANCE" : "ACTIVE" },
    });
  }

  async createBreakdown(
    dto: CreateBreakdownDto,
    user: { userId: string; role: string },
  ) {
    await this.getAssetOrThrow(dto.assetId);

    const photos = Array.isArray(dto.photos) ? dto.photos : [];
    const documents = Array.isArray(dto.documents) ? dto.documents : [];

    const created = await (this.prisma as any).breakdownLog.create({
      data: {
        assetId: dto.assetId,
        breakdownDate: new Date(dto.breakdownDate),
        reportedDate: new Date(),
        location: dto.location,
        siteLocation: dto.siteLocation,
        title: dto.title,
        description: dto.description,
        category: dto.category as any,
        severity: dto.severity as any,
        operationalImpact: dto.operationalImpact,
        estimatedDowntime: dto.estimatedDowntime
          ? toDecimal(dto.estimatedDowntime)
          : null,
        productionLoss: dto.productionLoss
          ? toDecimal(dto.productionLoss)
          : null,
        status: "REPORTED",
        repairCost: new Prisma.Decimal(0),
        partsUsed: null,
        reportedById: user.userId,
        assignedToId: null,
        resolvedById: null,
        photos,
        documents,
        maintenanceRecordId: dto.maintenanceRecordId ?? null,
      },
      include: {
        asset: {
          select: {
            id: true,
            assetCode: true,
            name: true,
            currentLocation: true,
            status: true,
          },
        },
        reportedBy: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
      },
    });

    await this.refreshAssetStatus(dto.assetId);

    return created;
  }

  async listBreakdowns(query: BreakdownQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 25;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (query.assetId) where.assetId = query.assetId;
    if (query.status) where.status = query.status as any;
    if (query.severity) where.severity = query.severity as any;
    if (query.category) where.category = query.category as any;
    if (query.siteLocation)
      where.siteLocation = {
        contains: query.siteLocation,
        mode: "insensitive",
      };

    if (query.activeOnly) {
      where.status = { notIn: ["RESOLVED", "CLOSED"] };
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
        { location: { contains: query.search, mode: "insensitive" } },
        { siteLocation: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [total, data] = await Promise.all([
      (this.prisma as any).breakdownLog.count({ where }),
      (this.prisma as any).breakdownLog.findMany({
        where,
        orderBy: { reportedDate: "desc" },
        skip,
        take: pageSize,
        include: {
          asset: {
            select: {
              id: true,
              assetCode: true,
              name: true,
              status: true,
              currentLocation: true,
            },
          },
          reportedBy: {
            select: { id: true, firstName: true, lastName: true, role: true },
          },
          assignedTo: {
            select: { id: true, firstName: true, lastName: true, role: true },
          },
          resolvedBy: {
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

  async getBreakdownById(id: string) {
    const row = await (this.prisma as any).breakdownLog.findUnique({
      where: { id },
      include: {
        asset: {
          select: {
            id: true,
            assetCode: true,
            name: true,
            status: true,
            currentLocation: true,
          },
        },
        reportedBy: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
        resolvedBy: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
        maintenanceRecord: {
          select: {
            id: true,
            title: true,
            status: true,
            startDate: true,
            completionDate: true,
          },
        },
      },
    });
    if (!row) throw new NotFoundException("Breakdown not found");
    return row;
  }

  async updateBreakdown(
    id: string,
    dto: UpdateBreakdownDto,
    user: { userId: string; role: string },
  ) {
    this.assertCanManageFleet(user.role);

    const existing = await (this.prisma as any).breakdownLog.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException("Breakdown not found");

    const updated = await (this.prisma as any).breakdownLog.update({
      where: { id },
      data: {
        breakdownDate: dto.breakdownDate
          ? new Date(dto.breakdownDate)
          : undefined,
        location: dto.location,
        siteLocation: dto.siteLocation,
        title: dto.title,
        description: dto.description,
        category: dto.category as any,
        severity: dto.severity as any,
        operationalImpact: dto.operationalImpact,
        estimatedDowntime:
          dto.estimatedDowntime !== undefined
            ? toDecimalOrNull(dto.estimatedDowntime)
            : undefined,
        actualDowntime:
          dto.actualDowntime !== undefined
            ? toDecimalOrNull(dto.actualDowntime)
            : undefined,
        productionLoss:
          dto.productionLoss !== undefined
            ? toDecimalOrNull(dto.productionLoss)
            : undefined,
        status: dto.status as any,
        rootCause: dto.rootCause,
        resolution: dto.resolution,
        resolvedDate: dto.resolvedDate ? new Date(dto.resolvedDate) : undefined,
        repairType: dto.repairType,
        repairCost:
          dto.repairCost !== undefined ? toDecimal(dto.repairCost) : undefined,
        partsUsed: dto.partsUsed,
        assignedToId:
          dto.assignedToId !== undefined ? dto.assignedToId || null : undefined,
        photos: dto.photos,
        documents: dto.documents,
      },
    });

    await this.refreshAssetStatus(existing.assetId);
    return this.getBreakdownById(updated.id);
  }

  async assignBreakdown(
    id: string,
    dto: AssignBreakdownDto,
    user: { userId: string; role: string },
  ) {
    this.assertCanManageFleet(user.role);

    const existing = await (this.prisma as any).breakdownLog.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException("Breakdown not found");

    const status = dto.status ?? BreakdownStatus.ACKNOWLEDGED;

    await (this.prisma as any).breakdownLog.update({
      where: { id },
      data: {
        assignedToId: dto.assignedToId,
        status: status as any,
      },
    });

    await this.refreshAssetStatus(existing.assetId);
    return this.getBreakdownById(id);
  }

  async resolveBreakdown(
    id: string,
    dto: ResolveBreakdownDto,
    user: { userId: string; role: string },
  ) {
    this.assertCanManageFleet(user.role);

    const existing = await (this.prisma as any).breakdownLog.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException("Breakdown not found");

    const status = dto.status ?? BreakdownStatus.RESOLVED;

    await (this.prisma as any).breakdownLog.update({
      where: { id },
      data: {
        rootCause: dto.rootCause,
        resolution: dto.resolution,
        resolvedDate: dto.resolvedDate
          ? new Date(dto.resolvedDate)
          : new Date(),
        actualDowntime:
          dto.actualDowntime !== undefined
            ? toDecimalOrNull(dto.actualDowntime)
            : undefined,
        repairType: dto.repairType,
        repairCost:
          dto.repairCost !== undefined ? toDecimal(dto.repairCost) : undefined,
        partsUsed: dto.partsUsed,
        status: status as any,
        resolvedById: user.userId,
      },
    });

    await this.refreshAssetStatus(existing.assetId);
    return this.getBreakdownById(id);
  }

  async listAssetBreakdowns(assetId: string) {
    await this.getAssetOrThrow(assetId);
    return (this.prisma as any).breakdownLog.findMany({
      where: { assetId },
      orderBy: { reportedDate: "desc" },
      take: 200,
    });
  }

  async activeBreakdowns() {
    return (this.prisma as any).breakdownLog.findMany({
      where: { status: { notIn: ["RESOLVED", "CLOSED"] } },
      orderBy: { reportedDate: "desc" },
      include: {
        asset: {
          select: {
            id: true,
            assetCode: true,
            name: true,
            status: true,
            currentLocation: true,
          },
        },
      },
      take: 500,
    });
  }

  async breakdownStats(days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const rows = await (this.prisma as any).breakdownLog.findMany({
      where: { reportedDate: { gte: since } },
      select: {
        status: true,
        severity: true,
        category: true,
        estimatedDowntime: true,
        actualDowntime: true,
        repairCost: true,
      },
      take: 5000,
    });

    const byStatus: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    let totalRepairCost = new Prisma.Decimal(0);
    let totalEstimatedDowntime = new Prisma.Decimal(0);
    let totalActualDowntime = new Prisma.Decimal(0);

    for (const r of rows) {
      byStatus[String(r.status)] = (byStatus[String(r.status)] || 0) + 1;
      bySeverity[String(r.severity)] =
        (bySeverity[String(r.severity)] || 0) + 1;
      byCategory[String(r.category)] =
        (byCategory[String(r.category)] || 0) + 1;

      totalRepairCost = totalRepairCost.add(
        r.repairCost ? new Prisma.Decimal(r.repairCost) : new Prisma.Decimal(0),
      );
      totalEstimatedDowntime = totalEstimatedDowntime.add(
        r.estimatedDowntime
          ? new Prisma.Decimal(r.estimatedDowntime)
          : new Prisma.Decimal(0),
      );
      totalActualDowntime = totalActualDowntime.add(
        r.actualDowntime
          ? new Prisma.Decimal(r.actualDowntime)
          : new Prisma.Decimal(0),
      );
    }

    return {
      periodDays: days,
      total: rows.length,
      byStatus,
      bySeverity,
      byCategory,
      totals: {
        repairCost: totalRepairCost.toString(),
        estimatedDowntimeHours: totalEstimatedDowntime.toString(),
        actualDowntimeHours: totalActualDowntime.toString(),
      },
    };
  }

  async createUsageLog(dto: CreateUsageLogDto) {
    await this.getAssetOrThrow(dto.assetId);

    const created = await (this.prisma as any).usageLog.create({
      data: {
        assetId: dto.assetId,
        date: new Date(dto.date),
        shiftId: dto.shiftId ?? null,
        shift: dto.shift ?? null,
        operatorId: dto.operatorId,
        siteLocation: dto.siteLocation,
        projectId: dto.projectId ?? null,
        startOdometer: dto.startOdometer ? toDecimal(dto.startOdometer) : null,
        endOdometer: dto.endOdometer ? toDecimal(dto.endOdometer) : null,
        distanceCovered: dto.distanceCovered
          ? toDecimal(dto.distanceCovered)
          : null,
        startHours: dto.startHours ? toDecimal(dto.startHours) : null,
        endHours: dto.endHours ? toDecimal(dto.endHours) : null,
        operatingHours: dto.operatingHours
          ? toDecimal(dto.operatingHours)
          : null,
        idleHours: dto.idleHours ? toDecimal(dto.idleHours) : null,
        workDescription: dto.workDescription ?? null,
        loadsCarried: dto.loadsCarried ?? null,
        materialMoved: dto.materialMoved ? toDecimal(dto.materialMoved) : null,
        tripsCompleted: dto.tripsCompleted ?? null,
        preOpCheck: dto.preOpCheck ?? false,
        postOpCheck: dto.postOpCheck ?? false,
        issuesReported: dto.issuesReported ?? null,
        fuelAdded: dto.fuelAdded ? toDecimal(dto.fuelAdded) : null,
        notes: dto.notes ?? null,
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
        operator: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
        project: { select: { id: true, projectCode: true, name: true } },
      },
    });

    const updates: any = {};
    if (dto.endOdometer) updates.currentOdometer = toDecimal(dto.endOdometer);
    if (dto.endHours) updates.currentHours = toDecimal(dto.endHours);
    if (Object.keys(updates).length > 0) {
      updates.lastOdometerUpdate = new Date();
      await (this.prisma as any).fleetAsset.update({
        where: { id: dto.assetId },
        data: updates,
      });
    }

    return created;
  }

  async listUsageLogs(query: UsageQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 25;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (query.assetId) where.assetId = query.assetId;
    if (query.operatorId) where.operatorId = query.operatorId;
    if (query.siteLocation)
      where.siteLocation = {
        contains: query.siteLocation,
        mode: "insensitive",
      };
    if (query.projectId) where.projectId = query.projectId;

    if (query.from || query.to) {
      where.date = {};
      if (query.from) where.date.gte = new Date(query.from);
      if (query.to) where.date.lte = new Date(query.to);
    }

    const [total, data] = await Promise.all([
      (this.prisma as any).usageLog.count({ where }),
      (this.prisma as any).usageLog.findMany({
        where,
        orderBy: { date: "desc" },
        skip,
        take: pageSize,
        include: {
          asset: {
            select: {
              id: true,
              assetCode: true,
              name: true,
              currentLocation: true,
            },
          },
          operator: {
            select: { id: true, firstName: true, lastName: true, role: true },
          },
          project: { select: { id: true, projectCode: true, name: true } },
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

  async assetUsageHistory(assetId: string) {
    await this.getAssetOrThrow(assetId);
    return (this.prisma as any).usageLog.findMany({
      where: { assetId },
      orderBy: { date: "desc" },
      take: 200,
      include: {
        operator: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
        project: { select: { id: true, projectCode: true, name: true } },
      },
    });
  }

  async operatorUsage(operatorId: string, query: UsageQueryDto) {
    return this.listUsageLogs({ ...query, operatorId });
  }

  async siteUsage(site: string, query: UsageQueryDto) {
    return this.listUsageLogs({ ...query, siteLocation: site });
  }

  async usageSummary(query: UsageSummaryQueryDto) {
    const days = query.days ?? 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const rows = await (this.prisma as any).usageLog.findMany({
      where: { date: { gte: since } },
      select: {
        assetId: true,
        siteLocation: true,
        operatingHours: true,
        idleHours: true,
        distanceCovered: true,
        materialMoved: true,
      },
      take: 10000,
    });

    const totals = {
      operatingHours: new Prisma.Decimal(0),
      idleHours: new Prisma.Decimal(0),
      distanceKm: new Prisma.Decimal(0),
      materialTonnes: new Prisma.Decimal(0),
    };

    const bySite: Record<string, any> = {};
    const assets = new Set<string>();

    for (const r of rows) {
      assets.add(String(r.assetId));
      totals.operatingHours = totals.operatingHours.add(
        r.operatingHours
          ? new Prisma.Decimal(r.operatingHours)
          : new Prisma.Decimal(0),
      );
      totals.idleHours = totals.idleHours.add(
        r.idleHours ? new Prisma.Decimal(r.idleHours) : new Prisma.Decimal(0),
      );
      totals.distanceKm = totals.distanceKm.add(
        r.distanceCovered
          ? new Prisma.Decimal(r.distanceCovered)
          : new Prisma.Decimal(0),
      );
      totals.materialTonnes = totals.materialTonnes.add(
        r.materialMoved
          ? new Prisma.Decimal(r.materialMoved)
          : new Prisma.Decimal(0),
      );

      const site = String(r.siteLocation || "Unknown");
      if (!bySite[site]) {
        bySite[site] = {
          count: 0,
          operatingHours: new Prisma.Decimal(0),
          idleHours: new Prisma.Decimal(0),
          distanceKm: new Prisma.Decimal(0),
          materialTonnes: new Prisma.Decimal(0),
        };
      }
      bySite[site].count += 1;
      bySite[site].operatingHours = bySite[site].operatingHours.add(
        r.operatingHours
          ? new Prisma.Decimal(r.operatingHours)
          : new Prisma.Decimal(0),
      );
      bySite[site].idleHours = bySite[site].idleHours.add(
        r.idleHours ? new Prisma.Decimal(r.idleHours) : new Prisma.Decimal(0),
      );
      bySite[site].distanceKm = bySite[site].distanceKm.add(
        r.distanceCovered
          ? new Prisma.Decimal(r.distanceCovered)
          : new Prisma.Decimal(0),
      );
      bySite[site].materialTonnes = bySite[site].materialTonnes.add(
        r.materialMoved
          ? new Prisma.Decimal(r.materialMoved)
          : new Prisma.Decimal(0),
      );
    }

    const bySiteOut = Object.fromEntries(
      Object.entries(bySite).map(([k, v]) => [
        k,
        {
          count: v.count,
          operatingHours: v.operatingHours.toString(),
          idleHours: v.idleHours.toString(),
          distanceKm: v.distanceKm.toString(),
          materialTonnes: v.materialTonnes.toString(),
        },
      ]),
    );

    return {
      periodDays: days,
      records: rows.length,
      assets: assets.size,
      totals: {
        operatingHours: totals.operatingHours.toString(),
        idleHours: totals.idleHours.toString(),
        distanceKm: totals.distanceKm.toString(),
        materialTonnes: totals.materialTonnes.toString(),
      },
      bySite: bySiteOut,
    };
  }

  async createInspection(dto: CreateFleetInspectionDto) {
    await this.getAssetOrThrow(dto.assetId);

    const checklistItems = Array.isArray(dto.checklistItems)
      ? dto.checklistItems
      : [];

    const created = await (this.prisma as any).fleetInspection.create({
      data: {
        assetId: dto.assetId,
        type: dto.type as any,
        inspectionDate: new Date(dto.inspectionDate),
        inspectorId: dto.inspectorId,
        overallResult: dto.overallResult as any,
        score: dto.score ?? null,
        checklistItems,
        findings: dto.findings ?? null,
        recommendations: dto.recommendations ?? null,
        defectsFound: Array.isArray(dto.defectsFound) ? dto.defectsFound : [],
        followUpRequired: dto.followUpRequired ?? false,
        followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : null,
        followUpNotes: dto.followUpNotes ?? null,
        photos: Array.isArray(dto.photos) ? dto.photos : [],
        documents: Array.isArray(dto.documents) ? dto.documents : [],
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
        inspector: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
      },
    });

    return created;
  }

  async listInspections(query: FleetInspectionQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 25;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (query.assetId) where.assetId = query.assetId;
    if (query.type) where.type = query.type as any;
    if (query.inspectorId) where.inspectorId = query.inspectorId;

    if (query.from || query.to) {
      where.inspectionDate = {};
      if (query.from) where.inspectionDate.gte = new Date(query.from);
      if (query.to) where.inspectionDate.lte = new Date(query.to);
    }

    const [total, data] = await Promise.all([
      (this.prisma as any).fleetInspection.count({ where }),
      (this.prisma as any).fleetInspection.findMany({
        where,
        orderBy: { inspectionDate: "desc" },
        skip,
        take: pageSize,
        include: {
          asset: {
            select: {
              id: true,
              assetCode: true,
              name: true,
              currentLocation: true,
            },
          },
          inspector: {
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

  async assetInspections(assetId: string) {
    await this.getAssetOrThrow(assetId);
    return (this.prisma as any).fleetInspection.findMany({
      where: { assetId },
      orderBy: { inspectionDate: "desc" },
      take: 200,
      include: {
        inspector: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
      },
    });
  }

  async dueInspections(query: DueInspectionsQueryDto) {
    const daysAhead = query.daysAhead ?? 30;
    const now = new Date();
    const until = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);

    const assets = await (this.prisma as any).fleetAsset.findMany({
      where: {
        nextInspectionDue: { gte: now, lte: until },
      },
      select: {
        id: true,
        assetCode: true,
        name: true,
        currentLocation: true,
        nextInspectionDue: true,
      },
      orderBy: { nextInspectionDue: "asc" },
      take: 500,
    });

    return { daysAhead, assets };
  }
}

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import {
  CancelMaintenanceRecordDto,
  CompleteMaintenanceRecordDto,
  CreateMaintenanceChecklistDto,
  CreateMaintenanceRecordDto,
  CreateMaintenanceScheduleDto,
  MaintenanceStatus,
  MaintenanceType,
  ScheduleFrequency,
  UpcomingMaintenanceQueryDto,
  UpdateMaintenanceRecordDto,
  UpdateMaintenanceScheduleDto,
} from "./dto";

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
export class FleetMaintenanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private assertCanManageFleet(role: string) {
    const allowed = [
      "SUPER_ADMIN",
      "CEO",
      "CFO",
      "OPERATIONS_MANAGER",
      "WAREHOUSE_MANAGER",
    ];
    if (!allowed.includes(String(role))) {
      throw new ForbiddenException("You do not have permission to manage fleet maintenance");
    }
  }

  private async getAsset(assetId: string) {
    const asset = await (this.prisma as any).fleetAsset.findUnique({
      where: { id: assetId },
      select: {
        id: true,
        assetCode: true,
        name: true,
        currentOdometer: true,
        currentHours: true,
        status: true,
      },
    });
    if (!asset) throw new NotFoundException("Fleet asset not found");
    return asset;
  }

  private validateScheduleUnit(frequency: ScheduleFrequency, intervalUnit: string) {
    const unit = String(intervalUnit || "").toUpperCase();
    const allowed = ["DAYS", "KM", "HOURS"];
    if (!allowed.includes(unit)) {
      throw new BadRequestException("intervalUnit must be one of DAYS, KM, HOURS");
    }

    if (frequency === ScheduleFrequency.TIME_BASED && unit !== "DAYS") {
      throw new BadRequestException("TIME_BASED schedules require intervalUnit DAYS");
    }
    if (frequency === ScheduleFrequency.DISTANCE_BASED && unit !== "KM") {
      throw new BadRequestException("DISTANCE_BASED schedules require intervalUnit KM");
    }
    if (frequency === ScheduleFrequency.HOURS_BASED && unit !== "HOURS") {
      throw new BadRequestException("HOURS_BASED schedules require intervalUnit HOURS");
    }

    return unit;
  }

  private calculateNextDue(args: {
    frequency: ScheduleFrequency;
    intervalValue: number;
    intervalUnit: string;
    asset: { currentOdometer: Prisma.Decimal; currentHours: Prisma.Decimal };
    baseDate?: Date | null;
  }) {
    const now = new Date();
    const unit = this.validateScheduleUnit(args.frequency, args.intervalUnit);
    const intervalValue = Math.max(1, args.intervalValue);

    const baseDate = args.baseDate ? new Date(args.baseDate) : now;

    let nextDue: Date | null = null;
    let nextDueOdometer: Prisma.Decimal | null = null;
    let nextDueHours: Prisma.Decimal | null = null;

    if (args.frequency === ScheduleFrequency.TIME_BASED || args.frequency === ScheduleFrequency.COMBINED) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + intervalValue);
      nextDue = d;
    }

    if (args.frequency === ScheduleFrequency.DISTANCE_BASED || args.frequency === ScheduleFrequency.COMBINED) {
      if (unit === "KM") {
        nextDueOdometer = args.asset.currentOdometer.add(new Prisma.Decimal(intervalValue));
      }
    }

    if (args.frequency === ScheduleFrequency.HOURS_BASED || args.frequency === ScheduleFrequency.COMBINED) {
      if (unit === "HOURS") {
        nextDueHours = args.asset.currentHours.add(new Prisma.Decimal(intervalValue));
      }
    }

    return { nextDue, nextDueOdometer, nextDueHours };
  }

  async createSchedule(dto: CreateMaintenanceScheduleDto, user: { userId: string; role: string }) {
    this.assertCanManageFleet(user.role);

    const asset = await this.getAsset(dto.assetId);

    const unit = this.validateScheduleUnit(dto.frequency, dto.intervalUnit);

    const next = this.calculateNextDue({
      frequency: dto.frequency,
      intervalValue: dto.intervalValue,
      intervalUnit: unit,
      asset,
      baseDate: null,
    });

    return (this.prisma as any).maintenanceSchedule.create({
      data: {
        assetId: dto.assetId,
        type: dto.type as any,
        name: dto.name,
        description: dto.description,
        frequency: dto.frequency as any,
        intervalValue: dto.intervalValue,
        intervalUnit: unit,
        lastPerformed: null,
        lastOdometer: asset.currentOdometer,
        lastHours: asset.currentHours,
        nextDue: next.nextDue,
        nextDueOdometer: next.nextDueOdometer,
        nextDueHours: next.nextDueHours,
        alertDaysBefore: dto.alertDaysBefore ?? 7,
        alertKmBefore: toDecimalOrNull(dto.alertKmBefore),
        alertHoursBefore: toDecimalOrNull(dto.alertHoursBefore),
        isActive: dto.isActive ?? true,
        priority: (dto.priority as any) ?? "MEDIUM",
        estimatedCost: toDecimalOrNull(dto.estimatedCost),
        estimatedDuration: dto.estimatedDuration ?? null,
      },
      include: {
        asset: { select: { id: true, assetCode: true, name: true } },
      },
    });
  }

  async updateSchedule(id: string, dto: UpdateMaintenanceScheduleDto, user: { userId: string; role: string }) {
    this.assertCanManageFleet(user.role);

    const existing = await (this.prisma as any).maintenanceSchedule.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Schedule not found");

    const asset = await this.getAsset(existing.assetId);

    const frequency = (dto.frequency as any) ?? existing.frequency;
    const intervalValue = dto.intervalValue ?? existing.intervalValue;
    const intervalUnit = dto.intervalUnit ?? existing.intervalUnit;

    const unit = this.validateScheduleUnit(frequency, intervalUnit);
    const next = this.calculateNextDue({
      frequency,
      intervalValue,
      intervalUnit: unit,
      asset,
      baseDate: existing.lastPerformed,
    });

    return (this.prisma as any).maintenanceSchedule.update({
      where: { id },
      data: {
        type: dto.type as any,
        name: dto.name,
        description: dto.description,
        frequency: dto.frequency as any,
        intervalValue: dto.intervalValue,
        intervalUnit: dto.intervalUnit ? unit : undefined,
        nextDue: next.nextDue,
        nextDueOdometer: next.nextDueOdometer,
        nextDueHours: next.nextDueHours,
        alertDaysBefore: dto.alertDaysBefore,
        alertKmBefore: dto.alertKmBefore !== undefined ? toDecimalOrNull(dto.alertKmBefore) : undefined,
        alertHoursBefore: dto.alertHoursBefore !== undefined ? toDecimalOrNull(dto.alertHoursBefore) : undefined,
        isActive: dto.isActive,
        priority: dto.priority as any,
        estimatedCost: dto.estimatedCost !== undefined ? toDecimalOrNull(dto.estimatedCost) : undefined,
        estimatedDuration: dto.estimatedDuration,
      },
      include: {
        asset: { select: { id: true, assetCode: true, name: true } },
      },
    });
  }

  async deleteSchedule(id: string, user: { userId: string; role: string }) {
    this.assertCanManageFleet(user.role);

    const existing = await (this.prisma as any).maintenanceSchedule.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Schedule not found");

    return (this.prisma as any).maintenanceSchedule.delete({ where: { id } });
  }

  async getSchedules(assetId?: string) {
    const where = assetId ? { assetId } : {};
    return (this.prisma as any).maintenanceSchedule.findMany({
      where,
      include: {
        asset: { select: { id: true, assetCode: true, name: true, currentLocation: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  }

  async getScheduleById(id: string) {
    const schedule = await (this.prisma as any).maintenanceSchedule.findUnique({
      where: { id },
      include: { asset: { select: { id: true, assetCode: true, name: true, currentLocation: true } } },
    });
    if (!schedule) throw new NotFoundException("Schedule not found");
    return schedule;
  }

  async createMaintenanceRecord(dto: CreateMaintenanceRecordDto, user: { userId: string; role: string }) {
    this.assertCanManageFleet(user.role);

    await this.getAsset(dto.assetId);

    const laborCost = new Prisma.Decimal(0);
    const partsCost = new Prisma.Decimal(0);
    const externalCost = new Prisma.Decimal(0);
    const totalCost = laborCost.add(partsCost).add(externalCost);

    const status = (dto.status as any) ?? MaintenanceStatus.SCHEDULED;

    const created = await (this.prisma as any).maintenanceRecord.create({
      data: {
        assetId: dto.assetId,
        scheduleId: dto.scheduleId ?? null,
        type: dto.type as any,
        title: dto.title,
        description: dto.description,
        scheduledDate: dto.scheduledDate ? new Date(dto.scheduledDate) : null,
        startDate: new Date(dto.startDate),
        downtime: dto.downtime ? toDecimal(dto.downtime) : null,
        odometerReading: dto.odometerReading ? toDecimal(dto.odometerReading) : null,
        hoursReading: dto.hoursReading ? toDecimal(dto.hoursReading) : null,
        workPerformed: null,
        partsReplaced: null,
        technicianNotes: null,
        laborCost,
        partsCost,
        externalCost,
        totalCost,
        serviceProvider: dto.serviceProvider,
        vendorId: dto.vendorId ?? null,
        invoiceNumber: dto.invoiceNumber,
        status: status as any,
        priority: (dto.priority as any) ?? "MEDIUM",
        performedById: dto.performedById ?? null,
        approvedById: null,
        documents: [],
        photos: [],
        createdById: user.userId,
      },
      include: {
        asset: { select: { id: true, assetCode: true, name: true, currentLocation: true } },
        schedule: true,
      },
    });

    if (status === MaintenanceStatus.IN_PROGRESS || status === MaintenanceStatus.SCHEDULED) {
      await (this.prisma as any).fleetAsset.update({
        where: { id: dto.assetId },
        data: { status: "IN_MAINTENANCE" },
      });
    }

    return created;
  }

  async updateMaintenanceRecord(id: string, dto: UpdateMaintenanceRecordDto, user: { userId: string; role: string }) {
    this.assertCanManageFleet(user.role);

    const existing = await (this.prisma as any).maintenanceRecord.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Maintenance record not found");

    const laborCost = dto.laborCost !== undefined ? toDecimal(dto.laborCost) : existing.laborCost;
    const partsCost = dto.partsCost !== undefined ? toDecimal(dto.partsCost) : existing.partsCost;
    const externalCost = dto.externalCost !== undefined ? toDecimal(dto.externalCost) : existing.externalCost;
    const totalCost = laborCost.add(partsCost).add(externalCost);

    const updated = await (this.prisma as any).maintenanceRecord.update({
      where: { id },
      data: {
        type: dto.type as any,
        title: dto.title,
        description: dto.description,
        scheduledDate: dto.scheduledDate ? new Date(dto.scheduledDate) : undefined,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        downtime: dto.downtime ? toDecimal(dto.downtime) : undefined,
        odometerReading: dto.odometerReading ? toDecimal(dto.odometerReading) : undefined,
        hoursReading: dto.hoursReading ? toDecimal(dto.hoursReading) : undefined,
        workPerformed: dto.workPerformed,
        partsReplaced: dto.partsReplaced,
        technicianNotes: dto.technicianNotes,
        laborCost: dto.laborCost !== undefined ? laborCost : undefined,
        partsCost: dto.partsCost !== undefined ? partsCost : undefined,
        externalCost: dto.externalCost !== undefined ? externalCost : undefined,
        totalCost,
        serviceProvider: dto.serviceProvider,
        vendorId: dto.vendorId !== undefined ? dto.vendorId : undefined,
        invoiceNumber: dto.invoiceNumber,
        status: dto.status as any,
        priority: dto.priority as any,
        performedById: dto.performedById !== undefined ? dto.performedById : undefined,
        approvedById: dto.approvedById !== undefined ? dto.approvedById : undefined,
      },
      include: {
        asset: { select: { id: true, assetCode: true, name: true, currentLocation: true } },
        schedule: true,
      },
    });

    return updated;
  }

  async getMaintenanceRecordById(id: string) {
    const record = await (this.prisma as any).maintenanceRecord.findUnique({
      where: { id },
      include: {
        asset: { select: { id: true, assetCode: true, name: true, currentLocation: true } },
        schedule: true,
        vendor: { select: { id: true, companyName: true, vendorCode: true } },
        performedBy: { select: { id: true, firstName: true, lastName: true, role: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true, role: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
    });
    if (!record) throw new NotFoundException("Maintenance record not found");
    return record;
  }

  async listMaintenanceRecords(assetId?: string) {
    const where = assetId ? { assetId } : {};
    return (this.prisma as any).maintenanceRecord.findMany({
      where,
      include: {
        asset: { select: { id: true, assetCode: true, name: true, currentLocation: true } },
      },
      orderBy: { startDate: "desc" },
      take: 200,
    });
  }

  async completeMaintenanceRecord(
    id: string,
    dto: CompleteMaintenanceRecordDto,
    user: { userId: string; role: string },
  ) {
    this.assertCanManageFleet(user.role);

    const existing = await (this.prisma as any).maintenanceRecord.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Maintenance record not found");

    const laborCost = dto.laborCost !== undefined ? toDecimal(dto.laborCost) : existing.laborCost;
    const partsCost = dto.partsCost !== undefined ? toDecimal(dto.partsCost) : existing.partsCost;
    const externalCost = dto.externalCost !== undefined ? toDecimal(dto.externalCost) : existing.externalCost;
    const totalCost = laborCost.add(partsCost).add(externalCost);

    const completionDate = dto.completionDate ? new Date(dto.completionDate) : new Date();

    const updated = await (this.prisma as any).maintenanceRecord.update({
      where: { id },
      data: {
        status: "COMPLETED",
        completionDate,
        downtime: dto.downtime ? toDecimal(dto.downtime) : existing.downtime,
        odometerReading: dto.odometerReading ? toDecimal(dto.odometerReading) : existing.odometerReading,
        hoursReading: dto.hoursReading ? toDecimal(dto.hoursReading) : existing.hoursReading,
        workPerformed: dto.workPerformed ?? existing.workPerformed,
        partsReplaced: dto.partsReplaced ?? existing.partsReplaced,
        technicianNotes: dto.technicianNotes ?? existing.technicianNotes,
        laborCost,
        partsCost,
        externalCost,
        totalCost,
        approvedById: dto.approvedById ?? existing.approvedById,
      },
      include: { schedule: true },
    });

    if (existing.scheduleId) {
      const asset = await this.getAsset(existing.assetId);
      const schedule = await (this.prisma as any).maintenanceSchedule.findUnique({
        where: { id: existing.scheduleId },
      });
      if (schedule) {
        const next = this.calculateNextDue({
          frequency: schedule.frequency,
          intervalValue: schedule.intervalValue,
          intervalUnit: schedule.intervalUnit,
          asset,
          baseDate: completionDate,
        });

        await (this.prisma as any).maintenanceSchedule.update({
          where: { id: schedule.id },
          data: {
            lastPerformed: completionDate,
            lastOdometer: updated.odometerReading ?? asset.currentOdometer,
            lastHours: updated.hoursReading ?? asset.currentHours,
            nextDue: next.nextDue,
            nextDueOdometer: next.nextDueOdometer,
            nextDueHours: next.nextDueHours,
          },
        });
      }
    }

    const openCount = await (this.prisma as any).maintenanceRecord.count({
      where: {
        assetId: existing.assetId,
        status: { in: ["SCHEDULED", "IN_PROGRESS"] },
      },
    });

    if (openCount === 0) {
      await (this.prisma as any).fleetAsset.update({
        where: { id: existing.assetId },
        data: { status: "ACTIVE" },
      });
    }

    return this.getMaintenanceRecordById(id);
  }

  async cancelMaintenanceRecord(id: string, _dto: CancelMaintenanceRecordDto, user: { userId: string; role: string }) {
    this.assertCanManageFleet(user.role);

    const existing = await (this.prisma as any).maintenanceRecord.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Maintenance record not found");

    await (this.prisma as any).maintenanceRecord.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    const openCount = await (this.prisma as any).maintenanceRecord.count({
      where: {
        assetId: existing.assetId,
        status: { in: ["SCHEDULED", "IN_PROGRESS"] },
      },
    });

    if (openCount === 0) {
      await (this.prisma as any).fleetAsset.update({
        where: { id: existing.assetId },
        data: { status: "ACTIVE" },
      });
    }

    return this.getMaintenanceRecordById(id);
  }

  async getMaintenanceHistory(assetId: string) {
    await this.getAsset(assetId);
    return (this.prisma as any).maintenanceRecord.findMany({
      where: { assetId },
      orderBy: { startDate: "desc" },
      take: 200,
    });
  }

  private isScheduleOverdue(schedule: any, asset: any) {
    const now = new Date();

    if (schedule.nextDue && new Date(schedule.nextDue).getTime() < now.getTime()) {
      return true;
    }

    if (schedule.nextDueOdometer && asset.currentOdometer && new Prisma.Decimal(asset.currentOdometer).greaterThanOrEqualTo(schedule.nextDueOdometer)) {
      return true;
    }

    if (schedule.nextDueHours && asset.currentHours && new Prisma.Decimal(asset.currentHours).greaterThanOrEqualTo(schedule.nextDueHours)) {
      return true;
    }

    return false;
  }

  async checkOverdueSchedules() {
    const schedules = await (this.prisma as any).maintenanceSchedule.findMany({
      where: { isActive: true },
      include: {
        asset: { select: { id: true, assetCode: true, name: true, currentOdometer: true, currentHours: true, currentLocation: true } },
      },
      take: 500,
    });

    return schedules.filter((s: any) => this.isScheduleOverdue(s, s.asset));
  }

  async getOverdueMaintenance() {
    return this.checkOverdueSchedules();
  }

  async getUpcomingMaintenance(query: UpcomingMaintenanceQueryDto) {
    const daysAhead = query.daysAhead ?? 14;
    const now = new Date();
    const until = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);

    const schedules = await (this.prisma as any).maintenanceSchedule.findMany({
      where: {
        isActive: true,
        nextDue: { gte: now, lte: until },
      },
      include: {
        asset: { select: { id: true, assetCode: true, name: true, currentLocation: true } },
      },
      orderBy: { nextDue: "asc" },
      take: 200,
    });

    return { daysAhead, schedules };
  }

  async getCalendar(daysAhead = 30) {
    const upcoming = await this.getUpcomingMaintenance({ daysAhead });
    const records = await (this.prisma as any).maintenanceRecord.findMany({
      where: {
        scheduledDate: {
          gte: new Date(),
          lte: new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000),
        },
      },
      include: { asset: { select: { id: true, assetCode: true, name: true } } },
      orderBy: { scheduledDate: "asc" },
      take: 200,
    });

    return { daysAhead, schedules: upcoming.schedules, records };
  }

  async getCostsSummary(daysAhead = 30) {
    const since = new Date(Date.now() - daysAhead * 24 * 60 * 60 * 1000);

    const rows = await (this.prisma as any).maintenanceRecord.findMany({
      where: {
        startDate: { gte: since },
        status: { in: ["COMPLETED", "IN_PROGRESS", "SCHEDULED"] },
      },
      select: {
        totalCost: true,
        status: true,
      },
      take: 1000,
    });

    const totals = rows.reduce(
      (acc: any, r: any) => {
        const v = r.totalCost ? new Prisma.Decimal(r.totalCost) : new Prisma.Decimal(0);
        acc.total = acc.total.add(v);
        acc.byStatus[r.status] = (acc.byStatus[r.status] || new Prisma.Decimal(0)).add(v);
        return acc;
      },
      { total: new Prisma.Decimal(0), byStatus: {} as Record<string, Prisma.Decimal> },
    );

    return {
      periodDays: daysAhead,
      totalCost: totals.total,
      byStatus: Object.fromEntries(
        Object.entries(totals.byStatus).map(([k, v]) => [k, v.toString()]),
      ),
    };
  }

  async getChecklists(assetType?: string) {
    const where = assetType ? { assetType: assetType as any } : {};
    return (this.prisma as any).maintenanceChecklist.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  }

  async createChecklist(dto: CreateMaintenanceChecklistDto, user: { userId: string; role: string }) {
    this.assertCanManageFleet(user.role);

    const items = Array.isArray(dto.items) ? dto.items : [];
    if (items.length === 0) {
      throw new BadRequestException("items is required");
    }

    if (dto.isDefault) {
      await (this.prisma as any).maintenanceChecklist.updateMany({
        where: { assetType: dto.assetType as any, isDefault: true },
        data: { isDefault: false },
      });
    }

    return (this.prisma as any).maintenanceChecklist.create({
      data: {
        assetType: dto.assetType as any,
        name: dto.name,
        items,
        isDefault: dto.isDefault ?? false,
      },
    });
  }

  async sendMaintenanceReminders() {
    const dueSoon = await this.getUpcomingMaintenance({ daysAhead: 7 });
    const overdue = await this.getOverdueMaintenance();

    const recipients = await this.notificationsService.getUsersByRole([
      "SUPER_ADMIN",
      "CEO",
      "CFO",
      "OPERATIONS_MANAGER",
      "WAREHOUSE_MANAGER",
    ]);

    const notifications: { userId: string; type: any; title: string; message: string; referenceId?: string; referenceType?: string }[] = [];

    if (Array.isArray(dueSoon.schedules) && dueSoon.schedules.length > 0) {
      const msg = `There are ${dueSoon.schedules.length} maintenance schedules due within ${dueSoon.daysAhead} days.`;
      for (const u of recipients) {
        notifications.push({
          userId: u.id,
          type: "SYSTEM_ALERT",
          title: "Upcoming Fleet Maintenance",
          message: msg,
          referenceType: "fleet_maintenance",
          referenceId: "upcoming",
        });
      }
    }

    if (Array.isArray(overdue) && overdue.length > 0) {
      const msg = `There are ${overdue.length} overdue fleet maintenance schedules.`;
      for (const u of recipients) {
        notifications.push({
          userId: u.id,
          type: "SYSTEM_ALERT",
          title: "Overdue Fleet Maintenance",
          message: msg,
          referenceType: "fleet_maintenance",
          referenceId: "overdue",
        });
      }
    }

    if (notifications.length > 0) {
      await this.notificationsService.createBulkNotifications(notifications);
    }

    return { upcoming: dueSoon.schedules.length, overdue: overdue.length };
  }
}

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import {
  StorageProvider,
  StorageService,
} from "../documents/services/storage.service";
import {
  AssignFleetOperatorDto,
  CreateFleetAssetDto,
  DecommissionFleetAssetDto,
  FleetAssignmentsQueryDto,
  FleetAssetsQueryDto,
  TransferFleetAssetDto,
  UpdateFleetAssetDto,
  UpdateFleetAssetStatusDto,
  UploadFleetDocumentDto,
} from "./dto";
import {
  FleetAssetCondition,
  FleetAssetStatus,
  FleetAssetType,
} from "./dto/create-fleet-asset.dto";

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
export class FleetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  private async getOperatorDisplayName(
    operatorId: string,
  ): Promise<string | null> {
    const u = await this.prisma.user.findUnique({
      where: { id: operatorId },
      select: { firstName: true, lastName: true },
    });
    if (!u) return null;
    const name = `${u.firstName} ${u.lastName}`.trim();
    return name.length ? name : null;
  }

  private canManageFleet(role: string): boolean {
    return (
      [
        "SUPER_ADMIN",
        "CEO",
        "CFO",
        "OPERATIONS_MANAGER",
        "WAREHOUSE_MANAGER",
      ] as string[]
    ).includes(role);
  }

  private assertCanManageFleet(role: string) {
    if (!this.canManageFleet(role)) {
      throw new ForbiddenException("Not allowed");
    }
  }

  private typePrefix(type: FleetAssetType): string {
    switch (type) {
      case FleetAssetType.VEHICLE:
        return "VEH";
      case FleetAssetType.HEAVY_MACHINERY:
        return "HM";
      case FleetAssetType.DRILLING_EQUIPMENT:
        return "DRL";
      case FleetAssetType.PROCESSING_EQUIPMENT:
        return "PRC";
      case FleetAssetType.SUPPORT_EQUIPMENT:
        return "SUP";
      case FleetAssetType.TRANSPORT:
        return "TRN";
      default:
        return "FLT";
    }
  }

  async generateAssetCode(type: FleetAssetType): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `${this.typePrefix(type)}-${year}-`;

    const count = await (this.prisma as any).fleetAsset.count({
      where: {
        assetCode: {
          startsWith: prefix,
        },
      },
    });

    return `${prefix}${String(count + 1).padStart(4, "0")}`;
  }

  async createAsset(
    dto: CreateFleetAssetDto,
    user: { userId: string; role: string },
  ) {
    this.assertCanManageFleet(user.role);

    const assetCode = dto.assetCode?.trim()
      ? dto.assetCode.trim()
      : await this.generateAssetCode(dto.type as unknown as FleetAssetType);

    const existing = await (this.prisma as any).fleetAsset.findUnique({
      where: { assetCode },
    });
    if (existing) throw new BadRequestException("Asset code already exists");

    const tankCapacity = toDecimalOrNull(dto.tankCapacity);
    const purchasePrice = toDecimalOrNull(dto.purchasePrice);
    const salvageValue =
      toDecimalOrNull(dto.salvageValue) ?? new Prisma.Decimal(0);
    const currentOdometer = dto.currentOdometer
      ? toDecimal(dto.currentOdometer)
      : new Prisma.Decimal(0);
    const currentHours = dto.currentHours
      ? toDecimal(dto.currentHours)
      : new Prisma.Decimal(0);

    const insurancePremium = toDecimalOrNull(dto.insurancePremium);

    const usefulLifeYears = dto.usefulLifeYears ?? 10;
    const depreciationMethod =
      dto.depreciationMethod?.trim() || "STRAIGHT_LINE";

    const currentValue = purchasePrice
      ? await this.calculateDepreciationForValues({
          purchasePrice,
          salvageValue,
          usefulLifeYears,
          depreciationMethod,
          purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : null,
        })
      : null;

    return (this.prisma as any).fleetAsset.create({
      data: {
        assetCode,
        name: dto.name,
        type: dto.type as any,
        category: dto.category,

        registrationNo: dto.registrationNo,
        serialNumber: dto.serialNumber,
        engineNumber: dto.engineNumber,
        chassisNumber: dto.chassisNumber,

        make: dto.make,
        model: dto.model,
        year: dto.year,
        capacity: dto.capacity,
        fuelType: dto.fuelType as any,
        tankCapacity,

        purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : null,
        purchasePrice,
        vendor: dto.vendor,
        warrantyExpiry: dto.warrantyExpiry
          ? new Date(dto.warrantyExpiry)
          : null,

        status: FleetAssetStatus.ACTIVE as any,
        condition: FleetAssetCondition.GOOD as any,
        currentLocation: dto.currentLocation,
        operatorId: dto.operatorId ?? null,
        currentOperator: dto.currentOperator,

        currentOdometer,
        currentHours,
        lastOdometerUpdate:
          dto.currentOdometer || dto.currentHours ? new Date() : null,

        depreciationMethod,
        usefulLifeYears,
        salvageValue,
        currentValue,

        insuranceProvider: dto.insuranceProvider,
        insurancePolicyNo: dto.insurancePolicyNo,
        insuranceExpiry: dto.insuranceExpiry
          ? new Date(dto.insuranceExpiry)
          : null,
        insurancePremium,

        miningPermit: dto.miningPermit,
        permitExpiry: dto.permitExpiry ? new Date(dto.permitExpiry) : null,
        safetyInspection: dto.safetyInspection
          ? new Date(dto.safetyInspection)
          : null,
        nextInspectionDue: dto.nextInspectionDue
          ? new Date(dto.nextInspectionDue)
          : null,
        emissionsCert: dto.emissionsCert,
        emissionsExpiry: dto.emissionsExpiry
          ? new Date(dto.emissionsExpiry)
          : null,

        createdById: user.userId,
      },
    });
  }

  async updateAsset(
    id: string,
    dto: UpdateFleetAssetDto,
    user: { userId: string; role: string },
  ) {
    this.assertCanManageFleet(user.role);

    await this.getAssetById(id, user);

    const data: any = {
      name: dto.name,
      type: dto.type as any,
      category: dto.category,
      registrationNo: dto.registrationNo,
      serialNumber: dto.serialNumber,
      engineNumber: dto.engineNumber,
      chassisNumber: dto.chassisNumber,
      make: dto.make,
      model: dto.model,
      year: dto.year,
      capacity: dto.capacity,
      fuelType: dto.fuelType as any,
      tankCapacity:
        dto.tankCapacity !== undefined
          ? toDecimalOrNull(dto.tankCapacity)
          : undefined,
      purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : undefined,
      purchasePrice:
        dto.purchasePrice !== undefined
          ? toDecimalOrNull(dto.purchasePrice)
          : undefined,
      vendor: dto.vendor,
      warrantyExpiry: dto.warrantyExpiry
        ? new Date(dto.warrantyExpiry)
        : undefined,
      status: dto.status as any,
      condition: dto.condition as any,
      currentLocation: dto.currentLocation,
      operatorId:
        dto.operatorId !== undefined ? dto.operatorId || null : undefined,
      currentOperator: dto.currentOperator,
      currentOdometer: dto.currentOdometer
        ? toDecimal(dto.currentOdometer)
        : undefined,
      currentHours: dto.currentHours ? toDecimal(dto.currentHours) : undefined,
      lastOdometerUpdate:
        dto.currentOdometer || dto.currentHours ? new Date() : undefined,
      depreciationMethod: dto.depreciationMethod,
      usefulLifeYears: dto.usefulLifeYears,
      salvageValue: dto.salvageValue ? toDecimal(dto.salvageValue) : undefined,
      insuranceProvider: dto.insuranceProvider,
      insurancePolicyNo: dto.insurancePolicyNo,
      insuranceExpiry: dto.insuranceExpiry
        ? new Date(dto.insuranceExpiry)
        : undefined,
      insurancePremium: dto.insurancePremium
        ? toDecimal(dto.insurancePremium)
        : undefined,
      miningPermit: dto.miningPermit,
      permitExpiry: dto.permitExpiry ? new Date(dto.permitExpiry) : undefined,
      safetyInspection: dto.safetyInspection
        ? new Date(dto.safetyInspection)
        : undefined,
      nextInspectionDue: dto.nextInspectionDue
        ? new Date(dto.nextInspectionDue)
        : undefined,
      emissionsCert: dto.emissionsCert,
      emissionsExpiry: dto.emissionsExpiry
        ? new Date(dto.emissionsExpiry)
        : undefined,
    };

    Object.keys(data).forEach((k) =>
      data[k] === undefined ? delete data[k] : null,
    );

    const updated = await (this.prisma as any).fleetAsset.update({
      where: { id },
      data,
    });

    if (
      dto.purchasePrice !== undefined ||
      dto.salvageValue !== undefined ||
      dto.usefulLifeYears !== undefined ||
      dto.depreciationMethod !== undefined ||
      dto.purchaseDate !== undefined
    ) {
      await this.calculateDepreciation(id, user);
    }

    return updated;
  }

  async deleteAsset(id: string, user: { userId: string; role: string }) {
    this.assertCanManageFleet(user.role);
    await this.getAssetById(id, user);
    return (this.prisma as any).fleetAsset.delete({ where: { id } });
  }

  async getAssetById(id: string, _user: { userId: string; role: string }) {
    const asset = await (this.prisma as any).fleetAsset.findUnique({
      where: { id },
      include: {
        documents: { orderBy: { uploadedAt: "desc" } },
        assignments: {
          orderBy: { startDate: "desc" },
          take: 20,
          include: {
            operator: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
              },
            },
            project: { select: { id: true, projectCode: true, name: true } },
            assignedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
              },
            },
          },
        },
        operator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!asset) throw new NotFoundException("Fleet asset not found");
    return asset;
  }

  async getAssets(query: FleetAssetsQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 25;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (query.type) where.type = query.type as any;
    if (query.status) where.status = query.status as any;
    if (query.condition) where.condition = query.condition as any;
    if (query.location)
      where.currentLocation = { contains: query.location, mode: "insensitive" };

    if (query.search) {
      where.OR = [
        { assetCode: { contains: query.search, mode: "insensitive" } },
        { name: { contains: query.search, mode: "insensitive" } },
        { category: { contains: query.search, mode: "insensitive" } },
        { registrationNo: { contains: query.search, mode: "insensitive" } },
        { serialNumber: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [total, data] = await Promise.all([
      (this.prisma as any).fleetAsset.count({ where }),
      (this.prisma as any).fleetAsset.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: {
          operator: {
            select: { id: true, firstName: true, lastName: true, role: true },
          },
          _count: { select: { documents: true, assignments: true } },
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

  async updateAssetStatus(
    id: string,
    dto: UpdateFleetAssetStatusDto,
    user: { userId: string; role: string },
  ) {
    this.assertCanManageFleet(user.role);
    await this.getAssetById(id, user);
    return (this.prisma as any).fleetAsset.update({
      where: { id },
      data: { status: dto.status as any },
    });
  }

  async transferAsset(
    id: string,
    dto: TransferFleetAssetDto,
    user: { userId: string; role: string },
  ) {
    this.assertCanManageFleet(user.role);
    await this.getAssetById(id, user);
    return (this.prisma as any).fleetAsset.update({
      where: { id },
      data: { currentLocation: dto.newLocation },
    });
  }

  async assignOperator(
    assetId: string,
    dto: AssignFleetOperatorDto,
    user: { userId: string; role: string },
  ) {
    this.assertCanManageFleet(user.role);

    const asset = await this.getAssetById(assetId, user);

    const operatorName = await this.getOperatorDisplayName(dto.operatorId);

    const assignmentId = await this.prisma.$transaction(async (tx) => {
      const t = tx as any;

      await t.fleetAssignment.updateMany({
        where: { assetId, status: "ACTIVE", endDate: null },
        data: { status: "ENDED", endDate: new Date() },
      });

      const created = await t.fleetAssignment.create({
        data: {
          assetId,
          operatorId: dto.operatorId,
          projectId: null,
          siteLocation: dto.siteLocation,
          startDate: new Date(),
          endDate: null,
          status: "ACTIVE",
          notes: dto.notes,
          assignedById: user.userId,
        },
      });

      await t.fleetAsset.update({
        where: { id: assetId },
        data: {
          operatorId: dto.operatorId,
          currentLocation: dto.siteLocation,
          currentOperator: operatorName ?? asset.currentOperator,
        },
      });

      return created.id as string;
    });

    return (this.prisma as any).fleetAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        asset: {
          select: {
            id: true,
            assetCode: true,
            name: true,
            type: true,
            status: true,
            currentLocation: true,
          },
        },
        operator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        project: { select: { id: true, projectCode: true, name: true } },
        assignedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async listAssignments(query: FleetAssignmentsQueryDto) {
    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.assetId) where.assetId = query.assetId;
    if (query.operatorId) where.operatorId = query.operatorId;

    return (this.prisma as any).fleetAssignment.findMany({
      where,
      orderBy: { startDate: "desc" },
      include: {
        asset: {
          select: {
            id: true,
            assetCode: true,
            name: true,
            type: true,
            status: true,
            currentLocation: true,
          },
        },
        operator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        project: { select: { id: true, projectCode: true, name: true } },
        assignedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async listActiveAssignments() {
    return (this.prisma as any).fleetAssignment.findMany({
      where: { status: "ACTIVE", endDate: null },
      orderBy: { startDate: "desc" },
      include: {
        asset: {
          select: {
            id: true,
            assetCode: true,
            name: true,
            type: true,
            status: true,
            currentLocation: true,
          },
        },
        operator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        project: { select: { id: true, projectCode: true, name: true } },
        assignedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async endAssignment(id: string, user: { userId: string; role: string }) {
    this.assertCanManageFleet(user.role);

    const existing = await (this.prisma as any).fleetAssignment.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException("Assignment not found");

    return (this.prisma as any).fleetAssignment.update({
      where: { id },
      data: { status: "ENDED", endDate: new Date() },
    });
  }

  async decommissionAsset(
    id: string,
    dto: DecommissionFleetAssetDto,
    user: { userId: string; role: string },
  ) {
    this.assertCanManageFleet(user.role);

    await this.getAssetById(id, user);

    await (this.prisma as any).fleetAssignment.updateMany({
      where: { assetId: id, status: "ACTIVE", endDate: null },
      data: { status: "ENDED", endDate: new Date() },
    });

    return (this.prisma as any).fleetAsset.update({
      where: { id },
      data: {
        status: FleetAssetStatus.DECOMMISSIONED as any,
        decommissionReason: dto.reason,
        decommissionedAt: new Date(),
      },
    });
  }

  private async calculateDepreciationForValues(args: {
    purchasePrice: Prisma.Decimal;
    salvageValue: Prisma.Decimal;
    usefulLifeYears: number;
    depreciationMethod: string;
    purchaseDate: Date | null;
  }): Promise<Prisma.Decimal> {
    const {
      purchasePrice,
      salvageValue,
      usefulLifeYears,
      depreciationMethod,
      purchaseDate,
    } = args;

    if (!purchaseDate) return purchasePrice;

    if ((depreciationMethod || "").toUpperCase() !== "STRAIGHT_LINE") {
      return purchasePrice;
    }

    const msPerYear = 365.25 * 24 * 60 * 60 * 1000;
    const yearsUsed = Math.max(
      0,
      (Date.now() - purchaseDate.getTime()) / msPerYear,
    );
    const annual = purchasePrice
      .sub(salvageValue)
      .div(new Prisma.Decimal(Math.max(1, usefulLifeYears)));
    const depreciation = annual.mul(new Prisma.Decimal(yearsUsed));
    const value = purchasePrice.sub(depreciation);
    const minValue = salvageValue;
    return value.lessThan(minValue) ? minValue : value;
  }

  async calculateDepreciation(
    assetId: string,
    user: { userId: string; role: string },
  ) {
    this.assertCanManageFleet(user.role);

    const asset = await (this.prisma as any).fleetAsset.findUnique({
      where: { id: assetId },
    });
    if (!asset) throw new NotFoundException("Fleet asset not found");

    if (!asset.purchasePrice) {
      return { assetId, currentValue: null, method: asset.depreciationMethod };
    }

    const currentValue = await this.calculateDepreciationForValues({
      purchasePrice: asset.purchasePrice,
      salvageValue: asset.salvageValue,
      usefulLifeYears: asset.usefulLifeYears,
      depreciationMethod: asset.depreciationMethod,
      purchaseDate: asset.purchaseDate,
    });

    await (this.prisma as any).fleetAsset.update({
      where: { id: assetId },
      data: { currentValue },
    });

    return { assetId, currentValue, method: asset.depreciationMethod };
  }

  async uploadDocument(
    assetId: string,
    file: Express.Multer.File,
    dto: UploadFleetDocumentDto,
    user: { userId: string; role: string },
  ) {
    this.assertCanManageFleet(user.role);

    await this.getAssetById(assetId, user);

    if (!file) throw new BadRequestException("file is required");

    const uploaded = await this.storageService.uploadFile(file, "fleet");

    return (this.prisma as any).fleetDocument.create({
      data: {
        assetId,
        type: dto.type,
        name: file.originalname,
        fileUrl: uploaded.url,
        storageKey: uploaded.key,
        storageProvider: uploaded.provider,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        uploadedById: user.userId,
      },
    });
  }

  async listDocuments(assetId: string, user: { userId: string; role: string }) {
    await this.getAssetById(assetId, user);
    return (this.prisma as any).fleetDocument.findMany({
      where: { assetId },
      orderBy: { uploadedAt: "desc" },
    });
  }

  async deleteDocument(id: string, user: { userId: string; role: string }) {
    this.assertCanManageFleet(user.role);

    const doc = await (this.prisma as any).fleetDocument.findUnique({
      where: { id },
    });
    if (!doc) throw new NotFoundException("Fleet document not found");

    await this.storageService.deleteFile(
      doc.storageKey,
      doc.storageProvider as StorageProvider,
    );

    return (this.prisma as any).fleetDocument.delete({ where: { id } });
  }

  async getExpiringDocuments(daysAhead: number) {
    const now = new Date();
    const until = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);

    return (this.prisma as any).fleetDocument.findMany({
      where: {
        expiryDate: {
          gte: now,
          lte: until,
        },
      },
      orderBy: { expiryDate: "asc" },
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
      },
    });
  }

  private expiringDateWhere(daysAhead: number): Prisma.DateTimeFilter {
    const now = new Date();
    const until = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
    return { gte: now, lte: until };
  }

  async checkExpiringItems(daysAhead = 30) {
    const [documents, insurance, permits, inspections] = await Promise.all([
      this.getExpiringDocuments(daysAhead),
      (this.prisma as any).fleetAsset.findMany({
        where: { insuranceExpiry: this.expiringDateWhere(daysAhead) },
        orderBy: { insuranceExpiry: "asc" },
        select: {
          id: true,
          assetCode: true,
          name: true,
          currentLocation: true,
          insuranceExpiry: true,
        },
      }),
      (this.prisma as any).fleetAsset.findMany({
        where: { permitExpiry: this.expiringDateWhere(daysAhead) },
        orderBy: { permitExpiry: "asc" },
        select: {
          id: true,
          assetCode: true,
          name: true,
          currentLocation: true,
          permitExpiry: true,
        },
      }),
      (this.prisma as any).fleetAsset.findMany({
        where: { nextInspectionDue: this.expiringDateWhere(daysAhead) },
        orderBy: { nextInspectionDue: "asc" },
        select: {
          id: true,
          assetCode: true,
          name: true,
          currentLocation: true,
          nextInspectionDue: true,
        },
      }),
    ]);

    return {
      daysAhead,
      documents,
      insurance,
      permits,
      inspections,
      counts: {
        documents: documents.length,
        insurance: insurance.length,
        permits: permits.length,
        inspections: inspections.length,
      },
    };
  }

  async dashboard() {
    const [
      totalAssets,
      activeAssets,
      inMaintenance,
      breakdowns,
      criticalAssets,
      expiringDocs,
    ] = await Promise.all([
      (this.prisma as any).fleetAsset.count(),
      (this.prisma as any).fleetAsset.count({
        where: { status: FleetAssetStatus.ACTIVE as any },
      }),
      (this.prisma as any).fleetAsset.count({
        where: { status: FleetAssetStatus.IN_MAINTENANCE as any },
      }),
      (this.prisma as any).fleetAsset.count({
        where: { status: FleetAssetStatus.BREAKDOWN as any },
      }),
      (this.prisma as any).fleetAsset.count({
        where: { condition: FleetAssetCondition.CRITICAL as any },
      }),
      (this.prisma as any).fleetDocument.count({
        where: {
          expiryDate: this.expiringDateWhere(30),
        },
      }),
    ]);

    return {
      totalAssets,
      activeAssets,
      inMaintenance,
      breakdowns,
      expiringDocuments: expiringDocs,
      criticalAssets,
    };
  }

  async assetsByLocation(location: string) {
    return (this.prisma as any).fleetAsset.findMany({
      where: { currentLocation: { equals: location, mode: "insensitive" } },
      orderBy: { createdAt: "desc" },
    });
  }

  async assetsByType(type: FleetAssetType) {
    return (this.prisma as any).fleetAsset.findMany({
      where: { type },
      orderBy: { createdAt: "desc" },
    });
  }
}

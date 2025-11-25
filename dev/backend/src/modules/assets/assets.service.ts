import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface CreateAssetDto {
  assetCode: string;
  name: string;
  description?: string;
  category: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate: string;
  purchasePrice: number;
  depreciationRate?: number;
  location?: string;
  assignedTo?: string;
  notes?: string;
  warrantyExpiry?: string;
}

export interface UpdateAssetDto {
  name?: string;
  description?: string;
  location?: string;
  status?: string;
  condition?: string;
  assignedTo?: string;
  notes?: string;
  currentValue?: number;
  nextMaintenanceAt?: string;
}

export interface CreateMaintenanceLogDto {
  maintenanceType: string;
  description: string;
  performedBy?: string;
  performedAt: string;
  cost?: number;
  nextDueDate?: string;
  notes?: string;
}

@Injectable()
export class AssetsService {
  constructor(private prisma: PrismaService) {}

  async createAsset(dto: CreateAssetDto) {
    const existing = await this.prisma.asset.findUnique({
      where: { assetCode: dto.assetCode },
    });

    if (existing) {
      throw new BadRequestException('Asset code already exists');
    }

    return this.prisma.asset.create({
      data: {
        assetCode: dto.assetCode,
        name: dto.name,
        description: dto.description,
        category: dto.category as any,
        manufacturer: dto.manufacturer,
        model: dto.model,
        serialNumber: dto.serialNumber,
        purchaseDate: new Date(dto.purchaseDate),
        purchasePrice: dto.purchasePrice,
        currentValue: dto.purchasePrice,
        depreciationRate: dto.depreciationRate,
        location: dto.location,
        assignedTo: dto.assignedTo,
        notes: dto.notes,
        warrantyExpiry: dto.warrantyExpiry ? new Date(dto.warrantyExpiry) : null,
      },
    });
  }

  async getAssets(category?: string, status?: string) {
    const where: any = {};
    if (category) where.category = category;
    if (status) where.status = status;

    return this.prisma.asset.findMany({
      where,
      include: {
        _count: {
          select: {
            maintenanceLogs: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getAssetById(id: string) {
    const asset = await this.prisma.asset.findUnique({
      where: { id },
      include: {
        maintenanceLogs: {
          orderBy: {
            performedAt: 'desc',
          },
          take: 20,
        },
      },
    });

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    return asset;
  }

  async updateAsset(id: string, dto: UpdateAssetDto) {
    await this.getAssetById(id);

    return this.prisma.asset.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        location: dto.location,
        status: dto.status as any,
        condition: dto.condition as any,
        assignedTo: dto.assignedTo,
        notes: dto.notes,
        currentValue: dto.currentValue,
        nextMaintenanceAt: dto.nextMaintenanceAt ? new Date(dto.nextMaintenanceAt) : undefined,
      },
    });
  }

  async deleteAsset(id: string) {
    await this.getAssetById(id);
    return this.prisma.asset.delete({ where: { id } });
  }

  async addMaintenanceLog(assetId: string, dto: CreateMaintenanceLogDto) {
    const asset = await this.getAssetById(assetId);

    const log = await this.prisma.maintenanceLog.create({
      data: {
        assetId,
        maintenanceType: dto.maintenanceType,
        description: dto.description,
        performedBy: dto.performedBy,
        performedAt: new Date(dto.performedAt),
        cost: dto.cost,
        nextDueDate: dto.nextDueDate ? new Date(dto.nextDueDate) : null,
        notes: dto.notes,
      },
    });

    await this.prisma.asset.update({
      where: { id: assetId },
      data: {
        lastMaintenanceAt: new Date(dto.performedAt),
        nextMaintenanceAt: dto.nextDueDate ? new Date(dto.nextDueDate) : undefined,
      },
    });

    return log;
  }

  async getMaintenanceLogs(assetId?: string) {
    const where = assetId ? { assetId } : {};

    return this.prisma.maintenanceLog.findMany({
      where,
      include: {
        asset: {
          select: {
            assetCode: true,
            name: true,
          },
        },
      },
      orderBy: {
        performedAt: 'desc',
      },
      take: 100,
    });
  }

  async getAssetStats() {
    const [totalAssets, activeAssets, maintenanceAssets, criticalAssets] = await Promise.all([
      this.prisma.asset.count(),
      this.prisma.asset.count({ where: { status: 'ACTIVE' } }),
      this.prisma.asset.count({ where: { status: 'MAINTENANCE' } }),
      this.prisma.asset.count({ where: { condition: 'CRITICAL' } }),
    ]);

    const assets = await this.prisma.asset.findMany({
      select: { purchasePrice: true, currentValue: true },
    });

    const totalValue = assets.reduce((sum, a) => sum + (a.currentValue || a.purchasePrice), 0);

    return {
      totalAssets,
      activeAssets,
      maintenanceAssets,
      criticalAssets,
      totalValue,
    };
  }

  async getMaintenanceDue() {
    const today = new Date();

    return this.prisma.asset.findMany({
      where: {
        nextMaintenanceAt: {
          lte: today,
        },
        status: {
          not: 'RETIRED',
        },
      },
      orderBy: {
        nextMaintenanceAt: 'asc',
      },
    });
  }
}

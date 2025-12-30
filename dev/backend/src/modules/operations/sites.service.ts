import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateSiteDto } from './dto';

@Injectable()
export class SitesService {
  constructor(private prisma: PrismaService) {}

  async createSite(dto: CreateSiteDto, userId: string) {
    const existing = await this.prisma.site.findUnique({
      where: { siteCode: dto.siteCode },
    });

    if (existing) {
      throw new BadRequestException('Site code already exists');
    }

    return this.prisma.site.create({
      data: {
        siteCode: dto.siteCode,
        name: dto.name,
        type: dto.type as any,
        status: dto.status as any,
        location: dto.location,
        address: dto.address,
        coordinates: dto.coordinates,
        area: dto.area,
        areaUnit: dto.areaUnit,
        description: dto.description,
        managerId: dto.managerId,
        managerName: dto.managerName,
        contactPhone: dto.contactPhone,
        contactEmail: dto.contactEmail,
        operatingHours: dto.operatingHours,
        establishedDate: dto.establishedDate ? new Date(dto.establishedDate) : null,
        closedDate: dto.closedDate ? new Date(dto.closedDate) : null,
        notes: dto.notes,
        createdById: userId,
      },
    });
  }

  async getSites(type?: string, status?: string) {
    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;

    return this.prisma.site.findMany({
      where,
      include: {
        _count: {
          select: {
            projects: true,
            productionLogs: true,
            fieldReports: true,
            shifts: true,
            equipmentUsage: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async getSiteById(id: string) {
    const site = await this.prisma.site.findUnique({
      where: { id },
      include: {
        projects: {
          select: {
            id: true,
            projectCode: true,
            name: true,
            status: true,
            startDate: true,
            endDate: true,
          },
          orderBy: {
            startDate: 'desc',
          },
        },
        _count: {
          select: {
            projects: true,
            productionLogs: true,
            fieldReports: true,
            shifts: true,
            equipmentUsage: true,
          },
        },
      },
    });

    if (!site) {
      throw new NotFoundException('Site not found');
    }

    return site;
  }

  async updateSite(id: string, dto: Partial<CreateSiteDto>) {
    const site = await this.getSiteById(id);

    if (dto.siteCode && dto.siteCode !== site.siteCode) {
      const existing = await this.prisma.site.findUnique({
        where: { siteCode: dto.siteCode },
      });

      if (existing) {
        throw new BadRequestException('Site code already exists');
      }
    }

    return this.prisma.site.update({
      where: { id },
      data: {
        siteCode: dto.siteCode,
        name: dto.name,
        type: dto.type as any,
        status: dto.status as any,
        location: dto.location,
        address: dto.address,
        coordinates: dto.coordinates,
        area: dto.area,
        areaUnit: dto.areaUnit,
        description: dto.description,
        managerId: dto.managerId,
        managerName: dto.managerName,
        contactPhone: dto.contactPhone,
        contactEmail: dto.contactEmail,
        operatingHours: dto.operatingHours,
        establishedDate: dto.establishedDate ? new Date(dto.establishedDate) : undefined,
        closedDate: dto.closedDate ? new Date(dto.closedDate) : undefined,
        notes: dto.notes,
      },
    });
  }

  async deleteSite(id: string) {
    const site = await this.getSiteById(id);

    if (site._count.projects > 0) {
      throw new BadRequestException(
        'Cannot delete site with associated projects. Remove or reassign projects first.',
      );
    }

    return this.prisma.site.delete({
      where: { id },
    });
  }

  async getSiteStats() {
    const [totalSites, activeSites, sitesByType] = await Promise.all([
      this.prisma.site.count(),
      this.prisma.site.count({ where: { status: 'ACTIVE' } }),
      this.prisma.site.groupBy({
        by: ['type'],
        _count: true,
      }),
    ]);

    return {
      totalSites,
      activeSites,
      inactiveSites: totalSites - activeSites,
      sitesByType,
    };
  }
}

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateWarehouseDto } from './dto';

@Injectable()
export class WarehousesService {
  constructor(private prisma: PrismaService) {}

  // Create warehouse
  async createWarehouse(dto: CreateWarehouseDto) {
    // Check if code already exists
    const existing = await this.prisma.warehouse.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new BadRequestException('Warehouse code already exists');
    }

    return this.prisma.warehouse.create({
      data: {
        code: dto.code,
        name: dto.name,
        location: dto.location,
        description: dto.description,
        managerId: dto.managerId,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
    });
  }

  // Get all warehouses
  async getWarehouses(activeOnly: boolean = false) {
    const where = activeOnly ? { isActive: true } : {};

    return this.prisma.warehouse.findMany({
      where,
      include: {
        _count: {
          select: {
            stockItems: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  // Get warehouse by ID
  async getWarehouseById(id: string) {
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id },
      include: {
        stockItems: {
          orderBy: {
            name: 'asc',
          },
        },
        _count: {
          select: {
            stockItems: true,
            movements: true,
          },
        },
      },
    });

    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }

    return warehouse;
  }

  // Update warehouse
  async updateWarehouse(id: string, dto: Partial<CreateWarehouseDto>) {
    const warehouse = await this.getWarehouseById(id);

    // If updating code, check it's unique
    if (dto.code && dto.code !== warehouse.code) {
      const existing = await this.prisma.warehouse.findUnique({
        where: { code: dto.code },
      });

      if (existing) {
        throw new BadRequestException('Warehouse code already exists');
      }
    }

    return this.prisma.warehouse.update({
      where: { id },
      data: {
        code: dto.code,
        name: dto.name,
        location: dto.location,
        description: dto.description,
        managerId: dto.managerId,
        isActive: dto.isActive,
      },
    });
  }

  // Delete warehouse
  async deleteWarehouse(id: string) {
    const warehouse = await this.getWarehouseById(id);

    // Check if warehouse has stock items
    if (warehouse._count.stockItems > 0) {
      throw new BadRequestException('Cannot delete warehouse with stock items. Move or delete items first.');
    }

    return this.prisma.warehouse.delete({
      where: { id },
    });
  }

  // Seed default warehouses
  async seedDefaultWarehouses() {
    const warehouses = [
      {
        code: 'WH-MAIN',
        name: 'Main Warehouse',
        location: 'Accra, Ghana',
        description: 'Primary storage facility for all mining equipment and consumables',
      },
      {
        code: 'WH-SITE-01',
        name: 'Tarkwa Mine Site Warehouse',
        location: 'Tarkwa, Western Region',
        description: 'On-site warehouse at Tarkwa mining operations',
      },
      {
        code: 'WH-TOOLS',
        name: 'Tools & Equipment Store',
        location: 'Accra, Ghana',
        description: 'Specialized storage for tools and small equipment',
      },
    ];

    const created = [];
    for (const warehouse of warehouses) {
      const existing = await this.prisma.warehouse.findUnique({
        where: { code: warehouse.code },
      });

      if (!existing) {
        const result = await this.createWarehouse(warehouse);
        created.push(result);
      }
    }

    return created;
  }
}

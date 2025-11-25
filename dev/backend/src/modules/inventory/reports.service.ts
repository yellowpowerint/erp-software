import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class InventoryReportsService {
  constructor(private prisma: PrismaService) {}

  // Stock Valuation Report
  async getStockValuation(warehouseId?: string) {
    const where = warehouseId ? { warehouseId } : {};

    const items = await this.prisma.stockItem.findMany({
      where,
      include: {
        warehouse: {
          select: {
            name: true,
            code: true,
          },
        },
      },
    });

    const totalValue = items.reduce(
      (sum, item) => sum + (item.currentQuantity * (item.unitPrice || 0)),
      0,
    );

    const byCategory = items.reduce((acc, item) => {
      const category = item.category;
      if (!acc[category]) {
        acc[category] = {
          category,
          itemCount: 0,
          totalQuantity: 0,
          totalValue: 0,
        };
      }
      acc[category].itemCount++;
      acc[category].totalQuantity += item.currentQuantity;
      acc[category].totalValue += item.currentQuantity * (item.unitPrice || 0);
      return acc;
    }, {} as Record<string, any>);

    const byWarehouse = items.reduce((acc, item) => {
      const warehouseName = item.warehouse.name;
      if (!acc[warehouseName]) {
        acc[warehouseName] = {
          warehouse: warehouseName,
          itemCount: 0,
          totalValue: 0,
        };
      }
      acc[warehouseName].itemCount++;
      acc[warehouseName].totalValue += item.currentQuantity * (item.unitPrice || 0);
      return acc;
    }, {} as Record<string, any>);

    return {
      totalValue,
      totalItems: items.length,
      totalQuantity: items.reduce((sum, item) => sum + item.currentQuantity, 0),
      byCategory: Object.values(byCategory),
      byWarehouse: Object.values(byWarehouse),
    };
  }

  // Stock Movement Report (In/Out over period)
  async getStockMovementReport(
    startDate?: Date,
    endDate?: Date,
    warehouseId?: string,
  ) {
    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }
    if (warehouseId) where.warehouseId = warehouseId;

    const movements = await this.prisma.stockMovement.findMany({
      where,
      include: {
        item: {
          select: {
            itemCode: true,
            name: true,
            category: true,
          },
        },
        warehouse: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const summary = {
      totalMovements: movements.length,
      stockIn: 0,
      stockOut: 0,
      adjustments: 0,
      transfers: 0,
      totalValueIn: 0,
      totalValueOut: 0,
    };

    const byType: Record<string, number> = {};
    const byCategory: Record<string, any> = {};

    movements.forEach((movement) => {
      byType[movement.movementType] = (byType[movement.movementType] || 0) + 1;

      const category = movement.item.category;
      if (!byCategory[category]) {
        byCategory[category] = { in: 0, out: 0, count: 0 };
      }
      byCategory[category].count++;

      if (movement.movementType.includes('IN') || movement.movementType === 'RETURN') {
        summary.stockIn += movement.quantity;
        summary.totalValueIn += movement.totalValue || 0;
        byCategory[category].in += movement.quantity;
      } else if (movement.movementType === 'STOCK_OUT' || movement.movementType === 'DAMAGED' || movement.movementType === 'EXPIRED') {
        summary.stockOut += movement.quantity;
        summary.totalValueOut += movement.totalValue || 0;
        byCategory[category].out += movement.quantity;
      } else if (movement.movementType === 'ADJUSTMENT') {
        summary.adjustments++;
      } else if (movement.movementType === 'TRANSFER') {
        summary.transfers++;
      }
    });

    return {
      summary,
      byType,
      byCategory,
      movements: movements.slice(0, 100), // Limit to 100 most recent
    };
  }

  // Usage Pattern Analysis
  async getUsagePatterns(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const movements = await this.prisma.stockMovement.findMany({
      where: {
        createdAt: { gte: startDate },
        movementType: 'STOCK_OUT',
      },
      include: {
        item: {
          select: {
            id: true,
            itemCode: true,
            name: true,
            category: true,
            currentQuantity: true,
            reorderLevel: true,
          },
        },
      },
    });

    const itemUsage: Record<string, any> = {};

    movements.forEach((movement) => {
      const itemId = movement.item.id;
      if (!itemUsage[itemId]) {
        itemUsage[itemId] = {
          itemCode: movement.item.itemCode,
          name: movement.item.name,
          category: movement.item.category,
          currentQuantity: movement.item.currentQuantity,
          reorderLevel: movement.item.reorderLevel,
          totalUsed: 0,
          usageCount: 0,
          averageUsage: 0,
        };
      }
      itemUsage[itemId].totalUsed += movement.quantity;
      itemUsage[itemId].usageCount++;
    });

    // Calculate averages and predict reorder
    Object.values(itemUsage).forEach((item: any) => {
      item.averageUsage = item.totalUsed / days;
      item.daysUntilReorder = item.currentQuantity > 0 
        ? Math.floor((item.currentQuantity - item.reorderLevel) / (item.averageUsage || 1))
        : 0;
    });

    const topMovers = Object.values(itemUsage)
      .sort((a: any, b: any) => b.totalUsed - a.totalUsed)
      .slice(0, 10);

    const needsReorder = Object.values(itemUsage)
      .filter((item: any) => item.daysUntilReorder <= 7 && item.daysUntilReorder >= 0);

    return {
      period: `${days} days`,
      totalItems: Object.keys(itemUsage).length,
      topMovers,
      needsReorder,
      allItems: Object.values(itemUsage),
    };
  }

  // Expiring Items Report
  async getExpiringItems(daysAhead: number = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const expiringItems = await this.prisma.stockItem.findMany({
      where: {
        expiryDate: {
          lte: futureDate,
          gte: new Date(),
        },
      },
      include: {
        warehouse: {
          select: {
            name: true,
            code: true,
          },
        },
      },
      orderBy: {
        expiryDate: 'asc',
      },
    });

    const expiredItems = await this.prisma.stockItem.findMany({
      where: {
        expiryDate: {
          lt: new Date(),
        },
        currentQuantity: {
          gt: 0,
        },
      },
      include: {
        warehouse: {
          select: {
            name: true,
            code: true,
          },
        },
      },
    });

    const expiringValue = expiringItems.reduce(
      (sum, item) => sum + (item.currentQuantity * (item.unitPrice || 0)),
      0,
    );

    const expiredValue = expiredItems.reduce(
      (sum, item) => sum + (item.currentQuantity * (item.unitPrice || 0)),
      0,
    );

    return {
      expiringItems,
      expiredItems,
      counts: {
        expiringSoon: expiringItems.length,
        expired: expiredItems.length,
      },
      values: {
        expiringValue,
        expiredValue,
      },
    };
  }

  // Reorder Suggestions
  async getReorderSuggestions() {
    const lowStockItems = await this.prisma.stockItem.findMany({
      where: {
        currentQuantity: {
          lte: this.prisma.stockItem.fields.reorderLevel,
        },
      },
      include: {
        warehouse: {
          select: {
            name: true,
          },
        },
        movements: {
          where: {
            movementType: 'STOCK_OUT',
          },
          take: 10,
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    const suggestions = lowStockItems.map((item) => {
      const recentUsage = item.movements.reduce((sum, m) => sum + m.quantity, 0);
      const averageUsage = item.movements.length > 0 
        ? recentUsage / item.movements.length 
        : 0;

      const suggestedOrderQuantity = Math.max(
        item.reorderLevel * 2 - item.currentQuantity,
        Math.ceil(averageUsage * 7), // 7 days worth
      );

      return {
        itemCode: item.itemCode,
        name: item.name,
        currentQuantity: item.currentQuantity,
        reorderLevel: item.reorderLevel,
        maxStockLevel: item.maxStockLevel,
        warehouse: item.warehouse.name,
        suggestedOrderQuantity,
        estimatedCost: suggestedOrderQuantity * (item.unitPrice || 0),
        supplier: item.supplier,
        priority: item.currentQuantity === 0 ? 'URGENT' : 'HIGH',
      };
    });

    return suggestions.sort((a, b) => {
      if (a.priority === 'URGENT' && b.priority !== 'URGENT') return -1;
      if (b.priority === 'URGENT' && a.priority !== 'URGENT') return 1;
      return a.currentQuantity - b.currentQuantity;
    });
  }

  // Inventory Trends (last 30 days)
  async getInventoryTrends() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const movements = await this.prisma.stockMovement.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group by date
    const dailyData: Record<string, any> = {};

    movements.forEach((movement) => {
      const date = movement.createdAt.toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = {
          date,
          stockIn: 0,
          stockOut: 0,
          valueIn: 0,
          valueOut: 0,
          movements: 0,
        };
      }
      dailyData[date].movements++;
      if (movement.movementType.includes('IN') || movement.movementType === 'RETURN') {
        dailyData[date].stockIn += movement.quantity;
        dailyData[date].valueIn += movement.totalValue || 0;
      } else if (movement.movementType === 'STOCK_OUT') {
        dailyData[date].stockOut += movement.quantity;
        dailyData[date].valueOut += movement.totalValue || 0;
      }
    });

    return Object.values(dailyData);
  }
}

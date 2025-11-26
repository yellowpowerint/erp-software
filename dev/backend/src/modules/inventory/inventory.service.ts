import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import {
  CreateStockItemDto,
  UpdateStockItemDto,
  StockMovementDto,
} from "./dto";

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  // Create stock item
  async createStockItem(dto: CreateStockItemDto) {
    // Check if item code already exists
    const existing = await this.prisma.stockItem.findUnique({
      where: { itemCode: dto.itemCode },
    });

    if (existing) {
      throw new BadRequestException("Item code already exists");
    }

    // Verify warehouse exists
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id: dto.warehouseId },
    });

    if (!warehouse) {
      throw new NotFoundException("Warehouse not found");
    }

    return this.prisma.stockItem.create({
      data: {
        itemCode: dto.itemCode,
        name: dto.name,
        description: dto.description,
        category: dto.category as any,
        unit: dto.unit as any,
        unitPrice: dto.unitPrice,
        reorderLevel: dto.reorderLevel || 0,
        maxStockLevel: dto.maxStockLevel,
        warehouseId: dto.warehouseId,
        barcode: dto.barcode,
        supplier: dto.supplier,
        notes: dto.notes,
        currentQuantity: 0,
      },
      include: {
        warehouse: {
          select: {
            id: true,
            code: true,
            name: true,
            location: true,
          },
        },
      },
    });
  }

  // Get all stock items with filters
  async getStockItems(
    warehouseId?: string,
    category?: string,
    lowStock?: boolean,
  ) {
    const where: any = {};

    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    if (category) {
      where.category = category;
    }

    const items = await this.prisma.stockItem.findMany({
      where,
      include: {
        warehouse: {
          select: {
            id: true,
            code: true,
            name: true,
            location: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Filter by low stock if requested
    if (lowStock === true) {
      return items.filter((item) => item.currentQuantity <= item.reorderLevel);
    }

    return items;
  }

  // Get stock item by ID
  async getStockItemById(id: string) {
    const item = await this.prisma.stockItem.findUnique({
      where: { id },
      include: {
        warehouse: {
          select: {
            id: true,
            code: true,
            name: true,
            location: true,
          },
        },
        movements: {
          orderBy: {
            createdAt: "desc",
          },
          take: 50,
        },
      },
    });

    if (!item) {
      throw new NotFoundException("Stock item not found");
    }

    return item;
  }

  // Update stock item
  async updateStockItem(id: string, dto: UpdateStockItemDto) {
    await this.getStockItemById(id);

    return this.prisma.stockItem.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        category: dto.category as any,
        unit: dto.unit as any,
        unitPrice: dto.unitPrice,
        reorderLevel: dto.reorderLevel,
        maxStockLevel: dto.maxStockLevel,
        barcode: dto.barcode,
        supplier: dto.supplier,
        notes: dto.notes,
      },
      include: {
        warehouse: {
          select: {
            id: true,
            code: true,
            name: true,
            location: true,
          },
        },
      },
    });
  }

  // Delete stock item
  async deleteStockItem(id: string) {
    const item = await this.getStockItemById(id);

    if (item.currentQuantity > 0) {
      throw new BadRequestException(
        "Cannot delete item with stock. Remove all stock first.",
      );
    }

    return this.prisma.stockItem.delete({
      where: { id },
    });
  }

  // Record stock movement
  async recordStockMovement(
    itemId: string,
    userId: string,
    dto: StockMovementDto,
  ) {
    const item = await this.getStockItemById(itemId);

    const previousQty = item.currentQuantity;
    let newQty = previousQty;

    // Calculate new quantity based on movement type
    switch (dto.movementType) {
      case "STOCK_IN":
      case "RETURN":
        newQty = previousQty + dto.quantity;
        break;
      case "STOCK_OUT":
      case "DAMAGED":
      case "EXPIRED":
        if (previousQty < dto.quantity) {
          throw new BadRequestException("Insufficient stock");
        }
        newQty = previousQty - dto.quantity;
        break;
      case "ADJUSTMENT":
        // Adjustment can be positive or negative
        newQty = dto.quantity;
        break;
      default:
        throw new BadRequestException("Invalid movement type");
    }

    if (newQty < 0) {
      throw new BadRequestException("Stock quantity cannot be negative");
    }

    // Calculate total value
    const unitPrice = dto.unitPrice || item.unitPrice || 0;
    const totalValue = unitPrice * dto.quantity;

    // Create movement record and update item quantity in a transaction
    const result = await this.prisma.$transaction([
      this.prisma.stockMovement.create({
        data: {
          itemId,
          warehouseId: item.warehouseId,
          movementType: dto.movementType as any,
          quantity: dto.quantity,
          previousQty,
          newQty,
          unitPrice,
          totalValue,
          reference: dto.reference,
          notes: dto.notes,
          performedById: userId,
        },
      }),
      this.prisma.stockItem.update({
        where: { id: itemId },
        data: {
          currentQuantity: newQty,
        },
      }),
    ]);

    return result[0];
  }

  // Get stock movements
  async getStockMovements(
    itemId?: string,
    warehouseId?: string,
    movementType?: string,
  ) {
    const where: any = {};

    if (itemId) {
      where.itemId = itemId;
    }

    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    if (movementType) {
      where.movementType = movementType;
    }

    return this.prisma.stockMovement.findMany({
      where,
      include: {
        item: {
          select: {
            id: true,
            itemCode: true,
            name: true,
            unit: true,
          },
        },
        warehouse: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    });
  }

  // Get inventory statistics
  async getInventoryStats(warehouseId?: string) {
    const where = warehouseId ? { warehouseId } : {};

    const [totalItems, lowStockItems, outOfStockItems, totalValue] =
      await Promise.all([
        this.prisma.stockItem.count({ where }),
        this.prisma.stockItem.count({
          where: {
            ...where,
            currentQuantity: { lte: this.prisma.stockItem.fields.reorderLevel },
          },
        }),
        this.prisma.stockItem.count({
          where: {
            ...where,
            currentQuantity: 0,
          },
        }),
        this.prisma.stockItem.aggregate({
          where,
          _sum: {
            currentQuantity: true,
          },
        }),
      ]);

    // Get total stock value
    const items = await this.prisma.stockItem.findMany({
      where,
      select: {
        currentQuantity: true,
        unitPrice: true,
      },
    });

    const stockValue = items.reduce((sum, item) => {
      return sum + item.currentQuantity * (item.unitPrice || 0);
    }, 0);

    return {
      totalItems,
      lowStockItems,
      outOfStockItems,
      totalQuantity: totalValue._sum.currentQuantity || 0,
      stockValue,
    };
  }

  // Get low stock alerts
  async getLowStockAlerts(warehouseId?: string) {
    const where: any = {};

    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    const items = await this.prisma.stockItem.findMany({
      where,
      include: {
        warehouse: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
      orderBy: {
        currentQuantity: "asc",
      },
    });

    // Filter items where current quantity is at or below reorder level
    return items.filter((item) => item.currentQuantity <= item.reorderLevel);
  }
}

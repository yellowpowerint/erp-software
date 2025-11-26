import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { InventoryService } from "./inventory.service";
import {
  CreateStockItemDto,
  UpdateStockItemDto,
  StockMovementDto,
} from "./dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../auth/guards/roles.guard";

@Controller("inventory")
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // Create stock item
  @Post("items")
  @Roles("SUPER_ADMIN", "WAREHOUSE_MANAGER")
  createStockItem(@Body() dto: CreateStockItemDto) {
    return this.inventoryService.createStockItem(dto);
  }

  // Get all stock items
  @Get("items")
  getStockItems(
    @Query("warehouseId") warehouseId?: string,
    @Query("category") category?: string,
    @Query("lowStock") lowStock?: string,
  ) {
    return this.inventoryService.getStockItems(
      warehouseId,
      category,
      lowStock === "true",
    );
  }

  // Get stock item by ID
  @Get("items/:id")
  getStockItemById(@Param("id") id: string) {
    return this.inventoryService.getStockItemById(id);
  }

  // Update stock item
  @Put("items/:id")
  @Roles("SUPER_ADMIN", "WAREHOUSE_MANAGER")
  updateStockItem(@Param("id") id: string, @Body() dto: UpdateStockItemDto) {
    return this.inventoryService.updateStockItem(id, dto);
  }

  // Delete stock item
  @Delete("items/:id")
  @Roles("SUPER_ADMIN", "WAREHOUSE_MANAGER")
  deleteStockItem(@Param("id") id: string) {
    return this.inventoryService.deleteStockItem(id);
  }

  // Record stock movement
  @Post("items/:id/movements")
  @Roles("SUPER_ADMIN", "WAREHOUSE_MANAGER", "OPERATIONS_MANAGER")
  recordStockMovement(
    @Param("id") id: string,
    @CurrentUser() user: any,
    @Body() dto: StockMovementDto,
  ) {
    return this.inventoryService.recordStockMovement(id, user.userId, dto);
  }

  // Get stock movements
  @Get("movements")
  getStockMovements(
    @Query("itemId") itemId?: string,
    @Query("warehouseId") warehouseId?: string,
    @Query("movementType") movementType?: string,
  ) {
    return this.inventoryService.getStockMovements(
      itemId,
      warehouseId,
      movementType,
    );
  }

  // Get inventory statistics
  @Get("stats")
  getInventoryStats(@Query("warehouseId") warehouseId?: string) {
    return this.inventoryService.getInventoryStats(warehouseId);
  }

  // Get low stock alerts
  @Get("alerts/low-stock")
  getLowStockAlerts(@Query("warehouseId") warehouseId?: string) {
    return this.inventoryService.getLowStockAlerts(warehouseId);
  }
}

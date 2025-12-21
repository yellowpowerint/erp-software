import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Response } from "express";
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
import { CsvService } from "../csv/csv.service";

@Controller("inventory")
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly csvService: CsvService,
  ) {}

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

  @Post("import")
  @Roles("SUPER_ADMIN", "WAREHOUSE_MANAGER")
  @UseInterceptors(FileInterceptor("file"))
  async importInventory(
    @UploadedFile() file: Express.Multer.File,
    @Body()
    body: {
      mappings?: string;
      duplicateStrategy?: string;
      warehouseId?: string;
      warehouseCode?: string;
    },
    @CurrentUser() user: any,
  ) {
    const mappings = body.mappings
      ? this.csvService.parseJson(body.mappings, "mappings")
      : undefined;

    const context = {
      duplicateStrategy: body.duplicateStrategy,
      warehouseId: body.warehouseId,
      warehouseCode: body.warehouseCode,
    };

    const job = await this.csvService.createImportJob(
      "inventory",
      file,
      user.userId,
      mappings,
      context,
    );
    return { success: true, data: job };
  }

  @Get("import/sample")
  async downloadInventorySample(@Res({ passthrough: true }) res: Response) {
    const template = await this.csvService.getSampleTemplate("inventory");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=inventory-sample.csv`,
    );
    return template;
  }

  @Get("export")
  async exportInventory(
    @Query("warehouseId") warehouseId: string | undefined,
    @Query("category") category: string | undefined,
    @Query("columns") columns: string | undefined,
    @CurrentUser() user: any,
  ) {
    const cols = columns
      ? String(columns)
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean)
      : [
          "itemCode",
          "name",
          "category",
          "unit",
          "unitPrice",
          "reorderLevel",
          "maxStockLevel",
          "warehouseId",
          "supplier",
          "barcode",
          "notes",
          "currentQuantity",
          "createdAt",
        ];

    const filters: any = {};
    if (warehouseId) filters.warehouseId = warehouseId;
    if (category) filters.category = category;

    const job = await this.csvService.createExportJob(
      "inventory",
      filters,
      cols,
      user.userId,
      undefined,
    );
    return { success: true, data: job };
  }

  @Post("import/movements")
  @Roles("SUPER_ADMIN", "WAREHOUSE_MANAGER", "OPERATIONS_MANAGER")
  @UseInterceptors(FileInterceptor("file"))
  async importInventoryMovements(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { mappings?: string },
    @CurrentUser() user: any,
  ) {
    const mappings = body.mappings
      ? this.csvService.parseJson(body.mappings, "mappings")
      : undefined;
    const job = await this.csvService.createImportJob(
      "inventory_movements",
      file,
      user.userId,
      mappings,
    );
    return { success: true, data: job };
  }

  @Get("export/movements")
  async exportInventoryMovements(
    @Query("itemId") itemId: string | undefined,
    @Query("warehouseId") warehouseId: string | undefined,
    @Query("movementType") movementType: string | undefined,
    @Query("columns") columns: string | undefined,
    @CurrentUser() user: any,
  ) {
    const cols = columns
      ? String(columns)
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean)
      : [
          "itemCode",
          "itemName",
          "warehouseCode",
          "movementType",
          "quantity",
          "previousQty",
          "newQty",
          "unitPrice",
          "totalValue",
          "reference",
          "notes",
          "createdAt",
        ];

    const filters: any = {};
    if (itemId) filters.itemId = itemId;
    if (warehouseId) filters.warehouseId = warehouseId;
    if (movementType) filters.movementType = movementType;

    const job = await this.csvService.createExportJob(
      "inventory_movements",
      filters,
      cols,
      user.userId,
      undefined,
    );
    return { success: true, data: job };
  }
}

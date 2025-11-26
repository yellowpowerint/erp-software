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
import { WarehousesService } from "./warehouses.service";
import { CreateWarehouseDto } from "./dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../auth/guards/roles.guard";

@Controller("warehouses")
@UseGuards(JwtAuthGuard, RolesGuard)
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  // Create warehouse
  @Post()
  @Roles("SUPER_ADMIN", "CEO")
  createWarehouse(@Body() dto: CreateWarehouseDto) {
    return this.warehousesService.createWarehouse(dto);
  }

  // Get all warehouses
  @Get()
  getWarehouses(@Query("activeOnly") activeOnly?: string) {
    return this.warehousesService.getWarehouses(activeOnly === "true");
  }

  // Get warehouse by ID
  @Get(":id")
  getWarehouseById(@Param("id") id: string) {
    return this.warehousesService.getWarehouseById(id);
  }

  // Update warehouse
  @Put(":id")
  @Roles("SUPER_ADMIN", "CEO", "WAREHOUSE_MANAGER")
  updateWarehouse(
    @Param("id") id: string,
    @Body() dto: Partial<CreateWarehouseDto>,
  ) {
    return this.warehousesService.updateWarehouse(id, dto);
  }

  // Delete warehouse
  @Delete(":id")
  @Roles("SUPER_ADMIN", "CEO")
  deleteWarehouse(@Param("id") id: string) {
    return this.warehousesService.deleteWarehouse(id);
  }

  // Seed default warehouses
  @Post("seed")
  @Roles("SUPER_ADMIN")
  seedDefaultWarehouses() {
    return this.warehousesService.seedDefaultWarehouses();
  }
}

import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import {
  AutoRequisitionDto,
  CheckAvailabilityDto,
  InventorySyncDto,
} from "./dto";
import { InventoryIntegrationService } from "./inventory-integration.service";

@Controller("procurement/inventory")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProcurementInventoryController {
  constructor(
    private readonly inventoryIntegration: InventoryIntegrationService,
  ) {}

  @Post("sync")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
  )
  sync(@Body() dto: InventorySyncDto, @CurrentUser() _user: any) {
    const limit = dto.limit ?? 50;
    return this.inventoryIntegration.syncProcurementWithInventory(limit);
  }

  @Post("availability")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
  )
  availability(@Body() dto: CheckAvailabilityDto) {
    const items = (dto.items || []).map((i) => ({
      stockItemId: i.stockItemId,
      quantity: i.quantity ?? "0",
    }));
    return this.inventoryIntegration.checkStockAvailability(items);
  }

  @Post("requisitions/:requisitionId/reserve")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
  )
  reserve(
    @Param("requisitionId") requisitionId: string,
    @CurrentUser() user: any,
  ) {
    return this.inventoryIntegration.reserveStockForRequisition(
      requisitionId,
      user,
    );
  }

  @Post("requisitions/:requisitionId/release")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
  )
  release(
    @Param("requisitionId") requisitionId: string,
    @CurrentUser() user: any,
  ) {
    return this.inventoryIntegration.releaseReservedStock(requisitionId, user);
  }

  @Get("reorder-alerts")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
  )
  reorderAlerts() {
    return this.inventoryIntegration.getReorderAlerts();
  }

  @Post("auto-requisition")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
  )
  autoRequisition(@Body() dto: AutoRequisitionDto, @CurrentUser() user: any) {
    return this.inventoryIntegration.generateReorderRequisition(
      dto.stockItemId,
      user,
    );
  }
}

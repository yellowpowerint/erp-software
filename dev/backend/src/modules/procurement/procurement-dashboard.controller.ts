import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { ProcurementDashboardService } from "./procurement-dashboard.service";

@Controller("procurement/dashboard")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProcurementDashboardController {
  constructor(private readonly dashboardService: ProcurementDashboardService) {}

  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
  )
  dashboard() {
    return this.dashboardService.getDashboard();
  }

  @Get("spend")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
  )
  spend(@Query() query: any) {
    return this.dashboardService.getSpendAnalysis(query);
  }

  @Get("vendors")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
  )
  vendors() {
    return this.dashboardService.getVendorPerformance();
  }
}

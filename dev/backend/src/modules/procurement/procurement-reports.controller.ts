import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { ProcurementReportsService } from "./procurement-reports.service";

@Controller("procurement/reports")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProcurementReportsController {
  constructor(private readonly reports: ProcurementReportsService) {}

  @Get("spend")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
  )
  spend(@Query() query: any) {
    return this.reports.spendAnalysis(query);
  }

  @Get("vendors")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
  )
  vendors(@Query() query: any) {
    return this.reports.vendorPerformance(query);
  }

  @Get("cycle-time")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
  )
  cycleTime(@Query() query: any) {
    return this.reports.cycleTime(query);
  }

  @Get("savings")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
  )
  savings(@Query() query: any) {
    return this.reports.savings(query);
  }

  @Get("compliance")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
  )
  compliance() {
    return this.reports.compliance();
  }

  @Get("pending-actions")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
  )
  pendingActions() {
    return this.reports.pendingActions();
  }

  @Get("equipment")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
  )
  equipment(@Query() query: any) {
    return this.reports.equipmentProcurement(query);
  }

  @Get("consumables")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
  )
  consumables(@Query() query: any) {
    return this.reports.consumablesUsage(query);
  }

  @Get("site-spend")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
  )
  siteSpend(@Query() query: any) {
    return this.reports.siteWiseSpend(query);
  }

  @Get("safety")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
  )
  safety(@Query() query: any) {
    return this.reports.safetyEquipment(query);
  }
}

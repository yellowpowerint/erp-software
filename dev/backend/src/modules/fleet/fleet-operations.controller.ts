import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import {
  AssignBreakdownDto,
  BreakdownQueryDto,
  CreateBreakdownDto,
  ResolveBreakdownDto,
  UpdateBreakdownDto,
} from "./dto/breakdown.dto";
import {
  CreateUsageLogDto,
  UsageQueryDto,
  UsageSummaryQueryDto,
} from "./dto/usage.dto";
import {
  CreateFleetInspectionDto,
  DueInspectionsQueryDto,
  FleetInspectionQueryDto,
} from "./dto/fleet-inspection.dto";
import { FleetOperationsService } from "./fleet-operations.service";

@Controller("fleet")
@UseGuards(JwtAuthGuard, RolesGuard)
export class FleetOperationsController {
  constructor(private readonly fleetOps: FleetOperationsService) {}

  // Breakdowns
  @Post("breakdowns")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
    UserRole.EMPLOYEE,
  )
  reportBreakdown(@Body() dto: CreateBreakdownDto, @CurrentUser() user: any) {
    return this.fleetOps.createBreakdown(dto, user);
  }

  @Get("breakdowns")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
    UserRole.EMPLOYEE,
  )
  listBreakdowns(@Query() query: BreakdownQueryDto) {
    return this.fleetOps.listBreakdowns(query);
  }

  @Get("breakdowns/active")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
    UserRole.EMPLOYEE,
  )
  activeBreakdowns() {
    return this.fleetOps.activeBreakdowns();
  }

  @Get("breakdowns/stats")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
  )
  breakdownStats(@Query("days") days?: string) {
    const n = days ? Number(days) : 30;
    return this.fleetOps.breakdownStats(Number.isFinite(n) ? n : 30);
  }

  @Get("breakdowns/:id")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
    UserRole.EMPLOYEE,
  )
  getBreakdown(@Param("id") id: string) {
    return this.fleetOps.getBreakdownById(id);
  }

  @Put("breakdowns/:id")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
  )
  updateBreakdown(
    @Param("id") id: string,
    @Body() dto: UpdateBreakdownDto,
    @CurrentUser() user: any,
  ) {
    return this.fleetOps.updateBreakdown(id, dto, user);
  }

  @Post("breakdowns/:id/assign")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
  )
  assignBreakdown(
    @Param("id") id: string,
    @Body() dto: AssignBreakdownDto,
    @CurrentUser() user: any,
  ) {
    return this.fleetOps.assignBreakdown(id, dto, user);
  }

  @Post("breakdowns/:id/resolve")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
  )
  resolveBreakdown(
    @Param("id") id: string,
    @Body() dto: ResolveBreakdownDto,
    @CurrentUser() user: any,
  ) {
    return this.fleetOps.resolveBreakdown(id, dto, user);
  }

  @Get("assets/:id/breakdowns")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
    UserRole.EMPLOYEE,
  )
  assetBreakdowns(@Param("id") assetId: string) {
    return this.fleetOps.listAssetBreakdowns(assetId);
  }

  // Usage Logs
  @Post("usage")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
    UserRole.EMPLOYEE,
  )
  logUsage(@Body() dto: CreateUsageLogDto) {
    return this.fleetOps.createUsageLog(dto);
  }

  @Get("usage")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
    UserRole.EMPLOYEE,
  )
  listUsage(@Query() query: UsageQueryDto) {
    return this.fleetOps.listUsageLogs(query);
  }

  @Get("assets/:id/usage")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
    UserRole.EMPLOYEE,
  )
  assetUsage(@Param("id") assetId: string) {
    return this.fleetOps.assetUsageHistory(assetId);
  }

  @Get("usage/by-operator/:id")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
    UserRole.EMPLOYEE,
  )
  operatorUsage(
    @Param("id") operatorId: string,
    @Query() query: UsageQueryDto,
  ) {
    return this.fleetOps.operatorUsage(operatorId, query);
  }

  @Get("usage/by-site/:site")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
    UserRole.EMPLOYEE,
  )
  siteUsage(@Param("site") site: string, @Query() query: UsageQueryDto) {
    return this.fleetOps.siteUsage(site, query);
  }

  @Get("usage/summary")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
  )
  usageSummary(@Query() query: UsageSummaryQueryDto) {
    return this.fleetOps.usageSummary(query);
  }

  // Inspections
  @Post("inspections")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
    UserRole.EMPLOYEE,
  )
  createInspection(@Body() dto: CreateFleetInspectionDto) {
    return this.fleetOps.createInspection(dto);
  }

  @Get("inspections")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
    UserRole.EMPLOYEE,
  )
  listInspections(@Query() query: FleetInspectionQueryDto) {
    return this.fleetOps.listInspections(query);
  }

  @Get("assets/:id/inspections")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
    UserRole.EMPLOYEE,
  )
  assetInspections(@Param("id") assetId: string) {
    return this.fleetOps.assetInspections(assetId);
  }

  @Get("inspections/due")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
  )
  due(@Query() query: DueInspectionsQueryDto) {
    return this.fleetOps.dueInspections(query);
  }
}

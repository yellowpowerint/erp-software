import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { CsvService } from "../csv/csv.service";
import {
  CompareCostsQueryDto,
  CreateFleetCostDto,
  DateRangeQueryDto,
  FleetCostsQueryDto,
} from "./dto";
import { FleetAnalyticsService } from "./fleet-analytics.service";

@Controller("fleet")
@UseGuards(JwtAuthGuard, RolesGuard)
export class FleetAnalyticsController {
  constructor(
    private readonly analytics: FleetAnalyticsService,
    private readonly csvService: CsvService,
  ) {}

  private parseColumns(
    columns: string | undefined,
    fallback: string[],
  ): string[] {
    const cols = columns
      ? String(columns)
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean)
      : [];
    return cols.length ? cols : fallback;
  }

  @Post("costs")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
  )
  createCost(@Body() dto: CreateFleetCostDto, @CurrentUser() user: any) {
    return this.analytics.createCost(dto, user);
  }

  @Get("costs")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
  )
  listCosts(@Query() query: FleetCostsQueryDto) {
    return this.analytics.listCosts(query);
  }

  @Get("costs/asset/:assetId")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
  )
  assetCosts(
    @Param("assetId") assetId: string,
    @Query() query: DateRangeQueryDto,
  ) {
    return this.analytics.getAssetCosts(assetId, query);
  }

  @Get("analytics/cost-breakdown")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
  )
  costBreakdown(@Query() query: DateRangeQueryDto) {
    return this.analytics.getCostBreakdown(query);
  }

  @Get("analytics/compare-costs")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
  )
  compareCosts(@Query() query: CompareCostsQueryDto) {
    return this.analytics.compareCosts(query);
  }

  @Get("analytics/tco/:assetId")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
  )
  tco(@Param("assetId") assetId: string) {
    return this.analytics.getTco(assetId);
  }

  @Get("analytics/utilization")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
  )
  utilization(@Query() query: DateRangeQueryDto) {
    return this.analytics.getUtilization(query);
  }

  @Get("analytics/performance")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
  )
  performance(@Query() query: DateRangeQueryDto) {
    return this.analytics.getPerformance(query);
  }

  @Get("analytics/dashboard")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
  )
  dashboard() {
    return this.analytics.getDashboard();
  }

  @Get("export/costs")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
  )
  async exportCosts(
    @Query("assetId") assetId: string | undefined,
    @Query("category") category: string | undefined,
    @Query("from") from: string | undefined,
    @Query("to") to: string | undefined,
    @Query("columns") columns: string | undefined,
    @CurrentUser() user: any,
  ) {
    const cols = this.parseColumns(columns, [
      "id",
      "costDate",
      "assetId",
      "assetCode",
      "assetName",
      "category",
      "description",
      "amount",
      "currency",
      "referenceType",
      "referenceId",
      "invoiceNumber",
      "receiptUrl",
      "createdById",
      "createdByName",
      "approvedById",
      "approvedByName",
      "createdAt",
    ]);

    const filters: any = {};
    if (assetId) filters.assetId = assetId;
    if (category) filters.category = category;
    if (from) filters.from = from;
    if (to) filters.to = to;

    const job = await this.csvService.createExportJob(
      "fleet",
      filters,
      cols,
      user.userId,
      undefined,
      { exportType: "costs" },
    );
    return { success: true, data: job };
  }

  @Get("export/cost-breakdown")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
  )
  async exportCostBreakdown(
    @Query("from") from: string | undefined,
    @Query("to") to: string | undefined,
    @Query("columns") columns: string | undefined,
    @CurrentUser() user: any,
  ) {
    const cols = this.parseColumns(columns, [
      "from",
      "to",
      "category",
      "amount",
      "total",
    ]);
    const filters: any = {};
    if (from) filters.from = from;
    if (to) filters.to = to;

    const job = await this.csvService.createExportJob(
      "fleet",
      filters,
      cols,
      user.userId,
      undefined,
      { exportType: "cost_breakdown", from, to },
    );
    return { success: true, data: job };
  }

  @Get("export/utilization/by-type")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
  )
  async exportUtilizationByType(
    @Query("from") from: string,
    @Query("to") to: string,
    @Query("columns") columns: string | undefined,
    @CurrentUser() user: any,
  ) {
    const cols = this.parseColumns(columns, [
      "from",
      "to",
      "type",
      "hours",
      "utilization",
    ]);
    const job = await this.csvService.createExportJob(
      "fleet",
      { from, to },
      cols,
      user.userId,
      undefined,
      { exportType: "utilization_by_type", from, to },
    );
    return { success: true, data: job };
  }

  @Get("export/utilization/by-site")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
  )
  async exportUtilizationBySite(
    @Query("from") from: string,
    @Query("to") to: string,
    @Query("columns") columns: string | undefined,
    @CurrentUser() user: any,
  ) {
    const cols = this.parseColumns(columns, [
      "from",
      "to",
      "site",
      "hours",
      "utilization",
    ]);
    const job = await this.csvService.createExportJob(
      "fleet",
      { from, to },
      cols,
      user.userId,
      undefined,
      { exportType: "utilization_by_site", from, to },
    );
    return { success: true, data: job };
  }

  @Get("export/performance")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
  )
  async exportPerformance(
    @Query("from") from: string,
    @Query("to") to: string,
    @Query("columns") columns: string | undefined,
    @CurrentUser() user: any,
  ) {
    const cols = this.parseColumns(columns, [
      "from",
      "to",
      "assetId",
      "assetCode",
      "assetName",
      "failures",
      "downtimeHours",
      "mtbfHours",
      "mttrHours",
      "availabilityRate",
    ]);
    const job = await this.csvService.createExportJob(
      "fleet",
      { from, to },
      cols,
      user.userId,
      undefined,
      { exportType: "performance_assets", from, to },
    );
    return { success: true, data: job };
  }

  @Get("export/tco")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
  )
  async exportTco(
    @Query("assetId") assetId: string | undefined,
    @Query("columns") columns: string | undefined,
    @CurrentUser() user: any,
  ) {
    const cols = this.parseColumns(columns, [
      "assetId",
      "assetCode",
      "assetName",
      "fuel",
      "maintenance",
      "repairs",
      "other",
      "depreciation",
      "total",
    ]);
    const filters: any = {};
    if (assetId) filters.assetId = assetId;

    const job = await this.csvService.createExportJob(
      "fleet",
      filters,
      cols,
      user.userId,
      undefined,
      { exportType: "tco", assetId },
    );
    return { success: true, data: job };
  }
}

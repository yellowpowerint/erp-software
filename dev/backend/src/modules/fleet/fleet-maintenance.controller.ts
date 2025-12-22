import {
  Body,
  Controller,
  Delete,
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
  CancelMaintenanceRecordDto,
  CompleteMaintenanceRecordDto,
  CreateMaintenanceChecklistDto,
  CreateMaintenanceRecordDto,
  CreateMaintenanceScheduleDto,
  UpcomingMaintenanceQueryDto,
  UpdateMaintenanceRecordDto,
  UpdateMaintenanceScheduleDto,
} from "./dto";
import { FleetMaintenanceService } from "./fleet-maintenance.service";

@Controller("fleet")
@UseGuards(JwtAuthGuard, RolesGuard)
export class FleetMaintenanceController {
  constructor(private readonly maintenanceService: FleetMaintenanceService) {}

  @Post("maintenance/schedules")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
  )
  createSchedule(
    @Body() dto: CreateMaintenanceScheduleDto,
    @CurrentUser() user: any,
  ) {
    return this.maintenanceService.createSchedule(dto, user);
  }

  @Get("maintenance/schedules")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
    UserRole.EMPLOYEE,
  )
  listSchedules(@Query("assetId") assetId?: string) {
    return this.maintenanceService.getSchedules(assetId);
  }

  @Get("maintenance/schedules/:id")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
    UserRole.EMPLOYEE,
  )
  getSchedule(@Param("id") id: string) {
    return this.maintenanceService.getScheduleById(id);
  }

  @Put("maintenance/schedules/:id")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
  )
  updateSchedule(
    @Param("id") id: string,
    @Body() dto: UpdateMaintenanceScheduleDto,
    @CurrentUser() user: any,
  ) {
    return this.maintenanceService.updateSchedule(id, dto, user);
  }

  @Delete("maintenance/schedules/:id")
  @Roles(UserRole.SUPER_ADMIN, UserRole.CEO)
  deleteSchedule(@Param("id") id: string, @CurrentUser() user: any) {
    return this.maintenanceService.deleteSchedule(id, user);
  }

  @Get("assets/:id/schedules")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
    UserRole.EMPLOYEE,
  )
  getAssetSchedules(@Param("id") assetId: string) {
    return this.maintenanceService.getSchedules(assetId);
  }

  @Post("maintenance")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
  )
  createRecord(
    @Body() dto: CreateMaintenanceRecordDto,
    @CurrentUser() user: any,
  ) {
    return this.maintenanceService.createMaintenanceRecord(dto, user);
  }

  @Get("maintenance")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
    UserRole.EMPLOYEE,
  )
  listRecords(@Query("assetId") assetId?: string) {
    return this.maintenanceService.listMaintenanceRecords(assetId);
  }

  @Get("maintenance/:id")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
    UserRole.EMPLOYEE,
  )
  getRecord(@Param("id") id: string) {
    return this.maintenanceService.getMaintenanceRecordById(id);
  }

  @Put("maintenance/:id")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
  )
  updateRecord(
    @Param("id") id: string,
    @Body() dto: UpdateMaintenanceRecordDto,
    @CurrentUser() user: any,
  ) {
    return this.maintenanceService.updateMaintenanceRecord(id, dto, user);
  }

  @Post("maintenance/:id/complete")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
  )
  complete(
    @Param("id") id: string,
    @Body() dto: CompleteMaintenanceRecordDto,
    @CurrentUser() user: any,
  ) {
    return this.maintenanceService.completeMaintenanceRecord(id, dto, user);
  }

  @Post("maintenance/:id/cancel")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
  )
  cancel(
    @Param("id") id: string,
    @Body() dto: CancelMaintenanceRecordDto,
    @CurrentUser() user: any,
  ) {
    return this.maintenanceService.cancelMaintenanceRecord(id, dto, user);
  }

  @Get("assets/:id/maintenance")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
    UserRole.EMPLOYEE,
  )
  history(@Param("id") assetId: string) {
    return this.maintenanceService.getMaintenanceHistory(assetId);
  }

  @Get("maintenance/upcoming")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
  )
  upcoming(@Query() query: UpcomingMaintenanceQueryDto) {
    return this.maintenanceService.getUpcomingMaintenance(query);
  }

  @Get("maintenance/overdue")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
  )
  overdue() {
    return this.maintenanceService.getOverdueMaintenance();
  }

  @Get("maintenance/calendar")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
  )
  calendar(@Query("daysAhead") daysAhead?: string) {
    const n = daysAhead ? Number(daysAhead) : 30;
    return this.maintenanceService.getCalendar(Number.isFinite(n) ? n : 30);
  }

  @Get("maintenance/costs")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
  )
  costs(@Query("days") days?: string) {
    const n = days ? Number(days) : 30;
    return this.maintenanceService.getCostsSummary(Number.isFinite(n) ? n : 30);
  }

  @Get("maintenance/checklists")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
    UserRole.EMPLOYEE,
  )
  checklists(@Query("assetType") assetType?: string) {
    return this.maintenanceService.getChecklists(assetType);
  }

  @Post("maintenance/checklists")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
  )
  createChecklist(
    @Body() dto: CreateMaintenanceChecklistDto,
    @CurrentUser() user: any,
  ) {
    return this.maintenanceService.createChecklist(dto, user);
  }

  @Post("maintenance/reminders/run")
  @Roles(UserRole.SUPER_ADMIN, UserRole.CEO)
  runReminders(@CurrentUser() _user: any) {
    return this.maintenanceService.sendMaintenanceReminders();
  }
}

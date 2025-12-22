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
  CreateFuelRecordDto,
  CreateFuelTankDto,
  FuelAnomaliesQueryDto,
  FuelConsumptionQueryDto,
  FuelEfficiencyQueryDto,
  FuelRecordsQueryDto,
  TankDispenseDto,
  TankRefillDto,
  TankTransactionsQueryDto,
  UpdateFuelTankDto,
} from "./dto";
import { FleetFuelService } from "./fleet-fuel.service";

@Controller("fleet")
@UseGuards(JwtAuthGuard, RolesGuard)
export class FleetFuelController {
  constructor(private readonly fuelService: FleetFuelService) {}

  // Fuel records
  @Post("fuel")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
    UserRole.EMPLOYEE,
  )
  recordFuel(@Body() dto: CreateFuelRecordDto, @CurrentUser() user: any) {
    return this.fuelService.recordFuelTransaction(dto, user);
  }

  @Get("fuel")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
    UserRole.EMPLOYEE,
  )
  listFuel(@Query() query: FuelRecordsQueryDto) {
    return this.fuelService.listFuelRecords(query);
  }

  @Get("assets/:id/fuel")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
    UserRole.EMPLOYEE,
  )
  assetFuel(@Param("id") assetId: string) {
    return this.fuelService.getFuelHistory(assetId);
  }

  @Get("fuel/efficiency")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
  )
  efficiency(@Query() query: FuelEfficiencyQueryDto) {
    return this.fuelService.getFuelEfficiency(query);
  }

  @Get("fuel/consumption")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
  )
  consumption(@Query() query: FuelConsumptionQueryDto) {
    return this.fuelService.getFuelConsumptionReport(query);
  }

  @Get("fuel/anomalies")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
  )
  anomalies(@Query() query: FuelAnomaliesQueryDto) {
    return this.fuelService.detectAnomalies(query);
  }

  // Fuel tanks
  @Get("fuel/tanks")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
    UserRole.EMPLOYEE,
  )
  tanks() {
    return this.fuelService.getTankLevels();
  }

  @Post("fuel/tanks")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
  )
  createTank(@Body() dto: CreateFuelTankDto, @CurrentUser() user: any) {
    return this.fuelService.createTank(dto, user);
  }

  @Put("fuel/tanks/:id")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
  )
  updateTank(
    @Param("id") id: string,
    @Body() dto: UpdateFuelTankDto,
    @CurrentUser() user: any,
  ) {
    return this.fuelService.updateTank(id, dto, user);
  }

  @Post("fuel/tanks/:id/refill")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
  )
  refill(
    @Param("id") id: string,
    @Body() dto: TankRefillDto,
    @CurrentUser() user: any,
  ) {
    return this.fuelService.recordTankRefill(id, dto, user);
  }

  @Post("fuel/tanks/:id/dispense")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
  )
  dispense(
    @Param("id") id: string,
    @Body() dto: TankDispenseDto,
    @CurrentUser() user: any,
  ) {
    return this.fuelService.recordTankDispense(id, dto, user);
  }

  @Get("fuel/tanks/low")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
  )
  low() {
    return this.fuelService.getLowTankAlerts();
  }

  @Get("fuel/tanks/:id/transactions")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
  )
  transactions(
    @Param("id") id: string,
    @Query() query: TankTransactionsQueryDto,
  ) {
    return this.fuelService.getTankTransactions(id, query);
  }
}

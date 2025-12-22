import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { UserRole } from "@prisma/client";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { multerConfig } from "../documents/config/multer.config";
import {
  AssignFleetOperatorDto,
  CreateFleetAssetDto,
  DecommissionFleetAssetDto,
  FleetAssetsQueryDto,
  TransferFleetAssetDto,
  UpdateFleetAssetDto,
  UpdateFleetAssetStatusDto,
  UploadFleetDocumentDto,
} from "./dto";
import { FleetService } from "./fleet.service";

@Controller("fleet")
@UseGuards(JwtAuthGuard, RolesGuard)
export class FleetAssetsController {
  constructor(private readonly fleetService: FleetService) {}

  @Post("assets")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
  )
  createAsset(@Body() dto: CreateFleetAssetDto, @CurrentUser() user: any) {
    return this.fleetService.createAsset(dto, user);
  }

  @Get("assets")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
    UserRole.EMPLOYEE,
  )
  listAssets(@Query() query: FleetAssetsQueryDto) {
    return this.fleetService.getAssets(query);
  }

  @Get("assets/:id")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
    UserRole.EMPLOYEE,
  )
  getAsset(@Param("id") id: string, @CurrentUser() user: any) {
    return this.fleetService.getAssetById(id, user);
  }

  @Put("assets/:id")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
  )
  updateAsset(
    @Param("id") id: string,
    @Body() dto: UpdateFleetAssetDto,
    @CurrentUser() user: any,
  ) {
    return this.fleetService.updateAsset(id, dto, user);
  }

  @Delete("assets/:id")
  @Roles(UserRole.SUPER_ADMIN, UserRole.CEO)
  deleteAsset(@Param("id") id: string, @CurrentUser() user: any) {
    return this.fleetService.deleteAsset(id, user);
  }

  @Post("assets/:id/status")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
  )
  updateStatus(
    @Param("id") id: string,
    @Body() dto: UpdateFleetAssetStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.fleetService.updateAssetStatus(id, dto, user);
  }

  @Post("assets/:id/transfer")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
  )
  transfer(
    @Param("id") id: string,
    @Body() dto: TransferFleetAssetDto,
    @CurrentUser() user: any,
  ) {
    return this.fleetService.transferAsset(id, dto, user);
  }

  @Post("assets/:id/assign")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
  )
  assign(
    @Param("id") id: string,
    @Body() dto: AssignFleetOperatorDto,
    @CurrentUser() user: any,
  ) {
    return this.fleetService.assignOperator(id, dto, user);
  }

  @Post("assets/:id/decommission")
  @Roles(UserRole.SUPER_ADMIN, UserRole.CEO)
  decommission(
    @Param("id") id: string,
    @Body() dto: DecommissionFleetAssetDto,
    @CurrentUser() user: any,
  ) {
    return this.fleetService.decommissionAsset(id, dto, user);
  }

  @Post("assets/:id/documents")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
  )
  @UseInterceptors(FileInterceptor("file", multerConfig))
  uploadDocument(
    @Param("id") assetId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadFleetDocumentDto,
    @CurrentUser() user: any,
  ) {
    return this.fleetService.uploadDocument(assetId, file, dto, user);
  }

  @Get("assets/:id/documents")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
    UserRole.EMPLOYEE,
  )
  listDocuments(@Param("id") assetId: string, @CurrentUser() user: any) {
    return this.fleetService.listDocuments(assetId, user);
  }

  @Delete("documents/:id")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
  )
  deleteDocument(@Param("id") id: string, @CurrentUser() user: any) {
    return this.fleetService.deleteDocument(id, user);
  }

  @Get("dashboard")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
  )
  dashboard() {
    return this.fleetService.dashboard();
  }

  @Get("alerts")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
  )
  alerts(@Query("daysAhead") daysAhead?: string) {
    const n = daysAhead ? Number(daysAhead) : 30;
    return this.fleetService.checkExpiringItems(Number.isFinite(n) ? n : 30);
  }

  @Get("by-location/:location")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
    UserRole.EMPLOYEE,
  )
  byLocation(@Param("location") location: string) {
    return this.fleetService.assetsByLocation(location);
  }

  @Get("by-type/:type")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
    UserRole.EMPLOYEE,
  )
  byType(@Param("type") type: string) {
    return this.fleetService.assetsByType(type as any);
  }
}

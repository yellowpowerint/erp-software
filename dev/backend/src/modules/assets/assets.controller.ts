import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Response } from "express";
import {
  AssetsService,
  CreateAssetDto,
  UpdateAssetDto,
  CreateMaintenanceLogDto,
} from "./assets.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../auth/guards/roles.guard";
import { CsvService } from "../csv/csv.service";

@Controller("assets")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssetsController {
  constructor(
    private readonly assetsService: AssetsService,
    private readonly csvService: CsvService,
  ) {}

  @Post()
  @Roles("SUPER_ADMIN", "CEO", "OPERATIONS_MANAGER")
  createAsset(@Body() dto: CreateAssetDto) {
    return this.assetsService.createAsset(dto);
  }

  @Get()
  getAssets(
    @Query("category") category?: string,
    @Query("status") status?: string,
  ) {
    return this.assetsService.getAssets(category, status);
  }

  @Get("stats")
  getAssetStats() {
    return this.assetsService.getAssetStats();
  }

  @Get("maintenance-due")
  getMaintenanceDue() {
    return this.assetsService.getMaintenanceDue();
  }

  @Get(":id")
  getAssetById(@Param("id") id: string) {
    return this.assetsService.getAssetById(id);
  }

  @Put(":id")
  @Roles("SUPER_ADMIN", "CEO", "OPERATIONS_MANAGER")
  updateAsset(@Param("id") id: string, @Body() dto: UpdateAssetDto) {
    return this.assetsService.updateAsset(id, dto);
  }

  @Delete(":id")
  @Roles("SUPER_ADMIN", "CEO")
  deleteAsset(@Param("id") id: string) {
    return this.assetsService.deleteAsset(id);
  }

  @Post(":id/maintenance")
  @Roles("SUPER_ADMIN", "CEO", "OPERATIONS_MANAGER", "WAREHOUSE_MANAGER")
  addMaintenanceLog(
    @Param("id") id: string,
    @Body() dto: CreateMaintenanceLogDto,
  ) {
    return this.assetsService.addMaintenanceLog(id, dto);
  }

  @Get("maintenance/logs")
  getMaintenanceLogs(@Query("assetId") assetId?: string) {
    return this.assetsService.getMaintenanceLogs(assetId);
  }

  @Post("import")
  @Roles("SUPER_ADMIN", "CEO", "OPERATIONS_MANAGER")
  @UseInterceptors(FileInterceptor("file"))
  async importAssets(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { mappings?: string; duplicateStrategy?: string },
    @Request() req: any,
  ) {
    if (!file) {
      throw new BadRequestException("file is required");
    }

    const mappings = body.mappings ? this.csvService.parseJson(body.mappings, "mappings") : undefined;
    const context = { duplicateStrategy: body.duplicateStrategy };
    const job = await this.csvService.createImportJob("assets", file, req.user.userId, mappings, context);
    return { success: true, data: job };
  }

  @Get("import/sample")
  async downloadAssetsSample(@Res({ passthrough: true }) res: Response) {
    const template = await this.csvService.getSampleTemplate("assets");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=assets-sample.csv`);
    return template;
  }

  @Get("export")
  async exportAssets(
    @Query("category") category: string | undefined,
    @Query("status") status: string | undefined,
    @Query("columns") columns: string | undefined,
    @Request() req: any,
  ) {
    const cols = columns
      ? String(columns)
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean)
      : [
          "assetCode",
          "name",
          "category",
          "manufacturer",
          "model",
          "serialNumber",
          "purchaseDate",
          "purchasePrice",
          "currentValue",
          "depreciationRate",
          "location",
          "status",
          "condition",
          "assignedTo",
          "notes",
          "createdAt",
        ];

    const filters: any = {};
    if (category) filters.category = category;
    if (status) filters.status = status;

    const job = await this.csvService.createExportJob("assets", filters, cols, req.user.userId, undefined);
    return { success: true, data: job };
  }
}

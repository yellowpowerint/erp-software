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
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { multerConfig } from "../documents/config/multer.config";
import { RequisitionsService } from "./requisitions.service";
import {
  AddRequisitionItemDto,
  CancelRequisitionDto,
  CreateRequisitionDto,
  UpdateRequisitionDto,
  UpdateRequisitionItemDto,
} from "./dto";
import { UserRole } from "@prisma/client";

@Controller("procurement/requisitions")
@UseGuards(JwtAuthGuard, RolesGuard)
export class RequisitionsController {
  constructor(private readonly requisitionsService: RequisitionsService) {}

  @Post()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.DEPARTMENT_HEAD,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.EMPLOYEE,
  )
  create(@CurrentUser() user: any, @Body() dto: CreateRequisitionDto) {
    return this.requisitionsService.createRequisition(dto, user.userId);
  }

  @Get()
  getRequisitions(@CurrentUser() user: any, @Query() query: any) {
    return this.requisitionsService.getRequisitions(
      query,
      user.userId,
      user.role,
    );
  }

  @Get("my")
  getMyRequisitions(@CurrentUser() user: any) {
    return this.requisitionsService.getMyRequisitions(user.userId);
  }

  @Get("pending")
  getPendingApprovals(@CurrentUser() user: any) {
    return this.requisitionsService.getPendingApprovals(user.userId);
  }

  @Get("stats")
  getStats(@CurrentUser() user: any) {
    return this.requisitionsService.getStats(user.userId, user.role);
  }

  @Get(":id")
  getById(@Param("id") id: string, @CurrentUser() user: any) {
    return this.requisitionsService.getRequisitionById(
      id,
      user.userId,
      user.role,
    );
  }

  @Put(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateRequisitionDto,
    @CurrentUser() user: any,
  ) {
    return this.requisitionsService.updateRequisition(
      id,
      dto,
      user.userId,
      user.role,
    );
  }

  @Delete(":id")
  remove(@Param("id") id: string, @CurrentUser() user: any) {
    return this.requisitionsService.deleteRequisition(
      id,
      user.userId,
      user.role,
    );
  }

  @Post(":id/submit")
  submit(@Param("id") id: string, @CurrentUser() user: any) {
    return this.requisitionsService.submitRequisition(
      id,
      user.userId,
      user.role,
    );
  }

  @Post(":id/cancel")
  cancel(
    @Param("id") id: string,
    @Body() dto: CancelRequisitionDto,
    @CurrentUser() user: any,
  ) {
    return this.requisitionsService.cancelRequisition(
      id,
      user.userId,
      user.role,
      dto.reason,
    );
  }

  @Post(":id/items")
  addItem(
    @Param("id") id: string,
    @Body() dto: AddRequisitionItemDto,
    @CurrentUser() user: any,
  ) {
    return this.requisitionsService.addItem(id, dto, user.userId, user.role);
  }

  @Put(":id/items/:itemId")
  updateItem(
    @Param("id") id: string,
    @Param("itemId") itemId: string,
    @Body() dto: UpdateRequisitionItemDto,
    @CurrentUser() user: any,
  ) {
    return this.requisitionsService.updateItem(
      id,
      itemId,
      dto,
      user.userId,
      user.role,
    );
  }

  @Delete(":id/items/:itemId")
  deleteItem(
    @Param("id") id: string,
    @Param("itemId") itemId: string,
    @CurrentUser() user: any,
  ) {
    return this.requisitionsService.deleteItem(
      id,
      itemId,
      user.userId,
      user.role,
    );
  }

  @Post(":id/attachments")
  @UseInterceptors(FileInterceptor("file", multerConfig))
  uploadAttachment(
    @Param("id") id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    return this.requisitionsService.uploadAttachment(
      id,
      file,
      user.userId,
      user.role,
    );
  }
}

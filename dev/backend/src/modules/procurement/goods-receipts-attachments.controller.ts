import { Controller, Post, Param, UseGuards, UseInterceptors, UploadedFile } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { UserRole } from "@prisma/client";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { multerConfig } from "../documents/config/multer.config";
import { GoodsReceiptsService } from "./goods-receipts.service";

@Controller("procurement/goods-receipts")
@UseGuards(JwtAuthGuard, RolesGuard)
export class GoodsReceiptsAttachmentsController {
  constructor(private readonly goodsReceiptsService: GoodsReceiptsService) {}

  @Post(":id/attachments")
  @Roles(UserRole.SUPER_ADMIN, UserRole.CEO, UserRole.CFO, UserRole.PROCUREMENT_OFFICER, UserRole.OPERATIONS_MANAGER, UserRole.WAREHOUSE_MANAGER)
  @UseInterceptors(FileInterceptor("file", multerConfig))
  uploadAttachment(@Param("id") grnId: string, @UploadedFile() file: Express.Multer.File, @CurrentUser() user: any) {
    return this.goodsReceiptsService.uploadAttachment(grnId, file, user.userId);
  }
}

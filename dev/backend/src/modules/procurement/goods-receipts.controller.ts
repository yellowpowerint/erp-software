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
  AcceptGoodsReceiptDto,
  CreateGoodsReceiptDto,
  RejectGoodsReceiptDto,
  SubmitQualityInspectionDto,
  UpdateGoodsReceiptDto,
} from "./dto";
import { GoodsReceiptsService } from "./goods-receipts.service";

@Controller("procurement/goods-receipts")
@UseGuards(JwtAuthGuard, RolesGuard)
export class GoodsReceiptsController {
  constructor(private readonly goodsReceiptsService: GoodsReceiptsService) {}

  @Post()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
  )
  create(@CurrentUser() user: any, @Body() dto: CreateGoodsReceiptDto) {
    return this.goodsReceiptsService.createGRN(dto, user);
  }

  @Get()
  list(@CurrentUser() user: any, @Query() query: any) {
    return this.goodsReceiptsService.listGRNs(query, user);
  }

  @Get(":id")
  getById(@Param("id") id: string, @CurrentUser() user: any) {
    return this.goodsReceiptsService.getGRNById(id, user);
  }

  @Put(":id")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
  )
  update(@Param("id") id: string, @CurrentUser() user: any, @Body() dto: UpdateGoodsReceiptDto) {
    return this.goodsReceiptsService.updateGRN(id, dto, user);
  }

  @Post(":id/inspect")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.SAFETY_OFFICER,
  )
  inspect(
    @Param("id") id: string,
    @CurrentUser() user: any,
    @Body() dto: SubmitQualityInspectionDto,
  ) {
    return this.goodsReceiptsService.submitInspection(id, dto, user);
  }

  @Post(":id/accept")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
  )
  accept(@Param("id") id: string, @CurrentUser() user: any, @Body() dto: AcceptGoodsReceiptDto) {
    return this.goodsReceiptsService.acceptGoods(id, dto, user);
  }

  @Post(":id/reject")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
  )
  reject(@Param("id") id: string, @CurrentUser() user: any, @Body() dto: RejectGoodsReceiptDto) {
    return this.goodsReceiptsService.rejectGoods(id, dto, user);
  }
}

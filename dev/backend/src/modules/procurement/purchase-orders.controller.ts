import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from "@nestjs/common";
import { Response } from "express";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole } from "@prisma/client";
import {
  CancelPurchaseOrderDto,
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
} from "./dto";
import { PurchaseOrdersService } from "./purchase-orders.service";

@Controller("procurement/purchase-orders")
@UseGuards(JwtAuthGuard, RolesGuard)
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @Post()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
  )
  create(@CurrentUser() user: any, @Body() dto: CreatePurchaseOrderDto) {
    return this.purchaseOrdersService.createPO(dto, user);
  }

  @Get()
  list(@CurrentUser() user: any, @Query() query: any) {
    return this.purchaseOrdersService.listPOs(query, user);
  }

  @Get(":id")
  getById(@Param("id") id: string, @CurrentUser() user: any) {
    return this.purchaseOrdersService.getPOById(id, user);
  }

  @Put(":id")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
  )
  update(@Param("id") id: string, @CurrentUser() user: any, @Body() dto: UpdatePurchaseOrderDto) {
    return this.purchaseOrdersService.updatePO(id, dto, user);
  }

  @Post(":id/approve")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
  )
  approve(@Param("id") id: string, @CurrentUser() user: any) {
    return this.purchaseOrdersService.approvePO(id, user);
  }

  @Post(":id/send")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
  )
  send(@Param("id") id: string, @CurrentUser() user: any) {
    return this.purchaseOrdersService.sendPO(id, user);
  }

  @Post(":id/cancel")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
  )
  cancel(
    @Param("id") id: string,
    @Body() dto: CancelPurchaseOrderDto,
    @CurrentUser() user: any,
  ) {
    return this.purchaseOrdersService.cancelPO(id, dto, user);
  }

  @Post("from-rfq/:responseId")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
  )
  createFromRfq(@Param("responseId") responseId: string, @CurrentUser() user: any) {
    return this.purchaseOrdersService.createFromRFQResponse(responseId, user);
  }

  @Get(":id/pdf")
  async pdf(@Param("id") id: string, @CurrentUser() user: any, @Res() res: Response) {
    const pdfBuffer = await this.purchaseOrdersService.generatePOPdf(id, user);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=\"purchase-order-${id}.pdf\"`);
    res.send(pdfBuffer);
  }
}

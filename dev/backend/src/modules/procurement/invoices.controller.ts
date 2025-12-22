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
import {
  ApproveVendorInvoiceDto,
  CreateVendorInvoiceDto,
  DisputeVendorInvoiceDto,
  MatchVendorInvoiceDto,
  RecordVendorPaymentDto,
} from "./dto";
import { InvoicesService } from "./invoices.service";
import { PaymentsService } from "./payments.service";

@Controller("procurement/invoices")
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvoicesController {
  constructor(
    private readonly invoicesService: InvoicesService,
    private readonly paymentsService: PaymentsService,
  ) {}

  @Post()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
  )
  create(@CurrentUser() user: any, @Body() dto: CreateVendorInvoiceDto) {
    return this.invoicesService.createInvoice(dto, user);
  }

  @Get()
  list(@CurrentUser() user: any, @Query() query: any) {
    return this.invoicesService.listInvoices(query, user);
  }

  @Get("pending-match")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
  )
  pending(@CurrentUser() user: any) {
    return this.invoicesService.pendingMatch(user);
  }

  @Get("discrepancies")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
  )
  discrepancies(@CurrentUser() user: any) {
    return this.invoicesService.discrepancies(user);
  }

  @Get(":id")
  getById(@Param("id") id: string, @CurrentUser() user: any) {
    return this.invoicesService.getInvoiceById(id, user);
  }

  @Post(":id/match")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
  )
  match(
    @Param("id") id: string,
    @CurrentUser() user: any,
    @Body() dto: MatchVendorInvoiceDto,
  ) {
    return this.invoicesService.runMatching(id, dto, user);
  }

  @Post(":id/approve")
  @Roles(UserRole.SUPER_ADMIN, UserRole.CEO, UserRole.CFO, UserRole.ACCOUNTANT)
  approve(
    @Param("id") id: string,
    @CurrentUser() user: any,
    @Body() dto: ApproveVendorInvoiceDto,
  ) {
    return this.invoicesService.approveInvoice(id, dto, user);
  }

  @Post(":id/dispute")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
  )
  dispute(
    @Param("id") id: string,
    @CurrentUser() user: any,
    @Body() dto: DisputeVendorInvoiceDto,
  ) {
    return this.invoicesService.disputeInvoice(id, dto, user);
  }

  @Post(":id/pay")
  @Roles(UserRole.SUPER_ADMIN, UserRole.CEO, UserRole.CFO, UserRole.ACCOUNTANT)
  pay(
    @Param("id") id: string,
    @CurrentUser() user: any,
    @Body() dto: RecordVendorPaymentDto,
  ) {
    return this.paymentsService.recordPayment(id, dto, user);
  }
}

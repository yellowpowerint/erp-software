import { Controller, Get, Post, Body, Param, UseGuards } from "@nestjs/common";
import { PaymentRequestsService } from "./payment-requests.service";
import { CreatePaymentRequestDto, ApprovalActionDto, RejectionActionDto } from "./dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../auth/guards/roles.guard";

@Controller("approvals/payment-requests")
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentRequestsController {
  constructor(
    private readonly paymentRequestsService: PaymentRequestsService,
  ) {}

  @Post()
  @Roles("SUPER_ADMIN", "CEO", "CFO", "ACCOUNTANT", "DEPARTMENT_HEAD")
  createPaymentRequest(
    @CurrentUser() user: any,
    @Body() dto: CreatePaymentRequestDto,
  ) {
    return this.paymentRequestsService.createPaymentRequest(user.userId, dto);
  }

  @Get()
  getPaymentRequests(@CurrentUser() user: any) {
    return this.paymentRequestsService.getPaymentRequests(
      user.userId,
      user.role,
    );
  }

  @Get(":id")
  getPaymentRequestById(@Param("id") id: string) {
    return this.paymentRequestsService.getPaymentRequestById(id);
  }

  @Post(":id/approve")
  @Roles("SUPER_ADMIN", "CEO", "CFO", "ACCOUNTANT")
  approvePaymentRequest(
    @Param("id") id: string,
    @CurrentUser() user: any,
    @Body() dto: ApprovalActionDto,
  ) {
    return this.paymentRequestsService.approvePaymentRequest(
      id,
      user.userId,
      user.role,
      dto,
    );
  }

  @Post(":id/reject")
  @Roles("SUPER_ADMIN", "CEO", "CFO", "ACCOUNTANT")
  rejectPaymentRequest(
    @Param("id") id: string,
    @CurrentUser() user: any,
    @Body() dto: RejectionActionDto,
  ) {
    return this.paymentRequestsService.rejectPaymentRequest(
      id,
      user.userId,
      user.role,
      dto,
    );
  }
}

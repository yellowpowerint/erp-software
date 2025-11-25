import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApprovalsService } from './approvals.service';
import { CreateInvoiceDto, CreatePurchaseRequestDto, ApprovalActionDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('approvals')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  // Invoice endpoints
  @Post('invoices')
  @Roles('SUPER_ADMIN', 'CFO', 'ACCOUNTANT')
  createInvoice(@CurrentUser() user: any, @Body() dto: CreateInvoiceDto) {
    return this.approvalsService.createInvoice(user.userId, dto);
  }

  @Get('invoices')
  getInvoices(@CurrentUser() user: any) {
    return this.approvalsService.getInvoices(user.userId, user.role);
  }

  @Get('invoices/:id')
  getInvoiceById(@Param('id') id: string) {
    return this.approvalsService.getInvoiceById(id);
  }

  @Post('invoices/:id/approve')
  @Roles('SUPER_ADMIN', 'CEO', 'CFO', 'ACCOUNTANT')
  approveInvoice(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: ApprovalActionDto,
  ) {
    return this.approvalsService.approveInvoice(id, user.userId, user.role, dto);
  }

  @Post('invoices/:id/reject')
  @Roles('SUPER_ADMIN', 'CEO', 'CFO', 'ACCOUNTANT')
  rejectInvoice(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: ApprovalActionDto,
  ) {
    return this.approvalsService.rejectInvoice(id, user.userId, user.role, dto);
  }

  // Purchase Request endpoints
  @Post('purchase-requests')
  @Roles('SUPER_ADMIN', 'CEO', 'CFO', 'PROCUREMENT_OFFICER', 'DEPARTMENT_HEAD')
  createPurchaseRequest(@CurrentUser() user: any, @Body() dto: CreatePurchaseRequestDto) {
    return this.approvalsService.createPurchaseRequest(user.userId, dto);
  }

  @Get('purchase-requests')
  getPurchaseRequests(@CurrentUser() user: any) {
    return this.approvalsService.getPurchaseRequests(user.userId, user.role);
  }

  @Get('purchase-requests/:id')
  getPurchaseRequestById(@Param('id') id: string) {
    return this.approvalsService.getPurchaseRequestById(id);
  }

  @Post('purchase-requests/:id/approve')
  @Roles('SUPER_ADMIN', 'CEO', 'CFO', 'PROCUREMENT_OFFICER')
  approvePurchaseRequest(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: ApprovalActionDto,
  ) {
    return this.approvalsService.approvePurchaseRequest(id, user.userId, user.role, dto);
  }

  @Post('purchase-requests/:id/reject')
  @Roles('SUPER_ADMIN', 'CEO', 'CFO', 'PROCUREMENT_OFFICER')
  rejectPurchaseRequest(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: ApprovalActionDto,
  ) {
    return this.approvalsService.rejectPurchaseRequest(id, user.userId, user.role, dto);
  }

  // Dashboard stats
  @Get('stats')
  getApprovalStats(@CurrentUser() user: any) {
    return this.approvalsService.getApprovalStats(user.userId, user.role);
  }
}

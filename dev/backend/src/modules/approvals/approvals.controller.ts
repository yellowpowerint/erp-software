import { Controller, Get, Post, Body, Param, Query, UseGuards, UseInterceptors, UploadedFile } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { multerConfig } from "../documents/config/multer.config";
import { ApprovalsService } from "./approvals.service";
import {
  CreateInvoiceDto,
  CreatePurchaseRequestDto,
  ApprovalActionDto,
  ApprovalsListQueryDto,
  RejectionActionDto,
} from "./dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../auth/guards/roles.guard";

@Controller("approvals")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Get()
  async listApprovals(@CurrentUser() user: any, @Query() query: ApprovalsListQueryDto) {
    return this.approvalsService.getApprovalsList(user.userId, user.role, query);
  }

  @Get("item/:type/:id")
  async getApprovalDetail(
    @Param("type") type: string,
    @Param("id") id: string,
    @CurrentUser() user: any,
  ) {
    return this.approvalsService.getApprovalDetail(user.userId, user.role, type, id);
  }

  @Post("item/:type/:id/approve")
  async approveApproval(
    @Param("type") type: string,
    @Param("id") id: string,
    @CurrentUser() user: any,
    @Body() dto: ApprovalActionDto,
  ) {
    return this.approvalsService.approveApproval(type, id, user.userId, user.role, dto);
  }

  @Post("item/:type/:id/reject")
  async rejectApproval(
    @Param("type") type: string,
    @Param("id") id: string,
    @CurrentUser() user: any,
    @Body() dto: RejectionActionDto,
  ) {
    return this.approvalsService.rejectApproval(type, id, user.userId, user.role, dto);
  }

  // Invoice endpoints
  @Post("invoices")
  @Roles("SUPER_ADMIN", "CEO", "CFO", "ACCOUNTANT")
  createInvoice(@CurrentUser() user: any, @Body() dto: CreateInvoiceDto) {
    return this.approvalsService.createInvoice(user.userId, dto);
  }

  @Get("invoices")
  getInvoices(@CurrentUser() user: any) {
    return this.approvalsService.getInvoices(user.userId, user.role);
  }

  @Get("invoices/:id")
  getInvoiceById(@Param("id") id: string) {
    return this.approvalsService.getInvoiceById(id);
  }

  @Post("invoices/:id/approve")
  @Roles("SUPER_ADMIN", "CEO", "CFO", "ACCOUNTANT")
  approveInvoice(
    @Param("id") id: string,
    @CurrentUser() user: any,
    @Body() dto: ApprovalActionDto,
  ) {
    return this.approvalsService.approveInvoice(
      id,
      user.userId,
      user.role,
      dto,
    );
  }

  @Post("invoices/:id/reject")
  @Roles("SUPER_ADMIN", "CEO", "CFO", "ACCOUNTANT")
  rejectInvoice(
    @Param("id") id: string,
    @CurrentUser() user: any,
    @Body() dto: RejectionActionDto,
  ) {
    return this.approvalsService.rejectInvoice(id, user.userId, user.role, dto);
  }

  // Purchase Request endpoints
  @Post("purchase-requests")
  @Roles(
    "SUPER_ADMIN",
    "CEO",
    "CFO",
    "PROCUREMENT_OFFICER",
    "DEPARTMENT_HEAD",
    "OPERATIONS_MANAGER",
  )
  createPurchaseRequest(
    @CurrentUser() user: any,
    @Body() dto: CreatePurchaseRequestDto,
  ) {
    return this.approvalsService.createPurchaseRequest(user.userId, dto);
  }

  @Get("purchase-requests")
  getPurchaseRequests(@CurrentUser() user: any) {
    return this.approvalsService.getPurchaseRequests(user.userId, user.role);
  }

  @Get("purchase-requests/:id")
  getPurchaseRequestById(@Param("id") id: string) {
    return this.approvalsService.getPurchaseRequestById(id);
  }

  @Post("purchase-requests/:id/approve")
  @Roles("SUPER_ADMIN", "CEO", "CFO", "PROCUREMENT_OFFICER")
  approvePurchaseRequest(
    @Param("id") id: string,
    @CurrentUser() user: any,
    @Body() dto: ApprovalActionDto,
  ) {
    return this.approvalsService.approvePurchaseRequest(
      id,
      user.userId,
      user.role,
      dto,
    );
  }

  @Post("purchase-requests/:id/reject")
  @Roles("SUPER_ADMIN", "CEO", "CFO", "PROCUREMENT_OFFICER")
  rejectPurchaseRequest(
    @Param("id") id: string,
    @CurrentUser() user: any,
    @Body() dto: RejectionActionDto,
  ) {
    return this.approvalsService.rejectPurchaseRequest(
      id,
      user.userId,
      user.role,
      dto,
    );
  }

  // Dashboard stats
  @Get("stats")
  getApprovalStats(@CurrentUser() user: any) {
    return this.approvalsService.getApprovalStats(user.userId, user.role);
  }

  // Attachments
  @Post("item/:type/:id/attachments")
  @UseInterceptors(FileInterceptor("file", multerConfig))
  uploadAttachment(
    @Param("type") type: string,
    @Param("id") id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    return this.approvalsService.uploadAttachment(type, id, file, user.userId, user.role);
  }
}

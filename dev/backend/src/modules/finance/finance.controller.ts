import {
  BadRequestException,
  Controller,
  ForbiddenException,
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
import { FinanceService } from "./finance.service";
import {
  PaymentStatus,
  PaymentMethod,
  ExpenseCategory,
  BudgetPeriod,
  ApprovalStatus,
} from "@prisma/client";
import { parse as json2csv } from "json2csv";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CsvService } from "../csv/csv.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CreateExpenseDto } from "./dto/create-expense.dto";
import { UpdateExpenseDto } from "./dto/update-expense.dto";
import { SetExpenseReceiptDto } from "./dto/set-expense-receipt.dto";

@Controller("finance")
@UseGuards(JwtAuthGuard, RolesGuard)
export class FinanceController {
  constructor(
    private readonly financeService: FinanceService,
    private readonly csvService: CsvService,
    private readonly prisma: PrismaService,
  ) {}

  private isFinanceRole(role: string | undefined) {
    return role === "SUPER_ADMIN" || role === "CEO" || role === "CFO" || role === "ACCOUNTANT";
  }

  // ==================== Payments ====================

  @Post("payments")
  createPayment(
    @Body()
    body: {
      supplierId?: string;
      projectId?: string;
      amount: number;
      currency?: string;
      paymentMethod: PaymentMethod;
      paymentDate: string;
      reference?: string;
      description: string;
      category?: string;
      approvedById?: string;
      notes?: string;
      attachments?: string[];
    },
  ) {
    return this.financeService.createPayment({
      ...body,
      paymentDate: new Date(body.paymentDate),
    });
  }

  @Get("payments")
  getAllPayments(
    @Query("status") status?: PaymentStatus,
    @Query("supplierId") supplierId?: string,
    @Query("projectId") projectId?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    return this.financeService.getAllPayments({
      status,
      supplierId,
      projectId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get("payments/:id")
  getPaymentById(@Param("id") id: string) {
    return this.financeService.getPaymentById(id);
  }

  @Put("payments/:id")
  updatePayment(
    @Param("id") id: string,
    @Body()
    body: {
      status?: PaymentStatus;
      reference?: string;
      notes?: string;
      approvedById?: string;
    },
  ) {
    return this.financeService.updatePayment(id, body);
  }

  @Delete("payments/:id")
  deletePayment(@Param("id") id: string) {
    return this.financeService.deletePayment(id);
  }

  // ==================== Expenses ====================

  @Post("expenses")
  @Roles(
    "SUPER_ADMIN",
    "CEO",
    "CFO",
    "DEPARTMENT_HEAD",
    "ACCOUNTANT",
    "PROCUREMENT_OFFICER",
    "OPERATIONS_MANAGER",
    "IT_MANAGER",
    "HR_MANAGER",
    "SAFETY_OFFICER",
    "WAREHOUSE_MANAGER",
    "EMPLOYEE",
  )
  createExpense(@Body() body: CreateExpenseDto, @Request() req: any) {
    return this.financeService.createExpense({
      category: body.category,
      projectId: body.projectId,
      description: body.description,
      amount: body.amount,
      currency: body.currency,
      expenseDate: new Date(body.expenseDate),
      submittedById: req.user.userId,
      receipt: body.receipt,
      notes: body.notes,
      attachments: body.attachments,
    });
  }

  @Get("expenses")
  getAllExpenses(
    @Query("status") status?: ApprovalStatus,
    @Query("category") category?: ExpenseCategory,
    @Query("projectId") projectId?: string,
    @Query("submittedById") submittedById?: string,
    @Request() req?: any,
  ) {
    const requesterRole = req?.user?.role as string | undefined;
    const requesterId = req?.user?.userId as string | undefined;
    const canViewAll = this.isFinanceRole(requesterRole);

    return this.financeService.getAllExpenses({
      status,
      category,
      projectId,
      submittedById: canViewAll ? submittedById : requesterId,
    });
  }

  @Get("expenses/:id")
  async getExpenseById(@Param("id") id: string, @Request() req: any) {
    const expense = await this.financeService.getExpenseById(id);
    const requesterRole = req?.user?.role as string | undefined;
    const requesterId = req?.user?.userId as string | undefined;

    if (!this.isFinanceRole(requesterRole) && expense.submittedById !== requesterId) {
      throw new ForbiddenException("You do not have access to this expense");
    }

    return expense;
  }

  @Put("expenses/:id")
  @Roles("SUPER_ADMIN", "CEO", "CFO", "ACCOUNTANT")
  updateExpense(
    @Param("id") id: string,
    @Body() body: UpdateExpenseDto,
  ) {
    return this.financeService.updateExpense(id, body);
  }

  @Put("expenses/:id/receipt")
  @Roles(
    "SUPER_ADMIN",
    "CEO",
    "CFO",
    "ACCOUNTANT",
    "DEPARTMENT_HEAD",
    "PROCUREMENT_OFFICER",
    "OPERATIONS_MANAGER",
    "IT_MANAGER",
    "HR_MANAGER",
    "SAFETY_OFFICER",
    "WAREHOUSE_MANAGER",
    "EMPLOYEE",
  )
  async setExpenseReceipt(
    @Param("id") id: string,
    @Body() body: SetExpenseReceiptDto,
    @Request() req: any,
  ) {
    const expense = await this.financeService.getExpenseById(id);
    const requesterRole = req?.user?.role as string | undefined;
    const requesterId = req?.user?.userId as string | undefined;

    if (!this.isFinanceRole(requesterRole) && expense.submittedById !== requesterId) {
      throw new ForbiddenException("You do not have access to this expense");
    }

    return this.financeService.updateExpense(id, {
      receipt: body.receiptUrl,
    });
  }

  @Delete("expenses/:id")
  @Roles("SUPER_ADMIN", "CFO")
  deleteExpense(@Param("id") id: string) {
    return this.financeService.deleteExpense(id);
  }

  // ==================== Budgets ====================

  @Post("budgets")
  createBudget(
    @Body()
    body: {
      name: string;
      description?: string;
      category: ExpenseCategory;
      projectId?: string;
      period: BudgetPeriod;
      startDate: string;
      endDate: string;
      allocatedAmount: number;
      currency?: string;
      createdById: string;
    },
  ) {
    return this.financeService.createBudget({
      ...body,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
    });
  }

  @Get("budgets")
  getAllBudgets(
    @Query("category") category?: ExpenseCategory,
    @Query("projectId") projectId?: string,
    @Query("period") period?: BudgetPeriod,
  ) {
    return this.financeService.getAllBudgets({
      category,
      projectId,
      period,
    });
  }

  @Get("budgets/:id")
  getBudgetById(@Param("id") id: string) {
    return this.financeService.getBudgetById(id);
  }

  @Put("budgets/:id")
  updateBudget(
    @Param("id") id: string,
    @Body()
    body: {
      name?: string;
      description?: string;
      allocatedAmount?: number;
      spentAmount?: number;
    },
  ) {
    return this.financeService.updateBudget(id, body);
  }

  @Delete("budgets/:id")
  deleteBudget(@Param("id") id: string) {
    return this.financeService.deleteBudget(id);
  }

  // ==================== Suppliers ====================

  @Post("suppliers")
  createSupplier(
    @Body()
    body: {
      name: string;
      contactPerson?: string;
      email?: string;
      phone?: string;
      address?: string;
      city?: string;
      country?: string;
      taxId?: string;
      bankAccount?: string;
      paymentTerms?: string;
      category?: string;
      rating?: number;
      notes?: string;
    },
  ) {
    return this.financeService.createSupplier(body);
  }

  @Get("suppliers")
  getAllSuppliers(
    @Query("isActive") isActive?: string,
    @Query("category") category?: string,
  ) {
    return this.financeService.getAllSuppliers({
      isActive:
        isActive === "true" ? true : isActive === "false" ? false : undefined,
      category,
    });
  }

  @Get("suppliers/:id")
  getSupplierById(@Param("id") id: string) {
    return this.financeService.getSupplierById(id);
  }

  @Put("suppliers/:id")
  updateSupplier(
    @Param("id") id: string,
    @Body()
    body: {
      name?: string;
      contactPerson?: string;
      email?: string;
      phone?: string;
      address?: string;
      city?: string;
      country?: string;
      taxId?: string;
      bankAccount?: string;
      paymentTerms?: string;
      category?: string;
      rating?: number;
      isActive?: boolean;
      notes?: string;
    },
  ) {
    return this.financeService.updateSupplier(id, body);
  }

  @Delete("suppliers/:id")
  deleteSupplier(@Param("id") id: string) {
    return this.financeService.deleteSupplier(id);
  }

  // ==================== Statistics ====================

  @Get("stats")
  getFinanceStats() {
    return this.financeService.getFinanceStats();
  }

  // ==================== CSV: Suppliers ====================

  @Post("suppliers/import")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "CFO", "ACCOUNTANT", "PROCUREMENT_OFFICER")
  @UseInterceptors(FileInterceptor("file"))
  async importSuppliers(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { mappings?: string; duplicateStrategy?: string },
    @Request() req: any,
  ) {
    if (!file) {
      throw new BadRequestException("file is required");
    }

    const mappings = body.mappings
      ? this.csvService.parseJson(body.mappings, "mappings")
      : undefined;
    const context = { duplicateStrategy: body.duplicateStrategy };
    const job = await this.csvService.createImportJob(
      "suppliers",
      file,
      req.user.userId,
      mappings,
      context,
    );
    return { success: true, data: job };
  }

  @Get("suppliers/import/sample")
  @UseGuards(JwtAuthGuard, RolesGuard)
  async downloadSuppliersSample(@Res({ passthrough: true }) res: Response) {
    const template = await this.csvService.getSampleTemplate("suppliers");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=suppliers-sample.csv`,
    );
    return template;
  }

  @Get("suppliers/export")
  @UseGuards(JwtAuthGuard, RolesGuard)
  async exportSuppliers(
    @Query("isActive") isActive: string | undefined,
    @Query("category") category: string | undefined,
    @Query("columns") columns: string | undefined,
    @Request() req: any,
  ) {
    const cols = columns
      ? String(columns)
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean)
      : [
          "supplierCode",
          "name",
          "contactPerson",
          "email",
          "phone",
          "city",
          "country",
          "category",
          "rating",
          "isActive",
          "createdAt",
        ];

    const filters: any = {};
    if (typeof isActive === "string" && isActive.length > 0) {
      filters.isActive = isActive === "true";
    }
    if (category) filters.category = category;

    const job = await this.csvService.createExportJob(
      "suppliers",
      filters,
      cols,
      req.user.userId,
      undefined,
    );
    return { success: true, data: job };
  }

  // ==================== CSV: Finance Exports ====================

  @Get("export/payments")
  @UseGuards(JwtAuthGuard, RolesGuard)
  async exportPayments(
    @Res({ passthrough: true }) res: Response,
    @Query("status") status?: PaymentStatus,
    @Query("supplierId") supplierId?: string,
    @Query("projectId") projectId?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    const where: any = {};
    if (status) where.status = status;
    if (supplierId) where.supplierId = supplierId;
    if (projectId) where.projectId = projectId;
    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) where.paymentDate.gte = new Date(startDate);
      if (endDate) where.paymentDate.lte = new Date(endDate);
    }

    const rows = await this.prisma.financePayment.findMany({
      where,
      orderBy: { paymentDate: "desc" },
    });
    const fields = [
      "paymentNumber",
      "supplierId",
      "projectId",
      "amount",
      "currency",
      "paymentMethod",
      "paymentDate",
      "status",
      "reference",
      "description",
      "category",
      "approvedById",
      "notes",
      "createdAt",
    ];

    const csv = json2csv(rows as any, { fields });
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=payments-export.csv`,
    );
    return csv;
  }

  @Get("export/expenses")
  @UseGuards(JwtAuthGuard, RolesGuard)
  async exportExpenses(
    @Res({ passthrough: true }) res: Response,
    @Query("status") status?: ApprovalStatus,
    @Query("category") category?: ExpenseCategory,
    @Query("projectId") projectId?: string,
    @Query("submittedById") submittedById?: string,
  ) {
    const where: any = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (projectId) where.projectId = projectId;
    if (submittedById) where.submittedById = submittedById;

    const rows = await this.prisma.expense.findMany({
      where,
      orderBy: { expenseDate: "desc" },
    });
    const fields = [
      "expenseNumber",
      "category",
      "projectId",
      "description",
      "amount",
      "currency",
      "expenseDate",
      "status",
      "submittedById",
      "approvedById",
      "receipt",
      "notes",
      "createdAt",
    ];

    const csv = json2csv(rows as any, { fields });
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=expenses-export.csv`,
    );
    return csv;
  }

  @Get("export/invoices")
  @UseGuards(JwtAuthGuard, RolesGuard)
  async exportInvoices(
    @Res({ passthrough: true }) res: Response,
    @Query("status") status?: ApprovalStatus,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    const where: any = {};
    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const rows = await this.prisma.invoice.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    const fields = [
      "invoiceNumber",
      "supplierName",
      "supplierEmail",
      "description",
      "amount",
      "currency",
      "dueDate",
      "status",
      "createdById",
      "attachmentUrl",
      "notes",
      "createdAt",
    ];

    const csv = json2csv(rows as any, { fields });
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoices-export.csv`,
    );
    return csv;
  }
}

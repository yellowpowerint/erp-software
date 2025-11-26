import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from "@nestjs/common";
import { FinanceService } from "./finance.service";
import {
  PaymentStatus,
  PaymentMethod,
  ExpenseCategory,
  BudgetPeriod,
  ApprovalStatus,
} from "@prisma/client";

@Controller("finance")
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

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
  createExpense(
    @Body()
    body: {
      category: ExpenseCategory;
      projectId?: string;
      description: string;
      amount: number;
      currency?: string;
      expenseDate: string;
      submittedById: string;
      receipt?: string;
      notes?: string;
      attachments?: string[];
    },
  ) {
    return this.financeService.createExpense({
      ...body,
      expenseDate: new Date(body.expenseDate),
    });
  }

  @Get("expenses")
  getAllExpenses(
    @Query("status") status?: ApprovalStatus,
    @Query("category") category?: ExpenseCategory,
    @Query("projectId") projectId?: string,
    @Query("submittedById") submittedById?: string,
  ) {
    return this.financeService.getAllExpenses({
      status,
      category,
      projectId,
      submittedById,
    });
  }

  @Get("expenses/:id")
  getExpenseById(@Param("id") id: string) {
    return this.financeService.getExpenseById(id);
  }

  @Put("expenses/:id")
  updateExpense(
    @Param("id") id: string,
    @Body()
    body: {
      status?: ApprovalStatus;
      approvedById?: string;
      notes?: string;
    },
  ) {
    return this.financeService.updateExpense(id, body);
  }

  @Delete("expenses/:id")
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
}

import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import {
  PaymentStatus,
  PaymentMethod,
  ExpenseCategory,
  BudgetPeriod,
  ApprovalStatus,
} from "@prisma/client";

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  // ==================== Payments ====================

  async createPayment(data: {
    supplierId?: string;
    projectId?: string;
    amount: number;
    currency?: string;
    paymentMethod: PaymentMethod;
    paymentDate: Date;
    reference?: string;
    description: string;
    category?: string;
    approvedById?: string;
    notes?: string;
    attachments?: string[];
  }) {
    const paymentCount = await this.prisma.financePayment.count();
    const paymentNumber = `PMT-${Date.now()}-${paymentCount + 1}`;

    return this.prisma.financePayment.create({
      data: {
        ...data,
        paymentNumber,
      },
      include: {
        supplier: true,
        project: true,
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async getAllPayments(filters?: {
    status?: PaymentStatus;
    supplierId?: string;
    projectId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {};

    if (filters?.status) where.status = filters.status;
    if (filters?.supplierId) where.supplierId = filters.supplierId;
    if (filters?.projectId) where.projectId = filters.projectId;
    if (filters?.startDate || filters?.endDate) {
      where.paymentDate = {};
      if (filters.startDate) where.paymentDate.gte = filters.startDate;
      if (filters.endDate) where.paymentDate.lte = filters.endDate;
    }

    return this.prisma.financePayment.findMany({
      where,
      include: {
        supplier: true,
        project: {
          select: {
            projectCode: true,
            name: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { paymentDate: "desc" },
    });
  }

  async getPaymentById(id: string) {
    const payment = await this.prisma.financePayment.findUnique({
      where: { id },
      include: {
        supplier: true,
        project: true,
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return payment;
  }

  async updatePayment(
    id: string,
    data: {
      status?: PaymentStatus;
      reference?: string;
      notes?: string;
      approvedById?: string;
    },
  ) {
    return this.prisma.financePayment.update({
      where: { id },
      data,
      include: {
        supplier: true,
        project: true,
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async deletePayment(id: string) {
    return this.prisma.financePayment.delete({
      where: { id },
    });
  }

  // ==================== Expenses ====================

  async createExpense(data: {
    category: ExpenseCategory;
    projectId?: string;
    description: string;
    amount: number;
    currency?: string;
    expenseDate: Date;
    submittedById: string;
    receipt?: string;
    notes?: string;
    attachments?: string[];
  }) {
    const expenseCount = await this.prisma.expense.count();
    const expenseNumber = `EXP-${Date.now()}-${expenseCount + 1}`;

    return this.prisma.expense.create({
      data: {
        ...data,
        expenseNumber,
      },
      include: {
        project: {
          select: {
            projectCode: true,
            name: true,
          },
        },
        submittedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async getAllExpenses(filters?: {
    status?: ApprovalStatus;
    category?: ExpenseCategory;
    projectId?: string;
    submittedById?: string;
  }) {
    const where: any = {};

    if (filters?.status) where.status = filters.status;
    if (filters?.category) where.category = filters.category;
    if (filters?.projectId) where.projectId = filters.projectId;
    if (filters?.submittedById) where.submittedById = filters.submittedById;

    return this.prisma.expense.findMany({
      where,
      include: {
        project: {
          select: {
            projectCode: true,
            name: true,
          },
        },
        submittedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { expenseDate: "desc" },
    });
  }

  async getExpenseById(id: string) {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
      include: {
        project: true,
        submittedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!expense) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }

    return expense;
  }

  async updateExpense(
    id: string,
    data: {
      status?: ApprovalStatus;
      approvedById?: string;
      notes?: string;
    },
  ) {
    return this.prisma.expense.update({
      where: { id },
      data,
      include: {
        project: {
          select: {
            projectCode: true,
            name: true,
          },
        },
        submittedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async deleteExpense(id: string) {
    return this.prisma.expense.delete({
      where: { id },
    });
  }

  // ==================== Budgets ====================

  async createBudget(data: {
    name: string;
    description?: string;
    category: ExpenseCategory;
    projectId?: string;
    period: BudgetPeriod;
    startDate: Date;
    endDate: Date;
    allocatedAmount: number;
    currency?: string;
    createdById: string;
  }) {
    return this.prisma.budget.create({
      data,
      include: {
        project: {
          select: {
            projectCode: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async getAllBudgets(filters?: {
    category?: ExpenseCategory;
    projectId?: string;
    period?: BudgetPeriod;
  }) {
    const where: any = {};

    if (filters?.category) where.category = filters.category;
    if (filters?.projectId) where.projectId = filters.projectId;
    if (filters?.period) where.period = filters.period;

    return this.prisma.budget.findMany({
      where,
      include: {
        project: {
          select: {
            projectCode: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { startDate: "desc" },
    });
  }

  async getBudgetById(id: string) {
    const budget = await this.prisma.budget.findUnique({
      where: { id },
      include: {
        project: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!budget) {
      throw new NotFoundException(`Budget with ID ${id} not found`);
    }

    return budget;
  }

  async updateBudget(
    id: string,
    data: {
      name?: string;
      description?: string;
      allocatedAmount?: number;
      spentAmount?: number;
    },
  ) {
    return this.prisma.budget.update({
      where: { id },
      data,
      include: {
        project: {
          select: {
            projectCode: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async deleteBudget(id: string) {
    return this.prisma.budget.delete({
      where: { id },
    });
  }

  // ==================== Suppliers ====================

  async createSupplier(data: {
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
  }) {
    const supplierCount = await this.prisma.supplier.count();
    const supplierCode = `SUP-${Date.now()}-${supplierCount + 1}`;

    return this.prisma.supplier.create({
      data: {
        ...data,
        supplierCode,
      },
    });
  }

  async getAllSuppliers(filters?: { isActive?: boolean; category?: string }) {
    const where: any = {};

    if (filters?.isActive !== undefined) where.isActive = filters.isActive;
    if (filters?.category) where.category = filters.category;

    return this.prisma.supplier.findMany({
      where,
      orderBy: { name: "asc" },
    });
  }

  async getSupplierById(id: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
      include: {
        payments: {
          orderBy: { paymentDate: "desc" },
          take: 10,
        },
      },
    });

    if (!supplier) {
      throw new NotFoundException(`Supplier with ID ${id} not found`);
    }

    return supplier;
  }

  async updateSupplier(
    id: string,
    data: {
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
    return this.prisma.supplier.update({
      where: { id },
      data,
    });
  }

  async deleteSupplier(id: string) {
    return this.prisma.supplier.delete({
      where: { id },
    });
  }

  // ==================== Statistics ====================

  async getFinanceStats() {
    const [
      totalPayments,
      pendingPayments,
      totalExpenses,
      pendingExpenses,
      totalBudgets,
      totalSuppliers,
    ] = await Promise.all([
      this.prisma.financePayment.count(),
      this.prisma.financePayment.count({ where: { status: "PENDING" } }),
      this.prisma.expense.count(),
      this.prisma.expense.count({ where: { status: "PENDING" } }),
      this.prisma.budget.count(),
      this.prisma.supplier.count({ where: { isActive: true } }),
    ]);

    // Calculate totals
    const paymentsSum = await this.prisma.financePayment.aggregate({
      where: { status: "COMPLETED" },
      _sum: { amount: true },
    });

    const expensesSum = await this.prisma.expense.aggregate({
      where: { status: "APPROVED" },
      _sum: { amount: true },
    });

    const budgetsSum = await this.prisma.budget.aggregate({
      _sum: { allocatedAmount: true, spentAmount: true },
    });

    return {
      totalPayments,
      pendingPayments,
      totalPaymentsAmount: paymentsSum._sum.amount || 0,
      totalExpenses,
      pendingExpenses,
      totalExpensesAmount: expensesSum._sum.amount || 0,
      totalBudgets,
      totalBudgetAllocated: budgetsSum._sum.allocatedAmount || 0,
      totalBudgetSpent: budgetsSum._sum.spentAmount || 0,
      activeSuppliers: totalSuppliers,
    };
  }
}

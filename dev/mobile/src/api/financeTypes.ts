import type { Money, ProjectRef, UserRef, ApprovalStatus } from './types';

export type Budget = {
  id: string;
  name: string;
  description?: string;
  category?: string;
  period?: string;
  startDate?: string;
  endDate?: string;
  allocatedAmount: number;
  spentAmount?: number;
  currency?: string;
  project?: ProjectRef;
  createdAt?: string;
  updatedAt?: string;
};

export type Payment = {
  id: string;
  paymentNumber?: string;
  description: string;
  amount: number;
  currency?: string;
  paymentDate?: string;
  paymentMethod?: string;
  status?: ApprovalStatus;
  supplier?: {
    id?: string;
    name?: string;
  };
  project?: ProjectRef;
  approvedBy?: UserRef;
  createdBy?: UserRef;
  createdAt?: string;
  updatedAt?: string;
};

export type FinanceExpense = {
  id: string;
  description: string;
  amount: number;
  currency?: string;
  category?: string;
  status?: ApprovalStatus;
  expenseDate?: string;
  receiptUrl?: string;
  project?: ProjectRef;
  submittedBy?: UserRef;
  approvedBy?: UserRef;
  createdAt?: string;
  updatedAt?: string;
};

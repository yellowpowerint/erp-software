import { apiClient } from './api.service';
import { uploadService } from './upload.service';

export interface Expense {
  id: string;
  employeeId: string;
  employeeName: string;
  category: string;
  amount: number;
  currency: string;
  date: string;
  description: string;
  receiptUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface ExpenseDetail {
  id: string;
  expenseNumber: string;
  category: string;
  amount: number;
  currency: string;
  expenseDate: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  project?: { id: string; name: string; projectCode?: string } | null;
  submittedBy?: { id: string; firstName: string; lastName: string } | null;
  attachments?: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    uploadedAt: string;
  }>;
}

export interface ExpenseSubmit {
  category: string;
  amount: number;
  date: string;
  description: string;
  receiptUri?: string;
}

export interface ExpenseSearchParams {
  page?: number;
  pageSize?: number;
  status?: string;
  category?: string;
}

export interface ExpenseSearchResponse {
  expenses: Expense[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
}

export const expensesService = {
  async submitExpense(data: ExpenseSubmit): Promise<Expense> {
    const formData = new FormData();
    formData.append('category', data.category);
    formData.append('amount', data.amount.toString());
    formData.append('date', data.date);
    formData.append('description', data.description);

    if (data.receiptUri) {
      const filename = data.receiptUri.split('/').pop() || 'receipt.jpg';
      const type = filename.endsWith('.png') ? 'image/png' : 'image/jpeg';
      formData.append('receipt', { uri: data.receiptUri, name: filename, type } as any);
    }

    const response = await apiClient.post<any>('/finance/expenses', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return {
      id: response.data.id,
      employeeId: response.data.employeeId,
      employeeName: response.data.employeeName,
      category: response.data.category,
      amount: response.data.amount,
      currency: response.data.currency || 'USD',
      date: response.data.date,
      description: response.data.description,
      receiptUrl: response.data.receiptUrl,
      status: response.data.status || 'pending',
      createdAt: response.data.createdAt,
    };
  },

  async getExpenses(params: ExpenseSearchParams = {}): Promise<ExpenseSearchResponse> {
    try {
      const query = {
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 20,
        ...(params.status ? { status: params.status } : {}),
        ...(params.category ? { category: params.category } : {}),
      };

      const response = await apiClient.get<any>('/finance/expenses', { params: query });

      return {
        expenses: response.data.expenses || [],
        page: response.data.page || 1,
        pageSize: response.data.pageSize || 20,
        totalPages: response.data.totalPages || 1,
        totalCount: response.data.totalCount || 0,
      };
    } catch (error) {
      console.error('Failed to get expenses:', error);
      throw error;
    }
  },

  async getCategories(): Promise<string[]> {
    try {
      const response = await apiClient.get<any>('/finance/expense-categories');
      return response.data.categories || ['Travel', 'Meals', 'Accommodation', 'Supplies', 'Equipment', 'Other'];
    } catch {
      return ['Travel', 'Meals', 'Accommodation', 'Supplies', 'Equipment', 'Other'];
    }
  },

  async getExpenseDetail(expenseId: string): Promise<ExpenseDetail> {
    const response = await apiClient.get<any>(`/finance/expenses/${expenseId}`);
    const data = response.data;

    return {
      id: data.id,
      expenseNumber: data.expenseNumber || data.number || `EXP-${data.id}`,
      category: data.category,
      amount: data.amount,
      currency: data.currency || 'USD',
      expenseDate: data.expenseDate || data.date,
      description: data.description,
      status: data.status || 'pending',
      project: data.project || null,
      submittedBy: data.submittedBy || null,
      attachments: data.attachments || [],
    };
  },

  async uploadAttachment(
    expenseId: string,
    uri: string,
    filename: string,
    mimeType: string,
  ): Promise<any> {
    const uploadId = `expense-${expenseId}-${Date.now()}`;

    const result = await uploadService.uploadFile({
      uploadId,
      endpoint: `/finance/expenses/${expenseId}/attachments`,
      file: { uri, name: filename, mimeType },
    });

    if (result.status !== 'success') {
      throw new Error(result.error || 'Upload failed');
    }

    return result.data;
  },
};

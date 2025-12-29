import { apiClient } from './api.service';

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

export interface ExpenseSubmit {
  category: string;
  amount: number;
  date: string;
  description: string;
  receiptUri?: string;
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

    return response.data;
  },

  async getExpenses(params: any = {}): Promise<any> {
    const response = await apiClient.get<any>('/finance/expenses', { params });
    return response.data;
  },

  async getCategories(): Promise<string[]> {
    try {
      const response = await apiClient.get<any>('/finance/expense-categories');
      return response.data.categories || ['Travel', 'Meals', 'Accommodation', 'Supplies', 'Equipment', 'Other'];
    } catch {
      return ['Travel', 'Meals', 'Accommodation', 'Supplies', 'Equipment', 'Other'];
    }
  },
};

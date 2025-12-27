import { http } from './http';

export function listBudgets() {
  return http.get('/finance/budgets');
}

export function listExpenses() {
  return http.get('/finance/expenses');
}

export function listPayments() {
  return http.get('/finance/payments');
}

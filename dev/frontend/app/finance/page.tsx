'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { DollarSign, TrendingUp, CreditCard, Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

interface FinanceStats {
  totalPayments: number;
  pendingPayments: number;
  totalPaymentsAmount: number;
  totalExpenses: number;
  pendingExpenses: number;
  totalExpensesAmount: number;
  totalBudgets: number;
  totalBudgetAllocated: number;
  totalBudgetSpent: number;
  activeSuppliers: number;
}

function FinanceDashboardContent() {
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/finance/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading finance dashboard...</p>
        </div>
      </DashboardLayout>
    );
  }

  const budgetUtilization = stats
    ? ((stats.totalBudgetSpent / stats.totalBudgetAllocated) * 100).toFixed(1)
    : '0';

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Finance & Procurement</h1>
        <p className="text-gray-600 mt-1">Manage payments, expenses, budgets, and suppliers</p>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Payments</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">GHS {stats.totalPaymentsAmount.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">{stats.totalPayments} transactions</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">GHS {stats.totalExpensesAmount.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">{stats.totalExpenses} expenses</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Budget Utilization</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{budgetUtilization}%</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.totalBudgetSpent.toLocaleString()} / {stats.totalBudgetAllocated.toLocaleString()} GHS
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <CreditCard className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Suppliers</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.activeSuppliers}</p>
                <p className="text-xs text-gray-500 mt-1">Registered vendors</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pending Items */}
      {stats && (stats.pendingPayments > 0 || stats.pendingExpenses > 0) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-yellow-800 mb-2">Pending Approvals</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {stats.pendingPayments > 0 && (
              <div>
                <span className="text-yellow-700">Payments: </span>
                <span className="font-semibold text-yellow-900">{stats.pendingPayments}</span>
              </div>
            )}
            {stats.pendingExpenses > 0 && (
              <div>
                <span className="text-yellow-700">Expenses: </span>
                <span className="font-semibold text-yellow-900">{stats.pendingExpenses}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/finance/payments"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow group"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Payments</h3>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
          </div>
          <p className="text-sm text-gray-600">Manage supplier payments and transactions</p>
          <div className="mt-3 text-xs text-indigo-600 font-medium">View all payments →</div>
        </Link>

        <Link
          href="/finance/expenses"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow group"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Expenses</h3>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
          </div>
          <p className="text-sm text-gray-600">Track and approve expense claims</p>
          <div className="mt-3 text-xs text-indigo-600 font-medium">View all expenses →</div>
        </Link>

        <Link
          href="/finance/budgets"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow group"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Budgets</h3>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
          </div>
          <p className="text-sm text-gray-600">Monitor budgets and allocations</p>
          <div className="mt-3 text-xs text-indigo-600 font-medium">View all budgets →</div>
        </Link>

        <Link
          href="/finance/suppliers"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow group"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Suppliers</h3>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
          </div>
          <p className="text-sm text-gray-600">Manage supplier information</p>
          <div className="mt-3 text-xs text-indigo-600 font-medium">View all suppliers →</div>
        </Link>
      </div>
    </DashboardLayout>
  );
}

export default function FinanceDashboardPage() {
  return (
    <ProtectedRoute>
      <FinanceDashboardContent />
    </ProtectedRoute>
  );
}

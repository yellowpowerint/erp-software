'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { DollarSign, ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

interface FinancialSummary {
  summary: {
    totalExpenses: number;
    totalBudget: number;
    totalSpent: number;
    budgetRemaining: number;
    utilizationRate: number;
  };
  expensesByCategory: Array<{ category: string; amount: number; percentage: number }>;
  expensesByMonth: Array<{ month: string; amount: number }>;
}

function FinancialReportsContent() {
  const [data, setData] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      let url = '/reports/financial/summary';
      if (dateRange.startDate || dateRange.endDate) {
        const params = new URLSearchParams();
        if (dateRange.startDate) params.append('startDate', dateRange.startDate);
        if (dateRange.endDate) params.append('endDate', dateRange.endDate);
        url += '?' + params.toString();
      }
      const response = await api.get(url);
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch financial report:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link href="/reports" className="inline-flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Reports</span>
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <DollarSign className="w-8 h-8 text-yellow-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
              <p className="text-gray-600">Financial performance and budget analysis</p>
            </div>
          </div>
          <button
            onClick={fetchReport}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <TrendingUp className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <button
            onClick={fetchReport}
            className="mt-5 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
          >
            Apply Filter
          </button>
        </div>
      </div>

      {data && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600 mb-1">Total Expenses</div>
              <div className="text-2xl font-bold text-gray-900">
                GHS {data.summary.totalExpenses.toLocaleString()}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600 mb-1">Total Budget</div>
              <div className="text-2xl font-bold text-gray-900">
                GHS {data.summary.totalBudget.toLocaleString()}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600 mb-1">Total Spent</div>
              <div className="text-2xl font-bold text-gray-900">
                GHS {data.summary.totalSpent.toLocaleString()}
              </div>
            </div>

            <div className={`rounded-lg shadow p-6 ${data.summary.budgetRemaining >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className={`text-sm font-medium mb-1 ${data.summary.budgetRemaining >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                Remaining Budget
              </div>
              <div className={`text-2xl font-bold ${data.summary.budgetRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                GHS {Math.abs(data.summary.budgetRemaining).toLocaleString()}
                {data.summary.budgetRemaining < 0 && ' (Over)'}
              </div>
            </div>

            <div className="bg-indigo-50 rounded-lg shadow p-6 border border-indigo-200">
              <div className="text-sm text-indigo-700 font-medium mb-1">Utilization Rate</div>
              <div className="text-2xl font-bold text-indigo-600">
                {data.summary.utilizationRate.toFixed(1)}%
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className={`h-2 rounded-full ${data.summary.utilizationRate >= 90 ? 'bg-red-600' : data.summary.utilizationRate >= 75 ? 'bg-yellow-600' : 'bg-green-600'}`}
                  style={{ width: `${Math.min(data.summary.utilizationRate, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Expenses by Category */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Expenses by Category</h2>
            <div className="space-y-3">
              {data.expensesByCategory.map((item, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700">{item.category}</span>
                    <span className="text-sm font-medium text-gray-900">
                      GHS {item.amount.toLocaleString()} ({item.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-600 h-2 rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Expenses by Month */}
          {data.expensesByMonth.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Expenses Trend</h2>
              <div className="space-y-2">
                {data.expensesByMonth.slice(0, 6).map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-700">{item.month}</span>
                    <span className="text-sm font-medium text-gray-900">
                      GHS {item.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}

export default function FinancialReportsPage() {
  return (
    <ProtectedRoute>
      <FinancialReportsContent />
    </ProtectedRoute>
  );
}

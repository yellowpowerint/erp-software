'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PieChart, Plus, ArrowLeft, Filter, TrendingUp, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

interface Budget {
  id: string;
  name: string;
  description?: string;
  category: string;
  project?: {
    projectCode: string;
    name: string;
  };
  period: string;
  startDate: string;
  endDate: string;
  allocatedAmount: number;
  spentAmount: number;
  currency: string;
  createdBy: {
    firstName: string;
    lastName: string;
  };
}

function BudgetsPageContent() {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [periodFilter, setPeriodFilter] = useState('');

  useEffect(() => {
    fetchBudgets();
  }, [categoryFilter, periodFilter]);

  const fetchBudgets = async () => {
    try {
      const params: any = {};
      if (categoryFilter) params.category = categoryFilter;
      if (periodFilter) params.period = periodFilter;
      
      const response = await api.get('/finance/budgets', { params });
      setBudgets(response.data);
    } catch (error) {
      console.error('Failed to fetch budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization < 60) return 'text-green-600';
    if (utilization < 80) return 'text-yellow-600';
    if (utilization < 100) return 'text-orange-600';
    return 'text-red-600';
  };

  const getUtilizationBg = (utilization: number) => {
    if (utilization < 60) return 'bg-green-100 text-green-800';
    if (utilization < 80) return 'bg-yellow-100 text-yellow-800';
    if (utilization < 100) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const canCreate = user && ['SUPER_ADMIN', 'CEO', 'CFO'].includes(user.role);
  const canEdit = user && ['SUPER_ADMIN', 'CEO', 'CFO', 'ACCOUNTANT'].includes(user.role);

  // Calculate summary stats
  const totalAllocated = budgets.reduce((sum, b) => sum + b.allocatedAmount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spentAmount, 0);
  const overallUtilization = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;
  const overBudgetCount = budgets.filter(b => (b.spentAmount / b.allocatedAmount) * 100 > 100).length;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading budgets...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link href="/finance" className="inline-flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Finance</span>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Budgets</h1>
            <p className="text-gray-600 mt-1">Monitor budget allocations and utilization</p>
          </div>
          {canCreate && (
            <Link
              href="/finance/budgets/new"
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Plus className="w-5 h-5" />
              <span>New Budget</span>
            </Link>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Allocated</p>
              <p className="text-2xl font-bold text-indigo-600 mt-1">GHS {totalAllocated.toLocaleString()}</p>
            </div>
            <div className="bg-indigo-100 p-3 rounded-lg">
              <PieChart className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">GHS {totalSpent.toLocaleString()}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overall Utilization</p>
              <p className={`text-2xl font-bold mt-1 ${getUtilizationColor(overallUtilization)}`}>
                {overallUtilization.toFixed(1)}%
              </p>
              {overBudgetCount > 0 && (
                <p className="text-xs text-red-600 mt-1">{overBudgetCount} over budget</p>
              )}
            </div>
            <div className={`p-3 rounded-lg ${overallUtilization > 90 ? 'bg-red-100' : 'bg-green-100'}`}>
              <AlertCircle className={`w-6 h-6 ${overallUtilization > 90 ? 'text-red-600' : 'text-green-600'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center space-x-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Categories</option>
            <option value="OPERATIONS">Operations</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="SALARIES">Salaries</option>
            <option value="SUPPLIES">Supplies</option>
            <option value="UTILITIES">Utilities</option>
            <option value="FUEL">Fuel</option>
            <option value="EQUIPMENT">Equipment</option>
            <option value="TRAVEL">Travel</option>
            <option value="TRAINING">Training</option>
            <option value="OTHER">Other</option>
          </select>
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Periods</option>
            <option value="MONTHLY">Monthly</option>
            <option value="QUARTERLY">Quarterly</option>
            <option value="YEARLY">Yearly</option>
          </select>
        </div>
      </div>

      {/* Budgets List */}
      <div className="space-y-4">
        {budgets.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <PieChart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Budgets Found</h3>
            <p className="text-gray-600">Create your first budget to start tracking allocations.</p>
          </div>
        ) : (
          budgets.map((budget) => {
            const utilization = (budget.spentAmount / budget.allocatedAmount) * 100;
            const remaining = budget.allocatedAmount - budget.spentAmount;

            return (
              <div key={budget.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{budget.name}</h3>
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">
                        {budget.period}
                      </span>
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 capitalize">
                        {budget.category.toLowerCase()}
                      </span>
                    </div>
                    {budget.description && (
                      <p className="text-sm text-gray-600 mb-2">{budget.description}</p>
                    )}
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>📅 {new Date(budget.startDate).toLocaleDateString()} - {new Date(budget.endDate).toLocaleDateString()}</span>
                      {budget.project && (
                        <span>🎯 {budget.project.projectCode}: {budget.project.name}</span>
                      )}
                      <span>👤 {budget.createdBy.firstName} {budget.createdBy.lastName}</span>
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <span className={`block px-3 py-1 text-sm font-semibold rounded-full ${getUtilizationBg(utilization)}`}>
                      {utilization.toFixed(1)}% Used
                    </span>
                    {canEdit && (
                      <Link
                        href={`/finance/budgets/${budget.id}/edit`}
                        className="inline-flex items-center px-3 py-1 text-xs font-medium text-indigo-600 border border-indigo-200 rounded hover:bg-indigo-50"
                      >
                        Edit
                      </Link>
                    )}
                  </div>
                </div>

                {/* Budget Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Budget Utilization</span>
                    <span className="font-medium text-gray-900">
                      {budget.currency} {budget.spentAmount.toLocaleString()} / {budget.allocatedAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        utilization < 60 ? 'bg-green-500' :
                        utilization < 80 ? 'bg-yellow-500' :
                        utilization < 100 ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(utilization, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Remaining: {budget.currency} {remaining.toLocaleString()}</span>
                    {utilization > 100 && (
                      <span className="text-red-600 font-semibold">
                        ⚠️ Over budget by {budget.currency} {Math.abs(remaining).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </DashboardLayout>
  );
}

export default function BudgetsPage() {
  return (
    <ProtectedRoute>
      <BudgetsPageContent />
    </ProtectedRoute>
  );
}

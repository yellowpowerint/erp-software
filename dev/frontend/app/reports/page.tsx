'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { BarChart3, TrendingUp, FileText, Package, Wrench, Briefcase, DollarSign, Users, Shield } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

interface DashboardAnalytics {
  inventory: { total: number; lowStock: number };
  assets: { total: number; active: number };
  projects: { total: number; active: number };
  finance: { totalBudgets: number; totalExpenses: number };
  hr: { total: number; active: number };
  safety: { pendingInspections: number; upcomingTrainings: number };
}

function ReportsDashboardContent() {
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/reports/dashboard');
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading analytics...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <div className="flex items-center space-x-3">
          <BarChart3 className="w-8 h-8 text-indigo-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600">Comprehensive business intelligence and reporting</p>
          </div>
        </div>
      </div>

      {analytics && (
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <Package className="w-5 h-5 text-blue-500" />
                <span className="text-2xl font-bold text-gray-900">{analytics.inventory.total}</span>
              </div>
              <p className="text-sm text-gray-600">Stock Items</p>
              <p className="text-xs text-orange-600 mt-1">{analytics.inventory.lowStock} low stock</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <Wrench className="w-5 h-5 text-green-500" />
                <span className="text-2xl font-bold text-gray-900">{analytics.assets.total}</span>
              </div>
              <p className="text-sm text-gray-600">Total Assets</p>
              <p className="text-xs text-green-600 mt-1">{analytics.assets.active} active</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <Briefcase className="w-5 h-5 text-purple-500" />
                <span className="text-2xl font-bold text-gray-900">{analytics.projects.total}</span>
              </div>
              <p className="text-sm text-gray-600">Projects</p>
              <p className="text-xs text-purple-600 mt-1">{analytics.projects.active} active</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-5 h-5 text-yellow-500" />
                <span className="text-2xl font-bold text-gray-900">{analytics.finance.totalExpenses}</span>
              </div>
              <p className="text-sm text-gray-600">Expenses</p>
              <p className="text-xs text-gray-600 mt-1">{analytics.finance.totalBudgets} budgets</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-5 h-5 text-indigo-500" />
                <span className="text-2xl font-bold text-gray-900">{analytics.hr.total}</span>
              </div>
              <p className="text-sm text-gray-600">Employees</p>
              <p className="text-xs text-indigo-600 mt-1">{analytics.hr.active} active</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <Shield className="w-5 h-5 text-red-500" />
                <span className="text-2xl font-bold text-gray-900">{analytics.safety.pendingInspections}</span>
              </div>
              <p className="text-sm text-gray-600">Pending Inspections</p>
              <p className="text-xs text-blue-600 mt-1">{analytics.safety.upcomingTrainings} trainings</p>
            </div>
          </div>

          {/* Report Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Link
              href="/reports/financial"
              className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg shadow p-6 hover:shadow-lg transition-shadow border border-yellow-200"
            >
              <DollarSign className="w-8 h-8 text-yellow-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">Financial Reports</h3>
              <p className="text-sm text-gray-600">P&L, budgets, expenses analysis</p>
            </Link>

            <Link
              href="/reports/operational"
              className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow p-6 hover:shadow-lg transition-shadow border border-blue-200"
            >
              <TrendingUp className="w-8 h-8 text-blue-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">Operational Reports</h3>
              <p className="text-sm text-gray-600">Inventory, assets, projects</p>
            </Link>

            <Link
              href="/reports/hr"
              className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg shadow p-6 hover:shadow-lg transition-shadow border border-purple-200"
            >
              <Users className="w-8 h-8 text-purple-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">HR Reports</h3>
              <p className="text-sm text-gray-600">Headcount, attendance, performance</p>
            </Link>

            <Link
              href="/reports/safety"
              className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg shadow p-6 hover:shadow-lg transition-shadow border border-green-200"
            >
              <Shield className="w-8 h-8 text-green-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">Safety Reports</h3>
              <p className="text-sm text-gray-600">Inspections, training, compliance</p>
            </Link>
          </div>

          {/* Quick Insights */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-indigo-600" />
              Quick Insights
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <div className="text-sm text-orange-700 font-medium mb-1">Inventory Alert</div>
                <div className="text-2xl font-bold text-orange-600">{analytics.inventory.lowStock}</div>
                <div className="text-xs text-orange-600">Items below reorder level</div>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="text-sm text-green-700 font-medium mb-1">Active Assets</div>
                <div className="text-2xl font-bold text-green-600">{analytics.assets.active}</div>
                <div className="text-xs text-green-600">Out of {analytics.assets.total} total</div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <div className="text-sm text-purple-700 font-medium mb-1">Active Projects</div>
                <div className="text-2xl font-bold text-purple-600">{analytics.projects.active}</div>
                <div className="text-xs text-purple-600">Out of {analytics.projects.total} total</div>
              </div>

              <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                <div className="text-sm text-indigo-700 font-medium mb-1">Active Employees</div>
                <div className="text-2xl font-bold text-indigo-600">{analytics.hr.active}</div>
                <div className="text-xs text-indigo-600">Out of {analytics.hr.total} total</div>
              </div>

              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <div className="text-sm text-yellow-700 font-medium mb-1">Safety Alerts</div>
                <div className="text-2xl font-bold text-yellow-600">{analytics.safety.pendingInspections}</div>
                <div className="text-xs text-yellow-600">Inspections pending</div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="text-sm text-blue-700 font-medium mb-1">Upcoming Training</div>
                <div className="text-2xl font-bold text-blue-600">{analytics.safety.upcomingTrainings}</div>
                <div className="text-xs text-blue-600">Training sessions scheduled</div>
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}

export default function ReportsDashboardPage() {
  return (
    <ProtectedRoute>
      <ReportsDashboardContent />
    </ProtectedRoute>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart3, TrendingUp } from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';

type MoneyLike = string | number | null | undefined;

function toNumber(v: MoneyLike): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function formatCurrency(v: MoneyLike) {
  return `₵${toNumber(v).toLocaleString()}`;
}

type ProcurementDashboard = {
  totalSpendMTD: MoneyLike;
  totalSpendYTD: MoneyLike;
  pendingApprovals: number;
  openPOs: number;
  pendingDeliveries: number;
  unpaidInvoices: number;
  overduePayments: number;
};

function ProcurementAnalyticsContent() {
  const [dashboard, setDashboard] = useState<ProcurementDashboard | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const res = await api.get('/procurement/dashboard');
        if (!mounted) return;
        setDashboard(res.data);
      } catch (e) {
        console.error('Failed to fetch procurement dashboard metrics:', e);
        if (!mounted) return;
        setDashboard(null);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };

    fetchDashboard();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Procurement Analytics</h1>
        <p className="text-gray-600 mt-1">Advanced analytics and insights (starter page)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-100 p-3 rounded-lg">
              <TrendingUp className="w-7 h-7 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Explore Reports</h2>
              <p className="text-sm text-gray-600">Use the reports hub to filter and export insights.</p>
            </div>
          </div>
          <div className="mt-4">
            <Link
              href="/procurement/reports"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <BarChart3 className="w-5 h-5" />
              <span>Open Reports</span>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900">Live Procurement Snapshot</h2>
          {loading ? (
            <p className="mt-3 text-sm text-gray-500">Loading analytics…</p>
          ) : !dashboard ? (
            <p className="mt-3 text-sm text-gray-500">No analytics available yet.</p>
          ) : (
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Spend (MTD)</span>
                <span className="font-medium text-gray-900">{formatCurrency(dashboard.totalSpendMTD)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Spend (YTD)</span>
                <span className="font-medium text-gray-900">{formatCurrency(dashboard.totalSpendYTD)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Pending Approvals</span>
                <span className="font-medium text-gray-900">{dashboard.pendingApprovals ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Open POs</span>
                <span className="font-medium text-gray-900">{dashboard.openPOs ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Pending Deliveries</span>
                <span className="font-medium text-gray-900">{dashboard.pendingDeliveries ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Unpaid Invoices</span>
                <span className="font-medium text-gray-900">{dashboard.unpaidInvoices ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Overdue Payments</span>
                <span className="font-medium text-gray-900">{dashboard.overduePayments ?? 0}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function ProcurementAnalyticsPage() {
  return (
    <ProtectedRoute>
      <ProcurementAnalyticsContent />
    </ProtectedRoute>
  );
}

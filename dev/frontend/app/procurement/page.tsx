'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  BarChart3,
  FileText,
  RefreshCw,
  TrendingUp,
  Truck,
} from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

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

interface DashboardData {
  totalSpendMTD: MoneyLike;
  totalSpendYTD: MoneyLike;
  openRequisitions: number;
  pendingApprovals: number;
  openPOs: number;
  pendingDeliveries: number;
  unpaidInvoices: number;
  overduePayments: number;
  invoiceMatchRate: number;
  onTimeDeliveryRate: number;
  lowStockItems: Array<{
    id: string;
    itemCode: string;
    name: string;
    currentQuantity: number;
    reservedQuantity: number;
    reorderLevel: number;
    warehouse?: { id: string; code: string; name: string };
  }>;
  overdueDeliveries: Array<{
    id: string;
    poNumber: string;
    expectedDelivery: string;
    vendor?: { id: string; vendorCode: string; companyName: string };
  }>;
}

function ProcurementDashboardContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [reorderAlerts, setReorderAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const canManage = useMemo(() => {
    return (
      user &&
      [
        'SUPER_ADMIN',
        'CEO',
        'CFO',
        'PROCUREMENT_OFFICER',
        'OPERATIONS_MANAGER',
        'WAREHOUSE_MANAGER',
      ].includes(user.role)
    );
  }, [user]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashRes, reorderRes] = await Promise.all([
        api.get('/procurement/dashboard'),
        api.get('/procurement/inventory/reorder-alerts'),
      ]);
      setDashboard(dashRes.data);
      setReorderAlerts(reorderRes.data);
    } catch (e) {
      console.error('Failed to fetch procurement dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  const runInventorySync = async () => {
    setSyncing(true);
    try {
      await api.post('/procurement/inventory/sync', { limit: 50 });
      await fetchData();
    } catch (e) {
      console.error('Failed to sync procurement with inventory:', e);
    } finally {
      setSyncing(false);
    }
  };

  const createAutoRequisition = async (stockItemId: string) => {
    try {
      const res = await api.post('/procurement/inventory/auto-requisition', {
        stockItemId,
      });
      const reqId = res?.data?.id;
      if (reqId) {
        router.push(`/procurement/requisitions/${reqId}`);
      }
    } catch (e) {
      console.error('Failed to create auto requisition:', e);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Procurement Dashboard</h1>
            <p className="text-gray-600 mt-1">Inventory integration, reporting & analytics</p>
          </div>
          <div className="flex space-x-3">
            <Link
              href="/procurement/reports"
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <BarChart3 className="w-5 h-5" />
              <span>Reports</span>
            </Link>
            {canManage && (
              <button
                type="button"
                disabled={syncing}
                onClick={runInventorySync}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
                <span>Sync Inventory</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading procurement dashboard...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-green-500 p-3 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Spend (MTD)</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(dashboard?.totalSpendMTD)}
                </p>
                <p className="text-xs text-gray-500 mt-2">Month-to-date invoices</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-indigo-500 p-3 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Spend (YTD)</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(dashboard?.totalSpendYTD)}
                </p>
                <p className="text-xs text-gray-500 mt-2">Year-to-date invoices</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-orange-500 p-3 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Pending Approvals</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {dashboard?.pendingApprovals ?? 0}
                </p>
                <p className="text-xs text-gray-500 mt-2">Requisitions awaiting approval</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-purple-500 p-3 rounded-lg">
                  <FileText className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Open POs</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{dashboard?.openPOs ?? 0}</p>
                <p className="text-xs text-gray-500 mt-2">Not completed/cancelled</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Open Requisitions</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{dashboard?.openRequisitions ?? 0}</p>
              <p className="text-xs text-gray-500 mt-2">Not completed/cancelled</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Pending Deliveries</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{dashboard?.pendingDeliveries ?? 0}</p>
              <p className="text-xs text-gray-500 mt-2">Sent/acknowledged/partial</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Unpaid Invoices</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{dashboard?.unpaidInvoices ?? 0}</p>
              <p className="text-xs text-gray-500 mt-2">Unpaid/partial/overdue</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Overdue Payments</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{dashboard?.overduePayments ?? 0}</p>
              <p className="text-xs text-gray-500 mt-2">Overdue invoices</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Invoice Match Rate</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {(dashboard?.invoiceMatchRate ?? 0).toFixed(1)}%
                  </p>
                </div>
                <div className="bg-indigo-100 p-3 rounded-lg">
                  <BarChart3 className="w-7 h-7 text-indigo-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">On-Time Delivery Rate</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {(dashboard?.onTimeDeliveryRate ?? 0).toFixed(1)}%
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <Truck className="w-7 h-7 text-green-600" />
                </div>
              </div>
            </div>
          </div>

          {(reorderAlerts.length > 0 || dashboard?.lowStockItems?.length) && (
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  <h2 className="text-lg font-semibold text-gray-900">Reorder Alerts</h2>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Code</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reserved</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reorder Level</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(reorderAlerts as any[]).slice(0, 20).map((item: any) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.itemCode}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{item.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.warehouse?.name ?? '—'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.currentQuantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.reservedQuantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.reorderLevel}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-3">
                            <Link
                              href={`/inventory/items/${item.id}`}
                              className="text-indigo-600 hover:text-indigo-700 font-medium"
                            >
                              View
                            </Link>
                            {canManage && (
                              <button
                                type="button"
                                onClick={() => createAutoRequisition(item.id)}
                                className="text-gray-700 hover:text-gray-900 font-medium"
                              >
                                Auto Requisition
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {dashboard?.overdueDeliveries?.length ? (
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  <Truck className="w-5 h-5 text-red-500" />
                  <h2 className="text-lg font-semibold text-gray-900">Overdue Deliveries</h2>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expected</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dashboard.overdueDeliveries.map((po) => (
                      <tr key={po.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{po.poNumber}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{po.vendor?.companyName ?? '—'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {po.expectedDelivery ? new Date(po.expectedDelivery).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Link
                            href={`/procurement/purchase-orders/${po.id}`}
                            className="text-indigo-600 hover:text-indigo-700 font-medium"
                          >
                            View PO
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </>
      )}
    </DashboardLayout>
  );
}

export default function ProcurementDashboardPage() {
  return (
    <ProtectedRoute>
      <ProcurementDashboardContent />
    </ProtectedRoute>
  );
}

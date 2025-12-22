'use client';

import { useEffect, useState } from 'react';
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

interface VendorPerfRow {
  vendorId: string;
  vendorCode: string;
  companyName: string;
  rating: MoneyLike;
  totalOrders: number;
  totalSpend: MoneyLike;
  onTimeDelivery: MoneyLike;
  qualityScore: MoneyLike;
  status: string;
}

function VendorPerformanceContent() {
  const [rows, setRows] = useState<VendorPerfRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [vendorId, setVendorId] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/procurement/reports/vendors', {
        params: { vendorId: vendorId || undefined },
      });
      setRows(res.data || []);
    } catch (e) {
      console.error('Failed to fetch vendor performance:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Vendor Performance</h1>
        <p className="text-gray-600 mt-1">Ratings, spend and delivery KPIs</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Vendor ID (optional)</label>
            <input
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
              placeholder="Paste vendor UUID to filter"
              className="mt-1 w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={fetchData}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading vendor performance...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Vendors</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Spend</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">On-time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quality</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rows.map((v) => (
                  <tr key={v.vendorId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{v.companyName} ({v.vendorCode})</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{toNumber(v.rating).toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{v.totalOrders}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(v.totalSpend)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{toNumber(v.onTimeDelivery).toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{toNumber(v.qualityScore).toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{v.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function VendorPerformancePage() {
  return (
    <ProtectedRoute>
      <VendorPerformanceContent />
    </ProtectedRoute>
  );
}

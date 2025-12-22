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

interface SavingsLine {
  requisitionNo?: string;
  poNumber?: string;
  estimated: MoneyLike;
  actual: MoneyLike;
  savings: MoneyLike;
  vendor?: { vendorCode: string; companyName: string };
}

interface SavingsReport {
  totalSavings: MoneyLike;
  lines: SavingsLine[];
}

function SavingsContent() {
  const [data, setData] = useState<SavingsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/procurement/reports/savings', {
        params: { startDate: startDate || undefined, endDate: endDate || undefined },
      });
      setData(res.data);
    } catch (e) {
      console.error('Failed to fetch savings report:', e);
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
        <h1 className="text-2xl font-bold text-gray-900">Savings</h1>
        <p className="text-gray-600 mt-1">Estimated vs actual (requisition → PO)</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1 w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1 w-full border rounded-lg px-3 py-2" />
          </div>
          <div className="flex items-end">
            <button type="button" onClick={fetchData} className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">Apply Filters</button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading savings...</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <p className="text-gray-600 text-sm">Total Savings</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(data?.totalSavings)}</p>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Lines</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requisition</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estimated</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actual</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Savings</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(data?.lines || []).map((l, idx) => (
                    <tr key={`${l.poNumber || 'po'}-${idx}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{l.requisitionNo ?? '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{l.poNumber ?? '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{l.vendor?.companyName ?? '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(l.estimated)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(l.actual)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(l.savings)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}

export default function SavingsPage() {
  return (
    <ProtectedRoute>
      <SavingsContent />
    </ProtectedRoute>
  );
}

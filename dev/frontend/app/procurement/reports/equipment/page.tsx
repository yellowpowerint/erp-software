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

interface EquipmentReport {
  totalSpend: MoneyLike;
  itemsCount: number;
  items: Array<{
    id: string;
    description: string;
    quantity: MoneyLike;
    totalPrice: MoneyLike;
    invoice?: { invoiceNumber: string; invoiceDate: string };
    poItem?: { itemName: string };
  }>;
}

function EquipmentContent() {
  const [data, setData] = useState<EquipmentReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/procurement/reports/equipment', {
        params: { startDate: startDate || undefined, endDate: endDate || undefined },
      });
      setData(res.data);
    } catch (e) {
      console.error('Failed to fetch equipment procurement report:', e);
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
        <h1 className="text-2xl font-bold text-gray-900">Equipment Procurement</h1>
        <p className="text-gray-600 mt-1">Invoice items linked to equipment stock category</p>
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
          <p className="text-gray-600 mt-4">Loading equipment procurement...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Total Spend</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(data?.totalSpend)}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Items</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{data?.itemsCount ?? 0}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Items</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(data?.items || []).map((it) => (
                    <tr key={it.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{it.invoice?.invoiceNumber ?? '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{it.poItem?.itemName ?? it.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{toNumber(it.quantity)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(it.totalPrice)}</td>
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

export default function EquipmentPage() {
  return (
    <ProtectedRoute>
      <EquipmentContent />
    </ProtectedRoute>
  );
}

'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';

interface CycleTimeReport {
  sampleSize: number;
  avgCycleTimeDays: number;
}

function CycleTimeContent() {
  const [data, setData] = useState<CycleTimeReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/procurement/reports/cycle-time', {
        params: {
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        },
      });
      setData(res.data);
    } catch (e) {
      console.error('Failed to fetch cycle time report:', e);
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
        <h1 className="text-2xl font-bold text-gray-900">Cycle Time</h1>
        <p className="text-gray-600 mt-1">Requisition-to-receipt cycle time</p>
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
          <p className="text-gray-600 mt-4">Loading cycle time...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Average Cycle Time</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{data?.avgCycleTimeDays ?? 0} days</p>
            <p className="text-xs text-gray-500 mt-2">Sample size: {data?.sampleSize ?? 0} completed POs</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Interpretation</p>
            <p className="text-sm text-gray-700 mt-2">
              This metric measures the elapsed time between requisition creation and the latest goods receipt date for completed purchase orders.
            </p>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function CycleTimePage() {
  return (
    <ProtectedRoute>
      <CycleTimeContent />
    </ProtectedRoute>
  );
}

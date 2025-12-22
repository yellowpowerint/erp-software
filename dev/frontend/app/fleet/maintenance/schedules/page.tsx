'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { ArrowLeft, Plus, Save } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

type ScheduleRow = {
  id: string;
  name: string;
  type: string;
  frequency: string;
  intervalValue: number;
  intervalUnit: string;
  nextDue?: string | null;
  priority: string;
  isActive: boolean;
  asset: { id: string; assetCode: string; name: string; currentLocation?: string };
};

function FleetMaintenanceSchedulesContent() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState<ScheduleRow[]>([]);
  const [creating, setCreating] = useState(false);

  const canManage = useMemo(() => {
    return !!user && ['SUPER_ADMIN', 'CEO', 'CFO', 'OPERATIONS_MANAGER', 'WAREHOUSE_MANAGER'].includes(user.role);
  }, [user]);

  const [form, setForm] = useState({
    assetId: '',
    type: 'PREVENTIVE',
    name: 'Oil Change',
    description: '',
    frequency: 'TIME_BASED',
    intervalValue: '30',
    intervalUnit: 'DAYS',
    alertDaysBefore: '7',
    priority: 'MEDIUM',
    estimatedCost: '',
    estimatedDuration: '',
    isActive: true,
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/fleet/maintenance/schedules');
      setSchedules(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error('Failed to fetch schedules:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;
    if (!form.assetId || !form.name) {
      alert('assetId and name are required');
      return;
    }

    setCreating(true);
    try {
      await api.post('/fleet/maintenance/schedules', {
        assetId: form.assetId,
        type: form.type,
        name: form.name,
        description: form.description || undefined,
        frequency: form.frequency,
        intervalValue: parseInt(form.intervalValue, 10),
        intervalUnit: form.intervalUnit,
        alertDaysBefore: form.alertDaysBefore ? parseInt(form.alertDaysBefore, 10) : undefined,
        priority: form.priority,
        estimatedCost: form.estimatedCost || undefined,
        estimatedDuration: form.estimatedDuration ? parseInt(form.estimatedDuration, 10) : undefined,
        isActive: form.isActive,
      });

      setForm({
        assetId: '',
        type: 'PREVENTIVE',
        name: 'Oil Change',
        description: '',
        frequency: 'TIME_BASED',
        intervalValue: '30',
        intervalUnit: 'DAYS',
        alertDaysBefore: '7',
        priority: 'MEDIUM',
        estimatedCost: '',
        estimatedDuration: '',
        isActive: true,
      });

      await load();
    } catch (err: any) {
      console.error('Failed to create schedule:', err);
      alert(err.response?.data?.message || 'Failed to create schedule');
    } finally {
      setCreating(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link href="/fleet/maintenance" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Maintenance</span>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Maintenance Schedules</h1>
            <p className="text-gray-600 mt-1">Create preventive maintenance schedules for fleet assets</p>
          </div>
        </div>
      </div>

      {canManage && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Plus className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">Create Schedule</h2>
          </div>
          <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Asset ID *</label>
              <input
                value={form.assetId}
                onChange={(e) => setForm({ ...form, assetId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Paste FleetAsset.id"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="PREVENTIVE">Preventive</option>
                <option value="CORRECTIVE">Corrective</option>
                <option value="PREDICTIVE">Predictive</option>
                <option value="EMERGENCY">Emergency</option>
                <option value="INSPECTION">Inspection</option>
                <option value="OVERHAUL">Overhaul</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
              <select
                value={form.frequency}
                onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="TIME_BASED">Time Based</option>
                <option value="DISTANCE_BASED">Distance Based</option>
                <option value="HOURS_BASED">Hours Based</option>
                <option value="COMBINED">Combined</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Interval</label>
              <input
                value={form.intervalValue}
                onChange={(e) => setForm({ ...form, intervalValue: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
              <select
                value={form.intervalUnit}
                onChange={(e) => setForm({ ...form, intervalUnit: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="DAYS">DAYS</option>
                <option value="KM">KM</option>
                <option value="HOURS">HOURS</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Alert Days Before</label>
              <input
                value={form.alertDaysBefore}
                onChange={(e) => setForm({ ...form, alertDaysBefore: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Cost</label>
              <input
                value={form.estimatedCost}
                onChange={(e) => setForm({ ...form, estimatedCost: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="e.g., 1200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Duration (hours)</label>
              <input
                value={form.estimatedDuration}
                onChange={(e) => setForm({ ...form, estimatedDuration: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="e.g., 4"
              />
            </div>

            <div className="md:col-span-4 flex justify-end">
              <button
                type="submit"
                disabled={creating}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
              >
                <Save className="w-4 h-4" />
                {creating ? 'Creating...' : 'Create Schedule'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">All Schedules</h2>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Active</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {schedules.length ? (
                schedules.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{s.asset.assetCode}</div>
                      <div className="text-xs text-gray-500">{s.asset.name}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{s.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{s.type}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{s.nextDue ? new Date(s.nextDue).toLocaleDateString() : '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{s.isActive ? 'Yes' : 'No'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No schedules found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function FleetMaintenanceSchedulesPage() {
  return (
    <ProtectedRoute>
      <FleetMaintenanceSchedulesContent />
    </ProtectedRoute>
  );
}

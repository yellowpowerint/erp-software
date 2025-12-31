'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { Calendar, AlertTriangle, Plus, Download, Upload } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import ImportModal from '@/components/csv/ImportModal';
import ExportModal from '@/components/csv/ExportModal';

type ScheduleRow = {
  id: string;
  name: string;
  type: string;
  frequency: string;
  intervalValue: number;
  intervalUnit: string;
  nextDue?: string | null;
  nextDueOdometer?: string | null;
  nextDueHours?: string | null;
  priority: string;
  asset: { id: string; assetCode: string; name: string; currentLocation?: string };
};

type UpcomingResponse = {
  daysAhead: number;
  schedules: ScheduleRow[];
};

function FleetMaintenanceDashboardContent() {
  const { user } = useAuth();

  const [upcoming, setUpcoming] = useState<UpcomingResponse | null>(null);
  const [overdue, setOverdue] = useState<ScheduleRow[]>([]);
  const [costs, setCosts] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [runningReminders, setRunningReminders] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const canManage = useMemo(() => {
    return !!user && ['SUPER_ADMIN', 'CEO', 'CFO', 'OPERATIONS_MANAGER', 'WAREHOUSE_MANAGER'].includes(user.role);
  }, [user]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [upRes, odRes, costRes] = await Promise.all([
          api.get('/fleet/maintenance/upcoming', { params: { daysAhead: 14 } }),
          api.get('/fleet/maintenance/overdue'),
          api.get('/fleet/maintenance/costs', { params: { days: 30 } }),
        ]);

        setUpcoming(upRes.data);
        setOverdue(Array.isArray(odRes.data) ? odRes.data : []);
        setCosts(costRes.data);
      } catch (e) {
        console.error('Failed to load maintenance dashboard:', e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const runReminders = async () => {
    if (!canManage) return;
    setRunningReminders(true);
    try {
      await api.post('/fleet/maintenance/reminders/run');
      alert('Reminders queued as in-app notifications.');
    } catch (e: any) {
      console.error('Failed to run reminders:', e);
      alert(e?.response?.data?.message || 'Failed to run reminders');
    } finally {
      setRunningReminders(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fleet Maintenance</h1>
          <p className="text-gray-600 mt-1">Schedules, work orders, and maintenance planning</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/fleet/maintenance/calendar"
            className="px-4 py-2 border border-gray-300 bg-white rounded-lg hover:bg-gray-50 transition-colors inline-flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            Calendar
          </Link>
          <Link
            href="/fleet/maintenance/new"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Log Maintenance
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading maintenance dashboard...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Upcoming (14d)</p>
              <p className="text-2xl font-bold text-indigo-600 mt-1">{upcoming?.schedules?.length ?? 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{overdue.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Maintenance Cost (30d)</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ₵{costs?.totalCost ? Number(costs.totalCost).toLocaleString() : '0'}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Actions</p>
              <div className="mt-2 flex gap-2">
                <Link className="text-indigo-600 hover:text-indigo-800 text-sm" href="/fleet/maintenance/schedules">
                  Manage Schedules
                </Link>
                {canManage && (
                  <button
                    onClick={runReminders}
                    disabled={runningReminders}
                    className="text-sm text-gray-700 hover:text-gray-900 disabled:opacity-50"
                  >
                    {runningReminders ? 'Running...' : 'Run Reminders'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {overdue.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h2 className="text-lg font-semibold text-gray-900">Overdue Maintenance</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Asset</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Schedule</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Due</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {overdue.slice(0, 10).map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2">
                          <div className="text-sm font-medium text-gray-900">{s.asset.assetCode}</div>
                          <div className="text-xs text-gray-500">{s.asset.name}</div>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700">{s.name}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">
                          {s.nextDue ? new Date(s.nextDue).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700">{s.priority}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Schedules</h2>
            {upcoming?.schedules?.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Asset</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Schedule</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Due</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Interval</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {upcoming.schedules.slice(0, 10).map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2">
                          <div className="text-sm font-medium text-gray-900">{s.asset.assetCode}</div>
                          <div className="text-xs text-gray-500">{s.asset.name}</div>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700">{s.name}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">
                          {s.nextDue ? new Date(s.nextDue).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700">
                          {s.intervalValue} {s.intervalUnit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No upcoming schedules found.</p>
            )}
          </div>
        </>
      )}

      <ImportModal
        open={importOpen}
        onClose={() => {
          setImportOpen(false);
          window.location.reload();
        }}
        module="fleet_maintenance"
        title="Import Maintenance Records"
      />

      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        module="fleet_maintenance"
        title="Export Maintenance Records"
      />
    </DashboardLayout>
  );
}

export default function FleetMaintenanceDashboardPage() {
  return (
    <ProtectedRoute>
      <FleetMaintenanceDashboardContent />
    </ProtectedRoute>
  );
}

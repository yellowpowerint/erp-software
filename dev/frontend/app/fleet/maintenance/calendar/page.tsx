'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { ArrowLeft, Calendar } from 'lucide-react';

type ScheduleRow = {
  id: string;
  name: string;
  type: string;
  nextDue?: string | null;
  priority: string;
  asset: { id: string; assetCode: string; name: string };
};

type RecordRow = {
  id: string;
  title: string;
  type: string;
  status: string;
  scheduledDate?: string | null;
  startDate: string;
  asset: { id: string; assetCode: string; name: string };
};

type CalendarResponse = {
  daysAhead: number;
  schedules: ScheduleRow[];
  records: RecordRow[];
};

function FleetMaintenanceCalendarContent() {
  const [daysAhead, setDaysAhead] = useState(30);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CalendarResponse | null>(null);

  const params = useMemo(() => ({ daysAhead }), [daysAhead]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get('/fleet/maintenance/calendar', { params });
        setData(res.data);
      } catch (e) {
        console.error('Failed to load maintenance calendar:', e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [params]);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link
          href="/fleet/maintenance"
          className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Maintenance</span>
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Maintenance Calendar</h1>
            <p className="text-gray-600 mt-1">Upcoming schedules and planned maintenance work</p>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <select
              value={daysAhead}
              onChange={(e) => setDaysAhead(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white"
            >
              <option value={7}>Next 7 days</option>
              <option value={14}>Next 14 days</option>
              <option value={30}>Next 30 days</option>
              <option value={60}>Next 60 days</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading calendar...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Schedules Due</h2>
              <p className="text-sm text-gray-500">Within {data?.daysAhead ?? daysAhead} days</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Schedule</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data?.schedules?.length ? (
                    data.schedules.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{s.asset.assetCode}</div>
                          <div className="text-xs text-gray-500">{s.asset.name}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">{s.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {s.nextDue ? new Date(s.nextDue).toLocaleDateString() : '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-10 text-center text-sm text-gray-500">
                        No schedules due.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Planned Records</h2>
              <p className="text-sm text-gray-500">Scheduled maintenance records</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data?.records?.length ? (
                    data.records.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{r.asset.assetCode}</div>
                          <div className="text-xs text-gray-500">{r.asset.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/fleet/maintenance/${r.id}`}
                            className="text-sm text-indigo-600 hover:text-indigo-800"
                          >
                            {r.title}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {r.scheduledDate
                            ? new Date(r.scheduledDate).toLocaleDateString()
                            : new Date(r.startDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">{r.status}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-sm text-gray-500">
                        No scheduled maintenance records.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function FleetMaintenanceCalendarPage() {
  return (
    <ProtectedRoute>
      <FleetMaintenanceCalendarContent />
    </ProtectedRoute>
  );
}

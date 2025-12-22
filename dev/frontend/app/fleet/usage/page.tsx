'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Plus, TrendingUp } from 'lucide-react';

type UsageRow = {
  id: string;
  date: string;
  shift?: string | null;
  siteLocation: string;
  operatingHours?: string | null;
  idleHours?: string | null;
  distanceCovered?: string | null;
  materialMoved?: string | null;
  asset?: { id: string; assetCode: string; name: string };
  operator?: { id: string; firstName: string; lastName: string; role: string };
};

type Paginated<T> = {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

function Inner() {
  const { user } = useAuth();
  const canManage = !!user && ['SUPER_ADMIN', 'CEO', 'CFO', 'OPERATIONS_MANAGER', 'WAREHOUSE_MANAGER'].includes(user.role);

  const [resp, setResp] = useState<Paginated<UsageRow> | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [assetId, setAssetId] = useState('');
  const [operatorId, setOperatorId] = useState('');
  const [siteLocation, setSiteLocation] = useState('');
  const [page, setPage] = useState(1);

  const params = useMemo(() => {
    const p: any = { page, pageSize: 25 };
    if (assetId.trim()) p.assetId = assetId.trim();
    if (operatorId.trim()) p.operatorId = operatorId.trim();
    if (siteLocation.trim()) p.siteLocation = siteLocation.trim();
    return p;
  }, [page, assetId, operatorId, siteLocation]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [logsRes, summaryRes] = await Promise.all([
          api.get('/fleet/usage', { params }),
          canManage ? api.get('/fleet/usage/summary', { params: { days: 30 } }) : Promise.resolve({ data: null }),
        ]);
        setResp(logsRes.data);
        setSummary(summaryRes.data);
      } catch (e) {
        console.error('Failed to load usage logs:', e);
        setResp(null);
        setSummary(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [params, canManage]);

  const totalPages = resp?.totalPages ?? 1;

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usage Logs</h1>
          <p className="text-gray-600 mt-1">Track operational usage (hours, distance, material moved)</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/fleet/usage/log"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Log Usage
          </Link>
          <Link
            href="/fleet"
            className="px-4 py-2 border border-gray-300 bg-white rounded-lg hover:bg-gray-50 transition-colors"
          >
            Fleet Dashboard
          </Link>
        </div>
      </div>

      {canManage && summary?.totals && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-semibold text-gray-900">Last 30 days summary</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-500">Operating Hours</div>
              <div className="text-gray-900 font-medium">{summary.totals.operatingHours}</div>
            </div>
            <div>
              <div className="text-gray-500">Idle Hours</div>
              <div className="text-gray-900 font-medium">{summary.totals.idleHours}</div>
            </div>
            <div>
              <div className="text-gray-500">Distance (km)</div>
              <div className="text-gray-900 font-medium">{summary.totals.distanceKm}</div>
            </div>
            <div>
              <div className="text-gray-500">Material (tonnes)</div>
              <div className="text-gray-900 font-medium">{summary.totals.materialTonnes}</div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Asset ID</label>
            <input
              value={assetId}
              onChange={(e) => {
                setPage(1);
                setAssetId(e.target.value);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="Optional"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Operator ID</label>
            <input
              value={operatorId}
              onChange={(e) => {
                setPage(1);
                setOperatorId(e.target.value);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="Optional"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Site</label>
            <input
              value={siteLocation}
              onChange={(e) => {
                setPage(1);
                setSiteLocation(e.target.value);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="Optional"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading usage logs...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Operator</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Site</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Operating</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Idle</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {resp?.data?.length ? (
                resp.data.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {r.date ? new Date(r.date).toLocaleDateString() : '-'}
                      <div className="text-xs text-gray-500">{r.shift || ''}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {r.asset?.assetCode || '-'}
                      <div className="text-xs text-gray-500">{r.asset?.name || ''}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {r.operator ? `${r.operator.firstName} ${r.operator.lastName}` : '-'}
                      <div className="text-xs text-gray-500">{r.operator?.role || ''}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{r.siteLocation}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{r.operatingHours ?? '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{r.idleHours ?? '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No usage logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing page {resp?.page ?? 1} of {totalPages} ({resp?.total ?? 0} total)
            </p>
            <div className="flex gap-2">
              <button
                disabled={(resp?.page ?? 1) <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Prev
              </button>
              <button
                disabled={(resp?.page ?? 1) >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function Page() {
  return (
    <ProtectedRoute>
      <Inner />
    </ProtectedRoute>
  );
}

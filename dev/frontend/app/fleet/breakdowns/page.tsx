'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { AlertTriangle, Plus, Search, Download, Upload } from 'lucide-react';
import ImportModal from '@/components/csv/ImportModal';
import ExportModal from '@/components/csv/ExportModal';

type BreakdownRow = {
  id: string;
  reportedDate: string;
  breakdownDate: string;
  title: string;
  location: string;
  siteLocation: string;
  category: string;
  severity: string;
  status: string;
  asset?: { id: string; assetCode: string; name: string; currentLocation: string; status: string };
  assignedTo?: { id: string; firstName: string; lastName: string; role: string } | null;
  reportedBy?: { id: string; firstName: string; lastName: string; role: string } | null;
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

  const [resp, setResp] = useState<Paginated<BreakdownRow> | null>(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [severity, setSeverity] = useState('ALL');
  const [activeOnly, setActiveOnly] = useState(true);
  const [page, setPage] = useState(1);
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const params = useMemo(() => {
    const p: any = { page, pageSize: 25 };
    if (search.trim()) p.search = search.trim();
    if (status !== 'ALL') p.status = status;
    if (severity !== 'ALL') p.severity = severity;
    if (activeOnly) p.activeOnly = true;
    return p;
  }, [page, search, status, severity, activeOnly]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get('/fleet/breakdowns', { params });
        setResp(res.data);
      } catch (e) {
        console.error('Failed to load breakdowns:', e);
        setResp(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [params]);

  const totalPages = resp?.totalPages ?? 1;

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fleet Breakdowns</h1>
          <p className="text-gray-600 mt-1">Report and track equipment breakdowns and downtime</p>
        </div>
        <div className="flex gap-2">
          {canManage && (
            <>
              <button
                onClick={() => setExportOpen(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors inline-flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                onClick={() => setImportOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Import
              </button>
            </>
          )}
          <Link
            href="/fleet/breakdowns/new"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Report Breakdown
          </Link>
          <Link
            href="/fleet"
            className="px-4 py-2 border border-gray-300 bg-white rounded-lg hover:bg-gray-50 transition-colors"
          >
            Fleet Dashboard
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Search title, description, location..."
            />
          </div>

          <select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white"
          >
            <option value="ALL">All Status</option>
            <option value="REPORTED">Reported</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="DIAGNOSING">Diagnosing</option>
            <option value="AWAITING_PARTS">Awaiting Parts</option>
            <option value="IN_REPAIR">In Repair</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>

          <select
            value={severity}
            onChange={(e) => {
              setPage(1);
              setSeverity(e.target.value);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white"
          >
            <option value="ALL">All Severity</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => {
                setPage(1);
                setActiveOnly(e.target.checked);
              }}
            />
            Active only
          </label>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading breakdowns...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reported</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {resp?.data?.length ? (
                resp.data.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{b.asset?.assetCode || '-'}</div>
                      <div className="text-xs text-gray-500">{b.asset?.name || '-'}</div>
                      <div className="text-xs text-gray-500">{b.siteLocation}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{b.title}</div>
                      <div className="text-xs text-gray-500">{b.location}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{b.severity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{b.status}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {b.reportedDate ? new Date(b.reportedDate).toLocaleString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link href={`/fleet/breakdowns/${b.id}`} className="text-indigo-600 hover:text-indigo-900">
                        View
                      </Link>
                      {canManage && b.status !== 'RESOLVED' && b.status !== 'CLOSED' && (
                        <span className="text-gray-300 px-2">|</span>
                      )}
                      {canManage && b.status !== 'RESOLVED' && b.status !== 'CLOSED' && (
                        <Link href={`/fleet/breakdowns/${b.id}`} className="text-gray-700 hover:text-gray-900">
                          Manage
                        </Link>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p>No breakdowns found.</p>
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

      <ImportModal
        open={importOpen}
        onClose={() => {
          setImportOpen(false);
          window.location.reload();
        }}
        module="fleet_breakdowns"
        title="Import Fleet Breakdowns"
      />

      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        module="fleet_breakdowns"
        title="Export Fleet Breakdowns"
        defaultFilters={{ search, status, severity, activeOnly }}
      />
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

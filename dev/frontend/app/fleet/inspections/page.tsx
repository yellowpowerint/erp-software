'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { ClipboardCheck, Plus, Download, Upload } from 'lucide-react';
import ImportModal from '@/components/csv/ImportModal';
import ExportModal from '@/components/csv/ExportModal';

type InspectionRow = {
  id: string;
  type: string;
  inspectionDate: string;
  overallResult: string;
  score?: number | null;
  followUpRequired?: boolean;
  followUpDate?: string | null;
  asset?: { id: string; assetCode: string; name: string; currentLocation: string };
  inspector?: { id: string; firstName: string; lastName: string; role: string };
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

  const [resp, setResp] = useState<Paginated<InspectionRow> | null>(null);
  const [due, setDue] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [assetId, setAssetId] = useState('');
  const [inspectorId, setInspectorId] = useState('');
  const [type, setType] = useState('ALL');
  const [page, setPage] = useState(1);
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const params = useMemo(() => {
    const p: any = { page, pageSize: 25 };
    if (assetId.trim()) p.assetId = assetId.trim();
    if (inspectorId.trim()) p.inspectorId = inspectorId.trim();
    if (type !== 'ALL') p.type = type;
    return p;
  }, [page, assetId, inspectorId, type]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [listRes, dueRes] = await Promise.all([
          api.get('/fleet/inspections', { params }),
          canManage ? api.get('/fleet/inspections/due', { params: { daysAhead: 30 } }) : Promise.resolve({ data: null }),
        ]);
        setResp(listRes.data);
        setDue(dueRes.data);
      } catch (e) {
        console.error('Failed to load inspections:', e);
        setResp(null);
        setDue(null);
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
          <h1 className="text-2xl font-bold text-gray-900">Fleet Inspections</h1>
          <p className="text-gray-600 mt-1">Record and review pre/post operation and periodic inspections</p>
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
            href="/fleet/inspections/new"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Inspection
          </Link>
          <Link
            href="/fleet"
            className="px-4 py-2 border border-gray-300 bg-white rounded-lg hover:bg-gray-50 transition-colors"
          >
            Fleet Dashboard
          </Link>
        </div>
      </div>

      {canManage && due?.assets && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <ClipboardCheck className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-semibold text-gray-900">Inspections due in next {due.daysAhead} days</h2>
          </div>
          <div className="text-sm text-gray-700">
            {due.assets.length ? (
              <ul className="list-disc pl-5">
                {due.assets.slice(0, 10).map((a: any) => (
                  <li key={a.id}>
                    {a.assetCode} {a.name ? `- ${a.name}` : ''} ({a.currentLocation}) — due {new Date(a.nextInspectionDue).toLocaleDateString()}
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-gray-500">No due inspections.</span>
            )}
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
            <label className="block text-xs font-medium text-gray-600 mb-1">Inspector ID</label>
            <input
              value={inspectorId}
              onChange={(e) => {
                setPage(1);
                setInspectorId(e.target.value);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="Optional"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
            <select
              value={type}
              onChange={(e) => {
                setPage(1);
                setType(e.target.value);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
            >
              <option value="ALL">All Types</option>
              <option value="PRE_OPERATION">Pre-Operation</option>
              <option value="POST_OPERATION">Post-Operation</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="SAFETY">Safety</option>
              <option value="REGULATORY">Regulatory</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading inspections...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Result</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inspector</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {resp?.data?.length ? (
                resp.data.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {r.inspectionDate ? new Date(r.inspectionDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {r.asset?.assetCode || '-'}
                      <div className="text-xs text-gray-500">{r.asset?.name || ''}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{r.type}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {r.overallResult}
                      {r.followUpRequired ? <div className="text-xs text-orange-600">Follow-up required</div> : null}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {r.inspector ? `${r.inspector.firstName} ${r.inspector.lastName}` : '-'}
                      <div className="text-xs text-gray-500">{r.inspector?.role || ''}</div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No inspections found.
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
        module="fleet_inspections"
        title="Import Fleet Inspections"
      />

      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        module="fleet_inspections"
        title="Export Fleet Inspections"
        defaultFilters={{ assetId, inspectorId, type }}
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

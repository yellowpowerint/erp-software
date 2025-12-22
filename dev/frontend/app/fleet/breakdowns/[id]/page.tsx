'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

function Inner() {
  const params = useParams();
  const id = String((params as any)?.id || '');
  const { user } = useAuth();
  const canManage = !!user && ['SUPER_ADMIN', 'CEO', 'CFO', 'OPERATIONS_MANAGER', 'WAREHOUSE_MANAGER'].includes(user.role);

  const [loading, setLoading] = useState(true);
  const [row, setRow] = useState<any>(null);

  const [assignedToId, setAssignedToId] = useState('');
  const [status, setStatus] = useState('ACKNOWLEDGED');

  const [resolution, setResolution] = useState('');
  const [rootCause, setRootCause] = useState('');
  const [actualDowntime, setActualDowntime] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/fleet/breakdowns/${id}`);
      setRow(res.data);
    } catch (e) {
      console.error('Failed to load breakdown:', e);
      setRow(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) load();
  }, [id]);

  const canAssign = canManage && row && !['RESOLVED', 'CLOSED'].includes(String(row.status));
  const canResolve = canManage && row && !['RESOLVED', 'CLOSED'].includes(String(row.status));

  const resolveStatus = useMemo(() => 'RESOLVED', []);

  const assign = async () => {
    if (!assignedToId.trim()) {
      alert('assignedToId is required');
      return;
    }
    await api.post(`/fleet/breakdowns/${id}/assign`, {
      assignedToId: assignedToId.trim(),
      status,
    });
    await load();
  };

  const resolve = async () => {
    await api.post(`/fleet/breakdowns/${id}/resolve`, {
      rootCause: rootCause.trim() || undefined,
      resolution: resolution.trim() || undefined,
      actualDowntime: actualDowntime.trim() || undefined,
      status: resolveStatus,
    });
    await load();
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link href="/fleet/breakdowns" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Breakdowns</span>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Breakdown Details</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {loading ? (
          <div className="text-sm text-gray-700">Loading...</div>
        ) : !row ? (
          <div className="text-sm text-gray-700">Not found.</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Asset</div>
                <div className="text-gray-900 font-medium">{row.asset?.assetCode} {row.asset?.name ? `- ${row.asset.name}` : ''}</div>
              </div>
              <div>
                <div className="text-gray-500">Status</div>
                <div className="text-gray-900 font-medium">{row.status}</div>
              </div>
              <div>
                <div className="text-gray-500">Severity</div>
                <div className="text-gray-900 font-medium">{row.severity}</div>
              </div>
              <div>
                <div className="text-gray-500">Category</div>
                <div className="text-gray-900 font-medium">{row.category}</div>
              </div>
              <div className="md:col-span-2">
                <div className="text-gray-500">Title</div>
                <div className="text-gray-900 font-medium">{row.title}</div>
              </div>
              <div className="md:col-span-2">
                <div className="text-gray-500">Description</div>
                <div className="text-gray-900">{row.description}</div>
              </div>
            </div>

            {canAssign && (
              <div className="mt-8 border-t pt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Assign Technician</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Assigned To (User ID)</label>
                    <input value={assignedToId} onChange={(e) => setAssignedToId(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Set Status</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white">
                      <option value="ACKNOWLEDGED">Acknowledged</option>
                      <option value="DIAGNOSING">Diagnosing</option>
                      <option value="AWAITING_PARTS">Awaiting Parts</option>
                      <option value="IN_REPAIR">In Repair</option>
                    </select>
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <button onClick={assign} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Assign</button>
                </div>
              </div>
            )}

            {canResolve && (
              <div className="mt-8 border-t pt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Resolve</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Root Cause</label>
                    <input value={rootCause} onChange={(e) => setRootCause(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Actual Downtime (hours)</label>
                    <input value={actualDowntime} onChange={(e) => setActualDowntime(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Resolution</label>
                    <textarea value={resolution} onChange={(e) => setResolution(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" rows={3} />
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <button onClick={resolve} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Mark Resolved</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
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

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Download, Upload } from 'lucide-react';
import ImportModal from '@/components/csv/ImportModal';
import ExportModal from '@/components/csv/ExportModal';

type AssignmentRow = {
  id: string;
  status: string;
  siteLocation: string;
  startDate: string;
  endDate?: string | null;
  asset: { id: string; assetCode: string; name: string; type: string; status: string; currentLocation: string };
  operator: { id: string; firstName: string; lastName: string; email: string; role: string };
  assignedBy: { id: string; firstName: string; lastName: string; email: string; role: string };
  project?: { id: string; projectCode: string; name: string } | null;
};

function FleetAssignmentsContent() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const canManage = user && ['SUPER_ADMIN', 'CEO', 'CFO', 'OPERATIONS_MANAGER', 'WAREHOUSE_MANAGER'].includes(user.role);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/fleet/assignments/active');
      setAssignments(res.data);
    } catch (e) {
      console.error('Failed to fetch fleet assignments:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const endAssignment = async (id: string) => {
    if (!confirm('End this assignment?')) return;

    try {
      await api.post(`/fleet/assignments/${id}/end`);
      await fetchData();
    } catch (err: any) {
      console.error('Failed to end assignment:', err);
      alert(err.response?.data?.message || 'Failed to end assignment');
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fleet Assignments</h1>
          <p className="text-gray-600 mt-1">Current active operator/site assignments</p>
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
            href="/fleet/assets"
            className="px-4 py-2 border border-gray-300 bg-white rounded-lg hover:bg-gray-50 transition-colors"
          >
            Fleet Assets
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading assignments...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Operator</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Site</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {assignments.length ? (
                assignments.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link
                        href={`/fleet/assets/${a.asset.id}`}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
                      >
                        {a.asset.assetCode}
                      </Link>
                      <div className="text-xs text-gray-500">{a.asset.name}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {a.operator.firstName} {a.operator.lastName}
                      <div className="text-xs text-gray-500">{a.operator.role}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{a.siteLocation}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {new Date(a.startDate).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {canManage ? (
                        <button
                          onClick={() => endAssignment(a.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          End
                        </button>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No active assignments.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <ImportModal
        open={importOpen}
        onClose={() => {
          setImportOpen(false);
          fetchData();
        }}
        module="fleet_assignments"
        title="Import Fleet Assignments"
      />

      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        module="fleet_assignments"
        title="Export Fleet Assignments"
      />
    </DashboardLayout>
  );
}

export default function FleetAssignmentsPage() {
  return (
    <ProtectedRoute>
      <FleetAssignmentsContent />
    </ProtectedRoute>
  );
}

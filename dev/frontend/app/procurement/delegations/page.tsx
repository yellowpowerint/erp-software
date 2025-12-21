'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

interface Delegation {
  id: string;
  delegatorId: string;
  delegateId: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  isActive: boolean;
  createdAt?: string;
}

function DelegationsContent() {
  const { user } = useAuth();
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDelegations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/procurement/delegations');
      setDelegations(res.data);
    } catch (error) {
      console.error('Failed to fetch delegations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDelegations();
  }, []);

  const createDelegation = async () => {
    if (!user?.id) return;

    const delegateId = window.prompt('Delegate userId');
    if (!delegateId?.trim()) return;

    const start = window.prompt('Start date (YYYY-MM-DD)');
    if (!start?.trim()) return;

    const end = window.prompt('End date (YYYY-MM-DD)');
    if (!end?.trim()) return;

    const reason = window.prompt('Reason (optional)') || undefined;

    setActionLoading(true);
    try {
      await api.post('/procurement/delegations', {
        delegatorId: user.id,
        delegateId,
        startDate: new Date(`${start}T00:00:00.000Z`).toISOString(),
        endDate: new Date(`${end}T23:59:59.000Z`).toISOString(),
        reason,
      });
      fetchDelegations();
    } catch (error: any) {
      console.error('Failed to create delegation:', error);
      alert(error.response?.data?.message || 'Failed to create delegation');
    } finally {
      setActionLoading(false);
    }
  };

  const cancelDelegation = async (id: string) => {
    if (!window.confirm('Cancel this delegation?')) return;

    setActionLoading(true);
    try {
      await api.delete(`/procurement/delegations/${id}`);
      fetchDelegations();
    } catch (error: any) {
      console.error('Failed to cancel delegation:', error);
      alert(error.response?.data?.message || 'Failed to cancel delegation');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Approval Delegations</h1>
          <p className="text-gray-600 mt-1">Delegate requisition approvals temporarily</p>
        </div>
        <button
          onClick={createDelegation}
          disabled={actionLoading}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
        >
          New Delegation
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading delegations...</p>
        </div>
      ) : delegations.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-10 text-center">
          <p className="text-gray-600">No delegations found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Delegator
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Delegate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {delegations.map((d) => (
                  <tr key={d.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {d.delegatorId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {d.delegateId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {new Date(d.startDate).toLocaleDateString()} -{' '}
                      {new Date(d.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          d.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {d.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => cancelDelegation(d.id)}
                        disabled={actionLoading || !d.isActive}
                        className="text-sm text-red-600 hover:text-red-700 disabled:text-gray-400"
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function DelegationsPage() {
  return (
    <ProtectedRoute>
      <DelegationsContent />
    </ProtectedRoute>
  );
}

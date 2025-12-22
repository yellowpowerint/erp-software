'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';

interface PendingActionsReport {
  pendingRequisitions: number;
  pendingPOApprovals: number;
  pendingInvoiceMatches: number;
  duePayments: number;
}

function PendingActionsContent() {
  const [data, setData] = useState<PendingActionsReport | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/procurement/reports/pending-actions');
      setData(res.data);
    } catch (e) {
      console.error('Failed to fetch pending actions:', e);
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
        <h1 className="text-2xl font-bold text-gray-900">Pending Actions</h1>
        <p className="text-gray-600 mt-1">Key items requiring attention</p>
      </div>

      {loading ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading pending actions...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Pending Requisitions</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{data?.pendingRequisitions ?? 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Pending PO Approvals</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{data?.pendingPOApprovals ?? 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Invoices Pending Match</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{data?.pendingInvoiceMatches ?? 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Overdue Payments</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{data?.duePayments ?? 0}</p>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function PendingActionsPage() {
  return (
    <ProtectedRoute>
      <PendingActionsContent />
    </ProtectedRoute>
  );
}

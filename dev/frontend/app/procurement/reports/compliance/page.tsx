'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';

interface ComplianceReport {
  poApprovalComplianceRate: number;
  invoiceMatchRate: number;
  totals: {
    poTotal: number;
    poApproved: number;
    invoiceTotal: number;
    invoiceMatched: number;
  };
}

function ComplianceContent() {
  const [data, setData] = useState<ComplianceReport | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/procurement/reports/compliance');
      setData(res.data);
    } catch (e) {
      console.error('Failed to fetch compliance report:', e);
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
        <h1 className="text-2xl font-bold text-gray-900">Compliance</h1>
        <p className="text-gray-600 mt-1">PO approvals and invoice matching compliance</p>
      </div>

      {loading ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading compliance...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">PO Approval Compliance</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{(data?.poApprovalComplianceRate ?? 0).toFixed(1)}%</p>
              <p className="text-xs text-gray-500 mt-2">Approved: {data?.totals.poApproved ?? 0} / {data?.totals.poTotal ?? 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Invoice Match Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{(data?.invoiceMatchRate ?? 0).toFixed(1)}%</p>
              <p className="text-xs text-gray-500 mt-2">Matched: {data?.totals.invoiceMatched ?? 0} / {data?.totals.invoiceTotal ?? 0}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900">Totals</h2>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">PO Total</span><span className="text-gray-900 font-medium">{data?.totals.poTotal ?? 0}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">PO Approved</span><span className="text-gray-900 font-medium">{data?.totals.poApproved ?? 0}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Invoice Total</span><span className="text-gray-900 font-medium">{data?.totals.invoiceTotal ?? 0}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Invoice Matched</span><span className="text-gray-900 font-medium">{data?.totals.invoiceMatched ?? 0}</span></div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}

export default function CompliancePage() {
  return (
    <ProtectedRoute>
      <ComplianceContent />
    </ProtectedRoute>
  );
}

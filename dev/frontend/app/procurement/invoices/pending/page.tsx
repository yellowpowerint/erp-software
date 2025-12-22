'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { FileText } from 'lucide-react';

interface VendorInvoiceListItem {
  id: string;
  invoiceNumber: string;
  matchStatus: string;
  approvedForPayment?: boolean;
  currency: string;
  totalAmount: string;
  dueDate: string;
  vendor?: {
    companyName: string;
    vendorCode: string;
  };
  purchaseOrder?: {
    poNumber: string;
  } | null;
}

function PendingInvoicesContent() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<VendorInvoiceListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const canAccess = user && ['SUPER_ADMIN', 'CEO', 'CFO', 'ACCOUNTANT', 'PROCUREMENT_OFFICER'].includes(user.role);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await api.get('/procurement/invoices', { params: { matchStatus: 'PENDING' } });
      setInvoices(res.data.data || res.data);
    } catch (e) {
      console.error('Failed to fetch pending invoices:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canAccess) {
      setLoading(false);
      return;
    }
    fetchPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAccess]);

  if (!canAccess) {
    return (
      <DashboardLayout>
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-700">You do not have access to pending invoices.</p>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading pending invoices...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Invoices Pending Matching</h1>
        <p className="text-gray-600 mt-1">Invoices with match status PENDING.</p>
      </div>

      {invoices.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Invoices</h3>
          <p className="text-gray-600">All invoices have been matched or are not in PENDING status.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PO</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link href={`/procurement/invoices/${inv.id}`} className="text-indigo-600 hover:text-indigo-900">
                      {inv.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {inv.vendor?.companyName || '-'} {inv.vendor?.vendorCode ? `(${inv.vendor.vendorCode})` : ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{inv.purchaseOrder?.poNumber || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {inv.currency} {Number(inv.totalAmount || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(inv.dueDate).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function PendingProcurementInvoicesPage() {
  return (
    <ProtectedRoute>
      <PendingInvoicesContent />
    </ProtectedRoute>
  );
}

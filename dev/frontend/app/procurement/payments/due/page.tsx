'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { FileText } from 'lucide-react';

interface DueInvoiceListItem {
  id: string;
  invoiceNumber: string;
  dueDate: string;
  paymentStatus: string;
  currency: string;
  totalAmount: string;
  paidAmount: string;
  vendor?: {
    companyName: string;
    vendorCode: string;
  };
  purchaseOrder?: {
    poNumber: string;
  } | null;
}

function DuePaymentsContent() {
  const [invoices, setInvoices] = useState<DueInvoiceListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDue = async () => {
    setLoading(true);
    try {
      const res = await api.get('/procurement/payments/due');
      setInvoices(res.data.data || res.data);
    } catch (e) {
      console.error('Failed to fetch due payments:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDue();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading due payments...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Due Payments</h1>
          <p className="text-gray-600 mt-1">Upcoming and overdue invoice payments.</p>
        </div>
        <Link href="/procurement/payments" className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900">
          Payment History
        </Link>
      </div>

      {invoices.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Due Invoices</h3>
          <p className="text-gray-600">No invoices are due in the next window.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PO</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Remaining</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.map((inv) => {
                const total = Number(inv.totalAmount || 0);
                const paid = Number(inv.paidAmount || 0);
                const remaining = Math.max(0, total - paid);
                return (
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(inv.dueDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{inv.paymentStatus}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                      {inv.currency} {remaining.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function DuePaymentsPage() {
  return (
    <ProtectedRoute>
      <DuePaymentsContent />
    </ProtectedRoute>
  );
}

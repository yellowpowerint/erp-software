'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { FileText, Filter, Plus, Search } from 'lucide-react';

interface VendorInvoiceListItem {
  id: string;
  invoiceNumber: string;
  matchStatus: string;
  paymentStatus: string;
  currency: string;
  totalAmount: string;
  invoiceDate: string;
  dueDate: string;
  createdAt: string;
  vendor?: {
    id: string;
    vendorCode: string;
    companyName: string;
  };
  purchaseOrder?: {
    id: string;
    poNumber: string;
  } | null;
  _count?: {
    items: number;
    payments: number;
  };
}

function InvoicesContent() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<VendorInvoiceListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [matchFilter, setMatchFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const isVendor = user?.role === 'VENDOR';

  const canCreate =
    user && ['SUPER_ADMIN', 'CEO', 'CFO', 'ACCOUNTANT', 'PROCUREMENT_OFFICER'].includes(user.role);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (matchFilter !== 'ALL') params.matchStatus = matchFilter;
      if (paymentFilter !== 'ALL') params.paymentStatus = paymentFilter;
      const res = await api.get('/procurement/invoices', { params });
      setInvoices(res.data.data || res.data);
    } catch (e) {
      console.error('Failed to fetch procurement invoices:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchFilter, paymentFilter]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return invoices;
    return invoices.filter((i) => {
      return (
        i.invoiceNumber.toLowerCase().includes(q) ||
        (i.vendor?.companyName || '').toLowerCase().includes(q) ||
        (i.vendor?.vendorCode || '').toLowerCase().includes(q) ||
        (i.purchaseOrder?.poNumber || '').toLowerCase().includes(q)
      );
    });
  }, [invoices, searchQuery]);

  const matchBadge = (status: string) => {
    const colors: any = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      MATCHED: 'bg-green-100 text-green-800',
      PARTIAL_MATCH: 'bg-orange-100 text-orange-800',
      MISMATCH: 'bg-red-100 text-red-800',
      DISPUTED: 'bg-purple-100 text-purple-800',
      RESOLVED: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const payBadge = (status: string) => {
    const colors: any = {
      UNPAID: 'bg-gray-100 text-gray-800',
      PARTIALLY_PAID: 'bg-yellow-100 text-yellow-800',
      PAID: 'bg-green-100 text-green-800',
      OVERDUE: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading invoices...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Procurement Invoices</h1>
          <p className="text-gray-600 mt-1">
            {isVendor ? 'Your invoice status and payments' : 'Record invoices, match, approve, and pay'}
          </p>
        </div>
        {canCreate && (
          <Link
            href="/procurement/invoices/new"
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus className="w-5 h-5" />
            <span>Record Invoice</span>
          </Link>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search invoices..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={matchFilter}
              onChange={(e) => setMatchFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="ALL">All Match Status</option>
              <option value="PENDING">Pending</option>
              <option value="MATCHED">Matched</option>
              <option value="PARTIAL_MATCH">Partial Match</option>
              <option value="MISMATCH">Mismatch</option>
              <option value="DISPUTED">Disputed</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="ALL">All Payment Status</option>
              <option value="UNPAID">Unpaid</option>
              <option value="PARTIALLY_PAID">Partially Paid</option>
              <option value="PAID">Paid</option>
              <option value="OVERDUE">Overdue</option>
            </select>
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <button onClick={fetchInvoices} className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900">
            Refresh
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Invoices Found</h3>
          <p className="text-gray-600">{canCreate ? 'Record your first vendor invoice.' : 'No invoices available.'}</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Match</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${matchBadge(inv.matchStatus)}`}>{inv.matchStatus}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${payBadge(inv.paymentStatus)}`}>{inv.paymentStatus}</span>
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

export default function ProcurementInvoicesPage() {
  return (
    <ProtectedRoute>
      <InvoicesContent />
    </ProtectedRoute>
  );
}

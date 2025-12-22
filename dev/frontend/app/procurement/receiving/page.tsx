'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { FileText, Filter, Search } from 'lucide-react';

interface PurchaseOrderListItem {
  id: string;
  poNumber: string;
  status: string;
  currency: string;
  totalAmount: number;
  expectedDelivery: string;
  createdAt: string;
  vendor?: {
    id: string;
    vendorCode: string;
    companyName: string;
  };
  _count?: {
    items: number;
  };
}

function ReceivingContent() {
  const { user } = useAuth();
  const [pos, setPos] = useState<PurchaseOrderListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState('SENT');
  const [searchQuery, setSearchQuery] = useState('');

  const canAccess =
    user &&
    ['SUPER_ADMIN', 'CEO', 'CFO', 'PROCUREMENT_OFFICER', 'OPERATIONS_MANAGER', 'WAREHOUSE_MANAGER'].includes(user.role);

  const fetchPOs = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter && statusFilter !== 'ALL') params.status = statusFilter;
      const res = await api.get('/procurement/purchase-orders', { params });
      setPos(res.data.data || res.data);
    } catch (e) {
      console.error('Failed to fetch purchase orders for receiving:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canAccess) return;
    fetchPOs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, canAccess]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return pos;
    return pos.filter((p) => {
      return (
        p.poNumber.toLowerCase().includes(q) ||
        (p.vendor?.companyName || '').toLowerCase().includes(q) ||
        (p.vendor?.vendorCode || '').toLowerCase().includes(q)
      );
    });
  }, [pos, searchQuery]);

  if (!canAccess) {
    return (
      <DashboardLayout>
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-700">You do not have access to Receiving.</p>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading pending deliveries...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Receiving</h1>
        <p className="text-gray-600 mt-1">Select a purchase order to receive goods and create a GRN.</p>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by PO number or vendor..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="SENT">Sent</option>
              <option value="ACKNOWLEDGED">Acknowledged</option>
              <option value="PARTIALLY_RECEIVED">Partially Received</option>
              <option value="APPROVED">Approved</option>
              <option value="ALL">All</option>
            </select>
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <button onClick={fetchPOs} className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900">
            Refresh
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No POs Found</h3>
          <p className="text-gray-600">No purchase orders match the selected status/filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((po) => (
            <Link
              key={po.id}
              href={`/procurement/receiving/${po.id}`}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{po.poNumber}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Vendor: {po.vendor?.companyName || '-'} {po.vendor?.vendorCode ? `(${po.vendor.vendorCode})` : ''}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Status: {po.status}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">
                    {po.currency} {Number(po.totalAmount || 0).toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">Expected: {new Date(po.expectedDelivery).toLocaleDateString()}</div>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-500">Items: {po._count?.items ?? '-'}</div>
            </Link>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

export default function ReceivingPage() {
  return (
    <ProtectedRoute>
      <ReceivingContent />
    </ProtectedRoute>
  );
}

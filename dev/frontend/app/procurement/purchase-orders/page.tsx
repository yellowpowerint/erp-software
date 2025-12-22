'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { FileText, Filter, Plus, Search } from 'lucide-react';

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

function PurchaseOrdersContent() {
  const { user } = useAuth();
  const [pos, setPos] = useState<PurchaseOrderListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const isVendor = user?.role === 'VENDOR';

  const canCreate =
    user && ['SUPER_ADMIN', 'CEO', 'CFO', 'PROCUREMENT_OFFICER', 'OPERATIONS_MANAGER'].includes(user.role);

  const fetchPOs = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const res = await api.get('/procurement/purchase-orders', { params });
      setPos(res.data.data || res.data);
    } catch (e) {
      console.error('Failed to fetch purchase orders:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPOs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

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

  const statusBadge = (status: string) => {
    const colors: any = {
      DRAFT: 'bg-gray-100 text-gray-800',
      PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      SENT: 'bg-blue-100 text-blue-800',
      ACKNOWLEDGED: 'bg-indigo-100 text-indigo-800',
      PARTIALLY_RECEIVED: 'bg-orange-100 text-orange-800',
      RECEIVED: 'bg-green-100 text-green-800',
      COMPLETED: 'bg-purple-100 text-purple-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading purchase orders...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="text-gray-600 mt-1">{isVendor ? 'Your purchase orders' : 'Manage purchase orders'}</p>
        </div>
        {canCreate && (
          <Link
            href="/procurement/purchase-orders/new"
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus className="w-5 h-5" />
            <span>New PO</span>
          </Link>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search POs..."
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
              <option value="ALL">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="APPROVED">Approved</option>
              <option value="SENT">Sent</option>
              <option value="ACKNOWLEDGED">Acknowledged</option>
              <option value="PARTIALLY_RECEIVED">Partially Received</option>
              <option value="RECEIVED">Received</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Purchase Orders Found</h3>
          <p className="text-gray-600 mb-4">{isVendor ? 'No POs assigned to your vendor yet.' : 'Create your first PO.'}</p>
          {canCreate && (
            <Link
              href="/procurement/purchase-orders/new"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Plus className="w-5 h-5" />
              <span>Create PO</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((po) => (
            <Link
              key={po.id}
              href={`/procurement/purchase-orders/${po.id}`}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center space-x-3 mb-1">
                    <h3 className="text-lg font-semibold text-gray-900">{po.poNumber}</h3>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusBadge(po.status)}`}>
                      {po.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Vendor: {po.vendor?.companyName || '-'} {po.vendor?.vendorCode ? `(${po.vendor.vendorCode})` : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">
                    {po.currency} {Number(po.totalAmount || 0).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">Expected: {new Date(po.expectedDelivery).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <p className="text-xs text-gray-500">Items</p>
                  <p className="text-sm font-medium text-gray-900">{po._count?.items ?? '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Created</p>
                  <p className="text-sm font-medium text-gray-900">{new Date(po.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

export default function PurchaseOrdersPage() {
  return (
    <ProtectedRoute>
      <PurchaseOrdersContent />
    </ProtectedRoute>
  );
}

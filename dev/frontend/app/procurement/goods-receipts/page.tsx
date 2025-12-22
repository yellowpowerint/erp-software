'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { FileText, Filter, Search } from 'lucide-react';

interface GoodsReceiptListItem {
  id: string;
  grnNumber: string;
  status: string;
  siteLocation: string;
  receivedDate: string;
  createdAt: string;
  purchaseOrder?: {
    id: string;
    poNumber: string;
    vendor?: {
      id: string;
      vendorCode: string;
      companyName: string;
    };
  };
  _count?: {
    items: number;
    inspections: number;
  };
}

function GoodsReceiptsContent() {
  const { user } = useAuth();
  const [grns, setGrns] = useState<GoodsReceiptListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchGRNs = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const res = await api.get('/procurement/goods-receipts', { params });
      setGrns(res.data.data || res.data);
    } catch (e) {
      console.error('Failed to fetch goods receipts:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGRNs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return grns;
    return grns.filter((g) => {
      return (
        g.grnNumber.toLowerCase().includes(q) ||
        (g.purchaseOrder?.poNumber || '').toLowerCase().includes(q) ||
        (g.purchaseOrder?.vendor?.companyName || '').toLowerCase().includes(q) ||
        (g.purchaseOrder?.vendor?.vendorCode || '').toLowerCase().includes(q) ||
        (g.siteLocation || '').toLowerCase().includes(q)
      );
    });
  }, [grns, searchQuery]);

  const statusBadge = (status: string) => {
    const colors: any = {
      PENDING_INSPECTION: 'bg-yellow-100 text-yellow-800',
      INSPECTING: 'bg-blue-100 text-blue-800',
      ACCEPTED: 'bg-green-100 text-green-800',
      PARTIALLY_ACCEPTED: 'bg-orange-100 text-orange-800',
      REJECTED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading goods receipts...</p>
        </div>
      </DashboardLayout>
    );
  }

  const isVendor = user?.role === 'VENDOR';

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Goods Receipts (GRNs)</h1>
        <p className="text-gray-600 mt-1">{isVendor ? 'Goods receipts for your purchase orders' : 'Manage receiving and inspections'}</p>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search GRNs..."
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
              <option value="PENDING_INSPECTION">Pending Inspection</option>
              <option value="INSPECTING">Inspecting</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="PARTIALLY_ACCEPTED">Partially Accepted</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <button onClick={fetchGRNs} className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900">
            Refresh
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Goods Receipts Found</h3>
          <p className="text-gray-600">Create a GRN from the Receiving page.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((g) => (
            <Link
              key={g.id}
              href={`/procurement/goods-receipts/${g.id}`}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">{g.grnNumber}</h3>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusBadge(g.status)}`}>{g.status}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    PO: {g.purchaseOrder?.poNumber || '-'} | Vendor: {g.purchaseOrder?.vendor?.companyName || '-'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Site: {g.siteLocation}</p>
                </div>
                <div className="text-right text-xs text-gray-500">
                  <div>Received: {new Date(g.receivedDate).toLocaleDateString()}</div>
                  <div>Items: {g._count?.items ?? '-'}</div>
                  <div>Inspections: {g._count?.inspections ?? '-'}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

export default function GoodsReceiptsPage() {
  return (
    <ProtectedRoute>
      <GoodsReceiptsContent />
    </ProtectedRoute>
  );
}

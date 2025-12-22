'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { FileText, Filter, Plus, Search } from 'lucide-react';

interface RFQListItem {
  id: string;
  rfqNumber: string;
  title: string;
  status: string;
  responseDeadline: string;
  deliveryLocation: string;
  createdAt: string;
  _count?: {
    items: number;
    invitedVendors: number;
    responses: number;
  };
}

function RFQsContent() {
  const { user } = useAuth();
  const [rfqs, setRfqs] = useState<RFQListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const isVendor = user?.role === 'VENDOR';

  const fetchRFQs = async () => {
    setLoading(true);
    try {
      if (isVendor) {
        const res = await api.get('/procurement/rfqs/invited');
        setRfqs(res.data.data || res.data);
      } else {
        const params: any = {};
        if (statusFilter !== 'ALL') params.status = statusFilter;
        if (searchQuery.trim()) params.search = searchQuery.trim();

        const res = await api.get('/procurement/rfqs', { params });
        setRfqs(res.data.data || res.data);
      }
    } catch (error) {
      console.error('Failed to fetch RFQs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRFQs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || isVendor) return rfqs;
    return rfqs.filter((r) => {
      return (
        r.title.toLowerCase().includes(q) ||
        r.rfqNumber.toLowerCase().includes(q) ||
        (r.deliveryLocation || '').toLowerCase().includes(q)
      );
    });
  }, [rfqs, searchQuery, isVendor]);

  const canCreate =
    user && ['SUPER_ADMIN', 'CEO', 'CFO', 'PROCUREMENT_OFFICER', 'OPERATIONS_MANAGER'].includes(user.role);

  const statusBadge = (status: string) => {
    const colors: any = {
      DRAFT: 'bg-gray-100 text-gray-800',
      PUBLISHED: 'bg-blue-100 text-blue-800',
      EVALUATING: 'bg-yellow-100 text-yellow-800',
      AWARDED: 'bg-green-100 text-green-800',
      CLOSED: 'bg-gray-100 text-gray-700',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading RFQs...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">RFQs</h1>
          <p className="text-gray-600 mt-1">
            {isVendor ? 'RFQs you are invited to' : 'Manage RFQs, invitations, and vendor responses'}
          </p>
        </div>
        {canCreate && (
          <Link
            href="/procurement/rfqs/new"
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus className="w-5 h-5" />
            <span>New RFQ</span>
          </Link>
        )}
      </div>

      {!isVendor && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search RFQs..."
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
                <option value="PUBLISHED">Published</option>
                <option value="EVALUATING">Evaluating</option>
                <option value="AWARDED">Awarded</option>
                <option value="CLOSED">Closed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <button
              onClick={fetchRFQs}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900"
            >
              Refresh
            </button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No RFQs Found</h3>
          <p className="text-gray-600 mb-4">
            {isVendor ? 'No invitations yet.' : 'Get started by creating your first RFQ.'}
          </p>
          {canCreate && (
            <Link
              href="/procurement/rfqs/new"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Plus className="w-5 h-5" />
              <span>Create RFQ</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((rfq) => (
            <Link
              key={rfq.id}
              href={`/procurement/rfqs/${rfq.id}`}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-1">
                    <h3 className="text-lg font-semibold text-gray-900">{rfq.title}</h3>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusBadge(rfq.status)}`}>
                      {rfq.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{rfq.rfqNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    Deadline: {new Date(rfq.responseDeadline).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-500">Delivery: {rfq.deliveryLocation}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <p className="text-xs text-gray-500">Items</p>
                  <p className="text-sm font-medium text-gray-900">{rfq._count?.items ?? '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Invited</p>
                  <p className="text-sm font-medium text-gray-900">{rfq._count?.invitedVendors ?? '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Responses</p>
                  <p className="text-sm font-medium text-gray-900">{rfq._count?.responses ?? '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Created</p>
                  <p className="text-sm font-medium text-gray-900">{new Date(rfq.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

export default function RFQsPage() {
  return (
    <ProtectedRoute>
      <RFQsContent />
    </ProtectedRoute>
  );
}

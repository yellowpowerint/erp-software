'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Clock, FileText, Search } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

interface Requisition {
  id: string;
  requisitionNo: string;
  title: string;
  type: string;
  priority: string;
  status: string;
  department: string;
  siteLocation: string;
  requiredDate: string;
  totalEstimate: number;
  currency: string;
  requestedBy: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  _count?: {
    items: number;
    attachments: number;
  };
  createdAt: string;
}

function PendingApprovalsContent() {
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await api.get('/procurement/requisitions/pending');
      setRequisitions(res.data.data || res.data);
    } catch (error) {
      console.error('Failed to fetch pending approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      SUBMITTED: 'bg-blue-100 text-blue-800',
      PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors: any = {
      LOW: 'text-gray-600',
      MEDIUM: 'text-blue-600',
      HIGH: 'text-orange-600',
      CRITICAL: 'text-red-600',
    };
    return colors[priority] || 'text-gray-600';
  };

  const filtered = requisitions.filter((req) =>
    req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.requisitionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading pending approvals...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pending Approvals</h1>
            <p className="text-gray-600 mt-1">Requisitions waiting for your action</p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>{requisitions.length} pending</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search pending requisitions..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Approvals</h3>
          <p className="text-gray-600">You have no requisitions waiting for approval.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((req) => (
            <Link
              key={req.id}
              href={`/procurement/requisitions/${req.id}`}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{req.title}</h3>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(req.status)}`}>
                      {req.status.replace(/_/g, ' ')}
                    </span>
                    <span className={`text-sm font-semibold ${getPriorityColor(req.priority)}`}>
                      {req.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{req.requisitionNo}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">
                    {req.currency} {Number(req.totalEstimate).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">Estimated Total</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <p className="text-xs text-gray-500">Department</p>
                  <p className="text-sm font-medium text-gray-900">{req.department}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Site</p>
                  <p className="text-sm font-medium text-gray-900">{req.siteLocation}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Required Date</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(req.requiredDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Requested By</p>
                  <p className="text-sm font-medium text-gray-900">
                    {req.requestedBy.firstName} {req.requestedBy.lastName}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

export default function PendingApprovalsPage() {
  return (
    <ProtectedRoute>
      <PendingApprovalsContent />
    </ProtectedRoute>
  );
}

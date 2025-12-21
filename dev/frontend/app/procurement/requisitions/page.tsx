'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { FileText, Plus, Filter, Search } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

interface Requisition {
  id: string;
  requisitionNo: string;
  title: string;
  description: string;
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
  project?: {
    id: string;
    name: string;
    projectCode: string;
  };
  _count: {
    items: number;
    attachments: number;
  };
  createdAt: string;
}

interface Stats {
  total: number;
  byStatus: Record<string, number>;
  pendingApprovals: number;
}

function RequisitionsContent() {
  const { user } = useAuth();
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, [statusFilter, priorityFilter, typeFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (priorityFilter !== 'ALL') params.priority = priorityFilter;
      if (typeFilter !== 'ALL') params.type = typeFilter;

      const [requisitionsRes, statsRes] = await Promise.all([
        api.get('/procurement/requisitions', { params }),
        api.get('/procurement/requisitions/stats'),
      ]);

      setRequisitions(requisitionsRes.data.data || requisitionsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to fetch requisitions:', error);
    } finally {
      setLoading(false);
    }
  };

  const canCreate = user && [
    'SUPER_ADMIN',
    'CEO',
    'CFO',
    'PROCUREMENT_OFFICER',
    'DEPARTMENT_HEAD',
    'OPERATIONS_MANAGER',
    'WAREHOUSE_MANAGER',
    'EMPLOYEE',
  ].includes(user.role);

  const getStatusColor = (status: string) => {
    const colors: any = {
      DRAFT: 'bg-gray-100 text-gray-800',
      SUBMITTED: 'bg-blue-100 text-blue-800',
      PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      PARTIALLY_APPROVED: 'bg-green-100 text-green-700',
      REJECTED: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-600',
      IN_PROCUREMENT: 'bg-indigo-100 text-indigo-800',
      COMPLETED: 'bg-purple-100 text-purple-800',
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

  const filteredRequisitions = requisitions.filter((req) =>
    req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.requisitionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading requisitions...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Procurement Requisitions</h1>
            <p className="text-gray-600 mt-1">Manage procurement requests and approvals</p>
          </div>
          {canCreate && (
            <Link
              href="/procurement/requisitions/new"
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>New Requisition</span>
            </Link>
          )}
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total Requisitions</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Pending Approval</p>
            <p className="text-2xl font-bold text-yellow-600 mt-1">
              {stats.byStatus.PENDING_APPROVAL || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Approved</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {stats.byStatus.APPROVED || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">My Pending Approvals</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">{stats.pendingApprovals}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search requisitions..."
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
              <option value="REJECTED">Rejected</option>
              <option value="IN_PROCUREMENT">In Procurement</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="ALL">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="ALL">All Types</option>
            <option value="STOCK_REPLENISHMENT">Stock Replenishment</option>
            <option value="PROJECT_MATERIALS">Project Materials</option>
            <option value="EQUIPMENT_PURCHASE">Equipment Purchase</option>
            <option value="MAINTENANCE_PARTS">Maintenance Parts</option>
            <option value="SAFETY_SUPPLIES">Safety Supplies</option>
            <option value="CONSUMABLES">Consumables</option>
            <option value="EMERGENCY">Emergency</option>
            <option value="CAPITAL_EXPENDITURE">Capital Expenditure</option>
          </select>
        </div>
      </div>

      {filteredRequisitions.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Requisitions Found</h3>
          <p className="text-gray-600 mb-4">Get started by creating your first procurement requisition.</p>
          {canCreate && (
            <Link
              href="/procurement/requisitions/new"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Plus className="w-5 h-5" />
              <span>Create Requisition</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredRequisitions.map((req) => (
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
                      {req.priority === 'CRITICAL' && '🔴 '}
                      {req.priority === 'HIGH' && '🟠 '}
                      {req.priority === 'MEDIUM' && '🟡 '}
                      {req.priority === 'LOW' && '🟢 '}
                      {req.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{req.requisitionNo}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">
                    {req.currency} {req.totalEstimate.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">Estimated Total</p>
                </div>
              </div>

              {req.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{req.description}</p>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <p className="text-xs text-gray-500">Type</p>
                  <p className="text-sm font-medium text-gray-900 capitalize">
                    {req.type.replace(/_/g, ' ').toLowerCase()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Department</p>
                  <p className="text-sm font-medium text-gray-900">{req.department}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Items</p>
                  <p className="text-sm font-medium text-gray-900">{req._count.items}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Required Date</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(req.requiredDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                <span>
                  Requested by: {req.requestedBy.firstName} {req.requestedBy.lastName}
                </span>
                <span>Created: {new Date(req.createdAt).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

export default function RequisitionsPage() {
  return (
    <ProtectedRoute>
      <RequisitionsContent />
    </ProtectedRoute>
  );
}

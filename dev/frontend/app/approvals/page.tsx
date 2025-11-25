'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { FileText, ShoppingCart, CheckCircle, XCircle, Clock, Plus } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

interface ApprovalStats {
  invoices: {
    pending: number;
    approved: number;
    rejected: number;
    total: number;
  };
  purchaseRequests: {
    pending: number;
    approved: number;
    rejected: number;
    total: number;
  };
  totalPending: number;
}

function ApprovalsContent() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ApprovalStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/approvals/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch approval stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const canCreateInvoice = user && ['SUPER_ADMIN', 'CFO', 'ACCOUNTANT'].includes(user.role);
  const canCreatePurchaseRequest = user && ['SUPER_ADMIN', 'CEO', 'CFO', 'PROCUREMENT_OFFICER', 'DEPARTMENT_HEAD'].includes(user.role);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Approvals & Workflows</h1>
        <p className="text-gray-600 mt-1">Manage invoices, purchase requests, and approval workflows</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {canCreateInvoice && (
          <Link
            href="/approvals/invoices/new"
            className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all"
          >
            <Plus className="w-6 h-6" />
            <div>
              <p className="font-semibold">Create Invoice</p>
              <p className="text-sm text-blue-100">Submit new invoice for approval</p>
            </div>
          </Link>
        )}
        {canCreatePurchaseRequest && (
          <Link
            href="/approvals/purchases/new"
            className="flex items-center space-x-3 p-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:shadow-lg transition-all"
          >
            <Plus className="w-6 h-6" />
            <div>
              <p className="font-semibold">New Purchase Request</p>
              <p className="text-sm text-green-100">Submit new purchase request</p>
            </div>
          </Link>
        )}
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading stats...</p>
        </div>
      ) : stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-orange-500 p-3 rounded-lg">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Total Pending</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalPending}</p>
                <p className="text-xs text-gray-500 mt-2">Awaiting approval</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-blue-500 p-3 rounded-lg">
                  <FileText className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Pending Invoices</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.invoices.pending}</p>
                <p className="text-xs text-gray-500 mt-2">{stats.invoices.total} total invoices</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-green-500 p-3 rounded-lg">
                  <ShoppingCart className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Pending Requests</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.purchaseRequests.pending}</p>
                <p className="text-xs text-gray-500 mt-2">{stats.purchaseRequests.total} total requests</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-indigo-500 p-3 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Total Approved</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.invoices.approved + stats.purchaseRequests.approved}</p>
                <p className="text-xs text-gray-500 mt-2">All time</p>
              </div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Invoices Card */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  <h2 className="text-lg font-semibold text-gray-900">Invoices</h2>
                </div>
                <Link
                  href="/approvals/invoices"
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  View All →
                </Link>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Clock className="w-5 h-5 text-orange-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Pending</p>
                        <p className="text-xs text-gray-500">Awaiting approval</p>
                      </div>
                    </div>
                    <span className="text-xl font-bold text-gray-900">{stats.invoices.pending}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Approved</p>
                        <p className="text-xs text-gray-500">Completed</p>
                      </div>
                    </div>
                    <span className="text-xl font-bold text-gray-900">{stats.invoices.approved}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <XCircle className="w-5 h-5 text-red-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Rejected</p>
                        <p className="text-xs text-gray-500">Not approved</p>
                      </div>
                    </div>
                    <span className="text-xl font-bold text-gray-900">{stats.invoices.rejected}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Purchase Requests Card */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShoppingCart className="w-5 h-5 text-green-500" />
                  <h2 className="text-lg font-semibold text-gray-900">Purchase Requests</h2>
                </div>
                <Link
                  href="/approvals/purchases"
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  View All →
                </Link>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Clock className="w-5 h-5 text-orange-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Pending</p>
                        <p className="text-xs text-gray-500">Awaiting approval</p>
                      </div>
                    </div>
                    <span className="text-xl font-bold text-gray-900">{stats.purchaseRequests.pending}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Approved</p>
                        <p className="text-xs text-gray-500">Completed</p>
                      </div>
                    </div>
                    <span className="text-xl font-bold text-gray-900">{stats.purchaseRequests.approved}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <XCircle className="w-5 h-5 text-red-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Rejected</p>
                        <p className="text-xs text-gray-500">Not approved</p>
                      </div>
                    </div>
                    <span className="text-xl font-bold text-gray-900">{stats.purchaseRequests.rejected}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}

export default function ApprovalsPage() {
  return (
    <ProtectedRoute>
      <ApprovalsContent />
    </ProtectedRoute>
  );
}

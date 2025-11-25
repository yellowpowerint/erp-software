'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { FileText, ArrowLeft, CheckCircle, XCircle, Clock, Calendar, DollarSign, User, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

interface Invoice {
  id: string;
  invoiceNumber: string;
  supplierName: string;
  supplierEmail: string;
  description: string;
  amount: number;
  currency: string;
  dueDate: string;
  status: string;
  notes: string;
  createdAt: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  approvalHistory: Array<{
    id: string;
    action: string;
    comments: string;
    createdAt: string;
    approver: {
      firstName: string;
      lastName: string;
      role: string;
    };
  }>;
}

function InvoiceDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [comments, setComments] = useState('');

  useEffect(() => {
    fetchInvoice();
  }, [params.id]);

  const fetchInvoice = async () => {
    try {
      const response = await api.get(`/approvals/invoices/${params.id}`);
      setInvoice(response.data);
    } catch (error) {
      console.error('Failed to fetch invoice:', error);
      alert('Invoice not found');
      router.push('/approvals/invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await api.post(`/approvals/invoices/${params.id}/approve`, { comments });
      alert('Invoice approved successfully!');
      setShowApproveModal(false);
      fetchInvoice();
    } catch (error: any) {
      console.error('Failed to approve invoice:', error);
      alert(error.response?.data?.message || 'Failed to approve invoice');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!comments.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    setActionLoading(true);
    try {
      await api.post(`/approvals/invoices/${params.id}/reject`, { comments });
      alert('Invoice rejected');
      setShowRejectModal(false);
      fetchInvoice();
    } catch (error: any) {
      console.error('Failed to reject invoice:', error);
      alert(error.response?.data?.message || 'Failed to reject invoice');
    } finally {
      setActionLoading(false);
    }
  };

  const canApprove = user && ['SUPER_ADMIN', 'CEO', 'CFO', 'ACCOUNTANT'].includes(user.role);
  const isPending = invoice?.status === 'PENDING';

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'bg-orange-100 text-orange-800 border-orange-200',
      APPROVED: 'bg-green-100 text-green-800 border-green-200',
      REJECTED: 'bg-red-100 text-red-800 border-red-200',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'APPROVED') return <CheckCircle className="w-5 h-5" />;
    if (status === 'REJECTED') return <XCircle className="w-5 h-5" />;
    return <Clock className="w-5 h-5" />;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading invoice...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!invoice) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link
          href="/approvals/invoices"
          className="inline-flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Invoices</span>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{invoice.invoiceNumber}</h1>
            <p className="text-gray-600 mt-1">{invoice.supplierName}</p>
          </div>
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${getStatusBadge(invoice.status)}`}>
            {getStatusIcon(invoice.status)}
            <span className="font-semibold">{invoice.status}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {canApprove && isPending && (
        <div className="mb-6 flex space-x-4">
          <button
            onClick={() => setShowApproveModal(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <CheckCircle className="w-5 h-5" />
            <span>Approve Invoice</span>
          </button>
          <button
            onClick={() => setShowRejectModal(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <XCircle className="w-5 h-5" />
            <span>Reject Invoice</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice Details</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Supplier Name</label>
                  <p className="font-medium text-gray-900">{invoice.supplierName}</p>
                </div>
                {invoice.supplierEmail && (
                  <div>
                    <label className="text-sm text-gray-500">Supplier Email</label>
                    <p className="font-medium text-gray-900">{invoice.supplierEmail}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-500">Description</label>
                <p className="font-medium text-gray-900">{invoice.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Amount</label>
                  <p className="text-2xl font-bold text-gray-900">
                    {invoice.currency} {invoice.amount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Due Date</label>
                  <p className="font-medium text-gray-900">
                    {new Date(invoice.dueDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {invoice.notes && (
                <div>
                  <label className="text-sm text-gray-500">Notes</label>
                  <p className="font-medium text-gray-900">{invoice.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Approval History */}
          {invoice.approvalHistory.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Approval History</h2>
              <div className="space-y-4">
                {invoice.approvalHistory.map((history) => (
                  <div key={history.id} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                    <div className={`p-2 rounded-lg ${
                      history.action === 'APPROVED' ? 'bg-green-100' :
                      history.action === 'REJECTED' ? 'bg-red-100' : 'bg-gray-100'
                    }`}>
                      {history.action === 'APPROVED' ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : history.action === 'REJECTED' ? (
                        <XCircle className="w-5 h-5 text-red-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-gray-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-gray-900">
                          {history.approver.firstName} {history.approver.lastName}
                        </p>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          history.action === 'APPROVED' ? 'bg-green-100 text-green-800' :
                          history.action === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {history.action}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mb-2">
                        {history.approver.role} • {new Date(history.createdAt).toLocaleString()}
                      </p>
                      {history.comments && (
                        <p className="text-sm text-gray-700 bg-white p-2 rounded border border-gray-200">
                          {history.comments}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Created By */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Created By</h2>
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium">
                  {invoice.createdBy.firstName[0]}{invoice.createdBy.lastName[0]}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {invoice.createdBy.firstName} {invoice.createdBy.lastName}
                </p>
                <p className="text-sm text-gray-500">{invoice.createdBy.role}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">{invoice.createdBy.email}</p>
            <p className="text-xs text-gray-500 mt-2">
              Created {new Date(invoice.createdAt).toLocaleString()}
            </p>
          </div>

          {/* Quick Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Info</h2>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-gray-700">
                <FileText className="w-5 h-5 text-gray-400" />
                <span className="text-sm">{invoice.invoiceNumber}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-700">
                <DollarSign className="w-5 h-5 text-gray-400" />
                <span className="text-sm">{invoice.currency} {invoice.amount.toLocaleString()}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-700">
                <Calendar className="w-5 h-5 text-gray-400" />
                <span className="text-sm">Due: {new Date(invoice.dueDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Approve Invoice</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to approve this invoice for {invoice.currency} {invoice.amount.toLocaleString()}?
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comments (Optional)
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Add any comments..."
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                {actionLoading ? 'Approving...' : 'Approve'}
              </button>
              <button
                onClick={() => setShowApproveModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Invoice</h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for rejecting this invoice.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Rejection *
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Explain why this invoice is being rejected..."
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleReject}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
              >
                {actionLoading ? 'Rejecting...' : 'Reject'}
              </button>
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function InvoiceDetailPage() {
  return (
    <ProtectedRoute>
      <InvoiceDetailContent />
    </ProtectedRoute>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { DollarSign, ArrowLeft, CheckCircle, XCircle, Clock, Calendar, User } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

interface PaymentRequest {
  id: string;
  requestNumber: string;
  paymentType: string;
  payeeName: string;
  payeeAccount: string;
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

function PaymentRequestDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [request, setRequest] = useState<PaymentRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [comments, setComments] = useState('');

  useEffect(() => {
    fetchRequest();
  }, [params.id]);

  const fetchRequest = async () => {
    try {
      const response = await api.get(`/approvals/payment-requests/${params.id}`);
      setRequest(response.data);
    } catch (error) {
      console.error('Failed to fetch payment request:', error);
      alert('Payment request not found');
      router.push('/approvals/payment-requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await api.post(`/approvals/payment-requests/${params.id}/approve`, { comments });
      alert('Payment request approved successfully!');
      setShowApproveModal(false);
      fetchRequest();
    } catch (error: any) {
      console.error('Failed to approve payment request:', error);
      alert(error.response?.data?.message || 'Failed to approve payment request');
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
      await api.post(`/approvals/payment-requests/${params.id}/reject`, { comments });
      alert('Payment request rejected');
      setShowRejectModal(false);
      fetchRequest();
    } catch (error: any) {
      console.error('Failed to reject payment request:', error);
      alert(error.response?.data?.message || 'Failed to reject payment request');
    } finally {
      setActionLoading(false);
    }
  };

  const canApprove = user && ['SUPER_ADMIN', 'CEO', 'CFO', 'ACCOUNTANT'].includes(user.role);
  const isPending = request?.status === 'PENDING';

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
          <p className="text-gray-600 mt-4">Loading payment request...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!request) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link
          href="/approvals/payment-requests"
          className="inline-flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Payment Requests</span>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{request.requestNumber}</h1>
            <p className="text-gray-600 mt-1">{request.payeeName}</p>
          </div>
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${getStatusBadge(request.status)}`}>
            {getStatusIcon(request.status)}
            <span className="font-semibold">{request.status}</span>
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
            <span>Approve Payment</span>
          </button>
          <button
            onClick={() => setShowRejectModal(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <XCircle className="w-5 h-5" />
            <span>Reject Payment</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Payment Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Payment Type</label>
                  <p className="font-medium text-gray-900 capitalize">{request.paymentType.replace('_', ' ')}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Amount</label>
                  <p className="font-medium text-gray-900 text-lg">{request.currency} {request.amount.toLocaleString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Payee Name</label>
                  <p className="font-medium text-gray-900">{request.payeeName}</p>
                </div>
                {request.payeeAccount && (
                  <div>
                    <label className="text-sm text-gray-500">Account Number</label>
                    <p className="font-medium text-gray-900">{request.payeeAccount}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-500">Description</label>
                <p className="text-gray-900 whitespace-pre-wrap">{request.description}</p>
              </div>

              {request.notes && (
                <div>
                  <label className="text-sm text-gray-500">Additional Notes</label>
                  <p className="text-gray-900 whitespace-pre-wrap">{request.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Approval History */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Approval History</h2>
            {request.approvalHistory.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No approval actions yet</p>
            ) : (
              <div className="space-y-4">
                {request.approvalHistory.map((history) => (
                  <div key={history.id} className="border-l-4 border-indigo-500 pl-4 py-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          history.action === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {history.action}
                        </span>
                        <span className="text-sm text-gray-600">
                          by {history.approver.firstName} {history.approver.lastName} ({history.approver.role})
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(history.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {history.comments && (
                      <p className="text-sm text-gray-700 mt-2 bg-gray-50 p-3 rounded">
                        {history.comments}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Submitted By */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
              <User className="w-4 h-4 mr-2" />
              Submitted By
            </h3>
            <div>
              <p className="font-medium text-gray-900">
                {request.createdBy.firstName} {request.createdBy.lastName}
              </p>
              <p className="text-sm text-gray-600">{request.createdBy.role}</p>
              <p className="text-sm text-gray-600">{request.createdBy.email}</p>
            </div>
          </div>

          {/* Dates */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Important Dates
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">Submitted</label>
                <p className="text-sm text-gray-900">{new Date(request.createdAt).toLocaleDateString()}</p>
              </div>
              {request.dueDate && (
                <div>
                  <label className="text-xs text-gray-500">Due Date</label>
                  <p className="text-sm text-gray-900">{new Date(request.dueDate).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Approve Payment Request</h3>
            <p className="text-gray-600 mb-4">Are you sure you want to approve this payment request?</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comments (Optional)
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Add your comments..."
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
              >
                {actionLoading ? 'Approving...' : 'Approve'}
              </button>
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  setComments('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Payment Request</h3>
            <p className="text-gray-600 mb-4">Please provide a reason for rejecting this payment request.</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Rejection *
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Explain why this payment is being rejected..."
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleReject}
                disabled={actionLoading || !comments.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors"
              >
                {actionLoading ? 'Rejecting...' : 'Reject'}
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setComments('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
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

export default function PaymentRequestDetailPage() {
  return (
    <ProtectedRoute>
      <PaymentRequestDetailContent />
    </ProtectedRoute>
  );
}

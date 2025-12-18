'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ShoppingCart, ArrowLeft, CheckCircle, XCircle, Clock, Package, DollarSign, User, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import GeneratePDFButton from '@/components/documents/GeneratePDFButton';
import SignDocumentModal from '@/components/documents/SignDocumentModal';
import { useDocuments } from '@/hooks/useDocuments';

interface PurchaseRequest {
  id: string;
  requestNumber: string;
  title: string;
  description: string;
  category: string;
  quantity: number;
  estimatedCost: number;
  currency: string;
  justification: string;
  urgency: string;
  status: string;
  supplierSuggestion: string;
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

function PurchaseRequestDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [request, setRequest] = useState<PurchaseRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [comments, setComments] = useState('');
  const [showSignModal, setShowSignModal] = useState(false);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const { signDocument, generatePDFPreview } = useDocuments();

  useEffect(() => {
    fetchRequest();
  }, [params.id]);

  const fetchRequest = async () => {
    try {
      const response = await api.get(`/approvals/purchase-requests/${params.id}`);
      setRequest(response.data);
    } catch (error) {
      console.error('Failed to fetch purchase request:', error);
      alert('Purchase request not found');
      router.push('/approvals/purchases');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await api.post(`/approvals/purchase-requests/${params.id}/approve`, { comments });
      alert('Purchase request approved successfully!');
      setShowApproveModal(false);
      fetchRequest();
    } catch (error: any) {
      console.error('Failed to approve purchase request:', error);
      alert(error.response?.data?.message || 'Failed to approve request');
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
      await api.post(`/approvals/purchase-requests/${params.id}/reject`, { comments });
      alert('Purchase request rejected');
      setShowRejectModal(false);
      fetchRequest();
    } catch (error: any) {
      console.error('Failed to reject purchase request:', error);
      alert(error.response?.data?.message || 'Failed to reject request');
    } finally {
      setActionLoading(false);
    }
  };

  const canApprove = user && ['SUPER_ADMIN', 'CEO', 'CFO', 'PROCUREMENT_OFFICER'].includes(user.role);
  const isPending = request?.status === 'PENDING';

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'bg-orange-100 text-orange-800 border-orange-200',
      APPROVED: 'bg-green-100 text-green-800 border-green-200',
      REJECTED: 'bg-red-100 text-red-800 border-red-200',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const getUrgencyBadge = (urgency: string) => {
    const styles = {
      HIGH: 'bg-red-100 text-red-800',
      NORMAL: 'bg-blue-100 text-blue-800',
      LOW: 'bg-gray-100 text-gray-800',
    };
    return styles[urgency as keyof typeof styles] || 'bg-gray-100 text-gray-800';
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
          <p className="text-gray-600 mt-4">Loading purchase request...</p>
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
          href="/approvals/purchases"
          className="inline-flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Purchase Requests</span>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{request.requestNumber}</h1>
            <p className="text-gray-600 mt-1">{request.title}</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-lg text-sm font-medium ${getUrgencyBadge(request.urgency)}`}>
              {request.urgency}
            </span>
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${getStatusBadge(request.status)}`}>
              {getStatusIcon(request.status)}
              <span className="font-semibold">{request.status}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mb-6 flex space-x-4">
        <GeneratePDFButton
          documentType="purchase-order"
          entityId={request.id}
          variant="outline"
          buttonText="Generate PDF"
        />

        <button
          onClick={async () => {
            try {
              const url = await generatePDFPreview('purchase-order', request.id, {});
              setDocumentUrl(url);
              setShowSignModal(true);
            } catch (err) {
              console.error('Failed to generate PDF preview:', err);
            }
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Sign Document</span>
        </button>

        {canApprove && isPending && (
          <>
            <button
              onClick={() => setShowApproveModal(true)}
              className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <CheckCircle className="w-5 h-5" />
              <span>Approve Request</span>
            </button>
            <button
              onClick={() => setShowRejectModal(true)}
              className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <XCircle className="w-5 h-5" />
              <span>Reject Request</span>
            </button>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Request Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Request Details</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-500">Title</label>
                <p className="font-medium text-gray-900">{request.title}</p>
              </div>

              <div>
                <label className="text-sm text-gray-500">Description</label>
                <p className="font-medium text-gray-900">{request.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Category</label>
                  <p className="font-medium text-gray-900">{request.category}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Quantity</label>
                  <p className="font-medium text-gray-900">{request.quantity}</p>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-500">Estimated Cost</label>
                <p className="text-2xl font-bold text-gray-900">
                  {request.currency} {request.estimatedCost.toLocaleString()}
                </p>
              </div>

              <div>
                <label className="text-sm text-gray-500">Justification</label>
                <p className="font-medium text-gray-900 bg-blue-50 p-3 rounded-lg">{request.justification}</p>
              </div>

              {request.supplierSuggestion && (
                <div>
                  <label className="text-sm text-gray-500">Suggested Supplier</label>
                  <p className="font-medium text-gray-900">{request.supplierSuggestion}</p>
                </div>
              )}

              {request.notes && (
                <div>
                  <label className="text-sm text-gray-500">Additional Notes</label>
                  <p className="font-medium text-gray-900">{request.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Approval History */}
          {request.approvalHistory.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Approval History</h2>
              <div className="space-y-4">
                {request.approvalHistory.map((history) => (
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
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Requested By</h2>
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium">
                  {request.createdBy.firstName[0]}{request.createdBy.lastName[0]}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {request.createdBy.firstName} {request.createdBy.lastName}
                </p>
                <p className="text-sm text-gray-500">{request.createdBy.role}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">{request.createdBy.email}</p>
            <p className="text-xs text-gray-500 mt-2">
              Created {new Date(request.createdAt).toLocaleString()}
            </p>
          </div>

          {/* Quick Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Summary</h2>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-gray-700">
                <ShoppingCart className="w-5 h-5 text-gray-400" />
                <span className="text-sm">{request.requestNumber}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-700">
                <Package className="w-5 h-5 text-gray-400" />
                <span className="text-sm">{request.quantity} units • {request.category}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-700">
                <DollarSign className="w-5 h-5 text-gray-400" />
                <span className="text-sm">{request.currency} {request.estimatedCost.toLocaleString()}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-700">
                <AlertCircle className="w-5 h-5 text-gray-400" />
                <span className={`text-sm font-medium ${
                  request.urgency === 'HIGH' ? 'text-red-600' :
                  request.urgency === 'NORMAL' ? 'text-blue-600' : 'text-gray-600'
                }`}>
                  {request.urgency} Priority
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Approve Purchase Request</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to approve this purchase request for {request.currency} {request.estimatedCost.toLocaleString()}?
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

      {/* Sign Document Modal */}
      <SignDocumentModal
        isOpen={showSignModal}
        onClose={() => {
          setShowSignModal(false);
          if (documentUrl) {
            window.URL.revokeObjectURL(documentUrl);
            setDocumentUrl(null);
          }
        }}
        documentId={request.id}
        documentName={`Purchase Request ${request.requestNumber}`}
        documentUrl={documentUrl || undefined}
        onSign={async (signatureData, reason) => {
          await signDocument(request.id, signatureData, reason || `Signed purchase request ${request.requestNumber}`);
          setShowSignModal(false);
          if (documentUrl) {
            window.URL.revokeObjectURL(documentUrl);
            setDocumentUrl(null);
          }
        }}
      />

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Purchase Request</h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for rejecting this purchase request.
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
                placeholder="Explain why this request is being rejected..."
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

export default function PurchaseRequestDetailPage() {
  return (
    <ProtectedRoute>
      <PurchaseRequestDetailContent />
    </ProtectedRoute>
  );
}

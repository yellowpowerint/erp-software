'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ArrowLeft, Edit, FileText, Upload, CheckCircle, XCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

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
  justification: string;
  totalEstimate: number;
  currency: string;
  currentStage: number;
  requestedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  approvedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  rejectedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  project?: {
    id: string;
    name: string;
    projectCode: string;
  };
  items: Array<{
    id: string;
    itemName: string;
    description: string;
    category: string;
    quantity: number;
    unit: string;
    estimatedPrice: number;
    totalPrice: number;
    specifications: string;
    preferredVendor: string;
    urgency: string;
    notes: string;
  }>;
  attachments: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    uploadedAt: string;
    uploadedBy: {
      id: string;
      firstName: string;
      lastName: string;
    };
  }>;
  approvalHistory: Array<{
    id: string;
    stage: number;
    status: string;
    comments: string;
    actionAt: string;
    approver: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      role: string;
    };
  }>;
  createdAt: string;
  updatedAt: string;
}

function RequisitionDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [requisition, setRequisition] = useState<Requisition | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [approveComments, setApproveComments] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [infoQuestions, setInfoQuestions] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    fetchRequisition();
  }, [params.id]);

  const fetchRequisition = async () => {
    try {
      const response = await api.get(`/procurement/requisitions/${params.id}`);
      setRequisition(response.data);
    } catch (error) {
      console.error('Failed to fetch requisition:', error);
      alert('Requisition not found');
      router.push('/procurement/requisitions');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      await api.post(`/procurement/requisitions/${params.id}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      alert('File uploaded successfully!');
      fetchRequisition();
    } catch (error: any) {
      console.error('Failed to upload file:', error);
      alert(error.response?.data?.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!window.confirm('Submit this requisition for approval?')) return;

    try {
      await api.post(`/procurement/requisitions/${params.id}/submit`);
      alert('Requisition submitted for approval!');
      fetchRequisition();
    } catch (error: any) {
      console.error('Failed to submit requisition:', error);
      alert(error.response?.data?.message || 'Failed to submit requisition');
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      alert('Please provide a reason for cancellation');
      return;
    }

    try {
      await api.post(`/procurement/requisitions/${params.id}/cancel`, {
        reason: cancelReason,
      });
      alert('Requisition cancelled');
      setShowCancelModal(false);
      fetchRequisition();
    } catch (error: any) {
      console.error('Failed to cancel requisition:', error);
      alert(error.response?.data?.message || 'Failed to cancel requisition');
    }
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await api.post(`/procurement/requisitions/${params.id}/approve`, {
        comments: approveComments,
      });
      setShowApproveModal(false);
      setApproveComments('');
      fetchRequisition();
    } catch (error: any) {
      console.error('Failed to approve requisition:', error);
      alert(error.response?.data?.message || 'Failed to approve requisition');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setActionLoading(true);
    try {
      await api.post(`/procurement/requisitions/${params.id}/reject`, {
        reason: rejectReason,
      });
      setShowRejectModal(false);
      setRejectReason('');
      fetchRequisition();
    } catch (error: any) {
      console.error('Failed to reject requisition:', error);
      alert(error.response?.data?.message || 'Failed to reject requisition');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestInfo = async () => {
    if (!infoQuestions.trim()) {
      alert('Please provide the information being requested');
      return;
    }

    setActionLoading(true);
    try {
      await api.post(`/procurement/requisitions/${params.id}/request-info`, {
        questions: infoQuestions,
      });
      setShowInfoModal(false);
      setInfoQuestions('');
      alert('Info request sent');
    } catch (error: any) {
      console.error('Failed to request info:', error);
      alert(error.response?.data?.message || 'Failed to request info');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEscalate = async () => {
    if (
      !window.confirm(
        'Escalate this approval to the configured escalation target?',
      )
    )
      return;

    setActionLoading(true);
    try {
      await api.post(`/procurement/requisitions/${params.id}/escalate`);
      fetchRequisition();
    } catch (error: any) {
      console.error('Failed to escalate:', error);
      alert(error.response?.data?.message || 'Failed to escalate');
    } finally {
      setActionLoading(false);
    }
  };

  const canEdit = user && requisition && (
    requisition.requestedBy.id === user.id ||
    ['SUPER_ADMIN', 'CEO', 'CFO', 'PROCUREMENT_OFFICER', 'OPERATIONS_MANAGER'].includes(user.role)
  ) && requisition.status === 'DRAFT';

  const canSubmit = canEdit && requisition?.items.length > 0;

  const canCancel = user && requisition && (
    requisition.requestedBy.id === user.id ||
    ['SUPER_ADMIN', 'CEO', 'CFO', 'PROCUREMENT_OFFICER', 'OPERATIONS_MANAGER'].includes(user.role)
  ) && !['CANCELLED', 'COMPLETED'].includes(requisition.status);

  const canTakeApprovalAction = user && requisition && (
    ['SUPER_ADMIN', 'CEO', 'CFO', 'PROCUREMENT_OFFICER', 'DEPARTMENT_HEAD', 'OPERATIONS_MANAGER'].includes(user.role)
  ) && requisition.status === 'PENDING_APPROVAL';

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading requisition...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!requisition) return null;

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

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link
          href="/procurement/requisitions"
          className="inline-flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Requisitions</span>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{requisition.title}</h1>
            <p className="text-gray-600 mt-1">{requisition.requisitionNo}</p>
          </div>
          <div className="flex items-center space-x-3">
            {canTakeApprovalAction && (
              <>
                <button
                  onClick={() => setShowApproveModal(true)}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                >
                  Approve
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
                >
                  Reject
                </button>
                <button
                  onClick={() => setShowInfoModal(true)}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-400"
                >
                  Request Info
                </button>
                <button
                  onClick={handleEscalate}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400"
                >
                  Escalate
                </button>
              </>
            )}
            {canSubmit && (
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Submit for Approval
              </button>
            )}
            {canCancel && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Cancel Requisition
              </button>
            )}
            {canEdit && (
              <Link
                href={`/procurement/requisitions/${requisition.id}/edit`}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Edit className="w-5 h-5" />
                <span>Edit</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {requisition.status === 'REJECTED' && requisition.rejectionReason && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="font-semibold text-red-800">Rejected</p>
          <p className="text-sm text-red-700 mt-1">{requisition.rejectionReason}</p>
          {requisition.rejectedBy && (
            <p className="text-xs text-red-600 mt-2">
              Rejected by {requisition.rejectedBy.firstName} {requisition.rejectedBy.lastName} on{' '}
              {new Date(requisition.rejectedAt!).toLocaleString()}
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Requisition Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Status</label>
                <div className="mt-1">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(requisition.status)}`}>
                    {requisition.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-500">Priority</label>
                <p className={`font-medium ${getPriorityColor(requisition.priority)}`}>
                  {requisition.priority === 'CRITICAL' && '🔴 '}
                  {requisition.priority === 'HIGH' && '🟠 '}
                  {requisition.priority === 'MEDIUM' && '🟡 '}
                  {requisition.priority === 'LOW' && '🟢 '}
                  {requisition.priority}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Type</label>
                <p className="font-medium text-gray-900 capitalize">
                  {requisition.type.replace(/_/g, ' ').toLowerCase()}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Department</label>
                <p className="font-medium text-gray-900">{requisition.department}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Site Location</label>
                <p className="font-medium text-gray-900">{requisition.siteLocation}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Required Date</label>
                <p className="font-medium text-gray-900">
                  {new Date(requisition.requiredDate).toLocaleDateString()}
                </p>
              </div>
              {requisition.project && (
                <div className="col-span-2">
                  <label className="text-sm text-gray-500">Project</label>
                  <p className="font-medium text-gray-900">
                    {requisition.project.projectCode} - {requisition.project.name}
                  </p>
                </div>
              )}
            </div>
            {requisition.description && (
              <div className="mt-4">
                <label className="text-sm text-gray-500">Description</label>
                <p className="text-gray-900 mt-1">{requisition.description}</p>
              </div>
            )}
            {requisition.justification && (
              <div className="mt-4">
                <label className="text-sm text-gray-500">Justification</label>
                <p className="text-gray-900 mt-1">{requisition.justification}</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Items ({requisition.items.length})</h2>
            {requisition.items.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No items added yet</p>
            ) : (
              <div className="space-y-3">
                {requisition.items.map((item) => (
                  <div key={item.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.itemName}</h4>
                        {item.description && (
                          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                        )}
                      </div>
                      <span className={`text-xs font-semibold ${getPriorityColor(item.urgency)}`}>
                        {item.urgency}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Quantity:</span>
                        <p className="font-medium text-gray-900">
                          {item.quantity} {item.unit}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Unit Price:</span>
                        <p className="font-medium text-gray-900">
                          {requisition.currency} {item.estimatedPrice.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Total:</span>
                        <p className="font-semibold text-indigo-600">
                          {requisition.currency} {item.totalPrice.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Category:</span>
                        <p className="font-medium text-gray-900 capitalize">
                          {item.category.replace(/_/g, ' ').toLowerCase()}
                        </p>
                      </div>
                    </div>
                    {item.specifications && (
                      <div className="mt-2 text-xs text-gray-600">
                        <span className="font-medium">Specs:</span> {item.specifications}
                      </div>
                    )}
                    {item.preferredVendor && (
                      <div className="mt-1 text-xs text-gray-600">
                        <span className="font-medium">Preferred Vendor:</span> {item.preferredVendor}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Attachments ({requisition.attachments.length})
              </h2>
              {canEdit && (
                <label className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>{uploading ? 'Uploading...' : 'Upload File'}</span>
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            {requisition.attachments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No attachments</p>
            ) : (
              <div className="space-y-2">
                {requisition.attachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{attachment.fileName}</p>
                        <p className="text-xs text-gray-500">
                          Uploaded by {attachment.uploadedBy.firstName} {attachment.uploadedBy.lastName} on{' '}
                          {new Date(attachment.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <a
                      href={attachment.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                    >
                      View
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {requisition.approvalHistory.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Approval History</h2>
              <div className="space-y-3">
                {requisition.approvalHistory.map((approval) => (
                  <div key={approval.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    {approval.status === 'APPROVED' && <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />}
                    {approval.status === 'REJECTED' && <XCircle className="w-5 h-5 text-red-600 mt-0.5" />}
                    {approval.status === 'PENDING' && <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        Stage {approval.stage} - {approval.approver.firstName} {approval.approver.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{approval.approver.role}</p>
                      {approval.comments && (
                        <p className="text-sm text-gray-600 mt-1">{approval.comments}</p>
                      )}
                      {approval.actionAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(approval.actionAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      approval.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                      approval.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {approval.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Summary</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">Total Items</label>
                <p className="text-lg font-semibold text-gray-900">{requisition.items.length}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Estimated Total</label>
                <p className="text-2xl font-bold text-indigo-600">
                  {requisition.currency} {requisition.totalEstimate.toFixed(2)}
                </p>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <label className="text-xs text-gray-500">Requested By</label>
                <p className="text-sm font-medium text-gray-900">
                  {requisition.requestedBy.firstName} {requisition.requestedBy.lastName}
                </p>
                <p className="text-xs text-gray-500">{requisition.requestedBy.role}</p>
              </div>
              {requisition.approvedBy && (
                <div className="pt-3 border-t border-gray-200">
                  <label className="text-xs text-gray-500">Approved By</label>
                  <p className="text-sm font-medium text-gray-900">
                    {requisition.approvedBy.firstName} {requisition.approvedBy.lastName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(requisition.approvedAt!).toLocaleDateString()}
                  </p>
                </div>
              )}
              <div className="pt-3 border-t border-gray-200">
                <label className="text-xs text-gray-500">Created</label>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(requisition.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Last Updated</label>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(requisition.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cancel Requisition</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for cancelling this requisition.
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter cancellation reason..."
            />
            <div className="flex space-x-3 mt-4">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Confirm Cancel
              </button>
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showApproveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Approve Requisition</h3>
            <textarea
              value={approveComments}
              onChange={(e) => setApproveComments(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Comments (optional)"
            />
            <div className="flex space-x-3 mt-4">
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                Confirm Approve
              </button>
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  setApproveComments('');
                }}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Requisition</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Reason for rejection"
            />
            <div className="flex space-x-3 mt-4">
              <button
                onClick={handleReject}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
              >
                Confirm Reject
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showInfoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Request More Information</h3>
            <textarea
              value={infoQuestions}
              onChange={(e) => setInfoQuestions(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="What information do you need from the requester?"
            />
            <div className="flex space-x-3 mt-4">
              <button
                onClick={handleRequestInfo}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-400"
              >
                Send Request
              </button>
              <button
                onClick={() => {
                  setShowInfoModal(false);
                  setInfoQuestions('');
                }}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function RequisitionDetailPage() {
  return (
    <ProtectedRoute>
      <RequisitionDetailContent />
    </ProtectedRoute>
  );
}

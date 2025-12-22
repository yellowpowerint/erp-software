'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  ArrowLeft,
  CheckCircle,
  Download,
  Send,
  XCircle,
} from 'lucide-react';

interface PurchaseOrderItem {
  id: string;
  itemName: string;
  description?: string | null;
  quantity: string;
  unit: string;
  unitPrice: string;
  totalPrice: string;
}

interface PurchaseOrderDetail {
  id: string;
  poNumber: string;
  status: string;
  currency: string;
  subtotal: string;
  taxAmount: string;
  discountAmount: string;
  shippingCost: string;
  totalAmount: string;
  deliveryAddress: string;
  deliverySite?: string | null;
  expectedDelivery: string;
  deliveryTerms?: string | null;
  paymentTerms: number;
  createdAt: string;
  approvedAt?: string | null;
  vendor: {
    id: string;
    vendorCode: string;
    companyName: string;
    email?: string | null;
    phone?: string | null;
  };
  requisition?: {
    id: string;
    requisitionNo: string;
    title: string;
  } | null;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  } | null;
  approvedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  } | null;
  items: PurchaseOrderItem[];
}

function PurchaseOrderDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const poId = String((params as any).id);

  const [po, setPo] = useState<PurchaseOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const isVendor = user?.role === 'VENDOR';
  const canManage =
    user && ['SUPER_ADMIN', 'CEO', 'CFO', 'PROCUREMENT_OFFICER', 'OPERATIONS_MANAGER'].includes(user.role);

  const fetchPO = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/procurement/purchase-orders/${poId}`);
      setPo(res.data);
    } catch (e) {
      console.error('Failed to fetch purchase order:', e);
      alert('Purchase order not found');
      router.push('/procurement/purchase-orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPO();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poId]);

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

  const approve = async () => {
    if (!po) return;
    if (!window.confirm('Approve this purchase order?')) return;
    setActionLoading(true);
    try {
      await api.post(`/procurement/purchase-orders/${po.id}/approve`);
      await fetchPO();
    } catch (error: any) {
      console.error('Failed to approve PO:', error);
      alert(error.response?.data?.message || 'Failed to approve purchase order');
    } finally {
      setActionLoading(false);
    }
  };

  const sendPO = async () => {
    if (!po) return;
    if (!window.confirm('Mark this PO as SENT?')) return;
    setActionLoading(true);
    try {
      await api.post(`/procurement/purchase-orders/${po.id}/send`);
      await fetchPO();
    } catch (error: any) {
      console.error('Failed to send PO:', error);
      alert(error.response?.data?.message || 'Failed to send purchase order');
    } finally {
      setActionLoading(false);
    }
  };

  const cancelPO = async () => {
    if (!po) return;
    setActionLoading(true);
    try {
      await api.post(`/procurement/purchase-orders/${po.id}/cancel`, {
        reason: cancelReason || undefined,
      });
      setShowCancel(false);
      setCancelReason('');
      await fetchPO();
    } catch (error: any) {
      console.error('Failed to cancel PO:', error);
      alert(error.response?.data?.message || 'Failed to cancel purchase order');
    } finally {
      setActionLoading(false);
    }
  };

  const downloadPdf = async () => {
    if (!po) return;

    setActionLoading(true);
    try {
      const res = await api.get(`/procurement/purchase-orders/${po.id}/pdf`, {
        responseType: 'blob',
      });

      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${po.poNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Failed to download PDF:', error);
      alert(error.response?.data?.message || 'Failed to download PDF');
    } finally {
      setActionLoading(false);
    }
  };

  const numeric = (v: any) => Number(v || 0);

  const totals = useMemo(() => {
    if (!po) return { subtotal: 0, tax: 0, discount: 0, shipping: 0, total: 0 };
    return {
      subtotal: numeric(po.subtotal),
      tax: numeric(po.taxAmount),
      discount: numeric(po.discountAmount),
      shipping: numeric(po.shippingCost),
      total: numeric(po.totalAmount),
    };
  }, [po]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading purchase order...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!po) return null;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link
          href="/procurement/purchase-orders"
          className="inline-flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Purchase Orders</span>
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{po.poNumber}</h1>
            <p className="text-gray-600 mt-1">
              Vendor: {po.vendor?.companyName} {po.vendor?.vendorCode ? `(${po.vendor.vendorCode})` : ''}
            </p>
            <div className="mt-2">
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusBadge(po.status)}`}>{po.status}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={downloadPdf}
              disabled={actionLoading}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:bg-gray-100"
            >
              <Download className="w-4 h-4 inline mr-2" />
              PDF
            </button>

            {canManage && ['DRAFT', 'PENDING_APPROVAL'].includes(po.status) && (
              <button
                onClick={approve}
                disabled={actionLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                <CheckCircle className="w-4 h-4 inline mr-2" />
                Approve
              </button>
            )}

            {canManage && po.status === 'APPROVED' && (
              <button
                onClick={sendPO}
                disabled={actionLoading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
              >
                <Send className="w-4 h-4 inline mr-2" />
                Mark Sent
              </button>
            )}

            {canManage && !['CANCELLED', 'COMPLETED'].includes(po.status) && (
              <button
                onClick={() => setShowCancel(true)}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
              >
                <XCircle className="w-4 h-4 inline mr-2" />
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Items</h2>
            <div className="space-y-3">
              {po.items.map((it) => (
                <div key={it.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{it.itemName}</p>
                      {it.description && <p className="text-sm text-gray-600 mt-1">{it.description}</p>}
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-medium text-gray-900">
                        {it.quantity} {it.unit}
                      </p>
                      <p className="text-xs text-gray-500">
                        Unit: {po.currency} {Number(it.unitPrice).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-700 font-semibold">
                        Total: {po.currency} {Number(it.totalPrice).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-500">Address</p>
                <p className="text-gray-900">{po.deliveryAddress}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Site</p>
                <p className="text-gray-900">{po.deliverySite || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Expected Delivery</p>
                <p className="text-gray-900">{new Date(po.expectedDelivery).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Delivery Terms</p>
                <p className="text-gray-900">{po.deliveryTerms || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Payment Terms</p>
                <p className="text-gray-900">{po.paymentTerms} days</p>
              </div>
              {po.requisition && (
                <div>
                  <p className="text-xs text-gray-500">Requisition</p>
                  <p className="text-gray-900">
                    {po.requisition.requisitionNo} - {po.requisition.title}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Totals</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-900">
                  {po.currency} {totals.subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tax</span>
                <span className="text-gray-900">
                  {po.currency} {totals.tax.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Discount</span>
                <span className="text-gray-900">
                  {po.currency} {totals.discount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Shipping</span>
                <span className="text-gray-900">
                  {po.currency} {totals.shipping.toFixed(2)}
                </span>
              </div>
              <div className="pt-2 border-t border-gray-200 flex justify-between font-semibold">
                <span className="text-gray-900">Total</span>
                <span className="text-indigo-700">
                  {po.currency} {totals.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Meta</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Created</span>
                <span className="text-gray-900">{new Date(po.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Approved</span>
                <span className="text-gray-900">{po.approvedAt ? new Date(po.approvedAt).toLocaleDateString() : '-'}</span>
              </div>
              {po.createdBy && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Created By</span>
                  <span className="text-gray-900">
                    {po.createdBy.firstName} {po.createdBy.lastName}
                  </span>
                </div>
              )}
              {po.approvedBy && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Approved By</span>
                  <span className="text-gray-900">
                    {po.approvedBy.firstName} {po.approvedBy.lastName}
                  </span>
                </div>
              )}
            </div>
          </div>

          {isVendor && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Vendor View</h3>
              <p className="text-sm text-gray-600">You can view and download the PO PDF. Workflow actions are restricted.</p>
            </div>
          )}
        </div>
      </div>

      {showCancel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Cancel Purchase Order</h3>
              <button onClick={() => setShowCancel(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-3">Optional reason</p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Reason..."
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowCancel(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
              <button
                onClick={cancelPO}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
              >
                Cancel PO
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function PurchaseOrderDetailPage() {
  return (
    <ProtectedRoute>
      <PurchaseOrderDetailContent />
    </ProtectedRoute>
  );
}

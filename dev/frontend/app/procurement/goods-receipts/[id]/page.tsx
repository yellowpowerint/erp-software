'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import InspectionChecklist, { InspectionPayload } from '@/components/procurement/InspectionChecklist';

interface GRNItem {
  id: string;
  itemName: string;
  unit: string;
  orderedQty: string;
  receivedQty: string;
  acceptedQty: string;
  rejectedQty: string;
  condition: string;
}

interface GoodsReceiptDetail {
  id: string;
  grnNumber: string;
  status: string;
  siteLocation: string;
  deliveryNote?: string | null;
  carrierName?: string | null;
  vehicleNumber?: string | null;
  driverName?: string | null;
  notes?: string | null;
  receivedDate: string;
  createdAt: string;
  purchaseOrder: {
    id: string;
    poNumber: string;
    vendor: {
      id: string;
      vendorCode: string;
      companyName: string;
    };
  };
  items: GRNItem[];
  inspections: Array<{
    id: string;
    inspectionDate: string;
    overallResult: string;
    qualityScore?: number | null;
    inspector?: {
      firstName: string;
      lastName: string;
      role: string;
    } | null;
    findings?: string | null;
    recommendations?: string | null;
  }>;
}

function GoodsReceiptDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const grnId = String((params as any).id);

  const [grn, setGrn] = useState<GoodsReceiptDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [acceptMode, setAcceptMode] = useState(false);
  const [acceptLines, setAcceptLines] = useState<Array<{ goodsReceiptItemId: string; acceptedQty: string; rejectedQty: string }>>(
    []
  );

  const [rejectReason, setRejectReason] = useState('');

  const canInspect =
    user &&
    ['SUPER_ADMIN', 'CEO', 'CFO', 'PROCUREMENT_OFFICER', 'OPERATIONS_MANAGER', 'WAREHOUSE_MANAGER', 'SAFETY_OFFICER'].includes(
      user.role
    );

  const canAcceptReject =
    user && ['SUPER_ADMIN', 'CEO', 'CFO', 'PROCUREMENT_OFFICER', 'OPERATIONS_MANAGER', 'WAREHOUSE_MANAGER'].includes(user.role);

  const fetchGRN = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/procurement/goods-receipts/${grnId}`);
      setGrn(res.data);
    } catch (e) {
      console.error('Failed to fetch GRN:', e);
      alert('Goods receipt not found');
      router.push('/procurement/goods-receipts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGRN();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grnId]);

  const initAccept = () => {
    if (!grn) return;
    setAcceptLines(
      grn.items.map((i) => ({
        goodsReceiptItemId: i.id,
        acceptedQty: String(i.receivedQty),
        rejectedQty: '0',
      }))
    );
    setAcceptMode(true);
  };

  const setAcceptLine = (idx: number, patch: Partial<(typeof acceptLines)[number]>) => {
    setAcceptLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  };

  const acceptInvalid = useMemo(() => {
    if (!grn || acceptLines.length === 0) return true;
    const byId = new Map(grn.items.map((i) => [i.id, i]));
    return acceptLines.some((l) => {
      const item = byId.get(l.goodsReceiptItemId);
      if (!item) return true;
      const received = Number(item.receivedQty || 0);
      const accepted = Number(l.acceptedQty || 0);
      const rejected = Number(l.rejectedQty || 0);
      return accepted < 0 || rejected < 0 || Math.abs(accepted + rejected - received) > 1e-9;
    });
  }, [grn, acceptLines]);

  const submitInspection = async (payload: InspectionPayload) => {
    if (!grn) return;
    setActionLoading(true);
    try {
      await api.post(`/procurement/goods-receipts/${grn.id}/inspect`, payload);
      alert('Inspection submitted');
      await fetchGRN();
    } catch (error: any) {
      console.error('Failed to submit inspection:', error);
      alert(error.response?.data?.message || 'Failed to submit inspection');
    } finally {
      setActionLoading(false);
    }
  };

  const accept = async () => {
    if (!grn) return;
    setActionLoading(true);
    try {
      await api.post(`/procurement/goods-receipts/${grn.id}/accept`, { items: acceptLines });
      alert('Goods receipt accepted');
      setAcceptMode(false);
      await fetchGRN();
    } catch (error: any) {
      console.error('Failed to accept goods:', error);
      alert(error.response?.data?.message || 'Failed to accept goods');
    } finally {
      setActionLoading(false);
    }
  };

  const reject = async () => {
    if (!grn) return;
    if (rejectReason.trim().length < 2) {
      alert('Please provide a rejection reason');
      return;
    }
    setActionLoading(true);
    try {
      await api.post(`/procurement/goods-receipts/${grn.id}/reject`, { reason: rejectReason.trim() });
      alert('Goods receipt rejected');
      setRejectReason('');
      await fetchGRN();
    } catch (error: any) {
      console.error('Failed to reject goods:', error);
      alert(error.response?.data?.message || 'Failed to reject goods');
    } finally {
      setActionLoading(false);
    }
  };

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

  if (loading || !grn) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading goods receipt...</p>
        </div>
      </DashboardLayout>
    );
  }

  const isFinal = ['ACCEPTED', 'PARTIALLY_ACCEPTED', 'REJECTED'].includes(grn.status);

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/procurement/goods-receipts"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{grn.grnNumber}</h1>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusBadge(grn.status)}`}>{grn.status}</span>
            </div>
            <p className="text-gray-600 mt-1">
              PO: {grn.purchaseOrder.poNumber} | Vendor: {grn.purchaseOrder.vendor.companyName} ({grn.purchaseOrder.vendor.vendorCode})
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-gray-500">Site Location</div>
            <div className="text-sm font-medium text-gray-900">{grn.siteLocation}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Received Date</div>
            <div className="text-sm font-medium text-gray-900">{new Date(grn.receivedDate).toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Delivery Note</div>
            <div className="text-sm font-medium text-gray-900">{grn.deliveryNote || '-'}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Items</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Received</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Accepted</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Rejected</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Condition</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {grn.items.map((i) => (
                <tr key={i.id}>
                  <td className="px-4 py-3 text-sm text-gray-900">{i.itemName}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">{Number(i.receivedQty || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">{Number(i.acceptedQty || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">{Number(i.rejectedQty || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{i.condition}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {canAcceptReject && !isFinal && !acceptMode && (
          <div className="mt-4 flex gap-3 justify-end">
            <button
              type="button"
              onClick={initAccept}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4" />
              Accept / Partially Accept
            </button>
          </div>
        )}

        {acceptMode && (
          <div className="mt-6 border-t pt-4">
            <h3 className="text-md font-semibold text-gray-900 mb-3">Acceptance Quantities</h3>
            <div className="space-y-3">
              {acceptLines.map((l, idx) => {
                const item = grn.items.find((x) => x.id === l.goodsReceiptItemId);
                const received = Number(item?.receivedQty || 0);
                return (
                  <div key={l.goodsReceiptItemId} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
                    <div className="md:col-span-2 text-sm text-gray-900">{item?.itemName}</div>
                    <div className="text-xs text-gray-500 md:text-right">Received: {received.toFixed(2)}</div>
                    <input
                      value={l.acceptedQty}
                      onChange={(e) => setAcceptLine(idx, { acceptedQty: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Accepted"
                    />
                    <input
                      value={l.rejectedQty}
                      onChange={(e) => setAcceptLine(idx, { rejectedQty: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Rejected"
                    />
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setAcceptMode(false)}
                className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={accept}
                disabled={actionLoading || acceptInvalid}
                className={`px-4 py-2 rounded-lg text-white ${
                  actionLoading || acceptInvalid ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                Save Acceptance
              </button>
            </div>
            {acceptInvalid ? <div className="mt-2 text-xs text-red-600">Accepted + rejected must equal received for each line.</div> : null}
          </div>
        )}

        {canAcceptReject && !isFinal && (
          <div className="mt-6 border-t pt-4">
            <h3 className="text-md font-semibold text-gray-900 mb-2">Reject Goods Receipt</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Reason"
              />
              <button
                type="button"
                onClick={reject}
                disabled={actionLoading || rejectReason.trim().length < 2}
                className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white ${
                  actionLoading || rejectReason.trim().length < 2 ? 'bg-gray-400' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Inspections</h2>
        {grn.inspections.length === 0 ? (
          <p className="text-sm text-gray-600">No inspections recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {grn.inspections.map((ins) => (
              <div key={ins.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{ins.overallResult}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(ins.inspectionDate).toLocaleString()} | {ins.inspector ? `${ins.inspector.firstName} ${ins.inspector.lastName}` : 'Unknown'}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">Score: {ins.qualityScore ?? '-'}</div>
                </div>
                {ins.findings ? <div className="mt-2 text-sm text-gray-700">Findings: {ins.findings}</div> : null}
                {ins.recommendations ? <div className="mt-1 text-sm text-gray-700">Recommendations: {ins.recommendations}</div> : null}
              </div>
            ))}
          </div>
        )}
      </div>

      {canInspect && !isFinal ? (
        <InspectionChecklist onSubmit={submitInspection} submitting={actionLoading} />
      ) : null}
    </DashboardLayout>
  );
}

export default function GoodsReceiptDetailPage() {
  return (
    <ProtectedRoute>
      <GoodsReceiptDetailContent />
    </ProtectedRoute>
  );
}

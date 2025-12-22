'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { ArrowLeft, CheckCircle, Edit, FileText, Plus, Send, XCircle } from 'lucide-react';

interface RFQItem {
  id: string;
  itemName: string;
  description?: string;
  specifications?: string;
  quantity: string;
  unit: string;
  estimatedPrice?: string | null;
}

interface VendorInvite {
  id: string;
  vendorId: string;
  status: string;
  invitedAt: string;
  vendor?: {
    id: string;
    vendorCode: string;
    companyName: string;
  };
}

interface RFQResponseItem {
  id: string;
  rfqItemId: string;
  unitPrice: string;
  totalPrice: string;
  leadTimeDays?: number | null;
  notes?: string | null;
  rfqItem?: RFQItem;
}

interface RFQResponse {
  id: string;
  vendorId: string;
  status: string;
  totalAmount: string;
  currency: string;
  validUntil: string;
  deliveryDays: number;
  paymentTerms?: string | null;
  warranty?: string | null;
  quotationDoc?: string | null;
  technicalDoc?: string | null;
  technicalScore?: string | null;
  commercialScore?: string | null;
  overallScore?: string | null;
  evaluationNotes?: string | null;
  submittedAt: string;
  vendor?: {
    id: string;
    vendorCode: string;
    companyName: string;
  };
  items: RFQResponseItem[];
}

interface RFQDetail {
  id: string;
  rfqNumber: string;
  title: string;
  description?: string;
  status: string;
  issueDate?: string | null;
  responseDeadline: string;
  validityPeriod: number;
  deliveryLocation: string;
  deliveryTerms?: string | null;
  paymentTerms?: string | null;
  specialConditions?: string | null;
  siteAccess?: string | null;
  safetyRequirements?: string | null;
  technicalSpecs?: string | null;
  items: RFQItem[];
  invitedVendors: VendorInvite[];
  responses: RFQResponse[];
  selectedResponseId?: string | null;
}

function RFQDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const rfqId = String((params as any).id);

  const [rfq, setRfq] = useState<RFQDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [showInvite, setShowInvite] = useState(false);
  const [inviteVendorIds, setInviteVendorIds] = useState('');

  const [showRespond, setShowRespond] = useState(false);
  const [responseForm, setResponseForm] = useState({
    currency: 'GHS',
    validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    deliveryDays: '14',
    paymentTerms: '',
    warranty: '',
    quotationDoc: '',
    technicalDoc: '',
  });

  const [responseItems, setResponseItems] = useState<Record<string, { unitPrice: string; leadTimeDays: string; notes: string }>>({});

  const isVendor = user?.role === 'VENDOR';
  const canManage =
    user && ['SUPER_ADMIN', 'CEO', 'CFO', 'PROCUREMENT_OFFICER', 'OPERATIONS_MANAGER'].includes(user.role);

  const fetchRFQ = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/procurement/rfqs/${rfqId}`);
      setRfq(res.data);
    } catch (e) {
      console.error('Failed to fetch RFQ:', e);
      alert('RFQ not found');
      router.push('/procurement/rfqs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRFQ();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rfqId]);

  const publish = async () => {
    if (!window.confirm('Publish this RFQ?')) return;
    setActionLoading(true);
    try {
      await api.post(`/procurement/rfqs/${rfqId}/publish`);
      await fetchRFQ();
    } catch (error: any) {
      console.error('Failed to publish:', error);
      alert(error.response?.data?.message || 'Failed to publish');
    } finally {
      setActionLoading(false);
    }
  };

  const closeRFQ = async () => {
    if (!window.confirm('Close this RFQ?')) return;
    setActionLoading(true);
    try {
      await api.post(`/procurement/rfqs/${rfqId}/close`);
      await fetchRFQ();
    } catch (error: any) {
      console.error('Failed to close:', error);
      alert(error.response?.data?.message || 'Failed to close');
    } finally {
      setActionLoading(false);
    }
  };

  const invite = async () => {
    const vendorIds = inviteVendorIds
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (vendorIds.length === 0) {
      alert('Provide at least one vendorId');
      return;
    }

    setActionLoading(true);
    try {
      await api.post(`/procurement/rfqs/${rfqId}/invite`, { vendorIds });
      setInviteVendorIds('');
      setShowInvite(false);
      await fetchRFQ();
    } catch (error: any) {
      console.error('Failed to invite:', error);
      alert(error.response?.data?.message || 'Failed to invite');
    } finally {
      setActionLoading(false);
    }
  };

  const openResponseModal = () => {
    if (!rfq) return;
    const init: any = {};
    for (const item of rfq.items) {
      init[item.id] = { unitPrice: '', leadTimeDays: '', notes: '' };
    }
    setResponseItems(init);
    setShowRespond(true);
  };

  const submitResponse = async () => {
    if (!rfq) return;

    const itemsPayload = rfq.items.map((i) => {
      const row = responseItems[i.id];
      return {
        rfqItemId: i.id,
        unitPrice: row?.unitPrice || '',
        leadTimeDays: row?.leadTimeDays ? Number(row.leadTimeDays) : undefined,
        notes: row?.notes || undefined,
      };
    });

    if (itemsPayload.some((x) => !x.unitPrice)) {
      alert('Please enter unit price for all items');
      return;
    }

    setActionLoading(true);
    try {
      await api.post(`/procurement/rfqs/${rfqId}/respond`, {
        currency: responseForm.currency,
        validUntil: new Date(`${responseForm.validUntil}T23:59:59.000Z`).toISOString(),
        deliveryDays: Number(responseForm.deliveryDays || '0'),
        paymentTerms: responseForm.paymentTerms || undefined,
        warranty: responseForm.warranty || undefined,
        quotationDoc: responseForm.quotationDoc || undefined,
        technicalDoc: responseForm.technicalDoc || undefined,
        items: itemsPayload,
      });

      setShowRespond(false);
      await fetchRFQ();
    } catch (error: any) {
      console.error('Failed to respond:', error);
      alert(error.response?.data?.message || 'Failed to submit response');
    } finally {
      setActionLoading(false);
    }
  };

  const award = async (responseId: string) => {
    if (!window.confirm('Award this RFQ to the selected response?')) return;
    setActionLoading(true);
    try {
      await api.post(`/procurement/rfqs/${rfqId}/award`, { responseId });
      await fetchRFQ();
    } catch (error: any) {
      console.error('Failed to award:', error);
      alert(error.response?.data?.message || 'Failed to award');
    } finally {
      setActionLoading(false);
    }
  };

  const createPOFromResponse = async (responseId: string) => {
    if (!window.confirm('Create Purchase Order draft from this response?')) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/procurement/purchase-orders/from-rfq/${responseId}`);
      alert('Purchase order draft created');
      router.push(`/procurement/purchase-orders/${res.data.id}`);
    } catch (error: any) {
      console.error('Failed to create PO:', error);
      alert(error.response?.data?.message || 'Failed to create PO');
    } finally {
      setActionLoading(false);
    }
  };

  const statusBadge = useMemo(() => {
    const s = rfq?.status || '';
    const colors: any = {
      DRAFT: 'bg-gray-100 text-gray-800',
      PUBLISHED: 'bg-blue-100 text-blue-800',
      EVALUATING: 'bg-yellow-100 text-yellow-800',
      AWARDED: 'bg-green-100 text-green-800',
      CLOSED: 'bg-gray-100 text-gray-700',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return colors[s] || 'bg-gray-100 text-gray-800';
  }, [rfq?.status]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading RFQ...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!rfq) return null;

  const myResponse = isVendor
    ? rfq.responses.find((r) => r.vendorId === user?.vendorId)
    : null;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link href="/procurement/rfqs" className="inline-flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to RFQs</span>
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{rfq.title}</h1>
            <p className="text-gray-600 mt-1">{rfq.rfqNumber}</p>
            <div className="mt-2">
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusBadge}`}>{rfq.status}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {canManage && rfq.status === 'DRAFT' && (
              <button
                onClick={publish}
                disabled={actionLoading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
              >
                <Send className="w-4 h-4 inline mr-2" />
                Publish
              </button>
            )}

            {canManage && ['DRAFT', 'PUBLISHED', 'EVALUATING'].includes(rfq.status) && (
              <button
                onClick={closeRFQ}
                disabled={actionLoading}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 disabled:bg-gray-400"
              >
                Close
              </button>
            )}

            {canManage && rfq.status === 'DRAFT' && (
              <Link
                href={`/procurement/rfqs/${rfq.id}/edit`}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                <Edit className="w-4 h-4 inline mr-2" />
                Edit
              </Link>
            )}

            {canManage && (
              <button
                onClick={() => setShowInvite(true)}
                disabled={actionLoading}
                className="px-4 py-2 bg-white border border-indigo-300 text-indigo-700 rounded-lg hover:bg-indigo-50 disabled:bg-gray-100"
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Invite Vendors
              </button>
            )}

            {isVendor && rfq.status === 'PUBLISHED' && !myResponse && (
              <button
                onClick={openResponseModal}
                disabled={actionLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                <FileText className="w-4 h-4 inline mr-2" />
                Submit Response
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">RFQ Items ({rfq.items.length})</h2>
            <div className="space-y-3">
              {rfq.items.map((it) => (
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
                      {it.estimatedPrice && <p className="text-xs text-gray-500">Est: {it.estimatedPrice}</p>}
                    </div>
                  </div>
                  {it.specifications && (
                    <p className="text-xs text-gray-600 mt-2">
                      <span className="font-medium">Specs:</span> {it.specifications}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {canManage && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Invited Vendors ({rfq.invitedVendors.length})</h2>
              {rfq.invitedVendors.length === 0 ? (
                <p className="text-gray-500">No vendors invited yet.</p>
              ) : (
                <div className="space-y-2">
                  {rfq.invitedVendors.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{inv.vendor?.companyName || inv.vendorId}</p>
                        <p className="text-xs text-gray-500">{inv.vendor?.vendorCode || ''}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-600">{inv.status}</p>
                        <p className="text-xs text-gray-500">{new Date(inv.invitedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Responses ({rfq.responses.length})</h2>
            {rfq.responses.length === 0 ? (
              <p className="text-gray-500">No responses yet.</p>
            ) : (
              <div className="space-y-3">
                {rfq.responses.map((resp) => {
                  const isSelected = rfq.selectedResponseId && resp.id === rfq.selectedResponseId;
                  return (
                    <div key={resp.id} className={`p-4 rounded-lg border ${isSelected ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white'}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{resp.vendor?.companyName || resp.vendorId}</p>
                          <p className="text-xs text-gray-500">{resp.vendor?.vendorCode || ''}</p>
                          <div className="mt-2 text-sm text-gray-700">
                            <p>
                              <span className="text-gray-500">Total:</span> {resp.currency} {Number(resp.totalAmount).toFixed(2)}
                            </p>
                            <p>
                              <span className="text-gray-500">Delivery Days:</span> {resp.deliveryDays}
                            </p>
                            <p>
                              <span className="text-gray-500">Status:</span> {resp.status}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {isSelected ? (
                            <span className="inline-flex items-center text-xs font-semibold text-green-800 bg-green-100 px-2 py-1 rounded-full">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Selected
                            </span>
                          ) : (
                            <span className="text-xs text-gray-500">{new Date(resp.submittedAt).toLocaleDateString()}</span>
                          )}

                          {canManage && !isSelected && ['PUBLISHED', 'EVALUATING', 'CLOSED'].includes(rfq.status) && (
                            <div className="mt-3 flex flex-col gap-2">
                              <button
                                onClick={() => award(resp.id)}
                                disabled={actionLoading}
                                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 text-sm"
                              >
                                Award
                              </button>
                              <button
                                onClick={() => createPOFromResponse(resp.id)}
                                disabled={actionLoading}
                                className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 text-sm"
                              >
                                Create PO
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Line Items</p>
                        <div className="space-y-1">
                          {resp.items.map((ri) => (
                            <div key={ri.id} className="text-xs text-gray-700 flex items-center justify-between">
                              <span>{ri.rfqItem?.itemName || ri.rfqItemId}</span>
                              <span>
                                Unit: {resp.currency} {Number(ri.unitPrice).toFixed(2)} • Total: {resp.currency} {Number(ri.totalPrice).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Key Dates</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Deadline</span>
                <span className="text-gray-900">{new Date(rfq.responseDeadline).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Validity</span>
                <span className="text-gray-900">{rfq.validityPeriod} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Issue Date</span>
                <span className="text-gray-900">{rfq.issueDate ? new Date(rfq.issueDate).toLocaleDateString() : '-'}</span>
              </div>
            </div>
          </div>

          {isVendor && myResponse && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">My Response</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className="text-gray-900">{myResponse.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total</span>
                  <span className="text-gray-900">{myResponse.currency} {Number(myResponse.totalAmount).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showInvite && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Invite Vendors</h3>
              <button onClick={() => setShowInvite(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-3">Enter vendor IDs (comma-separated).</p>
            <textarea
              value={inviteVendorIds}
              onChange={(e) => setInviteVendorIds(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="vendorId1, vendorId2"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowInvite(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={invite}
                disabled={actionLoading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
              >
                Invite
              </button>
            </div>
          </div>
        </div>
      )}

      {showRespond && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Submit Response</h3>
              <button onClick={() => setShowRespond(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                <input
                  value={responseForm.currency}
                  onChange={(e) => setResponseForm({ ...responseForm, currency: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Valid Until</label>
                <input
                  type="date"
                  value={responseForm.validUntil}
                  onChange={(e) => setResponseForm({ ...responseForm, validUntil: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Days</label>
                <input
                  type="number"
                  min={0}
                  value={responseForm.deliveryDays}
                  onChange={(e) => setResponseForm({ ...responseForm, deliveryDays: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Terms</label>
                <input
                  value={responseForm.paymentTerms}
                  onChange={(e) => setResponseForm({ ...responseForm, paymentTerms: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">Warranty</label>
                <input
                  value={responseForm.warranty}
                  onChange={(e) => setResponseForm({ ...responseForm, warranty: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mt-6">
              <h4 className="font-semibold text-gray-900 mb-2">Item Pricing</h4>
              <div className="space-y-3">
                {rfq.items.map((it) => (
                  <div key={it.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-gray-900">{it.itemName}</p>
                      <p className="text-sm text-gray-700">
                        {it.quantity} {it.unit}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Unit Price *</label>
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={responseItems[it.id]?.unitPrice || ''}
                          onChange={(e) =>
                            setResponseItems({
                              ...responseItems,
                              [it.id]: { ...responseItems[it.id], unitPrice: e.target.value },
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Lead Time (days)</label>
                        <input
                          type="number"
                          min={0}
                          value={responseItems[it.id]?.leadTimeDays || ''}
                          onChange={(e) =>
                            setResponseItems({
                              ...responseItems,
                              [it.id]: { ...responseItems[it.id], leadTimeDays: e.target.value },
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Notes</label>
                        <input
                          value={responseItems[it.id]?.notes || ''}
                          onChange={(e) =>
                            setResponseItems({
                              ...responseItems,
                              [it.id]: { ...responseItems[it.id], notes: e.target.value },
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowRespond(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={submitResponse}
                disabled={actionLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function RFQDetailPage() {
  return (
    <ProtectedRoute>
      <RFQDetailContent />
    </ProtectedRoute>
  );
}

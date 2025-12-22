'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { ArrowLeft, Save } from 'lucide-react';

interface RFQItemForm {
  id?: string;
  itemName: string;
  description: string;
  specifications: string;
  quantity: string;
  unit: string;
  estimatedPrice: string;
}

function EditRFQContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const rfqId = String((params as any).id);

  const canManage =
    user && ['SUPER_ADMIN', 'CEO', 'CFO', 'PROCUREMENT_OFFICER', 'OPERATIONS_MANAGER'].includes(user.role);

  const [loading, setLoading] = useState(false);
  const [rfq, setRfq] = useState<any>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    requisitionId: '',
    responseDeadline: '',
    validityPeriod: '30',
    deliveryLocation: '',
    deliveryTerms: '',
    paymentTerms: '',
    specialConditions: '',
    siteAccess: '',
    safetyRequirements: '',
    technicalSpecs: '',
  });
  const [items, setItems] = useState<RFQItemForm[]>([]);

  const fetchRFQ = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/procurement/rfqs/${rfqId}`);
      setRfq(res.data);
      setForm({
        title: res.data.title || '',
        description: res.data.description || '',
        requisitionId: res.data.requisitionId || '',
        responseDeadline: new Date(res.data.responseDeadline).toISOString().split('T')[0],
        validityPeriod: String(res.data.validityPeriod || 30),
        deliveryLocation: res.data.deliveryLocation || '',
        deliveryTerms: res.data.deliveryTerms || '',
        paymentTerms: res.data.paymentTerms || '',
        specialConditions: res.data.specialConditions || '',
        siteAccess: res.data.siteAccess || '',
        safetyRequirements: res.data.safetyRequirements || '',
        technicalSpecs: res.data.technicalSpecs || '',
      });
      setItems(
        (res.data.items || []).map((it: any) => ({
          id: it.id,
          itemName: it.itemName,
          description: it.description || '',
          specifications: it.specifications || '',
          quantity: String(it.quantity),
          unit: it.unit,
          estimatedPrice: it.estimatedPrice ? String(it.estimatedPrice) : '',
        })),
      );
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

  const updateItem = (idx: number, patch: Partial<RFQItemForm>) => {
    setItems(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) {
      alert('Not allowed');
      return;
    }
    if (!form.title.trim() || !form.deliveryLocation.trim() || !form.responseDeadline) {
      alert('Please fill title, delivery location, and response deadline');
      return;
    }
    if (!items.length) {
      alert('RFQ must have at least one item');
      return;
    }

    setLoading(true);
    try {
      await api.put(`/procurement/rfqs/${rfqId}`, {
        title: form.title,
        description: form.description || undefined,
        requisitionId: form.requisitionId || undefined,
        responseDeadline: new Date(`${form.responseDeadline}T23:59:59.000Z`).toISOString(),
        validityPeriod: Number(form.validityPeriod || '30'),
        deliveryLocation: form.deliveryLocation,
        deliveryTerms: form.deliveryTerms || undefined,
        paymentTerms: form.paymentTerms || undefined,
        specialConditions: form.specialConditions || undefined,
        siteAccess: form.siteAccess || undefined,
        safetyRequirements: form.safetyRequirements || undefined,
        technicalSpecs: form.technicalSpecs || undefined,
        items: items.map((it) => ({
          id: it.id,
          itemName: it.itemName,
          description: it.description || undefined,
          specifications: it.specifications || undefined,
          quantity: it.quantity,
          unit: it.unit,
          estimatedPrice: it.estimatedPrice || undefined,
        })),
      });

      alert('RFQ updated');
      router.push(`/procurement/rfqs/${rfqId}`);
    } catch (error: any) {
      console.error('Failed to update RFQ:', error);
      alert(error.response?.data?.message || 'Failed to update RFQ');
    } finally {
      setLoading(false);
    }
  };

  if (!canManage) {
    return (
      <DashboardLayout>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-900 font-semibold">Not allowed</p>
          <Link href="/procurement/rfqs" className="text-indigo-600 hover:text-indigo-700 mt-4 inline-block">
            Back to RFQs
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  if (loading && !rfq) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading RFQ...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link href={`/procurement/rfqs/${rfqId}`} className="inline-flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to RFQ</span>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit RFQ</h1>
        <p className="text-gray-600 mt-1">Only DRAFT RFQs can be edited</p>
      </div>

      <form onSubmit={submit} className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">RFQ Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Response Deadline *</label>
              <input
                type="date"
                value={form.responseDeadline}
                onChange={(e) => setForm({ ...form, responseDeadline: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Validity (days)</label>
              <input
                type="number"
                min={1}
                value={form.validityPeriod}
                onChange={(e) => setForm({ ...form, validityPeriod: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Location *</label>
              <input
                value={form.deliveryLocation}
                onChange={(e) => setForm({ ...form, deliveryLocation: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Terms</label>
              <input
                value={form.deliveryTerms}
                onChange={(e) => setForm({ ...form, deliveryTerms: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Terms</label>
              <input
                value={form.paymentTerms}
                onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Special Conditions</label>
              <textarea
                value={form.specialConditions}
                onChange={(e) => setForm({ ...form, specialConditions: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Site Access</label>
              <input
                value={form.siteAccess}
                onChange={(e) => setForm({ ...form, siteAccess: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Safety Requirements</label>
              <input
                value={form.safetyRequirements}
                onChange={(e) => setForm({ ...form, safetyRequirements: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Technical Specs</label>
              <textarea
                value={form.technicalSpecs}
                onChange={(e) => setForm({ ...form, technicalSpecs: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Items</h3>
          <div className="space-y-3">
            {items.map((it, idx) => (
              <div key={it.id || idx} className="p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-xs text-gray-600 mb-1">Item Name</label>
                    <input
                      value={it.itemName}
                      onChange={(e) => updateItem(idx, { itemName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Quantity</label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={it.quantity}
                      onChange={(e) => updateItem(idx, { quantity: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Unit</label>
                    <input
                      value={it.unit}
                      onChange={(e) => updateItem(idx, { unit: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Estimated Price</label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={it.estimatedPrice}
                      onChange={(e) => updateItem(idx, { estimatedPrice: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Description</label>
                    <input
                      value={it.description}
                      onChange={(e) => updateItem(idx, { description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs text-gray-600 mb-1">Specifications</label>
                    <input
                      value={it.specifications}
                      onChange={(e) => updateItem(idx, { specifications: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
          >
            <Save className="w-5 h-5" />
            <span>{loading ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
    </DashboardLayout>
  );
}

export default function EditRFQPage() {
  return (
    <ProtectedRoute>
      <EditRFQContent />
    </ProtectedRoute>
  );
}

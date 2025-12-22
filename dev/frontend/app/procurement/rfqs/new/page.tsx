'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { ArrowLeft, Plus, Save, X } from 'lucide-react';

interface RequisitionOption {
  id: string;
  requisitionNo: string;
  title: string;
  status: string;
}

interface RFQItemForm {
  itemName: string;
  description: string;
  specifications: string;
  quantity: string;
  unit: string;
  estimatedPrice: string;
}

function NewRFQContent() {
  const router = useRouter();
  const { user } = useAuth();

  const canCreate =
    user && ['SUPER_ADMIN', 'CEO', 'CFO', 'PROCUREMENT_OFFICER', 'OPERATIONS_MANAGER'].includes(user.role);

  const [loading, setLoading] = useState(false);
  const [requisitions, setRequisitions] = useState<RequisitionOption[]>([]);

  const [form, setForm] = useState({
    title: '',
    description: '',
    requisitionId: '',
    responseDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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
  const [showItemForm, setShowItemForm] = useState(false);
  const [currentItem, setCurrentItem] = useState<RFQItemForm>({
    itemName: '',
    description: '',
    specifications: '',
    quantity: '',
    unit: 'UNITS',
    estimatedPrice: '',
  });

  useEffect(() => {
    const fetchRequisitions = async () => {
      try {
        const res = await api.get('/procurement/requisitions', { params: { status: 'APPROVED' } });
        const data = res.data.data || res.data;
        setRequisitions(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Failed to fetch requisitions:', e);
      }
    };
    fetchRequisitions();
  }, []);

  const addItem = () => {
    if (!currentItem.itemName.trim() || !currentItem.quantity.trim() || !currentItem.unit.trim()) {
      alert('Please provide item name, quantity and unit');
      return;
    }
    setItems([...items, { ...currentItem }]);
    setCurrentItem({ itemName: '', description: '', specifications: '', quantity: '', unit: 'UNITS', estimatedPrice: '' });
    setShowItemForm(false);
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canCreate) {
      alert('Not allowed');
      return;
    }

    if (!form.title.trim() || !form.deliveryLocation.trim()) {
      alert('Please fill in title and delivery location');
      return;
    }

    if (!items.length) {
      alert('Add at least one RFQ item');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
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
        items: items.map((i) => ({
          itemName: i.itemName,
          description: i.description || undefined,
          specifications: i.specifications || undefined,
          quantity: i.quantity,
          unit: i.unit,
          estimatedPrice: i.estimatedPrice || undefined,
        })),
      };

      const res = await api.post('/procurement/rfqs', payload);
      alert('RFQ created');
      router.push(`/procurement/rfqs/${res.data.id}`);
    } catch (error: any) {
      console.error('Failed to create RFQ:', error);
      alert(error.response?.data?.message || 'Failed to create RFQ');
    } finally {
      setLoading(false);
    }
  };

  if (!canCreate) {
    return (
      <DashboardLayout>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-900 font-semibold">Not allowed</p>
          <p className="text-gray-600 mt-1">You do not have permission to create RFQs.</p>
          <Link href="/procurement/rfqs" className="text-indigo-600 hover:text-indigo-700 mt-4 inline-block">
            Back to RFQs
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link
          href="/procurement/rfqs"
          className="inline-flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to RFQs</span>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Create RFQ</h1>
        <p className="text-gray-600 mt-1">Draft a request for quotation and items</p>
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

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Link to Requisition (optional)</label>
              <select
                value={form.requisitionId}
                onChange={(e) => setForm({ ...form, requisitionId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">No requisition</option>
                {requisitions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.requisitionNo} - {r.title}
                  </option>
                ))}
              </select>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Validity Period (days)</label>
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Items</h3>
            <button
              type="button"
              onClick={() => setShowItemForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4" />
              <span>Add Item</span>
            </button>
          </div>

          {items.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No items added yet</p>
          ) : (
            <div className="space-y-3">
              {items.map((it, idx) => (
                <div key={idx} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{it.itemName}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {it.quantity} {it.unit}
                      {it.estimatedPrice ? ` • Est: ${it.estimatedPrice}` : ''}
                    </p>
                    {it.description && <p className="text-xs text-gray-500 mt-1">{it.description}</p>}
                  </div>
                  <button type="button" onClick={() => removeItem(idx)} className="text-red-600 hover:text-red-700 ml-4">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {showItemForm && (
            <div className="mt-4 p-4 border-2 border-indigo-200 rounded-lg bg-indigo-50">
              <h4 className="font-semibold text-gray-900 mb-4">Add Item</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Item Name *</label>
                  <input
                    value={currentItem.itemName}
                    onChange={(e) => setCurrentItem({ ...currentItem, itemName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <input
                    value={currentItem.description}
                    onChange={(e) => setCurrentItem({ ...currentItem, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={currentItem.quantity}
                    onChange={(e) => setCurrentItem({ ...currentItem, quantity: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Unit *</label>
                  <input
                    value={currentItem.unit}
                    onChange={(e) => setCurrentItem({ ...currentItem, unit: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Unit Price</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={currentItem.estimatedPrice}
                    onChange={(e) => setCurrentItem({ ...currentItem, estimatedPrice: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Specifications</label>
                  <textarea
                    value={currentItem.specifications}
                    onChange={(e) => setCurrentItem({ ...currentItem, specifications: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-4">
                <button type="button" onClick={addItem} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                  Add Item
                </button>
                <button type="button" onClick={() => setShowItemForm(false)} className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
          >
            <Save className="w-5 h-5" />
            <span>{loading ? 'Saving...' : 'Create RFQ'}</span>
          </button>
        </div>
      </form>
    </DashboardLayout>
  );
}

export default function NewRFQPage() {
  return (
    <ProtectedRoute>
      <NewRFQContent />
    </ProtectedRoute>
  );
}

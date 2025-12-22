'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { ArrowLeft, Plus, Save, X } from 'lucide-react';

interface VendorOption {
  id: string;
  vendorCode: string;
  companyName: string;
  status: string;
}

interface RequisitionOption {
  id: string;
  requisitionNo: string;
  title: string;
  status: string;
}

interface POItemForm {
  itemName: string;
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  stockItemId: string;
}

function NewPurchaseOrderContent() {
  const router = useRouter();
  const { user } = useAuth();

  const canCreate =
    user && ['SUPER_ADMIN', 'CEO', 'CFO', 'PROCUREMENT_OFFICER', 'OPERATIONS_MANAGER'].includes(user.role);

  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const [requisitions, setRequisitions] = useState<RequisitionOption[]>([]);

  const [form, setForm] = useState({
    vendorId: '',
    requisitionId: '',
    rfqResponseId: '',
    currency: 'GHS',
    taxAmount: '0',
    discountAmount: '0',
    shippingCost: '0',
    deliveryAddress: '',
    deliverySite: '',
    expectedDelivery: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    deliveryTerms: '',
    paymentTerms: '30',
  });

  const [items, setItems] = useState<POItemForm[]>([]);
  const [showItemForm, setShowItemForm] = useState(false);
  const [currentItem, setCurrentItem] = useState<POItemForm>({
    itemName: '',
    description: '',
    quantity: '',
    unit: 'UNITS',
    unitPrice: '',
    stockItemId: '',
  });

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const res = await api.get('/procurement/vendors', { params: { status: 'APPROVED', take: 200 } });
        const data = res.data.data || res.data;
        setVendors(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Failed to fetch vendors:', e);
      }
    };

    const fetchRequisitions = async () => {
      try {
        const res = await api.get('/procurement/requisitions', { params: { status: 'APPROVED' } });
        const data = res.data.data || res.data;
        setRequisitions(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Failed to fetch requisitions:', e);
      }
    };

    fetchVendors();
    fetchRequisitions();
  }, []);

  const subtotal = useMemo(() => {
    return items.reduce((sum, i) => {
      const qty = Number(i.quantity || 0);
      const price = Number(i.unitPrice || 0);
      return sum + qty * price;
    }, 0);
  }, [items]);

  const totals = useMemo(() => {
    const tax = Number(form.taxAmount || 0);
    const discount = Number(form.discountAmount || 0);
    const shipping = Number(form.shippingCost || 0);
    const total = subtotal + tax + shipping - discount;
    return { tax, discount, shipping, total };
  }, [subtotal, form.taxAmount, form.discountAmount, form.shippingCost]);

  const addItem = () => {
    if (!currentItem.itemName.trim() || !currentItem.quantity.trim() || !currentItem.unit.trim() || !currentItem.unitPrice.trim()) {
      alert('Please provide item name, quantity, unit and unit price');
      return;
    }
    setItems([...items, { ...currentItem }]);
    setCurrentItem({ itemName: '', description: '', quantity: '', unit: 'UNITS', unitPrice: '', stockItemId: '' });
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

    if (!form.vendorId) {
      alert('Select a vendor');
      return;
    }

    if (!form.deliveryAddress.trim()) {
      alert('Delivery address is required');
      return;
    }

    if (!items.length) {
      alert('Add at least one PO item');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        vendorId: form.vendorId,
        requisitionId: form.requisitionId || undefined,
        rfqResponseId: form.rfqResponseId || undefined,
        currency: form.currency || undefined,
        taxAmount: form.taxAmount || undefined,
        discountAmount: form.discountAmount || undefined,
        shippingCost: form.shippingCost || undefined,
        deliveryAddress: form.deliveryAddress,
        deliverySite: form.deliverySite || undefined,
        expectedDelivery: new Date(`${form.expectedDelivery}T00:00:00.000Z`).toISOString(),
        deliveryTerms: form.deliveryTerms || undefined,
        paymentTerms: form.paymentTerms ? Number(form.paymentTerms) : undefined,
        items: items.map((i) => ({
          itemName: i.itemName,
          description: i.description || undefined,
          quantity: i.quantity,
          unit: i.unit,
          unitPrice: i.unitPrice,
          stockItemId: i.stockItemId || undefined,
        })),
      };

      const res = await api.post('/procurement/purchase-orders', payload);
      alert('Purchase order created');
      router.push(`/procurement/purchase-orders/${res.data.id}`);
    } catch (error: any) {
      console.error('Failed to create PO:', error);
      alert(error.response?.data?.message || 'Failed to create purchase order');
    } finally {
      setLoading(false);
    }
  };

  if (!canCreate) {
    return (
      <DashboardLayout>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-900 font-semibold">Not allowed</p>
          <p className="text-gray-600 mt-1">You do not have permission to create purchase orders.</p>
          <Link href="/procurement/purchase-orders" className="text-indigo-600 hover:text-indigo-700 mt-4 inline-block">
            Back to Purchase Orders
          </Link>
        </div>
      </DashboardLayout>
    );
  }

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
        <h1 className="text-2xl font-bold text-gray-900">Create Purchase Order</h1>
        <p className="text-gray-600 mt-1">Create a draft PO and line items</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <form onSubmit={submit} className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendor & References</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vendor *</label>
                  <select
                    value={form.vendorId}
                    onChange={(e) => setForm({ ...form, vendorId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Select vendor...</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.vendorCode} - {v.companyName}
                      </option>
                    ))}
                  </select>
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

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">RFQ Response ID (optional)</label>
                  <input
                    value={form.rfqResponseId}
                    onChange={(e) => setForm({ ...form, rfqResponseId: e.target.value })}
                    placeholder="Paste RFQ response ID if applicable"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery & Terms</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Address *</label>
                  <input
                    value={form.deliveryAddress}
                    onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Site</label>
                  <input
                    value={form.deliverySite}
                    onChange={(e) => setForm({ ...form, deliverySite: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expected Delivery *</label>
                  <input
                    type="date"
                    value={form.expectedDelivery}
                    onChange={(e) => setForm({ ...form, expectedDelivery: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Terms (days)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.paymentTerms}
                    onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Terms</label>
                  <input
                    value={form.deliveryTerms}
                    onChange={(e) => setForm({ ...form, deliveryTerms: e.target.value })}
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
                          {it.quantity} {it.unit} × {form.currency} {Number(it.unitPrice).toFixed(2)}
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">Unit Price ({form.currency}) *</label>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={currentItem.unitPrice}
                        onChange={(e) => setCurrentItem({ ...currentItem, unitPrice: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Stock Item ID (optional)</label>
                      <input
                        value={currentItem.stockItemId}
                        onChange={(e) => setCurrentItem({ ...currentItem, stockItemId: e.target.value })}
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

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Charges</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tax</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.taxAmount}
                    onChange={(e) => setForm({ ...form, taxAmount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Discount</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.discountAmount}
                    onChange={(e) => setForm({ ...form, discountAmount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Shipping</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.shippingCost}
                    onChange={(e) => setForm({ ...form, shippingCost: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
              >
                <Save className="w-5 h-5" />
                <span>{loading ? 'Saving...' : 'Create PO'}</span>
              </button>
            </div>
          </form>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 sticky top-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Summary</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">Items</p>
                <p className="text-lg font-semibold text-gray-900">{items.length}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Subtotal</p>
                <p className="text-lg font-semibold text-gray-900">
                  {form.currency} {subtotal.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {form.currency} {totals.total.toFixed(2)}
                </p>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500">Status</p>
                <p className="text-sm font-medium text-gray-900">DRAFT</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function NewPurchaseOrderPage() {
  return (
    <ProtectedRoute>
      <NewPurchaseOrderContent />
    </ProtectedRoute>
  );
}

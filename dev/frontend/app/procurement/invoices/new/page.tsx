'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

interface VendorListItem {
  id: string;
  vendorCode: string;
  companyName: string;
}

interface PurchaseOrderListItem {
  id: string;
  poNumber: string;
}

function NewInvoiceContent() {
  const router = useRouter();
  const { user } = useAuth();

  const canCreate =
    user && ['SUPER_ADMIN', 'CEO', 'CFO', 'ACCOUNTANT', 'PROCUREMENT_OFFICER'].includes(user.role);

  const [vendors, setVendors] = useState<VendorListItem[]>([]);
  const [poOptions, setPoOptions] = useState<PurchaseOrderListItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [purchaseOrderId, setPurchaseOrderId] = useState('');

  const [currency, setCurrency] = useState('GHS');
  const [taxAmount, setTaxAmount] = useState('0');
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });

  const [items, setItems] = useState<Array<{ description: string; quantity: string; unitPrice: string; poItemId?: string }>>([
    { description: '', quantity: '1', unitPrice: '0' },
  ]);

  const fetchVendors = async () => {
    const res = await api.get('/procurement/vendors', { params: { limit: 200 } });
    const data = res.data.data || res.data;
    setVendors((data || []).map((v: any) => ({ id: v.id, vendorCode: v.vendorCode, companyName: v.companyName })));
  };

  const fetchPOsForVendor = async (vId: string) => {
    if (!vId) {
      setPoOptions([]);
      return;
    }
    const res = await api.get('/procurement/purchase-orders', { params: { vendorId: vId } });
    const data = res.data.data || res.data;
    setPoOptions((data || []).map((p: any) => ({ id: p.id, poNumber: p.poNumber })));
  };

  useEffect(() => {
    if (!canCreate) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        await fetchVendors();
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canCreate]);

  useEffect(() => {
    fetchPOsForVendor(vendorId);
    setPurchaseOrderId('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorId]);

  const numeric = (v: any) => Number(v || 0);

  const subtotal = useMemo(() => {
    return items.reduce((acc, i) => acc + numeric(i.quantity) * numeric(i.unitPrice), 0);
  }, [items]);

  const totalAmount = useMemo(() => {
    return subtotal + numeric(taxAmount);
  }, [subtotal, taxAmount]);

  const addItem = () => {
    setItems((prev) => [...prev, { description: '', quantity: '1', unitPrice: '0' }]);
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const setItem = (idx: number, patch: Partial<(typeof items)[number]>) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const toIso = (d: string) => {
    const date = new Date(d);
    return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
  };

  const canSave = invoiceNumber.trim().length > 0 && vendorId && items.some((i) => i.description.trim().length >= 2);

  const save = async () => {
    if (!canSave) return;

    setSaving(true);
    try {
      const payload = {
        invoiceNumber: invoiceNumber.trim(),
        vendorId,
        purchaseOrderId: purchaseOrderId || undefined,
        currency,
        subtotal: String(subtotal.toFixed(2)),
        taxAmount: String(numeric(taxAmount).toFixed(2)),
        totalAmount: String(totalAmount.toFixed(2)),
        invoiceDate: toIso(invoiceDate),
        dueDate: toIso(dueDate),
        items: items
          .filter((i) => i.description.trim().length >= 2)
          .map((i) => ({
            description: i.description.trim(),
            quantity: String(i.quantity),
            unitPrice: String(i.unitPrice),
            poItemId: i.poItemId || undefined,
          })),
      };

      const res = await api.post('/procurement/invoices', payload);
      alert('Invoice recorded');
      router.push(`/procurement/invoices/${res.data.id}`);
    } catch (error: any) {
      console.error('Failed to record invoice:', error);
      alert(error.response?.data?.message || 'Failed to record invoice');
    } finally {
      setSaving(false);
    }
  };

  if (!canCreate) {
    return (
      <DashboardLayout>
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-700">You do not have access to record invoices.</p>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/procurement/invoices"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Record Vendor Invoice</h1>
            <p className="text-gray-600 mt-1">Create an invoice and link it to a PO for matching.</p>
          </div>
        </div>
        <button
          onClick={save}
          disabled={!canSave || saving}
          className={`px-4 py-2 rounded-lg text-white ${!canSave || saving ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
            <input
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
            <select
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select vendor</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.companyName} ({v.vendorCode})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Order (optional)</label>
            <select
              value={purchaseOrderId}
              onChange={(e) => setPurchaseOrderId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Not linked</option>
              {poOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.poNumber}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
            <input
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tax Amount</label>
            <input
              value={taxAmount}
              onChange={(e) => setTaxAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Invoice Items</h2>
          <button onClick={addItem} className="inline-flex items-center gap-2 px-3 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900">
            <Plus className="w-4 h-4" />
            Add Line
          </button>
        </div>

        <div className="space-y-3">
          {items.map((it, idx) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center border rounded-lg p-3">
              <div className="md:col-span-6">
                <label className="block text-xs text-gray-500 mb-1">Description</label>
                <input
                  value={it.description}
                  onChange={(e) => setItem(idx, { description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Item description"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Qty</label>
                <input
                  value={it.quantity}
                  onChange={(e) => setItem(idx, { quantity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Unit Price</label>
                <input
                  value={it.unitPrice}
                  onChange={(e) => setItem(idx, { unitPrice: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="md:col-span-2 flex items-end justify-end">
                <button
                  onClick={() => removeItem(idx)}
                  disabled={items.length === 1}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${
                    items.length === 1 ? 'bg-gray-200 text-gray-500' : 'bg-red-50 text-red-700 hover:bg-red-100'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <div className="text-right">
            <div className="text-sm text-gray-600">Subtotal: {currency} {subtotal.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Tax: {currency} {numeric(taxAmount).toFixed(2)}</div>
            <div className="text-lg font-semibold text-gray-900">Total: {currency} {totalAmount.toFixed(2)}</div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function NewProcurementInvoicePage() {
  return (
    <ProtectedRoute>
      <NewInvoiceContent />
    </ProtectedRoute>
  );
}

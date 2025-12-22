'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { ArrowLeft, Save } from 'lucide-react';

const vendorTypes = [
  'MANUFACTURER',
  'DISTRIBUTOR',
  'WHOLESALER',
  'RETAILER',
  'SERVICE_PROVIDER',
  'CONTRACTOR',
];

function NewVendorContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const canManage =
    user && ['SUPER_ADMIN', 'CEO', 'CFO', 'PROCUREMENT_OFFICER'].includes(user.role);

  const [form, setForm] = useState({
    companyName: '',
    tradingName: '',
    type: 'SERVICE_PROVIDER',
    categoryInput: '',

    primaryContact: '',
    email: '',
    phone: '',

    address: '',
    city: '',
    region: '',
    country: 'Ghana',

    vatRegistered: false,
    vatNumber: '',

    paymentTerms: '30',
    currency: 'GHS',

    isPreferred: false,
  });

  const categories = useMemo(() => {
    return form.categoryInput
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
  }, [form.categoryInput]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canManage) {
      alert('Not allowed');
      return;
    }

    if (!form.companyName || !form.primaryContact || !form.email || !form.phone) {
      alert('Please fill in company name, primary contact, email, and phone');
      return;
    }

    if (!form.address || !form.city || !form.region) {
      alert('Please fill in address, city and region');
      return;
    }

    if (categories.length === 0) {
      alert('Please enter at least one category (comma-separated)');
      return;
    }

    if (form.vatRegistered && !form.vatNumber.trim()) {
      alert('VAT number is required when VAT registered');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        companyName: form.companyName,
        tradingName: form.tradingName || undefined,
        type: form.type,
        category: categories,

        primaryContact: form.primaryContact,
        email: form.email,
        phone: form.phone,

        address: form.address,
        city: form.city,
        region: form.region,
        country: form.country || 'Ghana',

        vatRegistered: form.vatRegistered,
        vatNumber: form.vatRegistered ? form.vatNumber : undefined,

        paymentTerms: Number(form.paymentTerms || '30'),
        currency: form.currency || 'GHS',

        isPreferred: form.isPreferred,
      };

      const res = await api.post('/procurement/vendors', payload);
      alert('Vendor created');
      router.push(`/procurement/vendors/${res.data.id}`);
    } catch (error: any) {
      console.error('Failed to create vendor:', error);
      alert(error.response?.data?.message || 'Failed to create vendor');
    } finally {
      setLoading(false);
    }
  };

  if (!canManage) {
    return (
      <DashboardLayout>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-900 font-semibold">Not allowed</p>
          <p className="text-gray-600 mt-1">You do not have permission to create vendors.</p>
          <Link
            href="/procurement/vendors"
            className="text-indigo-600 hover:text-indigo-700 mt-4 inline-block"
          >
            Back to Vendors
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link
          href="/procurement/vendors"
          className="inline-flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Vendors</span>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Create New Vendor</h1>
        <p className="text-gray-600 mt-1">Register a supplier</p>
      </div>

      <form onSubmit={submit} className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendor Profile</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
              <input
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Trading Name</label>
              <input
                value={form.tradingName}
                onChange={(e) => setForm({ ...form, tradingName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Vendor Type *</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {vendorTypes.map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Categories * (comma-separated)</label>
              <input
                value={form.categoryInput}
                onChange={(e) => setForm({ ...form, categoryInput: e.target.value })}
                placeholder="e.g., EQUIPMENT, SPARE_PARTS"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              {categories.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">Parsed: {categories.join(', ')}</p>
              )}
            </div>

            <div className="md:col-span-2 flex items-center space-x-3">
              <input
                id="isPreferred"
                type="checkbox"
                checked={form.isPreferred}
                onChange={(e) => setForm({ ...form, isPreferred: e.target.checked })}
              />
              <label htmlFor="isPreferred" className="text-sm text-gray-700">
                Mark as Preferred
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Primary Contact</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
              <input
                value={form.primaryContact}
                onChange={(e) => setForm({ ...form, primaryContact: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
              <input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Region *</label>
              <input
                value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
              <input
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tax & Payment</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 flex items-center space-x-3">
              <input
                id="vatRegistered"
                type="checkbox"
                checked={form.vatRegistered}
                onChange={(e) => setForm({ ...form, vatRegistered: e.target.checked })}
              />
              <label htmlFor="vatRegistered" className="text-sm text-gray-700">
                VAT Registered
              </label>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">VAT Number</label>
              <input
                value={form.vatNumber}
                onChange={(e) => setForm({ ...form, vatNumber: e.target.value })}
                disabled={!form.vatRegistered}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Terms (days)</label>
              <input
                type="number"
                value={form.paymentTerms}
                onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
              <input
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
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
            <span>{loading ? 'Saving...' : 'Create Vendor'}</span>
          </button>
        </div>
      </form>
    </DashboardLayout>
  );
}

export default function NewVendorPage() {
  return (
    <ProtectedRoute>
      <NewVendorContent />
    </ProtectedRoute>
  );
}

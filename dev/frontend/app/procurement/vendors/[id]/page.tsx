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
  Edit,
  FileText,
  Plus,
  ShieldAlert,
  Trash2,
  Upload,
} from 'lucide-react';

interface UserLite {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface VendorContact {
  id: string;
  name: string;
  position?: string;
  email: string;
  phone: string;
  isPrimary: boolean;
}

interface VendorDocument {
  id: string;
  type: string;
  name: string;
  fileUrl: string;
  expiryDate?: string;
  uploadedAt: string;
  uploadedBy?: UserLite;
}

interface VendorProduct {
  id: string;
  productName: string;
  category: string;
  description?: string;
  unitPrice: any;
  unit: string;
  leadTimeDays?: number;
  minOrderQty?: any;
}

interface VendorEvaluation {
  id: string;
  period: string;
  qualityScore: number;
  deliveryScore: number;
  priceScore: number;
  serviceScore: number;
  safetyScore: number;
  overallScore: any;
  comments?: string;
  recommendation?: string;
  evaluatedAt: string;
  evaluator?: UserLite;
}

interface Vendor {
  id: string;
  vendorCode: string;
  companyName: string;
  tradingName?: string;
  type: string;
  category: string[];

  primaryContact: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  website?: string;

  address: string;
  city: string;
  region: string;
  country: string;

  taxId?: string;
  businessRegNo?: string;
  vatRegistered: boolean;
  vatNumber?: string;

  paymentTerms: number;
  creditLimit?: any;
  currency: string;

  rating: any;
  totalOrders: number;
  totalSpend: any;
  onTimeDelivery: any;
  qualityScore: any;

  status: string;
  isPreferred: boolean;
  isBlacklisted: boolean;
  blacklistReason?: string;

  contacts: VendorContact[];
  documents: VendorDocument[];
  products: VendorProduct[];
  evaluations: VendorEvaluation[];

  createdBy?: UserLite;
  createdAt: string;
  updatedAt: string;
}

function VendorDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const vendorId = String((params as any).id);

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);

  const [actionLoading, setActionLoading] = useState(false);

  const [showAddContact, setShowAddContact] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    position: '',
    email: '',
    phone: '',
    isPrimary: false,
  });

  const [uploading, setUploading] = useState(false);
  const [docMeta, setDocMeta] = useState({
    type: 'LICENSE',
    name: '',
    expiryDate: '',
  });

  const [showAddProduct, setShowAddProduct] = useState(false);
  const [productForm, setProductForm] = useState({
    productName: '',
    category: '',
    description: '',
    unitPrice: '',
    unit: 'UNIT',
    leadTimeDays: '',
    minOrderQty: '',
  });

  const [showAddEvaluation, setShowAddEvaluation] = useState(false);
  const [evaluationForm, setEvaluationForm] = useState({
    period: '',
    qualityScore: 3,
    deliveryScore: 3,
    priceScore: 3,
    serviceScore: 3,
    safetyScore: 3,
    comments: '',
    recommendation: '',
  });

  const canManage =
    user && ['SUPER_ADMIN', 'CEO', 'CFO', 'PROCUREMENT_OFFICER'].includes(user.role);

  const canEvaluate =
    user &&
    [
      'SUPER_ADMIN',
      'CEO',
      'CFO',
      'PROCUREMENT_OFFICER',
      'OPERATIONS_MANAGER',
      'SAFETY_OFFICER',
      'DEPARTMENT_HEAD',
    ].includes(user.role);

  useEffect(() => {
    fetchVendor();
  }, [vendorId]);

  const fetchVendor = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/procurement/vendors/${vendorId}`);
      setVendor(res.data);
    } catch (error) {
      console.error('Failed to fetch vendor:', error);
      alert('Vendor not found');
      router.push('/procurement/vendors');
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = useMemo(() => {
    const s = vendor?.status || '';
    const colors: any = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      SUSPENDED: 'bg-orange-100 text-orange-800',
      BLACKLISTED: 'bg-red-100 text-red-800',
      INACTIVE: 'bg-gray-100 text-gray-800',
    };
    return colors[s] || 'bg-gray-100 text-gray-800';
  }, [vendor?.status]);

  const doStatusAction = async (action: 'approve' | 'suspend' | 'blacklist' | 'reactivate') => {
    if (!canManage) {
      alert('Not allowed');
      return;
    }

    let payload: any = {};

    if (action === 'blacklist') {
      const reason = window.prompt('Blacklist reason (required):') || '';
      if (!reason.trim()) {
        alert('Reason is required');
        return;
      }
      payload.reason = reason;
    }

    setActionLoading(true);
    try {
      await api.post(`/procurement/vendors/${vendorId}/${action}`, payload);
      await fetchVendor();
    } catch (error: any) {
      console.error('Failed action:', error);
      alert(error.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const addContact = async () => {
    if (!canManage) {
      alert('Not allowed');
      return;
    }

    if (!contactForm.name || !contactForm.email || !contactForm.phone) {
      alert('Please fill in name, email and phone');
      return;
    }

    setActionLoading(true);
    try {
      await api.post(`/procurement/vendors/${vendorId}/contacts`, {
        name: contactForm.name,
        position: contactForm.position || undefined,
        email: contactForm.email,
        phone: contactForm.phone,
        isPrimary: contactForm.isPrimary,
      });
      setShowAddContact(false);
      setContactForm({ name: '', position: '', email: '', phone: '', isPrimary: false });
      await fetchVendor();
    } catch (error: any) {
      console.error('Failed to add contact:', error);
      alert(error.response?.data?.message || 'Failed to add contact');
    } finally {
      setActionLoading(false);
    }
  };

  const uploadDocument = async (file: File | null) => {
    if (!file) return;
    if (!canManage) {
      alert('Not allowed');
      return;
    }
    if (!docMeta.type.trim()) {
      alert('Document type is required');
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('type', docMeta.type);
      if (docMeta.name.trim()) form.append('name', docMeta.name);
      if (docMeta.expiryDate) {
        form.append('expiryDate', new Date(docMeta.expiryDate).toISOString());
      }

      await api.post(`/procurement/vendors/${vendorId}/documents`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setDocMeta({ type: docMeta.type, name: '', expiryDate: '' });
      await fetchVendor();
    } catch (error: any) {
      console.error('Failed to upload document:', error);
      alert(error.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const addProduct = async () => {
    if (!canManage) {
      alert('Not allowed');
      return;
    }

    if (!productForm.productName || !productForm.category || !productForm.unitPrice || !productForm.unit) {
      alert('Please fill in product name, category, unit price and unit');
      return;
    }

    setActionLoading(true);
    try {
      await api.post(`/procurement/vendors/${vendorId}/products`, {
        productName: productForm.productName,
        category: productForm.category,
        description: productForm.description || undefined,
        unitPrice: productForm.unitPrice,
        unit: productForm.unit,
        leadTimeDays: productForm.leadTimeDays ? Number(productForm.leadTimeDays) : undefined,
        minOrderQty: productForm.minOrderQty || undefined,
      });
      setShowAddProduct(false);
      setProductForm({
        productName: '',
        category: '',
        description: '',
        unitPrice: '',
        unit: 'UNIT',
        leadTimeDays: '',
        minOrderQty: '',
      });
      await fetchVendor();
    } catch (error: any) {
      console.error('Failed to add product:', error);
      alert(error.response?.data?.message || 'Failed to add product');
    } finally {
      setActionLoading(false);
    }
  };

  const addEvaluation = async () => {
    if (!canEvaluate) {
      alert('Not allowed');
      return;
    }

    if (!evaluationForm.period.trim()) {
      alert('Period is required (e.g., 2025-Q1)');
      return;
    }

    setActionLoading(true);
    try {
      await api.post(`/procurement/vendors/${vendorId}/evaluations`, {
        period: evaluationForm.period,
        qualityScore: evaluationForm.qualityScore,
        deliveryScore: evaluationForm.deliveryScore,
        priceScore: evaluationForm.priceScore,
        serviceScore: evaluationForm.serviceScore,
        safetyScore: evaluationForm.safetyScore,
        comments: evaluationForm.comments || undefined,
        recommendation: evaluationForm.recommendation || undefined,
      });
      setShowAddEvaluation(false);
      setEvaluationForm({
        period: '',
        qualityScore: 3,
        deliveryScore: 3,
        priceScore: 3,
        serviceScore: 3,
        safetyScore: 3,
        comments: '',
        recommendation: '',
      });
      await fetchVendor();
    } catch (error: any) {
      console.error('Failed to add evaluation:', error);
      alert(error.response?.data?.message || 'Failed to add evaluation');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading vendor...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!vendor) return null;

  const primaryContact = vendor.contacts?.find((c) => c.isPrimary) || vendor.contacts?.[0];

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

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{vendor.companyName}</h1>
            <p className="text-gray-600 mt-1">
              {vendor.vendorCode} • {vendor.type.replace(/_/g, ' ')}
            </p>
            <div className="flex items-center space-x-2 mt-2">
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusBadge}`}>
                {vendor.status}
              </span>
              {vendor.isPreferred && (
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">
                  Preferred
                </span>
              )}
              {vendor.isBlacklisted && (
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                  Blacklisted
                </span>
              )}
            </div>
            {vendor.isBlacklisted && vendor.blacklistReason && (
              <p className="text-sm text-red-700 mt-2">Reason: {vendor.blacklistReason}</p>
            )}
          </div>

          {canManage && (
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/procurement/vendors/${vendorId}/edit`}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </Link>
              <button
                onClick={() => doStatusAction('approve')}
                disabled={actionLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                Approve
              </button>
              <button
                onClick={() => doStatusAction('suspend')}
                disabled={actionLoading}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400"
              >
                Suspend
              </button>
              <button
                onClick={() => doStatusAction('blacklist')}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
              >
                Blacklist
              </button>
              <button
                onClick={() => doStatusAction('reactivate')}
                disabled={actionLoading}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black disabled:bg-gray-400"
              >
                Reactivate
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Vendor Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-500">Primary Contact</p>
                <p className="font-medium text-gray-900">{vendor.primaryContact}</p>
                <p className="text-gray-600">{vendor.email}</p>
                <p className="text-gray-600">{vendor.phone}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Address</p>
                <p className="font-medium text-gray-900">{vendor.address}</p>
                <p className="text-gray-600">
                  {vendor.city}, {vendor.region}, {vendor.country}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs text-gray-500">Categories</p>
                <p className="font-medium text-gray-900">{(vendor.category || []).join(', ')}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Payment Terms</p>
                <p className="font-medium text-gray-900">{vendor.paymentTerms} days</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Currency</p>
                <p className="font-medium text-gray-900">{vendor.currency}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Contacts ({vendor.contacts?.length || 0})</h2>
              {canManage && (
                <button
                  onClick={() => setShowAddContact((v) => !v)}
                  className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Contact</span>
                </button>
              )}
            </div>

            {vendor.contacts?.length ? (
              <div className="space-y-2">
                {vendor.contacts.map((c) => (
                  <div key={c.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {c.name}{' '}
                          {c.isPrimary && (
                            <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">
                              Primary
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-600">{c.position || '—'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-600">{c.email}</p>
                        <p className="text-xs text-gray-600">{c.phone}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No contacts yet.</p>
            )}

            {showAddContact && (
              <div className="mt-4 p-4 border-2 border-indigo-200 rounded-lg bg-indigo-50">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">New Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    placeholder="Name *"
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    value={contactForm.position}
                    onChange={(e) => setContactForm({ ...contactForm, position: e.target.value })}
                    placeholder="Position"
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    placeholder="Email *"
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                    placeholder="Phone *"
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <label className="flex items-center space-x-2 md:col-span-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={contactForm.isPrimary}
                      onChange={(e) => setContactForm({ ...contactForm, isPrimary: e.target.checked })}
                    />
                    <span>Set as primary contact</span>
                  </label>
                </div>
                <div className="flex space-x-3 mt-3">
                  <button
                    type="button"
                    onClick={addContact}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
                  >
                    Save Contact
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddContact(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Documents ({vendor.documents?.length || 0})</h2>
              {canManage && (
                <label className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>{uploading ? 'Uploading...' : 'Upload'}</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => uploadDocument(e.target.files?.[0] || null)}
                    disabled={uploading}
                  />
                </label>
              )}
            </div>

            {canManage && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <input
                  value={docMeta.type}
                  onChange={(e) => setDocMeta({ ...docMeta, type: e.target.value })}
                  placeholder="Type (e.g., LICENSE)"
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  value={docMeta.name}
                  onChange={(e) => setDocMeta({ ...docMeta, name: e.target.value })}
                  placeholder="Display name (optional)"
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="date"
                  value={docMeta.expiryDate}
                  onChange={(e) => setDocMeta({ ...docMeta, expiryDate: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            )}

            {vendor.documents?.length ? (
              <div className="space-y-2">
                {vendor.documents.map((d) => (
                  <div key={d.id} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                    <div className="flex items-start space-x-3">
                      <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{d.name}</p>
                        <p className="text-xs text-gray-500">Type: {d.type}</p>
                        {d.expiryDate && (
                          <p className="text-xs text-gray-500">Expiry: {new Date(d.expiryDate).toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>
                    <a
                      href={d.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                    >
                      View
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No documents uploaded.</p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Products ({vendor.products?.length || 0})</h2>
              {canManage && (
                <button
                  onClick={() => setShowAddProduct((v) => !v)}
                  className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Product</span>
                </button>
              )}
            </div>

            {vendor.products?.length ? (
              <div className="space-y-2">
                {vendor.products.map((p) => (
                  <div key={p.id} className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-900">{p.productName}</p>
                    <p className="text-xs text-gray-600">Category: {p.category}</p>
                    <p className="text-xs text-gray-600">
                      Unit Price: {vendor.currency} {Number(p.unitPrice || 0).toFixed(2)} / {p.unit}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No products cataloged.</p>
            )}

            {showAddProduct && (
              <div className="mt-4 p-4 border-2 border-indigo-200 rounded-lg bg-indigo-50">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">New Product</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    value={productForm.productName}
                    onChange={(e) => setProductForm({ ...productForm, productName: e.target.value })}
                    placeholder="Product name *"
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    placeholder="Category *"
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    value={productForm.unitPrice}
                    onChange={(e) => setProductForm({ ...productForm, unitPrice: e.target.value })}
                    placeholder="Unit price *"
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    value={productForm.unit}
                    onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                    placeholder="Unit * (e.g., PIECES)"
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    value={productForm.leadTimeDays}
                    onChange={(e) => setProductForm({ ...productForm, leadTimeDays: e.target.value })}
                    placeholder="Lead time (days)"
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    value={productForm.minOrderQty}
                    onChange={(e) => setProductForm({ ...productForm, minOrderQty: e.target.value })}
                    placeholder="Min order qty"
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    placeholder="Description"
                    className="px-4 py-2 border border-gray-300 rounded-lg md:col-span-2"
                  />
                </div>
                <div className="flex space-x-3 mt-3">
                  <button
                    type="button"
                    onClick={addProduct}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
                  >
                    Save Product
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddProduct(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Evaluations ({vendor.evaluations?.length || 0})</h2>
              {canEvaluate && (
                <button
                  onClick={() => setShowAddEvaluation((v) => !v)}
                  className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Evaluation</span>
                </button>
              )}
            </div>

            {vendor.evaluations?.length ? (
              <div className="space-y-2">
                {vendor.evaluations.map((ev) => (
                  <div key={ev.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">{ev.period}</p>
                      <p className="text-sm font-semibold text-gray-900">
                        Overall: {Number(ev.overallScore || 0).toFixed(2)}
                      </p>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Scores (Q/D/P/S/Safety): {ev.qualityScore}/{ev.deliveryScore}/{ev.priceScore}/{ev.serviceScore}/{ev.safetyScore}
                    </p>
                    {ev.comments && <p className="text-xs text-gray-600 mt-1">{ev.comments}</p>}
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(ev.evaluatedAt).toLocaleDateString()}{' '}
                      {ev.evaluator ? `• ${ev.evaluator.firstName} ${ev.evaluator.lastName}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No evaluations yet.</p>
            )}

            {showAddEvaluation && (
              <div className="mt-4 p-4 border-2 border-indigo-200 rounded-lg bg-indigo-50">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">New Evaluation</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    value={evaluationForm.period}
                    onChange={(e) => setEvaluationForm({ ...evaluationForm, period: e.target.value })}
                    placeholder="Period * (e.g., 2025-Q1)"
                    className="px-4 py-2 border border-gray-300 rounded-lg md:col-span-2"
                  />

                  {(
                    [
                      ['qualityScore', 'Quality'],
                      ['deliveryScore', 'Delivery'],
                      ['priceScore', 'Price'],
                      ['serviceScore', 'Service'],
                      ['safetyScore', 'Safety'],
                    ] as any
                  ).map(([key, label]: any) => (
                    <div key={key}>
                      <label className="block text-xs text-gray-500 mb-1">{label} (1-5)</label>
                      <input
                        type="number"
                        min={1}
                        max={5}
                        value={(evaluationForm as any)[key]}
                        onChange={(e) =>
                          setEvaluationForm({ ...evaluationForm, [key]: Number(e.target.value) })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  ))}

                  <textarea
                    value={evaluationForm.comments}
                    onChange={(e) => setEvaluationForm({ ...evaluationForm, comments: e.target.value })}
                    placeholder="Comments"
                    rows={3}
                    className="px-4 py-2 border border-gray-300 rounded-lg md:col-span-2"
                  />

                  <input
                    value={evaluationForm.recommendation}
                    onChange={(e) => setEvaluationForm({ ...evaluationForm, recommendation: e.target.value })}
                    placeholder="Recommendation"
                    className="px-4 py-2 border border-gray-300 rounded-lg md:col-span-2"
                  />
                </div>
                <div className="flex space-x-3 mt-3">
                  <button
                    type="button"
                    onClick={addEvaluation}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
                  >
                    Save Evaluation
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddEvaluation(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Performance</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Rating</span>
                <span className="font-semibold text-gray-900">{Number(vendor.rating || 0).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">On-time Delivery</span>
                <span className="font-semibold text-gray-900">{Number(vendor.onTimeDelivery || 0).toFixed(2)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Quality Score</span>
                <span className="font-semibold text-gray-900">{Number(vendor.qualityScore || 0).toFixed(2)}%</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Compliance</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-2 text-gray-900">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Documents tracked with expiry dates</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-900">
                <ShieldAlert className="w-4 h-4 text-orange-600" />
                <span>Review expiring compliance documents regularly</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Quick Info</h3>
            <div className="text-sm">
              <p className="text-gray-500">Primary contact (from contacts)</p>
              <p className="font-medium text-gray-900">{primaryContact ? primaryContact.name : '—'}</p>
              <p className="text-gray-600">{primaryContact ? primaryContact.email : '—'}</p>
              <p className="text-gray-600">{primaryContact ? primaryContact.phone : '—'}</p>
            </div>
          </div>

          {canManage && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Danger Zone</h3>
              <button
                onClick={async () => {
                  if (!window.confirm('Delete this vendor? This cannot be undone.')) return;
                  setActionLoading(true);
                  try {
                    await api.delete(`/procurement/vendors/${vendorId}`);
                    router.push('/procurement/vendors');
                  } catch (error: any) {
                    console.error('Failed to delete vendor:', error);
                    alert(error.response?.data?.message || 'Failed to delete vendor');
                  } finally {
                    setActionLoading(false);
                  }
                }}
                disabled={actionLoading}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Vendor</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function VendorDetailPage() {
  return (
    <ProtectedRoute>
      <VendorDetailContent />
    </ProtectedRoute>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Filter, Plus, Search, Truck } from 'lucide-react';

interface Vendor {
  id: string;
  vendorCode: string;
  companyName: string;
  tradingName?: string;
  type: string;
  category: string[];
  email: string;
  phone: string;
  region: string;
  city: string;
  status: string;
  isPreferred: boolean;
  isBlacklisted: boolean;
  rating: number;
  createdAt: string;
  _count?: {
    contacts: number;
    documents: number;
    products: number;
    evaluations: number;
  };
}

interface Stats {
  total: number;
  byStatus: Record<string, number>;
  preferred: number;
  blacklisted: number;
  expiringDocumentsNext30Days: number;
}

const vendorTypes = [
  'MANUFACTURER',
  'DISTRIBUTOR',
  'WHOLESALER',
  'RETAILER',
  'SERVICE_PROVIDER',
  'CONTRACTOR',
];

const vendorStatuses = ['PENDING', 'APPROVED', 'SUSPENDED', 'BLACKLISTED', 'INACTIVE'];

function VendorsContent() {
  const { user } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [preferredFilter, setPreferredFilter] = useState('ALL');
  const [blacklistedFilter, setBlacklistedFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const canManage =
    user && ['SUPER_ADMIN', 'CEO', 'CFO', 'PROCUREMENT_OFFICER'].includes(user.role);

  useEffect(() => {
    fetchData();
  }, [statusFilter, typeFilter, preferredFilter, blacklistedFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (typeFilter !== 'ALL') params.type = typeFilter;
      if (preferredFilter !== 'ALL') params.isPreferred = preferredFilter === 'YES';
      if (blacklistedFilter !== 'ALL') params.isBlacklisted = blacklistedFilter === 'YES';
      if (categoryFilter.trim()) params.category = categoryFilter.trim();

      const [vendorsRes, statsRes] = await Promise.all([
        api.get('/procurement/vendors', { params }),
        api.get('/procurement/vendors/stats'),
      ]);

      setVendors(vendorsRes.data.data || vendorsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVendors = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return vendors;

    return vendors.filter((v) => {
      return (
        v.vendorCode.toLowerCase().includes(q) ||
        v.companyName.toLowerCase().includes(q) ||
        (v.tradingName || '').toLowerCase().includes(q) ||
        v.email.toLowerCase().includes(q) ||
        v.phone.toLowerCase().includes(q) ||
        (v.category || []).some((c) => String(c).toLowerCase().includes(q))
      );
    });
  }, [vendors, searchQuery]);

  const getStatusColor = (status: string) => {
    const colors: any = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      SUSPENDED: 'bg-orange-100 text-orange-800',
      BLACKLISTED: 'bg-red-100 text-red-800',
      INACTIVE: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading vendors...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
            <p className="text-gray-600 mt-1">Register and manage suppliers, compliance documents, and performance</p>
          </div>
          {canManage && (
            <Link
              href="/procurement/vendors/new"
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>New Vendor</span>
            </Link>
          )}
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total Vendors</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Approved</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats.byStatus.APPROVED || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Preferred</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">{stats.preferred}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Expiring Docs (30d)</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">{stats.expiringDocumentsNext30Days}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vendors..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="ALL">All Status</option>
              {vendorStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="ALL">All Types</option>
            {vendorTypes.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, ' ')}
              </option>
            ))}
          </select>

          <select
            value={preferredFilter}
            onChange={(e) => setPreferredFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="ALL">Preferred?</option>
            <option value="YES">Yes</option>
            <option value="NO">No</option>
          </select>

          <select
            value={blacklistedFilter}
            onChange={(e) => setBlacklistedFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="ALL">Blacklisted?</option>
            <option value="YES">Yes</option>
            <option value="NO">No</option>
          </select>
        </div>

        <div className="mt-4">
          <label className="block text-xs text-gray-500 mb-1">Category (exact match)</label>
          <input
            type="text"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            placeholder="e.g., EQUIPMENT"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <div className="mt-3 flex justify-end">
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {filteredVendors.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Vendors Found</h3>
          <p className="text-gray-600 mb-4">Try adjusting filters or add a new vendor.</p>
          {canManage && (
            <Link
              href="/procurement/vendors/new"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Plus className="w-5 h-5" />
              <span>Create Vendor</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredVendors.map((v) => (
            <Link
              key={v.id}
              href={`/procurement/vendors/${v.id}`}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{v.companyName}</h3>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(v.status)}`}>
                      {v.status}
                    </span>
                    {v.isPreferred && (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">
                        Preferred
                      </span>
                    )}
                    {v.isBlacklisted && (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        Blacklisted
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{v.vendorCode}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {v.type.replace(/_/g, ' ')} • {v.city}, {v.region}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">{Number(v.rating || 0).toFixed(2)}</p>
                  <p className="text-xs text-gray-500">Rating</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <p className="text-xs text-gray-500">Contacts</p>
                  <p className="text-sm font-medium text-gray-900">{v._count?.contacts ?? 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Documents</p>
                  <p className="text-sm font-medium text-gray-900">{v._count?.documents ?? 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Products</p>
                  <p className="text-sm font-medium text-gray-900">{v._count?.products ?? 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Evaluations</p>
                  <p className="text-sm font-medium text-gray-900">{v._count?.evaluations ?? 0}</p>
                </div>
              </div>

              <div className="mt-4 text-xs text-gray-500">
                Created: {new Date(v.createdAt).toLocaleDateString()}
              </div>
            </Link>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

export default function VendorsPage() {
  return (
    <ProtectedRoute>
      <VendorsContent />
    </ProtectedRoute>
  );
}

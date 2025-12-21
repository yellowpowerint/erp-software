'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Truck, Plus, Filter, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import ImportModal from '@/components/csv/ImportModal';
import ExportModal from '@/components/csv/ExportModal';

interface Asset {
  id: string;
  assetCode: string;
  name: string;
  category: string;
  status: string;
  condition: string;
  location: string;
  purchasePrice: number;
  currentValue: number;
  lastMaintenanceAt: string;
  nextMaintenanceAt: string;
  _count: { maintenanceLogs: number };
}

interface Stats {
  totalAssets: number;
  activeAssets: number;
  maintenanceAssets: number;
  criticalAssets: number;
  totalValue: number;
}

function AssetsContent() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, [categoryFilter, statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (categoryFilter !== 'ALL') params.category = categoryFilter;
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const [assetsRes, statsRes] = await Promise.all([
        api.get('/assets', { params }),
        api.get('/assets/stats'),
      ]);

      setAssets(assetsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const canManage = user && ['SUPER_ADMIN', 'CEO', 'OPERATIONS_MANAGER'].includes(user.role);

  const exportFilters: any = {};
  if (categoryFilter !== 'ALL') exportFilters.category = categoryFilter;
  if (statusFilter !== 'ALL') exportFilters.status = statusFilter;

  const getStatusColor = (status: string) => {
    const colors: any = {
      ACTIVE: 'bg-green-100 text-green-800',
      MAINTENANCE: 'bg-orange-100 text-orange-800',
      INACTIVE: 'bg-gray-100 text-gray-800',
      RETIRED: 'bg-red-100 text-red-800',
      DAMAGED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getConditionColor = (condition: string) => {
    const colors: any = {
      EXCELLENT: 'text-green-600',
      GOOD: 'text-blue-600',
      FAIR: 'text-yellow-600',
      POOR: 'text-orange-600',
      CRITICAL: 'text-red-600',
    };
    return colors[condition] || 'text-gray-600';
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Asset Management</h1>
            <p className="text-gray-600 mt-1">Track and manage heavy equipment and assets</p>
          </div>
          {canManage && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setImportOpen(true)}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-sm"
              >
                Import CSV
              </button>
              <button
                onClick={() => setExportOpen(true)}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-sm"
              >
                Export CSV
              </button>
              <Link
                href="/assets/new"
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Add Asset</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        module="assets"
        title="Import Assets"
      />

      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        module="assets"
        title="Export Assets"
        defaultFilters={exportFilters}
      />

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total Assets</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalAssets}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Active</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats.activeAssets}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">In Maintenance</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">{stats.maintenanceAssets}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Critical Condition</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{stats.criticalAssets}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total Value</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">₵{stats.totalValue.toFixed(0)}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="ALL">All Categories</option>
              <option value="HEAVY_EQUIPMENT">Heavy Equipment</option>
              <option value="VEHICLES">Vehicles</option>
              <option value="MACHINERY">Machinery</option>
              <option value="TOOLS">Tools</option>
              <option value="COMPUTERS">Computers</option>
              <option value="FURNITURE">Furniture</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="INACTIVE">Inactive</option>
            <option value="RETIRED">Retired</option>
            <option value="DAMAGED">Damaged</option>
          </select>
        </div>
      </div>

      {/* Assets Table */}
      {loading ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading assets...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Condition</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {assets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p>No assets found</p>
                  </td>
                </tr>
              ) : (
                assets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`/assets/${asset.id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-900">
                        {asset.assetCode}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{asset.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">
                      {asset.category.replace('_', ' ').toLowerCase()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(asset.status)}`}>
                        {asset.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-semibold ${getConditionColor(asset.condition)}`}>
                        {asset.condition}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {asset.location || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₵{(asset.currentValue || asset.purchasePrice).toFixed(0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        href={`/assets/${asset.id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function AssetsPage() {
  return (
    <ProtectedRoute>
      <AssetsContent />
    </ProtectedRoute>
  );
}

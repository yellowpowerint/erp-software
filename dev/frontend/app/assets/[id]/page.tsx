'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ArrowLeft, Edit, Wrench, Calendar } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

interface Asset {
  id: string;
  assetCode: string;
  name: string;
  description: string;
  category: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  purchaseDate: string;
  purchasePrice: number;
  currentValue: number;
  depreciationRate: number;
  location: string;
  status: string;
  condition: string;
  assignedTo: string;
  notes: string;
  warrantyExpiry: string;
  lastMaintenanceAt: string;
  nextMaintenanceAt: string;
  maintenanceLogs: Array<{
    id: string;
    maintenanceType: string;
    description: string;
    performedBy: string;
    performedAt: string;
    cost: number;
    notes: string;
  }>;
}

function AssetDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [maintenanceData, setMaintenanceData] = useState({
    maintenanceType: '',
    description: '',
    performedBy: user ? `${user.firstName} ${user.lastName}` : '',
    performedAt: new Date().toISOString().split('T')[0],
    cost: '',
    nextDueDate: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAsset();
  }, [params.id]);

  const fetchAsset = async () => {
    try {
      const response = await api.get(`/assets/${params.id}`);
      setAsset(response.data);
    } catch (error) {
      console.error('Failed to fetch asset:', error);
      alert('Asset not found');
      router.push('/assets');
    } finally {
      setLoading(false);
    }
  };

  const handleMaintenanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintenanceData.maintenanceType || !maintenanceData.description) {
      alert('Please fill in required fields');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/assets/${params.id}/maintenance`, {
        maintenanceType: maintenanceData.maintenanceType,
        description: maintenanceData.description,
        performedBy: maintenanceData.performedBy,
        performedAt: new Date(maintenanceData.performedAt).toISOString(),
        cost: maintenanceData.cost ? parseFloat(maintenanceData.cost) : undefined,
        nextDueDate: maintenanceData.nextDueDate ? new Date(maintenanceData.nextDueDate).toISOString() : undefined,
        notes: maintenanceData.notes,
      });

      alert('Maintenance log recorded successfully!');
      setShowMaintenanceModal(false);
      setMaintenanceData({
        maintenanceType: '',
        description: '',
        performedBy: user ? `${user.firstName} ${user.lastName}` : '',
        performedAt: new Date().toISOString().split('T')[0],
        cost: '',
        nextDueDate: '',
        notes: '',
      });
      fetchAsset();
    } catch (error: any) {
      console.error('Failed to record maintenance:', error);
      alert(error.response?.data?.message || 'Failed to record maintenance');
    } finally {
      setSubmitting(false);
    }
  };

  const canManage = user && ['SUPER_ADMIN', 'CEO', 'OPERATIONS_MANAGER', 'WAREHOUSE_MANAGER'].includes(user.role);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading asset...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!asset) return null;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link
          href="/assets"
          className="inline-flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Assets</span>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{asset.name}</h1>
            <p className="text-gray-600 mt-1">{asset.assetCode}</p>
          </div>
          {canManage && (
            <div className="flex space-x-3">
              <button
                onClick={() => setShowMaintenanceModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Wrench className="w-5 h-5" />
                <span>Log Maintenance</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Asset Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Asset Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Category</label>
                <p className="font-medium text-gray-900 capitalize">{asset.category.replace('_', ' ')}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Status</label>
                <p className="font-medium text-gray-900">{asset.status}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Condition</label>
                <p className="font-medium text-gray-900">{asset.condition}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Location</label>
                <p className="font-medium text-gray-900">{asset.location || 'Not specified'}</p>
              </div>
              {asset.manufacturer && (
                <div>
                  <label className="text-sm text-gray-500">Manufacturer</label>
                  <p className="font-medium text-gray-900">{asset.manufacturer}</p>
                </div>
              )}
              {asset.model && (
                <div>
                  <label className="text-sm text-gray-500">Model</label>
                  <p className="font-medium text-gray-900">{asset.model}</p>
                </div>
              )}
              {asset.serialNumber && (
                <div>
                  <label className="text-sm text-gray-500">Serial Number</label>
                  <p className="font-medium text-gray-900">{asset.serialNumber}</p>
                </div>
              )}
              {asset.assignedTo && (
                <div>
                  <label className="text-sm text-gray-500">Assigned To</label>
                  <p className="font-medium text-gray-900">{asset.assignedTo}</p>
                </div>
              )}
            </div>
            {asset.description && (
              <div className="mt-4">
                <label className="text-sm text-gray-500">Description</label>
                <p className="text-gray-900">{asset.description}</p>
              </div>
            )}
          </div>

          {/* Maintenance History */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Maintenance History</h2>
            {asset.maintenanceLogs.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No maintenance records yet</p>
            ) : (
              <div className="space-y-3">
                {asset.maintenanceLogs.map((log) => (
                  <div key={log.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-gray-900">{log.maintenanceType}</p>
                      <p className="text-xs text-gray-500">{new Date(log.performedAt).toLocaleDateString()}</p>
                    </div>
                    <p className="text-sm text-gray-700">{log.description}</p>
                    {log.performedBy && (
                      <p className="text-xs text-gray-500 mt-2">Performed by: {log.performedBy}</p>
                    )}
                    {log.cost && (
                      <p className="text-xs text-gray-500">Cost: ₵{log.cost.toFixed(2)}</p>
                    )}
                    {log.notes && (
                      <p className="text-xs text-gray-600 mt-1">{log.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Financial Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Financial Summary</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">Purchase Date</label>
                <p className="text-sm font-medium text-gray-900">{new Date(asset.purchaseDate).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Purchase Price</label>
                <p className="text-lg font-semibold text-gray-900">₵{asset.purchasePrice.toFixed(2)}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Current Value</label>
                <p className="text-lg font-semibold text-gray-900">₵{(asset.currentValue || asset.purchasePrice).toFixed(2)}</p>
              </div>
              {asset.depreciationRate && (
                <div>
                  <label className="text-xs text-gray-500">Depreciation Rate</label>
                  <p className="text-sm font-medium text-gray-900">{asset.depreciationRate}% / year</p>
                </div>
              )}
            </div>
          </div>

          {/* Maintenance Schedule */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Maintenance Schedule</h3>
            <div className="space-y-3">
              {asset.lastMaintenanceAt && (
                <div>
                  <label className="text-xs text-gray-500">Last Maintenance</label>
                  <p className="text-sm font-medium text-gray-900">{new Date(asset.lastMaintenanceAt).toLocaleDateString()}</p>
                </div>
              )}
              {asset.nextMaintenanceAt && (
                <div>
                  <label className="text-xs text-gray-500">Next Maintenance</label>
                  <p className="text-sm font-medium text-orange-600">{new Date(asset.nextMaintenanceAt).toLocaleDateString()}</p>
                </div>
              )}
              {asset.warrantyExpiry && (
                <div>
                  <label className="text-xs text-gray-500">Warranty Expiry</label>
                  <p className="text-sm font-medium text-gray-900">{new Date(asset.warrantyExpiry).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Maintenance Modal */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Log Maintenance</h3>
            <form onSubmit={handleMaintenanceSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Maintenance Type *</label>
                  <input
                    type="text"
                    value={maintenanceData.maintenanceType}
                    onChange={(e) => setMaintenanceData({ ...maintenanceData, maintenanceType: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., Oil Change, Tire Replacement"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                  <textarea
                    value={maintenanceData.description}
                    onChange={(e) => setMaintenanceData({ ...maintenanceData, description: e.target.value })}
                    required
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Details of maintenance performed..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Performed By</label>
                    <input
                      type="text"
                      value={maintenanceData.performedBy}
                      onChange={(e) => setMaintenanceData({ ...maintenanceData, performedBy: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={maintenanceData.performedAt}
                      onChange={(e) => setMaintenanceData({ ...maintenanceData, performedAt: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cost (₵)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={maintenanceData.cost}
                      onChange={(e) => setMaintenanceData({ ...maintenanceData, cost: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Next Due Date</label>
                    <input
                      type="date"
                      value={maintenanceData.nextDueDate}
                      onChange={(e) => setMaintenanceData({ ...maintenanceData, nextDueDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={maintenanceData.notes}
                    onChange={(e) => setMaintenanceData({ ...maintenanceData, notes: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Additional notes..."
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                >
                  {submitting ? 'Recording...' : 'Record Maintenance'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowMaintenanceModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function AssetDetailPage() {
  return (
    <ProtectedRoute>
      <AssetDetailContent />
    </ProtectedRoute>
  );
}

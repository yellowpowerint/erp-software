'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { TrendingUp, TrendingDown, ArrowLeft, Package, Wrench, Briefcase } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

interface InventoryReport {
  summary: {
    totalItems: number;
    lowStock: number;
    outOfStock: number;
    totalValue: number;
  };
  itemsByCategory: Array<{ category: string; count: number }>;
}

interface AssetReport {
  summary: {
    totalAssets: number;
    totalValue: number;
    active: number;
    maintenance: number;
    retired: number;
  };
  assetsByStatus: Array<{ status: string; count: number }>;
  assetsByCategory: Array<{ category: string; count: number }>;
}

interface ProjectReport {
  summary: {
    totalProjects: number;
    totalBudget: number;
    onTime: number;
    delayed: number;
  };
  projectsByStatus: Array<{ status: string; count: number }>;
}

function OperationalReportsContent() {
  const [inventoryData, setInventoryData] = useState<InventoryReport | null>(null);
  const [assetData, setAssetData] = useState<AssetReport | null>(null);
  const [projectData, setProjectData] = useState<ProjectReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const [inventory, assets, projects] = await Promise.all([
        api.get('/reports/operational/inventory'),
        api.get('/reports/operational/assets'),
        api.get('/reports/operational/projects'),
      ]);
      setInventoryData(inventory.data);
      setAssetData(assets.data);
      setProjectData(projects.data);
    } catch (error) {
      console.error('Failed to fetch operational reports:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link href="/reports" className="inline-flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Reports</span>
        </Link>
        <div className="flex items-center space-x-3">
          <TrendingUp className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Operational Reports</h1>
            <p className="text-gray-600">Inventory, assets, and projects analysis</p>
          </div>
        </div>
      </div>

      {inventoryData && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <Package className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Inventory Report</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="text-sm text-blue-700 font-medium mb-1">Total Items</div>
              <div className="text-2xl font-bold text-blue-600">{inventoryData.summary.totalItems}</div>
            </div>

            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <div className="text-sm text-orange-700 font-medium mb-1">Low Stock</div>
              <div className="text-2xl font-bold text-orange-600">{inventoryData.summary.lowStock}</div>
            </div>

            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="text-sm text-red-700 font-medium mb-1">Out of Stock</div>
              <div className="text-2xl font-bold text-red-600">{inventoryData.summary.outOfStock}</div>
            </div>

            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="text-sm text-green-700 font-medium mb-1">Total Value</div>
              <div className="text-xl font-bold text-green-600">
                GHS {inventoryData.summary.totalValue.toLocaleString()}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Items by Category</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {inventoryData.itemsByCategory.map((item, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xl font-bold text-indigo-600">{item.count}</div>
                  <div className="text-xs text-gray-600">{item.category}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {assetData && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <Wrench className="w-6 h-6 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">Asset Report</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="text-sm text-gray-700 font-medium mb-1">Total Assets</div>
              <div className="text-2xl font-bold text-gray-900">{assetData.summary.totalAssets}</div>
            </div>

            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="text-sm text-green-700 font-medium mb-1">Active</div>
              <div className="text-2xl font-bold text-green-600">{assetData.summary.active}</div>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <div className="text-sm text-yellow-700 font-medium mb-1">Maintenance</div>
              <div className="text-2xl font-bold text-yellow-600">{assetData.summary.maintenance}</div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-300">
              <div className="text-sm text-gray-700 font-medium mb-1">Retired</div>
              <div className="text-2xl font-bold text-gray-600">{assetData.summary.retired}</div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="text-sm text-blue-700 font-medium mb-1">Total Value</div>
              <div className="text-xl font-bold text-blue-600">
                GHS {assetData.summary.totalValue.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Assets by Status</h3>
              <div className="space-y-2">
                {assetData.assetsByStatus.map((item, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <span className="text-sm text-gray-700">{item.status}</span>
                    <span className="text-sm font-bold text-gray-900">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Assets by Category</h3>
              <div className="space-y-2">
                {assetData.assetsByCategory.map((item, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <span className="text-sm text-gray-700">{item.category}</span>
                    <span className="text-sm font-bold text-gray-900">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {projectData && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Briefcase className="w-6 h-6 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">Project Report</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="text-sm text-purple-700 font-medium mb-1">Total Projects</div>
              <div className="text-2xl font-bold text-purple-600">{projectData.summary.totalProjects}</div>
            </div>

            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="text-sm text-green-700 font-medium mb-1 flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" />
                On Time
              </div>
              <div className="text-2xl font-bold text-green-600">{projectData.summary.onTime}</div>
            </div>

            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="text-sm text-red-700 font-medium mb-1 flex items-center">
                <TrendingDown className="w-3 h-3 mr-1" />
                Delayed
              </div>
              <div className="text-2xl font-bold text-red-600">{projectData.summary.delayed}</div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="text-sm text-blue-700 font-medium mb-1">Total Budget</div>
              <div className="text-2xl font-bold text-blue-600">{projectData.summary.totalBudget}</div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Projects by Status</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {projectData.projectsByStatus.map((item, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xl font-bold text-indigo-600">{item.count}</div>
                  <div className="text-xs text-gray-600">{item.status}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function OperationalReportsPage() {
  return (
    <ProtectedRoute>
      <OperationalReportsContent />
    </ProtectedRoute>
  );
}

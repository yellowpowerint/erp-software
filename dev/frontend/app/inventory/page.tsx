'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Package, AlertTriangle, TrendingUp, Warehouse, Plus } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

interface InventoryStats {
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalQuantity: number;
  stockValue: number;
}

interface LowStockItem {
  id: string;
  itemCode: string;
  name: string;
  currentQuantity: number;
  reorderLevel: number;
  unit: string;
  warehouse: {
    name: string;
  };
}

function InventoryContent() {
  const { user } = useAuth();
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, alertsRes] = await Promise.all([
        api.get('/inventory/stats'),
        api.get('/inventory/alerts/low-stock'),
      ]);
      setStats(statsRes.data);
      setLowStockItems(alertsRes.data);
    } catch (error) {
      console.error('Failed to fetch inventory data:', error);
    } finally {
      setLoading(false);
    }
  };

  const canManage = user && ['SUPER_ADMIN', 'WAREHOUSE_MANAGER'].includes(user.role);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
            <p className="text-gray-600 mt-1">Manage stock items, warehouses, and inventory movements</p>
          </div>
          <div className="flex space-x-3">
            <Link
              href="/inventory/warehouses"
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Warehouse className="w-5 h-5" />
              <span>Warehouses</span>
            </Link>
            {canManage && (
              <Link
                href="/inventory/items/new"
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Add Stock Item</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading inventory...</p>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-indigo-500 p-3 rounded-lg">
                  <Package className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Total Items</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.totalItems || 0}</p>
                <p className="text-xs text-gray-500 mt-2">Across all warehouses</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-orange-500 p-3 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Low Stock Alerts</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.lowStockItems || 0}</p>
                <p className="text-xs text-gray-500 mt-2">Items need reordering</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-red-500 p-3 rounded-lg">
                  <Package className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Out of Stock</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.outOfStockItems || 0}</p>
                <p className="text-xs text-gray-500 mt-2">Items with zero quantity</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-green-500 p-3 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Stock Value</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">₵{stats?.stockValue.toLocaleString() || 0}</p>
                <p className="text-xs text-gray-500 mt-2">Total inventory value</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Link
              href="/inventory/items"
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-all"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-indigo-100 p-3 rounded-lg">
                  <Package className="w-8 h-8 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Stock Items</h3>
                  <p className="text-sm text-gray-600">View all inventory items</p>
                </div>
              </div>
            </Link>

            <Link
              href="/inventory/movements"
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-all"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-green-100 p-3 rounded-lg">
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Stock Movements</h3>
                  <p className="text-sm text-gray-600">View movement history</p>
                </div>
              </div>
            </Link>

            <Link
              href="/inventory/warehouses"
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-all"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Warehouse className="w-8 h-8 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Warehouses</h3>
                  <p className="text-sm text-gray-600">Manage warehouse locations</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Low Stock Alerts */}
          {lowStockItems.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  <h2 className="text-lg font-semibold text-gray-900">Low Stock Alerts</h2>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Code</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Qty</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reorder Level</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {lowStockItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.itemCode}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{item.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.warehouse.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            item.currentQuantity === 0 ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                          }`}>
                            {item.currentQuantity} {item.unit}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.reorderLevel} {item.unit}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Link
                            href={`/inventory/items/${item.id}`}
                            className="text-indigo-600 hover:text-indigo-700 font-medium"
                          >
                            View Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}

export default function InventoryPage() {
  return (
    <ProtectedRoute>
      <InventoryContent />
    </ProtectedRoute>
  );
}

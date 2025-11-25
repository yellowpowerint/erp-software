'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { BarChart3, TrendingUp, Package, AlertTriangle, Download, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

interface StockValuation {
  totalValue: number;
  totalItems: number;
  totalQuantity: number;
  byCategory: Array<{
    category: string;
    itemCount: number;
    totalQuantity: number;
    totalValue: number;
  }>;
  byWarehouse: Array<{
    warehouse: string;
    itemCount: number;
    totalValue: number;
  }>;
}

interface ReorderSuggestion {
  itemCode: string;
  name: string;
  currentQuantity: number;
  reorderLevel: number;
  warehouse: string;
  suggestedOrderQuantity: number;
  estimatedCost: number;
  supplier: string;
  priority: string;
}

function InventoryReportsContent() {
  const [valuation, setValuation] = useState<StockValuation | null>(null);
  const [reorderSuggestions, setReorderSuggestions] = useState<ReorderSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [valuationRes, reorderRes] = await Promise.all([
        api.get('/inventory/reports/valuation'),
        api.get('/inventory/reports/reorder-suggestions'),
      ]);

      setValuation(valuationRes.data);
      setReorderSuggestions(reorderRes.data);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading reports...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventory Reports & Analytics</h1>
            <p className="text-gray-600 mt-1">Comprehensive inventory insights and recommendations</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={fetchReports}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Refresh</span>
            </button>
            <Link
              href="/inventory/reports/analytics"
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <BarChart3 className="w-5 h-5" />
              <span>View Analytics</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {valuation && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Stock Value</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">₵{valuation.totalValue.toFixed(0)}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{valuation.totalItems}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Quantity</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{valuation.totalQuantity}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Reorder Needed</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{reorderSuggestions.length}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Valuation by Category */}
        {valuation && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Stock Value by Category</h2>
            <div className="space-y-3">
              {valuation.byCategory.map((cat) => (
                <div key={cat.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 capitalize">{cat.category.replace('_', ' ')}</p>
                    <p className="text-sm text-gray-600">{cat.itemCount} items • {cat.totalQuantity} units</p>
                  </div>
                  <p className="text-lg font-semibold text-indigo-600">₵{cat.totalValue.toFixed(0)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Valuation by Warehouse */}
        {valuation && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Stock Value by Warehouse</h2>
            <div className="space-y-3">
              {valuation.byWarehouse.map((wh) => (
                <div key={wh.warehouse} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{wh.warehouse}</p>
                    <p className="text-sm text-gray-600">{wh.itemCount} items</p>
                  </div>
                  <p className="text-lg font-semibold text-indigo-600">₵{wh.totalValue.toFixed(0)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Reorder Suggestions */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Reorder Recommendations</h2>
            <p className="text-sm text-gray-600 mt-1">Items that need to be reordered based on current levels</p>
          </div>
          <Link
            href="/inventory/reports/expiry"
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            View Expiring Items →
          </Link>
        </div>
        {reorderSuggestions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p>No reorder recommendations at this time</p>
            <p className="text-sm mt-1">All items are well stocked!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reorder Level</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Warehouse</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Suggested Qty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Est. Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reorderSuggestions.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        item.priority === 'URGENT' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {item.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      <div className="text-xs text-gray-500">{item.itemCode}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-semibold ${
                        item.currentQuantity === 0 ? 'text-red-600' : 'text-orange-600'
                      }`}>
                        {item.currentQuantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {item.reorderLevel}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {item.warehouse}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-green-600">
                        {item.suggestedOrderQuantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₵{item.estimatedCost.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {item.supplier || 'Not specified'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/inventory/reports/analytics"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <BarChart3 className="w-8 h-8 text-indigo-600 mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Usage Analytics</h3>
          <p className="text-sm text-gray-600">View trends, top movers, and usage patterns over time</p>
        </Link>

        <Link
          href="/inventory/reports/expiry"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <AlertTriangle className="w-8 h-8 text-orange-600 mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Expiry Tracking</h3>
          <p className="text-sm text-gray-600">Monitor items expiring soon and expired stock</p>
        </Link>

        <Link
          href="/inventory/movements"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <TrendingUp className="w-8 h-8 text-green-600 mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Movement History</h3>
          <p className="text-sm text-gray-600">Complete log of all stock in/out movements</p>
        </Link>
      </div>
    </DashboardLayout>
  );
}

export default function InventoryReportsPage() {
  return (
    <ProtectedRoute>
      <InventoryReportsContent />
    </ProtectedRoute>
  );
}

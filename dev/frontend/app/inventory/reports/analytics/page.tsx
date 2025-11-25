'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { BarChart3, TrendingUp, TrendingDown, ArrowLeft, Package } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

interface UsagePattern {
  period: string;
  totalItems: number;
  topMovers: Array<{
    itemCode: string;
    name: string;
    category: string;
    totalUsed: number;
    usageCount: number;
    averageUsage: number;
    currentQuantity: number;
    daysUntilReorder: number;
  }>;
  needsReorder: any[];
}

interface Trend {
  date: string;
  stockIn: number;
  stockOut: number;
  valueIn: number;
  valueOut: number;
  movements: number;
}

function InventoryAnalyticsContent() {
  const [usagePatterns, setUsagePatterns] = useState<UsagePattern | null>(null);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchAnalytics();
  }, [days]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [usageRes, trendsRes] = await Promise.all([
        api.get(`/inventory/reports/usage-patterns?days=${days}`),
        api.get('/inventory/reports/trends'),
      ]);

      setUsagePatterns(usageRes.data);
      setTrends(trendsRes.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading analytics...</p>
        </div>
      </DashboardLayout>
    );
  }

  // Calculate totals for trends
  const totalStockIn = trends.reduce((sum, t) => sum + t.stockIn, 0);
  const totalStockOut = trends.reduce((sum, t) => sum + t.stockOut, 0);
  const totalValueIn = trends.reduce((sum, t) => sum + t.valueIn, 0);
  const totalValueOut = trends.reduce((sum, t) => sum + t.valueOut, 0);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link
          href="/inventory/reports"
          className="inline-flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Reports</span>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventory Analytics</h1>
            <p className="text-gray-600 mt-1">Usage patterns, trends, and predictive insights</p>
          </div>
          <div className="flex items-center space-x-3">
            <label className="text-sm text-gray-600">Analysis Period:</label>
            <select
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="7">Last 7 days</option>
              <option value="14">Last 14 days</option>
              <option value="30">Last 30 days</option>
              <option value="60">Last 60 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Trend Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Stock In</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{totalStockIn}</p>
              <p className="text-xs text-gray-500 mt-1">₵{totalValueIn.toFixed(0)}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Stock Out</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{totalStockOut}</p>
              <p className="text-xs text-gray-500 mt-1">₵{totalValueOut.toFixed(0)}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Net Movement</p>
              <p className={`text-2xl font-bold mt-1 ${totalStockIn - totalStockOut >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalStockIn - totalStockOut >= 0 ? '+' : ''}{totalStockIn - totalStockOut}
              </p>
              <p className="text-xs text-gray-500 mt-1">Last {days} days</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Items</p>
              <p className="text-2xl font-bold text-indigo-600 mt-1">{usagePatterns?.totalItems || 0}</p>
              <p className="text-xs text-gray-500 mt-1">With movement</p>
            </div>
            <div className="bg-indigo-100 p-3 rounded-lg">
              <Package className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Top Movers */}
      {usagePatterns && usagePatterns.topMovers.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Top 10 Most Used Items</h2>
            <p className="text-sm text-gray-600 mt-1">Items with highest usage in the last {days} days</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Used</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usage Count</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg. Daily Usage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days Until Reorder</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usagePatterns.topMovers.map((item, idx) => (
                  <tr key={item.itemCode} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-lg font-bold ${
                        idx === 0 ? 'text-yellow-600' :
                        idx === 1 ? 'text-gray-500' :
                        idx === 2 ? 'text-orange-600' :
                        'text-gray-400'
                      }`}>
                        #{idx + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      <div className="text-xs text-gray-500">{item.itemCode}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">
                      {item.category.replace('_', ' ').toLowerCase()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-red-600">{item.totalUsed}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {item.usageCount} times
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.averageUsage.toFixed(2)} / day
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-semibold ${
                        item.currentQuantity <= item.averageUsage * 7 ? 'text-orange-600' : 'text-green-600'
                      }`}>
                        {item.currentQuantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-semibold ${
                        item.daysUntilReorder <= 7 ? 'text-red-600' :
                        item.daysUntilReorder <= 14 ? 'text-orange-600' :
                        'text-green-600'
                      }`}>
                        {item.daysUntilReorder > 0 ? `${item.daysUntilReorder} days` : 'Reorder now!'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Movement Trends Chart (Simple Visual) */}
      {trends.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Daily Movement Trends</h2>
          <div className="space-y-2">
            {trends.slice(-14).map((trend, idx) => {
              const maxMovement = Math.max(...trends.map(t => Math.max(t.stockIn, t.stockOut)));
              const inWidth = (trend.stockIn / maxMovement) * 100;
              const outWidth = (trend.stockOut / maxMovement) * 100;

              return (
                <div key={idx} className="flex items-center space-x-4">
                  <div className="w-24 text-xs text-gray-600">{new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="w-16 text-xs text-gray-500">In:</div>
                      <div className="flex-1 bg-gray-100 rounded-full h-5 relative">
                        <div 
                          className="bg-green-500 h-5 rounded-full flex items-center justify-end px-2"
                          style={{ width: `${inWidth}%` }}
                        >
                          {trend.stockIn > 0 && (
                            <span className="text-xs text-white font-semibold">{trend.stockIn}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 text-xs text-gray-500">Out:</div>
                      <div className="flex-1 bg-gray-100 rounded-full h-5 relative">
                        <div 
                          className="bg-red-500 h-5 rounded-full flex items-center justify-end px-2"
                          style={{ width: `${outWidth}%` }}
                        >
                          {trend.stockOut > 0 && (
                            <span className="text-xs text-white font-semibold">{trend.stockOut}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between text-sm text-gray-600">
            <div>
              <span className="font-semibold text-green-600">Total In:</span> {totalStockIn} units (₵{totalValueIn.toFixed(0)})
            </div>
            <div>
              <span className="font-semibold text-red-600">Total Out:</span> {totalStockOut} units (₵{totalValueOut.toFixed(0)})
            </div>
          </div>
        </div>
      )}

      {/* Predictive Insights */}
      {usagePatterns && usagePatterns.needsReorder.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-orange-900 mb-3 flex items-center space-x-2">
            <TrendingDown className="w-5 h-5" />
            <span>Predictive Reorder Alerts</span>
          </h2>
          <p className="text-sm text-orange-800 mb-4">
            Based on usage patterns, these {usagePatterns.needsReorder.length} items will reach reorder level within 7 days:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {usagePatterns.needsReorder.map((item: any, idx: number) => (
              <div key={idx} className="bg-white rounded-lg p-4 border border-orange-300">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{item.itemCode}</p>
                  </div>
                  <span className="text-xs font-semibold text-orange-600">
                    {item.daysUntilReorder} days
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-gray-600">Current: <span className="font-semibold">{item.currentQuantity}</span></span>
                  <span className="text-gray-600">Avg. usage: <span className="font-semibold">{item.averageUsage.toFixed(1)}/day</span></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {trends.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Movement Data</h3>
          <p className="text-gray-600">
            Start recording stock movements to see analytics and trends here.
          </p>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function InventoryAnalyticsPage() {
  return (
    <ProtectedRoute>
      <InventoryAnalyticsContent />
    </ProtectedRoute>
  );
}

'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { AlertTriangle, Clock, XCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

interface ExpiringItem {
  id: string;
  itemCode: string;
  name: string;
  category: string;
  currentQuantity: number;
  unit: string;
  unitPrice: number;
  expiryDate: string;
  warehouse: {
    name: string;
    code: string;
  };
}

interface ExpiryData {
  expiringItems: ExpiringItem[];
  expiredItems: ExpiringItem[];
  counts: {
    expiringSoon: number;
    expired: number;
  };
  values: {
    expiringValue: number;
    expiredValue: number;
  };
}

function ExpiryTrackingContent() {
  const [data, setData] = useState<ExpiryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [daysAhead, setDaysAhead] = useState(30);

  useEffect(() => {
    fetchExpiryData();
  }, [daysAhead]);

  const fetchExpiryData = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/inventory/reports/expiring?days=${daysAhead}`);
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch expiry data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const days = Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getUrgencyColor = (days: number) => {
    if (days <= 7) return 'text-red-600 bg-red-100';
    if (days <= 14) return 'text-orange-600 bg-orange-100';
    return 'text-yellow-600 bg-yellow-100';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading expiry data...</p>
        </div>
      </DashboardLayout>
    );
  }

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
            <h1 className="text-2xl font-bold text-gray-900">Expiry Tracking</h1>
            <p className="text-gray-600 mt-1">Monitor items approaching expiry dates</p>
          </div>
          <div className="flex items-center space-x-3">
            <label className="text-sm text-gray-600">Show items expiring in:</label>
            <select
              value={daysAhead}
              onChange={(e) => setDaysAhead(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="7">7 days</option>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
              <option value="60">60 days</option>
              <option value="90">90 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Expiring Soon</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{data.counts.expiringSoon}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Already Expired</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{data.counts.expired}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Expiring Value</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">₵{data.values.expiringValue.toFixed(0)}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Expired Value</p>
                <p className="text-2xl font-bold text-red-600 mt-1">₵{data.values.expiredValue.toFixed(0)}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expired Items Alert */}
      {data && data.expiredItems.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <div className="flex items-start space-x-3">
            <XCircle className="w-6 h-6 text-red-600 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">
                {data.expiredItems.length} Items Have Expired
              </h3>
              <p className="text-sm text-red-800">
                These items are past their expiry date and should be removed from inventory immediately. 
                Total value at risk: ₵{data.values.expiredValue.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Expiring Items Table */}
      {data && data.expiringItems.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Items Expiring Soon</h2>
            <p className="text-sm text-gray-600 mt-1">Items expiring within {daysAhead} days</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Urgency</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Warehouse</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days Left</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.expiringItems.map((item) => {
                  const daysLeft = getDaysUntilExpiry(item.expiryDate);
                  const urgencyColor = getUrgencyColor(daysLeft);
                  
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${urgencyColor}`}>
                          {daysLeft <= 7 ? 'URGENT' : daysLeft <= 14 ? 'HIGH' : 'MEDIUM'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Link href={`/inventory/items/${item.id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-900">
                          {item.name}
                        </Link>
                        <div className="text-xs text-gray-500">{item.itemCode}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">
                        {item.category.replace('_', ' ').toLowerCase()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {item.warehouse.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.currentQuantity} {item.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₵{(item.currentQuantity * (item.unitPrice || 0)).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(item.expiryDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-semibold ${
                          daysLeft <= 7 ? 'text-red-600' : 
                          daysLeft <= 14 ? 'text-orange-600' : 
                          'text-yellow-600'
                        }`}>
                          {daysLeft} days
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expired Items Table */}
      {data && data.expiredItems.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-red-50">
            <h2 className="text-lg font-semibold text-red-900">Expired Items - Action Required</h2>
            <p className="text-sm text-red-800 mt-1">These items have passed their expiry date</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Warehouse</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value Loss</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expired On</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days Overdue</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.expiredItems.map((item) => {
                  const daysOverdue = Math.abs(getDaysUntilExpiry(item.expiryDate));
                  
                  return (
                    <tr key={item.id} className="hover:bg-red-50">
                      <td className="px-6 py-4">
                        <Link href={`/inventory/items/${item.id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-900">
                          {item.name}
                        </Link>
                        <div className="text-xs text-gray-500">{item.itemCode}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">
                        {item.category.replace('_', ' ').toLowerCase()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {item.warehouse.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">
                        {item.currentQuantity} {item.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">
                        ₵{(item.currentQuantity * (item.unitPrice || 0)).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(item.expiryDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-red-600">
                          {daysOverdue} days ago
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {data && data.expiringItems.length === 0 && data.expiredItems.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Clock className="w-16 h-16 text-green-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Expiry Concerns</h3>
          <p className="text-gray-600">
            No items are expiring within the next {daysAhead} days. All inventory is within safe expiry windows!
          </p>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function ExpiryTrackingPage() {
  return (
    <ProtectedRoute>
      <ExpiryTrackingContent />
    </ProtectedRoute>
  );
}

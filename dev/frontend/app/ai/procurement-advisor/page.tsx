'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Brain, ArrowLeft, ShoppingCart, AlertCircle, DollarSign, TrendingUp, Star, Package } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

interface ProcurementAdvice {
  urgentPurchases: Array<{
    itemCode: string;
    name: string;
    category: string;
    currentQuantity: number;
    reorderLevel: number;
    urgency: string;
    estimatedCost: number;
    warehouse: string;
  }>;
  supplierRecommendations: Array<{
    supplierCode: string;
    name: string;
    rating: number;
    totalPayments: number;
    totalSpent: number;
    paymentTerms?: string;
    category?: string;
  }>;
  costSavingOpportunities: string[];
  budgetAlerts: string[];
  seasonalRecommendations: string[];
  bulkPurchaseOpportunities: string[];
}

function ProcurementAdvisorContent() {
  const [advice, setAdvice] = useState<ProcurementAdvice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdvice();
  }, []);

  const fetchAdvice = async () => {
    try {
      const response = await api.get('/ai/procurement-advisor');
      setAdvice(response.data);
    } catch (error) {
      console.error('Failed to fetch procurement advice:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Generating procurement recommendations...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link href="/ai" className="inline-flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to AI Intelligence</span>
        </Link>
        <div>
          <div className="flex items-center space-x-3">
            <Brain className="w-8 h-8 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-900">AI Procurement Advisor</h1>
          </div>
          <p className="text-gray-600 mt-1">Smart purchasing recommendations and supplier analysis</p>
        </div>
      </div>

      {advice && (
        <>
          {/* Urgent Purchases */}
          {advice.urgentPurchases.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-red-600" />
                Urgent Purchases Required ({advice.urgentPurchases.length} items)
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reorder Level</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Est. Cost</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Warehouse</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {advice.urgentPurchases.map((item) => (
                      <tr key={item.itemCode} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{item.name}</div>
                            <div className="text-xs text-gray-500">{item.itemCode}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">
                          {item.category.toLowerCase()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-red-600">{item.currentQuantity}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {item.reorderLevel}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          GHS {item.estimatedCost.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {item.warehouse}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Top Suppliers */}
          {advice.supplierRecommendations.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Star className="w-5 h-5 mr-2 text-yellow-600" />
                Recommended Suppliers (Top {Math.min(advice.supplierRecommendations.length, 10)})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {advice.supplierRecommendations.slice(0, 10).map((supplier) => (
                  <div key={supplier.supplierCode} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{supplier.name}</h3>
                        <p className="text-xs text-gray-500">{supplier.supplierCode}</p>
                      </div>
                      {renderStars(supplier.rating)}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Payments:</span>
                        <span className="font-medium text-gray-900">{supplier.totalPayments}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Spent:</span>
                        <span className="font-medium text-gray-900">GHS {supplier.totalSpent.toLocaleString()}</span>
                      </div>
                      {supplier.paymentTerms && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Payment Terms:</span>
                          <span className="font-medium text-gray-900">{supplier.paymentTerms}</span>
                        </div>
                      )}
                      {supplier.category && (
                        <div className="mt-2">
                          <span className="px-2 py-1 text-xs font-medium rounded bg-indigo-100 text-indigo-800">
                            {supplier.category}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Budget Alerts */}
          {advice.budgetAlerts.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-yellow-900 mb-4 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                Budget Alerts
              </h3>
              <div className="space-y-2">
                {advice.budgetAlerts.map((alert, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-white rounded-lg">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700">{alert}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cost Savings & Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Cost Saving Opportunities */}
            {advice.costSavingOpportunities.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                  Cost-Saving Opportunities
                </h3>
                <div className="space-y-2">
                  {advice.costSavingOpportunities.map((opportunity, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-700">{opportunity}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bulk Purchase Opportunities */}
            {advice.bulkPurchaseOpportunities.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Package className="w-5 h-5 mr-2 text-blue-600" />
                  Bulk Purchase Opportunities
                </h3>
                <div className="space-y-2">
                  {advice.bulkPurchaseOpportunities.map((opportunity, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                      <ShoppingCart className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-700">{opportunity}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Seasonal Recommendations */}
          {advice.seasonalRecommendations.length > 0 && (
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg shadow p-6 text-white">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Brain className="w-5 h-5 mr-2" />
                Seasonal Recommendations
              </h3>
              <div className="space-y-2">
                {advice.seasonalRecommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-white bg-opacity-20 rounded-lg">
                    <TrendingUp className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">{recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!advice && !loading && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Recommendations Available</h3>
          <p className="text-gray-600">Procurement recommendations will appear as data becomes available.</p>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function ProcurementAdvisorPage() {
  return (
    <ProtectedRoute>
      <ProcurementAdvisorContent />
    </ProtectedRoute>
  );
}

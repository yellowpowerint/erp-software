'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Package, ArrowLeft, Edit, TrendingUp, TrendingDown, Plus, Minus } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

interface StockItem {
  id: string;
  itemCode: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  unitPrice: number;
  currentQuantity: number;
  reorderLevel: number;
  maxStockLevel: number;
  barcode: string;
  supplier: string;
  notes: string;
  warehouse: {
    id: string;
    name: string;
    location: string;
  };
  movements: Array<{
    id: string;
    movementType: string;
    quantity: number;
    previousQty: number;
    newQty: number;
    reference: string;
    notes: string;
    createdAt: string;
  }>;
}

function StockItemDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [item, setItem] = useState<StockItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<'IN' | 'OUT'>('IN');
  const [adjustmentData, setAdjustmentData] = useState({
    quantity: '',
    reference: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchItem();
  }, [params.id]);

  const fetchItem = async () => {
    try {
      const response = await api.get(`/inventory/items/${params.id}`);
      setItem(response.data);
    } catch (error) {
      console.error('Failed to fetch item:', error);
      alert('Item not found');
      router.push('/inventory/items');
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustmentData.quantity || parseInt(adjustmentData.quantity) <= 0) {
      alert('Please enter a valid quantity');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/inventory/items/${params.id}/movements`, {
        movementType: adjustmentType === 'IN' ? 'STOCK_IN' : 'STOCK_OUT',
        quantity: parseInt(adjustmentData.quantity),
        reference: adjustmentData.reference,
        notes: adjustmentData.notes,
      });

      alert('Stock adjustment recorded successfully!');
      setShowAdjustModal(false);
      setAdjustmentData({ quantity: '', reference: '', notes: '' });
      fetchItem();
    } catch (error: any) {
      console.error('Failed to adjust stock:', error);
      alert(error.response?.data?.message || 'Failed to adjust stock');
    } finally {
      setSubmitting(false);
    }
  };

  const canManage = user && ['SUPER_ADMIN', 'WAREHOUSE_MANAGER', 'OPERATIONS_MANAGER'].includes(user.role);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading item...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!item) return null;

  const isLowStock = item.currentQuantity <= item.reorderLevel;
  const isOutOfStock = item.currentQuantity === 0;
  const stockValue = item.currentQuantity * (item.unitPrice || 0);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link
          href="/inventory/items"
          className="inline-flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Stock Items</span>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{item.name}</h1>
            <p className="text-gray-600 mt-1">{item.itemCode}</p>
          </div>
          <div className="flex space-x-3">
            {canManage && (
              <>
                <button
                  onClick={() => {
                    setAdjustmentType('IN');
                    setShowAdjustModal(true);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Stock</span>
                </button>
                <button
                  onClick={() => {
                    setAdjustmentType('OUT');
                    setShowAdjustModal(true);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <Minus className="w-5 h-5" />
                  <span>Remove Stock</span>
                </button>
                <Link
                  href={`/inventory/items/${item.id}/edit`}
                  className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Edit className="w-5 h-5" />
                  <span>Edit Item</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stock Status Banner */}
      {(isOutOfStock || isLowStock) && (
        <div className={`mb-6 p-4 rounded-lg ${isOutOfStock ? 'bg-red-100 border border-red-200' : 'bg-orange-100 border border-orange-200'}`}>
          <p className={`font-semibold ${isOutOfStock ? 'text-red-800' : 'text-orange-800'}`}>
            {isOutOfStock ? '⚠️ Out of Stock!' : '⚠️ Low Stock Alert'}
          </p>
          <p className={`text-sm mt-1 ${isOutOfStock ? 'text-red-700' : 'text-orange-700'}`}>
            {isOutOfStock 
              ? 'This item is out of stock. Please reorder immediately.'
              : `Current stock (${item.currentQuantity}) is at or below reorder level (${item.reorderLevel}). Consider reordering.`
            }
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Item Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Item Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Category</label>
                <p className="font-medium text-gray-900 capitalize">{item.category.replace('_', ' ')}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Unit</label>
                <p className="font-medium text-gray-900">{item.unit}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Warehouse</label>
                <p className="font-medium text-gray-900">{item.warehouse.name}</p>
                <p className="text-xs text-gray-500">{item.warehouse.location}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Supplier</label>
                <p className="font-medium text-gray-900">{item.supplier || 'Not specified'}</p>
              </div>
              {item.barcode && (
                <div>
                  <label className="text-sm text-gray-500">Barcode</label>
                  <p className="font-medium text-gray-900">{item.barcode}</p>
                </div>
              )}
            </div>
            {item.description && (
              <div className="mt-4">
                <label className="text-sm text-gray-500">Description</label>
                <p className="text-gray-900">{item.description}</p>
              </div>
            )}
            {item.notes && (
              <div className="mt-4">
                <label className="text-sm text-gray-500">Notes</label>
                <p className="text-gray-900">{item.notes}</p>
              </div>
            )}
          </div>

          {/* Recent Movements */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Stock Movements</h2>
            {item.movements.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No stock movements recorded yet</p>
            ) : (
              <div className="space-y-3">
                {item.movements.slice(0, 10).map((movement) => (
                  <div key={movement.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {movement.movementType.includes('IN') ? (
                        <TrendingUp className="w-5 h-5 text-green-500" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900 capitalize">
                          {movement.movementType.replace('_', ' ')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {movement.reference && `Ref: ${movement.reference} • `}
                          {new Date(movement.createdAt).toLocaleString()}
                        </p>
                        {movement.notes && (
                          <p className="text-xs text-gray-600 mt-1">{movement.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {movement.movementType.includes('IN') ? '+' : '-'}{movement.quantity} {item.unit}
                      </p>
                      <p className="text-xs text-gray-500">
                        {movement.previousQty} → {movement.newQty}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stock Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Stock Summary</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500">Current Quantity</label>
                <p className={`text-3xl font-bold mt-1 ${
                  isOutOfStock ? 'text-red-600' :
                  isLowStock ? 'text-orange-600' :
                  'text-green-600'
                }`}>
                  {item.currentQuantity}
                </p>
                <p className="text-sm text-gray-600">{item.unit}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Unit Price</label>
                <p className="text-lg font-semibold text-gray-900 mt-1">
                  ₵{item.unitPrice?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Total Value</label>
                <p className="text-lg font-semibold text-gray-900 mt-1">
                  ₵{stockValue.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Stock Levels */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Stock Levels</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Reorder Level</span>
                <span className="text-sm font-medium text-gray-900">{item.reorderLevel} {item.unit}</span>
              </div>
              {item.maxStockLevel && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Max Stock Level</span>
                  <span className="text-sm font-medium text-gray-900">{item.maxStockLevel} {item.unit}</span>
                </div>
              )}
              <div className="pt-3 border-t border-gray-200">
                <div className="flex justify-between mb-2">
                  <span className="text-xs text-gray-500">Stock Status</span>
                  <span className="text-xs text-gray-500">
                    {Math.round((item.currentQuantity / (item.maxStockLevel || item.reorderLevel * 2)) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      isOutOfStock ? 'bg-red-500' :
                      isLowStock ? 'bg-orange-500' :
                      'bg-green-500'
                    }`}
                    style={{ 
                      width: `${Math.min((item.currentQuantity / (item.maxStockLevel || item.reorderLevel * 2)) * 100, 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Adjustment Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {adjustmentType === 'IN' ? 'Add Stock' : 'Remove Stock'}
            </h3>
            <form onSubmit={handleAdjustment}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity ({item.unit}) *
                  </label>
                  <input
                    type="number"
                    value={adjustmentData.quantity}
                    onChange={(e) => setAdjustmentData({ ...adjustmentData, quantity: e.target.value })}
                    required
                    min="1"
                    max={adjustmentType === 'OUT' ? item.currentQuantity : undefined}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter quantity"
                  />
                  {adjustmentType === 'OUT' && (
                    <p className="text-xs text-gray-500 mt-1">Available: {item.currentQuantity} {item.unit}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reference Number
                  </label>
                  <input
                    type="text"
                    value={adjustmentData.reference}
                    onChange={(e) => setAdjustmentData({ ...adjustmentData, reference: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., PO-001, WO-123"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={adjustmentData.notes}
                    onChange={(e) => setAdjustmentData({ ...adjustmentData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Reason for adjustment..."
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
                    adjustmentType === 'IN' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-orange-600 hover:bg-orange-700'
                  } disabled:bg-gray-400`}
                >
                  {submitting ? 'Processing...' : adjustmentType === 'IN' ? 'Add Stock' : 'Remove Stock'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAdjustModal(false);
                    setAdjustmentData({ quantity: '', reference: '', notes: '' });
                  }}
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

export default function StockItemDetailPage() {
  return (
    <ProtectedRoute>
      <StockItemDetailContent />
    </ProtectedRoute>
  );
}

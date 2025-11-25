'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Package, Plus, Search, Filter, Eye, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

interface StockItem {
  id: string;
  itemCode: string;
  name: string;
  category: string;
  unit: string;
  currentQuantity: number;
  reorderLevel: number;
  unitPrice: number;
  warehouse: {
    name: string;
  };
}

interface Warehouse {
  id: string;
  name: string;
}

function StockItemsContent() {
  const { user } = useAuth();
  const [items, setItems] = useState<StockItem[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [warehouseFilter, setWarehouseFilter] = useState('ALL');
  const [lowStockFilter, setLowStockFilter] = useState(false);

  useEffect(() => {
    fetchData();
  }, [warehouseFilter, categoryFilter, lowStockFilter]);

  const fetchData = async () => {
    try {
      const params: any = {};
      if (warehouseFilter !== 'ALL') params.warehouseId = warehouseFilter;
      if (categoryFilter !== 'ALL') params.category = categoryFilter;
      if (lowStockFilter) params.lowStock = 'true';

      const [itemsRes, warehousesRes] = await Promise.all([
        api.get('/inventory/items', { params }),
        api.get('/warehouses'),
      ]);
      
      setItems(itemsRes.data);
      setWarehouses(warehousesRes.data);
    } catch (error) {
      console.error('Failed to fetch items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, itemCode: string) {
    if (!confirm(`Are you sure you want to delete item ${itemCode}?`)) return;

    try {
      await api.delete(`/inventory/items/${id}`);
      alert('Item deleted successfully');
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete item');
    }
  };

  const canManage = user && ['SUPER_ADMIN', 'WAREHOUSE_MANAGER'].includes(user.role);

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.itemCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = ['CONSUMABLES', 'EQUIPMENT', 'SPARE_PARTS', 'TOOLS', 'FUEL', 'CHEMICALS', 'SAFETY_GEAR', 'OFFICE_SUPPLIES', 'OTHER'];

  return (
    <DashboardLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Stock Items</h1>
            <p className="text-gray-600 mt-1">Manage inventory items across all warehouses</p>
          </div>
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

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="ALL">All Warehouses</option>
            {warehouses.map((wh) => (
              <option key={wh.id} value={wh.id}>{wh.name}</option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="ALL">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat.replace('_', ' ')}</option>
            ))}
          </select>

          <label className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={lowStockFilter}
              onChange={(e) => setLowStockFilter(e.target.checked)}
              className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Low Stock Only</span>
          </label>
        </div>
      </div>

      {/* Items Table */}
      {loading ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading items...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p>No stock items found</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isLowStock = item.currentQuantity <= item.reorderLevel;
                  const isOutOfStock = item.currentQuantity === 0;
                  
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.itemCode}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{item.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">
                        {item.category.replace('_', ' ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.warehouse.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          isOutOfStock ? 'bg-red-100 text-red-800' :
                          isLowStock ? 'bg-orange-100 text-orange-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {item.currentQuantity} {item.unit}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₵{item.unitPrice?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                        <Link
                          href={`/inventory/items/${item.id}`}
                          className="inline-flex items-center text-indigo-600 hover:text-indigo-700"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {canManage && (
                          <>
                            <Link
                              href={`/inventory/items/${item.id}/edit`}
                              className="inline-flex items-center text-blue-600 hover:text-blue-700"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleDelete(item.id, item.itemCode)}
                              className="inline-flex items-center text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function StockItemsPage() {
  return (
    <ProtectedRoute>
      <StockItemsContent />
    </ProtectedRoute>
  );
}

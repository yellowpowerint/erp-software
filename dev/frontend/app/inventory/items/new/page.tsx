'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Package, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

interface Warehouse {
  id: string;
  name: string;
  code: string;
}

function NewStockItemContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [formData, setFormData] = useState({
    itemCode: '',
    name: '',
    description: '',
    category: 'CONSUMABLES',
    unit: 'PIECES',
    unitPrice: '',
    reorderLevel: '10',
    maxStockLevel: '',
    warehouseId: '',
    barcode: '',
    supplier: '',
    notes: '',
  });

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const response = await api.get('/warehouses');
      setWarehouses(response.data);
      if (response.data.length > 0) {
        setFormData(prev => ({ ...prev, warehouseId: response.data[0].id }));
      }
    } catch (error) {
      console.error('Failed to fetch warehouses:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/inventory/items', {
        ...formData,
        unitPrice: formData.unitPrice ? parseFloat(formData.unitPrice) : undefined,
        reorderLevel: parseInt(formData.reorderLevel) || 0,
        maxStockLevel: formData.maxStockLevel ? parseInt(formData.maxStockLevel) : undefined,
      });

      alert('Stock item created successfully!');
      router.push('/inventory/items');
    } catch (error: any) {
      console.error('Failed to create item:', error);
      alert(error.response?.data?.message || 'Failed to create stock item');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const categories = [
    { value: 'CONSUMABLES', label: 'Consumables' },
    { value: 'EQUIPMENT', label: 'Equipment' },
    { value: 'SPARE_PARTS', label: 'Spare Parts' },
    { value: 'TOOLS', label: 'Tools' },
    { value: 'FUEL', label: 'Fuel' },
    { value: 'CHEMICALS', label: 'Chemicals' },
    { value: 'SAFETY_GEAR', label: 'Safety Gear' },
    { value: 'OFFICE_SUPPLIES', label: 'Office Supplies' },
    { value: 'OTHER', label: 'Other' },
  ];

  const units = [
    { value: 'PIECES', label: 'Pieces' },
    { value: 'KILOGRAMS', label: 'Kilograms' },
    { value: 'LITERS', label: 'Liters' },
    { value: 'METERS', label: 'Meters' },
    { value: 'BOXES', label: 'Boxes' },
    { value: 'PALLETS', label: 'Pallets' },
    { value: 'TONS', label: 'Tons' },
    { value: 'GALLONS', label: 'Gallons' },
    { value: 'UNITS', label: 'Units' },
  ];

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
        <h1 className="text-2xl font-bold text-gray-900">Add New Stock Item</h1>
        <p className="text-gray-600 mt-1">Create a new inventory item</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Item Code *
                </label>
                <input
                  type="text"
                  name="itemCode"
                  value={formData.itemCode}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., ITEM-001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Item Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., Hydraulic Oil"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Describe the item..."
              />
            </div>
          </div>

          {/* Classification */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Classification</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit *
                </label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  {units.map((unit) => (
                    <option key={unit.value} value={unit.value}>{unit.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Warehouse *
                </label>
                <select
                  name="warehouseId"
                  value={formData.warehouseId}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>{wh.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Stock Levels */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Levels</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit Price (₵)
                </label>
                <input
                  type="number"
                  name="unitPrice"
                  value={formData.unitPrice}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reorder Level
                </label>
                <input
                  type="number"
                  name="reorderLevel"
                  value={formData.reorderLevel}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Stock Level
                </label>
                <input
                  type="number"
                  name="maxStockLevel"
                  value={formData.maxStockLevel}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Barcode
                </label>
                <input
                  type="text"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Barcode number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supplier
                </label>
                <input
                  type="text"
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Supplier name"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Additional notes..."
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Package className="w-5 h-5" />
                  <span>Create Stock Item</span>
                </>
              )}
            </button>
            <Link
              href="/inventory/items"
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

export default function NewStockItemPage() {
  return (
    <ProtectedRoute>
      <NewStockItemContent />
    </ProtectedRoute>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ArrowLeft, Plus, X, Save } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

interface Project {
  id: string;
  name: string;
  projectCode: string;
}

interface StockItem {
  id: string;
  itemCode: string;
  name: string;
  unit: string;
  unitPrice: number;
}

interface RequisitionItem {
  itemName: string;
  description: string;
  category: string;
  quantity: string;
  unit: string;
  estimatedPrice: string;
  specifications: string;
  preferredVendor: string;
  stockItemId: string;
  urgency: string;
  notes: string;
}

function NewRequisitionContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'CONSUMABLES',
    priority: 'MEDIUM',
    department: '',
    projectId: '',
    siteLocation: '',
    requiredDate: new Date().toISOString().split('T')[0],
    justification: '',
    currency: 'GHS',
  });
  const [items, setItems] = useState<RequisitionItem[]>([]);
  const [showItemForm, setShowItemForm] = useState(false);
  const [currentItem, setCurrentItem] = useState<RequisitionItem>({
    itemName: '',
    description: '',
    category: 'CONSUMABLES',
    quantity: '',
    unit: 'PIECES',
    estimatedPrice: '',
    specifications: '',
    preferredVendor: '',
    stockItemId: '',
    urgency: 'MEDIUM',
    notes: '',
  });

  useEffect(() => {
    fetchProjects();
    fetchStockItems();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data.data || response.data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };

  const fetchStockItems = async () => {
    try {
      const response = await api.get('/inventory/items');
      setStockItems(response.data.data || response.data);
    } catch (error) {
      console.error('Failed to fetch stock items:', error);
    }
  };

  const handleAddItem = () => {
    if (!currentItem.itemName || !currentItem.quantity || !currentItem.estimatedPrice) {
      alert('Please fill in item name, quantity, and estimated price');
      return;
    }

    setItems([...items, { ...currentItem }]);
    setCurrentItem({
      itemName: '',
      description: '',
      category: 'CONSUMABLES',
      quantity: '',
      unit: 'PIECES',
      estimatedPrice: '',
      specifications: '',
      preferredVendor: '',
      stockItemId: '',
      urgency: 'MEDIUM',
      notes: '',
    });
    setShowItemForm(false);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleStockItemSelect = (stockItemId: string) => {
    const stockItem = stockItems.find((item) => item.id === stockItemId);
    if (stockItem) {
      setCurrentItem({
        ...currentItem,
        stockItemId,
        itemName: stockItem.name,
        unit: stockItem.unit,
        estimatedPrice: stockItem.unitPrice?.toString() || '',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent, submitNow: boolean = false) => {
    e.preventDefault();

    if (!formData.title || !formData.department || !formData.siteLocation) {
      alert('Please fill in all required fields');
      return;
    }

    if (items.length === 0) {
      alert('Please add at least one item to the requisition');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/procurement/requisitions', {
        ...formData,
        items,
      });

      if (submitNow) {
        await api.post(`/procurement/requisitions/${response.data.id}/submit`);
        alert('Requisition created and submitted for approval!');
      } else {
        alert('Requisition saved as draft!');
      }

      router.push(`/procurement/requisitions/${response.data.id}`);
    } catch (error: any) {
      console.error('Failed to create requisition:', error);
      alert(error.response?.data?.message || 'Failed to create requisition');
    } finally {
      setLoading(false);
    }
  };

  const totalEstimate = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.estimatedPrice) || 0;
    return sum + qty * price;
  }, 0);

  const requisitionTypes = [
    { value: 'STOCK_REPLENISHMENT', label: 'Stock Replenishment' },
    { value: 'PROJECT_MATERIALS', label: 'Project Materials' },
    { value: 'EQUIPMENT_PURCHASE', label: 'Equipment Purchase' },
    { value: 'MAINTENANCE_PARTS', label: 'Maintenance Parts' },
    { value: 'SAFETY_SUPPLIES', label: 'Safety Supplies' },
    { value: 'CONSUMABLES', label: 'Consumables' },
    { value: 'EMERGENCY', label: 'Emergency' },
    { value: 'CAPITAL_EXPENDITURE', label: 'Capital Expenditure' },
  ];

  const categories = [
    'CONSUMABLES', 'EQUIPMENT', 'SPARE_PARTS', 'TOOLS', 'FUEL',
    'CHEMICALS', 'SAFETY_GEAR', 'OFFICE_SUPPLIES', 'OTHER',
  ];

  const units = [
    'PIECES', 'KILOGRAMS', 'LITERS', 'METERS', 'BOXES',
    'PALLETS', 'TONS', 'GALLONS', 'UNITS',
  ];

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link
          href="/procurement/requisitions"
          className="inline-flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Requisitions</span>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Create New Requisition</h1>
        <p className="text-gray-600 mt-1">Submit a new procurement request</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <form className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., Q1 2024 Safety Equipment"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Describe the purpose of this requisition..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {requisitionTypes.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority *
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department *
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., Operations, Maintenance"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project (Optional)
                  </label>
                  <select
                    value={formData.projectId}
                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">No Project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.projectCode} - {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site Location *
                  </label>
                  <input
                    type="text"
                    value={formData.siteLocation}
                    onChange={(e) => setFormData({ ...formData, siteLocation: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., Tarkwa Mine Site A"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Required Date *
                  </label>
                  <input
                    type="date"
                    value={formData.requiredDate}
                    onChange={(e) => setFormData({ ...formData, requiredDate: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Justification
                  </label>
                  <textarea
                    value={formData.justification}
                    onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Explain why this requisition is needed..."
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Items</h3>
                <button
                  type="button"
                  onClick={() => setShowItemForm(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Item</span>
                </button>
              </div>

              {items.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No items added yet. Click &quot;Add Item&quot; to get started.</p>
              ) : (
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={index} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.itemName}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {item.quantity} {item.unit} × {formData.currency} {parseFloat(item.estimatedPrice).toFixed(2)} = {formData.currency} {(parseFloat(item.quantity) * parseFloat(item.estimatedPrice)).toFixed(2)}
                        </p>
                        {item.description && (
                          <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-600 hover:text-red-700 ml-4"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {showItemForm && (
                <div className="mt-4 p-4 border-2 border-indigo-200 rounded-lg bg-indigo-50">
                  <h4 className="font-semibold text-gray-900 mb-4">Add New Item</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Link to Stock Item (Optional)
                      </label>
                      <select
                        value={currentItem.stockItemId}
                        onChange={(e) => handleStockItemSelect(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        <option value="">Select existing stock item...</option>
                        {stockItems.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.itemCode} - {item.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Item Name *
                      </label>
                      <input
                        type="text"
                        value={currentItem.itemName}
                        onChange={(e) => setCurrentItem({ ...currentItem, itemName: e.target.value })}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <input
                        type="text"
                        value={currentItem.description}
                        onChange={(e) => setCurrentItem({ ...currentItem, description: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category *
                      </label>
                      <select
                        value={currentItem.category}
                        onChange={(e) => setCurrentItem({ ...currentItem, category: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>{cat.replace(/_/g, ' ')}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Urgency
                      </label>
                      <select
                        value={currentItem.urgency}
                        onChange={(e) => setCurrentItem({ ...currentItem, urgency: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="CRITICAL">Critical</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        value={currentItem.quantity}
                        onChange={(e) => setCurrentItem({ ...currentItem, quantity: e.target.value })}
                        required
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Unit *
                      </label>
                      <select
                        value={currentItem.unit}
                        onChange={(e) => setCurrentItem({ ...currentItem, unit: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        {units.map((unit) => (
                          <option key={unit} value={unit}>{unit}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estimated Price ({formData.currency}) *
                      </label>
                      <input
                        type="number"
                        value={currentItem.estimatedPrice}
                        onChange={(e) => setCurrentItem({ ...currentItem, estimatedPrice: e.target.value })}
                        required
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Preferred Vendor
                      </label>
                      <input
                        type="text"
                        value={currentItem.preferredVendor}
                        onChange={(e) => setCurrentItem({ ...currentItem, preferredVendor: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Specifications
                      </label>
                      <textarea
                        value={currentItem.specifications}
                        onChange={(e) => setCurrentItem({ ...currentItem, specifications: e.target.value })}
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-3 mt-4">
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      Add Item
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowItemForm(false)}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={(e) => handleSubmit(e, false)}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 transition-colors"
              >
                {loading ? 'Saving...' : 'Save as Draft'}
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={loading}
                className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors"
              >
                <Save className="w-5 h-5" />
                <span>{loading ? 'Submitting...' : 'Submit for Approval'}</span>
              </button>
            </div>
          </form>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 sticky top-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Summary</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">Total Items</label>
                <p className="text-lg font-semibold text-gray-900">{items.length}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Estimated Total</label>
                <p className="text-2xl font-bold text-indigo-600">
                  {formData.currency} {totalEstimate.toFixed(2)}
                </p>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <label className="text-xs text-gray-500">Status</label>
                <p className="text-sm font-medium text-gray-900">Draft</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function NewRequisitionPage() {
  return (
    <ProtectedRoute>
      <NewRequisitionContent />
    </ProtectedRoute>
  );
}

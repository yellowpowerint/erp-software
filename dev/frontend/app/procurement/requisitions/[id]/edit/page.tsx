'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ArrowLeft, Plus, Save, X } from 'lucide-react';
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

interface RequisitionItemApi {
  id: string;
  itemName: string;
  description?: string;
  category: string;
  quantity: any;
  unit: string;
  estimatedPrice: any;
  totalPrice: any;
  specifications?: string;
  preferredVendor?: string;
  stockItemId?: string | null;
  urgency: string;
  notes?: string;
}

interface RequisitionApi {
  id: string;
  requisitionNo: string;
  title: string;
  description?: string;
  type: string;
  priority: string;
  status: string;
  department: string;
  projectId?: string | null;
  siteLocation: string;
  requiredDate: string;
  justification?: string;
  currency: string;
  items: RequisitionItemApi[];
}

interface RequisitionItemForm {
  id?: string;
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

function EditRequisitionContent() {
  const router = useRouter();
  const params = useParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);

  const [requisition, setRequisition] = useState<RequisitionApi | null>(null);

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

  const [items, setItems] = useState<RequisitionItemApi[]>([]);

  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState<RequisitionItemForm>({
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
    fetchRequisition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requisitionId = String(params.id);

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

  const fetchRequisition = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/procurement/requisitions/${requisitionId}`);
      const data: RequisitionApi = res.data;

      setRequisition(data);
      setItems(data.items || []);
      setFormData({
        title: data.title || '',
        description: data.description || '',
        type: data.type || 'CONSUMABLES',
        priority: data.priority || 'MEDIUM',
        department: data.department || '',
        projectId: data.projectId || '',
        siteLocation: data.siteLocation || '',
        requiredDate: new Date(data.requiredDate).toISOString().split('T')[0],
        justification: data.justification || '',
        currency: data.currency || 'GHS',
      });

      if (data.status !== 'DRAFT') {
        alert('Only draft requisitions can be edited. Redirecting to details.');
        router.push(`/procurement/requisitions/${requisitionId}`);
      }
    } catch (error) {
      console.error('Failed to fetch requisition:', error);
      alert('Failed to load requisition');
      router.push('/procurement/requisitions');
    } finally {
      setLoading(false);
    }
  };

  const totalEstimate = useMemo(() => {
    return items.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0);
  }, [items]);

  const openNewItem = () => {
    setEditingItemId(null);
    setItemForm({
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
    setShowItemModal(true);
  };

  const openEditItem = (item: RequisitionItemApi) => {
    setEditingItemId(item.id);
    setItemForm({
      id: item.id,
      itemName: item.itemName || '',
      description: item.description || '',
      category: item.category || 'CONSUMABLES',
      quantity: String(item.quantity ?? ''),
      unit: item.unit || 'PIECES',
      estimatedPrice: String(item.estimatedPrice ?? ''),
      specifications: item.specifications || '',
      preferredVendor: item.preferredVendor || '',
      stockItemId: item.stockItemId || '',
      urgency: item.urgency || 'MEDIUM',
      notes: item.notes || '',
    });
    setShowItemModal(true);
  };

  const closeItemModal = () => {
    setShowItemModal(false);
    setEditingItemId(null);
  };

  const handleStockItemSelect = (stockItemId: string) => {
    const stockItem = stockItems.find((s) => s.id === stockItemId);
    if (!stockItem) {
      setItemForm((prev) => ({ ...prev, stockItemId }));
      return;
    }

    setItemForm((prev) => ({
      ...prev,
      stockItemId,
      itemName: stockItem.name,
      unit: stockItem.unit,
      estimatedPrice: stockItem.unitPrice?.toString() || prev.estimatedPrice,
    }));
  };

  const saveItem = async () => {
    if (!itemForm.itemName || !itemForm.quantity || !itemForm.estimatedPrice) {
      alert('Please fill in item name, quantity, and estimated price');
      return;
    }

    try {
      if (!editingItemId) {
        await api.post(`/procurement/requisitions/${requisitionId}/items`, {
          itemName: itemForm.itemName,
          description: itemForm.description || undefined,
          category: itemForm.category,
          quantity: itemForm.quantity,
          unit: itemForm.unit,
          estimatedPrice: itemForm.estimatedPrice,
          specifications: itemForm.specifications || undefined,
          preferredVendor: itemForm.preferredVendor || undefined,
          stockItemId: itemForm.stockItemId || undefined,
          urgency: itemForm.urgency,
          notes: itemForm.notes || undefined,
        });
      } else {
        await api.put(`/procurement/requisitions/${requisitionId}/items/${editingItemId}`, {
          itemName: itemForm.itemName,
          description: itemForm.description || undefined,
          category: itemForm.category,
          quantity: itemForm.quantity,
          unit: itemForm.unit,
          estimatedPrice: itemForm.estimatedPrice,
          specifications: itemForm.specifications || undefined,
          preferredVendor: itemForm.preferredVendor || undefined,
          stockItemId: itemForm.stockItemId || undefined,
          urgency: itemForm.urgency,
          notes: itemForm.notes || undefined,
        });
      }

      closeItemModal();
      await fetchRequisition();
    } catch (error: any) {
      console.error('Failed to save item:', error);
      alert(error.response?.data?.message || 'Failed to save item');
    }
  };

  const deleteItem = async (itemId: string) => {
    if (!window.confirm('Remove this item from the requisition?')) return;

    try {
      await api.delete(`/procurement/requisitions/${requisitionId}/items/${itemId}`);
      await fetchRequisition();
    } catch (error: any) {
      console.error('Failed to delete item:', error);
      alert(error.response?.data?.message || 'Failed to delete item');
    }
  };

  const saveRequisition = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!requisition) return;

    setSaving(true);
    try {
      await api.put(`/procurement/requisitions/${requisitionId}`, {
        title: formData.title,
        description: formData.description || undefined,
        type: formData.type,
        priority: formData.priority,
        department: formData.department,
        projectId: formData.projectId || undefined,
        siteLocation: formData.siteLocation,
        requiredDate: formData.requiredDate,
        justification: formData.justification || undefined,
        currency: formData.currency,
      });

      alert('Requisition updated successfully');
      router.push(`/procurement/requisitions/${requisitionId}`);
    } catch (error: any) {
      console.error('Failed to update requisition:', error);
      alert(error.response?.data?.message || 'Failed to update requisition');
      setSaving(false);
    }
  };

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
    'CONSUMABLES',
    'EQUIPMENT',
    'SPARE_PARTS',
    'TOOLS',
    'FUEL',
    'CHEMICALS',
    'SAFETY_GEAR',
    'OFFICE_SUPPLIES',
    'OTHER',
  ];

  const units = ['PIECES', 'KILOGRAMS', 'LITERS', 'METERS', 'BOXES', 'PALLETS', 'TONS', 'GALLONS', 'UNITS'];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading requisition...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!requisition) return null;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link
          href={`/procurement/requisitions/${requisitionId}`}
          className="inline-flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Requisition</span>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Requisition</h1>
        <p className="text-gray-600 mt-1">{requisition.requisitionNo} (Draft only)</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <form onSubmit={saveRequisition} className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {requisitionTypes.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority *</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department *</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Project (Optional)</label>
                  <select
                    value={formData.projectId}
                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">No Project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.projectCode} - {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Site Location *</label>
                  <input
                    type="text"
                    value={formData.siteLocation}
                    onChange={(e) => setFormData({ ...formData, siteLocation: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Required Date *</label>
                  <input
                    type="date"
                    value={formData.requiredDate}
                    onChange={(e) => setFormData({ ...formData, requiredDate: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Justification</label>
                  <textarea
                    value={formData.justification}
                    onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Items ({items.length})</h3>
                <button
                  type="button"
                  onClick={openNewItem}
                  className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Item</span>
                </button>
              </div>

              {items.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No items added yet.</p>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <button
                          type="button"
                          onClick={() => openEditItem(item)}
                          className="text-left"
                        >
                          <h4 className="font-medium text-gray-900 hover:underline">{item.itemName}</h4>
                        </button>
                        <p className="text-sm text-gray-600 mt-1">
                          {String(item.quantity)} {item.unit} × {formData.currency} {Number(item.estimatedPrice).toFixed(2)} = {formData.currency}{' '}
                          {Number(item.totalPrice).toFixed(2)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteItem(item.id)}
                        className="text-red-600 hover:text-red-700 ml-4"
                        aria-label="Remove item"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
            >
              <Save className="w-5 h-5" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
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

      {showItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingItemId ? 'Edit Item' : 'Add Item'}
              </h3>
              <button type="button" onClick={closeItemModal} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Link to Stock Item (Optional)</label>
                <select
                  value={itemForm.stockItemId}
                  onChange={(e) => handleStockItemSelect(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select existing stock item...</option>
                  {stockItems.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.itemCode} - {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Item Name *</label>
                <input
                  type="text"
                  value={itemForm.itemName}
                  onChange={(e) => setItemForm((p) => ({ ...p, itemName: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <input
                  type="text"
                  value={itemForm.description}
                  onChange={(e) => setItemForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                <select
                  value={itemForm.category}
                  onChange={(e) => setItemForm((p) => ({ ...p, category: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Urgency</label>
                <select
                  value={itemForm.urgency}
                  onChange={(e) => setItemForm((p) => ({ ...p, urgency: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={itemForm.quantity}
                  onChange={(e) => setItemForm((p) => ({ ...p, quantity: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Unit *</label>
                <select
                  value={itemForm.unit}
                  onChange={(e) => setItemForm((p) => ({ ...p, unit: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  {units.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Price ({formData.currency}) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={itemForm.estimatedPrice}
                  onChange={(e) => setItemForm((p) => ({ ...p, estimatedPrice: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Vendor</label>
                <input
                  type="text"
                  value={itemForm.preferredVendor}
                  onChange={(e) => setItemForm((p) => ({ ...p, preferredVendor: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Specifications</label>
                <textarea
                  rows={2}
                  value={itemForm.specifications}
                  onChange={(e) => setItemForm((p) => ({ ...p, specifications: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  rows={2}
                  value={itemForm.notes}
                  onChange={(e) => setItemForm((p) => ({ ...p, notes: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                type="button"
                onClick={saveItem}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Save Item
              </button>
              <button
                type="button"
                onClick={closeItemModal}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function EditRequisitionPage() {
  return (
    <ProtectedRoute>
      <EditRequisitionContent />
    </ProtectedRoute>
  );
}

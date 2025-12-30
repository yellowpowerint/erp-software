'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Warehouse, Plus, MapPin, Package, CheckCircle, XCircle, Edit } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import ImportModal from '@/components/csv/ImportModal';
import ExportModal from '@/components/csv/ExportModal';
import WarehouseModal from '@/components/inventory/WarehouseModal';

interface WarehouseItem {
  id: string;
  code: string;
  name: string;
  location: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  _count: {
    stockItems: number;
  };
}

function WarehousesContent() {
  const { user } = useAuth();
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseItem | null>(null);

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const response = await api.get('/warehouses');
      setWarehouses(response.data);
    } catch (error) {
      console.error('Failed to fetch warehouses:', error);
    } finally {
      setLoading(false);
    }
  };

  const seedDefaultWarehouses = async () => {
    setSeeding(true);
    try {
      await api.post('/warehouses/seed');
      alert('Default warehouses seeded successfully!');
      fetchWarehouses();
    } catch (error: any) {
      console.error('Failed to seed warehouses:', error);
      alert(error.response?.data?.message || 'Failed to seed warehouses');
    } finally {
      setSeeding(false);
    }
  };

  const handleEditWarehouse = (warehouse: WarehouseItem) => {
    setSelectedWarehouse(warehouse);
    setModalOpen(true);
  };

  const handleSaveWarehouse = async (data: any) => {
    if (selectedWarehouse) {
      await api.put(`/warehouses/${selectedWarehouse.id}`, data);
      alert('Warehouse updated successfully!');
      fetchWarehouses();
    } else {
      await api.post('/warehouses', data);
      alert('Warehouse created successfully!');
      fetchWarehouses();
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedWarehouse(null);
  };

  const canManage = user && ['SUPER_ADMIN', 'CEO'].includes(user.role);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Warehouses</h1>
            <p className="text-gray-600 mt-1">Manage warehouse locations and inventory distribution</p>
          </div>
          {canManage && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setImportOpen(true)}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-sm"
              >
                Import CSV
              </button>
              <button
                onClick={() => setExportOpen(true)}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-sm"
              >
                Export CSV
              </button>
              <button
                onClick={() => {
                  setSelectedWarehouse(null);
                  setModalOpen(true);
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Add Warehouse</span>
              </button>
              <button
                onClick={seedDefaultWarehouses}
                disabled={seeding || warehouses.length > 0}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>{seeding ? 'Seeding...' : 'Seed Samples'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        module="warehouses"
        title="Import Warehouses"
      />

      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        module="warehouses"
        title="Export Warehouses"
        defaultFilters={{}}
      />

      <WarehouseModal
        open={modalOpen}
        onClose={handleCloseModal}
        warehouse={selectedWarehouse}
        onSave={handleSaveWarehouse}
      />

      {loading ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading warehouses...</p>
        </div>
      ) : warehouses.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Warehouse className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Warehouses Found</h3>
          <p className="text-gray-600 mb-4">
            Get started by seeding default warehouses for your mining operations.
          </p>
          {canManage && (
            <button
              onClick={seedDefaultWarehouses}
              disabled={seeding}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
            >
              <Plus className="w-5 h-5" />
              <span>{seeding ? 'Seeding...' : 'Seed Default Warehouses'}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {warehouses.map((warehouse) => (
            <div key={warehouse.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-indigo-100 p-3 rounded-lg">
                      <Warehouse className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{warehouse.name}</h3>
                      <p className="text-sm text-gray-500">{warehouse.code}</p>
                    </div>
                  </div>
                  {warehouse.isActive ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400" />
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">{warehouse.location}</p>
                    </div>
                  </div>

                  {warehouse.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {warehouse.description}
                    </p>
                  )}

                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Package className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Stock Items</span>
                      </div>
                      <span className="text-lg font-semibold text-indigo-600">
                        {warehouse._count.stockItems}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      warehouse.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {warehouse.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Created {new Date(warehouse.createdAt).toLocaleDateString()}
                </p>
                {canManage && (
                  <button
                    onClick={() => handleEditWarehouse(warehouse)}
                    className="flex items-center space-x-1 px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Box */}
      {warehouses.length > 0 && (
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Warehouse Management</h3>
          <p className="text-sm text-blue-800 mb-3">
            Warehouses are storage locations where your inventory items are kept. Each stock item belongs to one warehouse.
          </p>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Stock items are tracked per warehouse location</li>
            <li>You can filter inventory reports by warehouse</li>
            <li>Transfer items between warehouses using stock movements</li>
            <li>Each warehouse shows the total number of unique items stored</li>
          </ul>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function WarehousesPage() {
  return (
    <ProtectedRoute>
      <WarehousesContent />
    </ProtectedRoute>
  );
}

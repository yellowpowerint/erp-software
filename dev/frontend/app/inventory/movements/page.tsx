'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { TrendingUp, TrendingDown, Filter, RefreshCw } from 'lucide-react';
import api from '@/lib/api';

interface StockMovement {
  id: string;
  movementType: string;
  quantity: number;
  previousQty: number;
  newQty: number;
  unitPrice: number;
  totalValue: number;
  reference: string;
  notes: string;
  createdAt: string;
  item: {
    itemCode: string;
    name: string;
    unit: string;
  };
  warehouse: {
    code: string;
    name: string;
  };
}

interface Warehouse {
  id: string;
  name: string;
}

function StockMovementsContent() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [warehouseFilter, setWarehouseFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  useEffect(() => {
    fetchData();
  }, [warehouseFilter, typeFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (warehouseFilter !== 'ALL') params.warehouseId = warehouseFilter;
      if (typeFilter !== 'ALL') params.movementType = typeFilter;

      const [movementsRes, warehousesRes] = await Promise.all([
        api.get('/inventory/movements', { params }),
        api.get('/warehouses'),
      ]);
      
      setMovements(movementsRes.data);
      setWarehouses(warehousesRes.data);
    } catch (error) {
      console.error('Failed to fetch movements:', error);
    } finally {
      setLoading(false);
    }
  };

  const movementTypes = [
    { value: 'STOCK_IN', label: 'Stock In', color: 'text-green-600', bg: 'bg-green-100' },
    { value: 'STOCK_OUT', label: 'Stock Out', color: 'text-red-600', bg: 'bg-red-100' },
    { value: 'ADJUSTMENT', label: 'Adjustment', color: 'text-blue-600', bg: 'bg-blue-100' },
    { value: 'TRANSFER', label: 'Transfer', color: 'text-purple-600', bg: 'bg-purple-100' },
    { value: 'RETURN', label: 'Return', color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { value: 'DAMAGED', label: 'Damaged', color: 'text-orange-600', bg: 'bg-orange-100' },
    { value: 'EXPIRED', label: 'Expired', color: 'text-gray-600', bg: 'bg-gray-100' },
  ];

  const getMovementTypeStyle = (type: string) => {
    const typeConfig = movementTypes.find(t => t.value === type);
    return typeConfig || { color: 'text-gray-600', bg: 'bg-gray-100', label: type };
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Stock Movements</h1>
            <p className="text-gray-600 mt-1">Complete history of all inventory movements</p>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="ALL">All Warehouses</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>{wh.name}</option>
              ))}
            </select>
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="ALL">All Movement Types</option>
            {movementTypes.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Movements List */}
      {loading ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading movements...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Change</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {movements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p>No stock movements found</p>
                  </td>
                </tr>
              ) : (
                movements.map((movement) => {
                  const typeStyle = getMovementTypeStyle(movement.movementType);
                  const isIncoming = movement.movementType.includes('IN') || movement.movementType === 'RETURN';
                  
                  return (
                    <tr key={movement.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(movement.createdAt).toLocaleDateString()}
                        <br />
                        <span className="text-xs text-gray-500">
                          {new Date(movement.createdAt).toLocaleTimeString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="font-medium text-gray-900">{movement.item.name}</div>
                        <div className="text-xs text-gray-500">{movement.item.itemCode}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {movement.warehouse.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${typeStyle.bg} ${typeStyle.color}`}>
                          {typeStyle.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1">
                          {isIncoming ? (
                            <TrendingUp className="w-4 h-4 text-green-500" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-500" />
                          )}
                          <span className={`text-sm font-semibold ${isIncoming ? 'text-green-600' : 'text-red-600'}`}>
                            {isIncoming ? '+' : '-'}{movement.quantity} {movement.item.unit}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {movement.previousQty} → {movement.newQty}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {movement.totalValue ? `₵${movement.totalValue.toFixed(2)}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {movement.reference && (
                          <div className="font-medium text-gray-900">{movement.reference}</div>
                        )}
                        {movement.notes && (
                          <div className="text-xs text-gray-500 max-w-xs truncate">{movement.notes}</div>
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

export default function StockMovementsPage() {
  return (
    <ProtectedRoute>
      <StockMovementsContent />
    </ProtectedRoute>
  );
}

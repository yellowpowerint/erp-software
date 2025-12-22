'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

type Tx = {
  id: string;
  transactionType: string;
  quantity: string;
  balanceBefore: string;
  balanceAfter: string;
  transactionDate: string;
  reference?: string | null;
  notes?: string | null;
  performedBy?: { firstName: string; lastName: string; role: string };
};

type Tank = {
  id: string;
  name: string;
  location: string;
  fuelType: string;
  capacity: string;
  currentLevel: string;
  reorderLevel: string;
  status: string;
};

function Inner() {
  const params = useParams();
  const tankId = String(params?.id || '');

  const { user } = useAuth();
  const canManage = useMemo(() => {
    return !!user && ['SUPER_ADMIN', 'CEO', 'CFO', 'OPERATIONS_MANAGER', 'WAREHOUSE_MANAGER'].includes(user.role);
  }, [user]);

  const [tank, setTank] = useState<Tank | null>(null);
  const [tx, setTx] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);

  const [refillQty, setRefillQty] = useState('');
  const [dispenseQty, setDispenseQty] = useState('');
  const [dispenseAssetId, setDispenseAssetId] = useState('');
  const [unitPrice, setUnitPrice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tankRes, txRes] = await Promise.all([
        api.get('/fleet/fuel/tanks'),
        api.get(`/fleet/fuel/tanks/${tankId}/transactions`, { params: { take: 200 } }),
      ]);
      const tanks = Array.isArray(tankRes.data) ? tankRes.data : [];
      setTank(tanks.find((t: any) => t.id === tankId) || null);
      setTx(Array.isArray(txRes.data) ? txRes.data : []);
    } catch (e) {
      console.error('Failed to load tank:', e);
      setTank(null);
      setTx([]);
    } finally {
      setLoading(false);
    }
  }, [tankId]);

  useEffect(() => {
    if (!tankId) return;
    load();
  }, [tankId, load]);

  const refill = async () => {
    if (!canManage) return;
    if (!refillQty.trim()) {
      alert('Enter refill quantity');
      return;
    }
    try {
      await api.post(`/fleet/fuel/tanks/${tankId}/refill`, { quantity: refillQty.trim() });
      setRefillQty('');
      await load();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to refill');
    }
  };

  const dispense = async () => {
    if (!canManage) return;
    if (!dispenseQty.trim()) {
      alert('Enter dispense quantity');
      return;
    }
    try {
      await api.post(`/fleet/fuel/tanks/${tankId}/dispense`, {
        quantity: dispenseQty.trim(),
        assetId: dispenseAssetId.trim() || undefined,
        unitPrice: unitPrice.trim() || undefined,
      });
      setDispenseQty('');
      setDispenseAssetId('');
      setUnitPrice('');
      await load();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to dispense');
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link href="/fleet/fuel/tanks" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Tanks</span>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Tank Details</h1>
      </div>

      {loading ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading tank...</p>
        </div>
      ) : tank ? (
        <>
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-500">Name</div>
                <div className="text-gray-900 font-medium">{tank.name}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Location</div>
                <div className="text-gray-900 font-medium">{tank.location}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Fuel Type</div>
                <div className="text-gray-900 font-medium">{tank.fuelType}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Level</div>
                <div className="text-gray-900 font-medium">
                  {tank.currentLevel} / {tank.capacity}
                </div>
              </div>
            </div>
          </div>

          {canManage && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Refill</h3>
                  <input value={refillQty} onChange={(e) => setRefillQty(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-2" placeholder="Quantity (L)" />
                  <button onClick={refill} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                    Refill
                  </button>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Dispense</h3>
                  <input value={dispenseQty} onChange={(e) => setDispenseQty(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-2" placeholder="Quantity (L)" />
                  <input value={dispenseAssetId} onChange={(e) => setDispenseAssetId(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-2" placeholder="Asset ID (optional)" />
                  <input value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-2" placeholder="Unit price (optional, for costing)" />
                  <button onClick={dispense} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                    Dispense
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h2>
            {tx.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Before</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">After</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">By</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tx.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-700">{new Date(r.transactionDate).toLocaleString()}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{r.transactionType}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{r.quantity}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{r.balanceBefore}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{r.balanceAfter}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">
                          {r.performedBy ? `${r.performedBy.firstName} ${r.performedBy.lastName}` : '-'}
                          <div className="text-xs text-gray-500">{r.performedBy?.role || ''}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No transactions found.</p>
            )}
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">Tank not found.</p>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function Page() {
  return (
    <ProtectedRoute>
      <Inner />
    </ProtectedRoute>
  );
}

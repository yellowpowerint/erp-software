'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { AlertTriangle, Droplet, Fuel, TrendingUp } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

type FuelTank = {
  id: string;
  name: string;
  location: string;
  fuelType: string;
  capacity: string;
  currentLevel: string;
  reorderLevel: string;
  status: string;
};

type FuelRecordRow = {
  id: string;
  transactionDate: string;
  transactionType: string;
  fuelType: string;
  quantity: string;
  unitPrice: string;
  totalCost: string;
  siteLocation: string;
  asset?: { id: string; assetCode: string; name: string };
};

type Paginated<T> = {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

function Inner() {
  const { user } = useAuth();

  const canManage = useMemo(() => {
    return !!user && ['SUPER_ADMIN', 'CEO', 'CFO', 'OPERATIONS_MANAGER', 'WAREHOUSE_MANAGER'].includes(user.role);
  }, [user]);

  const [tanks, setTanks] = useState<FuelTank[]>([]);
  const [lowTanks, setLowTanks] = useState<FuelTank[]>([]);
  const [recent, setRecent] = useState<Paginated<FuelRecordRow> | null>(null);
  const [efficiency, setEfficiency] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [tankRes, lowRes, recRes, effRes] = await Promise.all([
          api.get('/fleet/fuel/tanks'),
          canManage ? api.get('/fleet/fuel/tanks/low') : Promise.resolve({ data: [] }),
          api.get('/fleet/fuel', { params: { page: 1, pageSize: 10 } }),
          canManage ? api.get('/fleet/fuel/efficiency', { params: { days: 30 } }) : Promise.resolve({ data: null }),
        ]);

        setTanks(Array.isArray(tankRes.data) ? tankRes.data : []);
        setLowTanks(Array.isArray(lowRes.data) ? lowRes.data : []);
        setRecent(recRes.data);
        setEfficiency(effRes.data);
      } catch (e) {
        console.error('Failed to load fuel dashboard:', e);
        setTanks([]);
        setLowTanks([]);
        setRecent(null);
        setEfficiency(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [canManage]);

  const totalLiters = efficiency?.totals?.liters ? Number(efficiency.totals.liters) : 0;
  const totalCost = efficiency?.totals?.cost ? Number(efficiency.totals.cost) : 0;

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fuel Management</h1>
          <p className="text-gray-600 mt-1">Track fuel transactions, site tanks, and consumption trends</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/fleet/fuel/record"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
          >
            <Fuel className="w-4 h-4" />
            Record Fuel
          </Link>
          <Link
            href="/fleet/fuel/tanks"
            className="px-4 py-2 border border-gray-300 bg-white rounded-lg hover:bg-gray-50 transition-colors"
          >
            Tanks
          </Link>
          <Link
            href="/fleet/fuel/reports"
            className="px-4 py-2 border border-gray-300 bg-white rounded-lg hover:bg-gray-50 transition-colors"
          >
            Reports
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading fuel dashboard...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Tanks</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{tanks.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Low Tanks</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{lowTanks.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Fuel Used (30d)</p>
              <p className="text-2xl font-bold text-indigo-600 mt-1">{totalLiters.toLocaleString()} L</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Fuel Cost (30d)</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">₵{totalCost.toLocaleString()}</p>
            </div>
          </div>

          {lowTanks.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h2 className="text-lg font-semibold text-gray-900">Low Tank Alerts</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tank</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Site</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fuel Type</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reorder</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {lowTanks.slice(0, 10).map((t) => (
                      <tr key={t.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2">
                          <div className="text-sm font-medium text-gray-900">{t.name}</div>
                          <div className="text-xs text-gray-500">{t.status}</div>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700">{t.location}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{t.fuelType}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{t.currentLevel}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{t.reorderLevel}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Droplet className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-semibold text-gray-900">Recent Fuel Transactions</h2>
              </div>
              <Link className="text-sm text-indigo-600 hover:text-indigo-800" href="/fleet/fuel/reports">
                <span className="inline-flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  View Reports
                </span>
              </Link>
            </div>

            {recent?.data?.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Asset</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Liters</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Site</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recent.data.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-700">
                          {r.transactionDate ? new Date(r.transactionDate).toLocaleString() : '-'}
                        </td>
                        <td className="px-4 py-2">
                          <div className="text-sm font-medium text-gray-900">{r.asset?.assetCode || '-'}</div>
                          <div className="text-xs text-gray-500">{r.asset?.name || ''}</div>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700">{r.transactionType}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{r.quantity}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">₵{Number(r.totalCost || 0).toLocaleString()}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{r.siteLocation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No fuel transactions found.</p>
            )}
          </div>
        </>
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

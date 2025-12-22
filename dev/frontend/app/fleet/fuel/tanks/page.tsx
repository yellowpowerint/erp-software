'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { ArrowLeft, Plus, RefreshCw } from 'lucide-react';
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
  updatedAt?: string;
};

function Inner() {
  const { user } = useAuth();
  const canManage = useMemo(() => {
    return !!user && ['SUPER_ADMIN', 'CEO', 'CFO', 'OPERATIONS_MANAGER', 'WAREHOUSE_MANAGER'].includes(user.role);
  }, [user]);

  const [tanks, setTanks] = useState<FuelTank[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [fuelType, setFuelType] = useState('DIESEL');
  const [capacity, setCapacity] = useState('');
  const [currentLevel, setCurrentLevel] = useState('');
  const [reorderLevel, setReorderLevel] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/fleet/fuel/tanks');
      setTanks(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error('Failed to load tanks:', e);
      setTanks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !location || !capacity || !currentLevel || !reorderLevel) {
      alert('name, location, capacity, currentLevel and reorderLevel are required');
      return;
    }
    setSaving(true);
    try {
      await api.post('/fleet/fuel/tanks', {
        name: name.trim(),
        location: location.trim(),
        fuelType,
        capacity: capacity.trim(),
        currentLevel: currentLevel.trim(),
        reorderLevel: reorderLevel.trim(),
      });
      setShowCreate(false);
      setName('');
      setLocation('');
      setCapacity('');
      setCurrentLevel('');
      setReorderLevel('');
      await load();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to create tank');
    } finally {
      setSaving(false);
    }
  };

  const percent = (t: FuelTank) => {
    const cap = Number(t.capacity || 0);
    const cur = Number(t.currentLevel || 0);
    if (!cap) return 0;
    return Math.max(0, Math.min(100, Math.round((cur / cap) * 100)));
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link href="/fleet/fuel" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Fuel</span>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fuel Tanks</h1>
            <p className="text-gray-600 mt-1">Manage site tanks and track levels</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={load}
              className="px-4 py-2 border border-gray-300 bg-white rounded-lg hover:bg-gray-50 transition-colors inline-flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            {canManage && (
              <button
                onClick={() => setShowCreate((s) => !s)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Tank
              </button>
            )}
          </div>
        </div>
      </div>

      {showCreate && canManage && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Tank</h2>
          <form onSubmit={create} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <input value={location} onChange={(e) => setLocation(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fuel Type</label>
              <select value={fuelType} onChange={(e) => setFuelType(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white">
                <option value="DIESEL">Diesel</option>
                <option value="PETROL">Petrol</option>
                <option value="ELECTRIC">Electric</option>
                <option value="HYBRID">Hybrid</option>
                <option value="LPG">LPG</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Capacity (L)</label>
              <input value={capacity} onChange={(e) => setCapacity(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Level (L)</label>
              <input value={currentLevel} onChange={(e) => setCurrentLevel(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reorder Level (L)</label>
              <input value={reorderLevel} onChange={(e) => setReorderLevel(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400">
                {saving ? 'Saving...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading tanks...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Site</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fuel Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tanks.length ? (
                tanks.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{t.name}</div>
                      <div className="text-xs text-gray-500">{t.id}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{t.location}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{t.fuelType}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700">
                        {t.currentLevel} / {t.capacity} ({percent(t)}%)
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className={`h-2 rounded-full ${percent(t) <= 20 ? 'bg-red-500' : percent(t) <= 40 ? 'bg-orange-500' : 'bg-green-500'}`}
                          style={{ width: `${percent(t)}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{t.status}</td>
                    <td className="px-6 py-4 text-sm">
                      <Link className="text-indigo-600 hover:text-indigo-800" href={`/fleet/fuel/tanks/${t.id}`}>
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No tanks found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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

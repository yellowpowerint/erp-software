'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { ArrowLeft } from 'lucide-react';

function Inner() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [assetId, setAssetId] = useState('');
  const [operatorId, setOperatorId] = useState('');
  const [siteLocation, setSiteLocation] = useState('');
  const [shift, setShift] = useState('');
  const [operatingHours, setOperatingHours] = useState('');
  const [idleHours, setIdleHours] = useState('');
  const [distanceCovered, setDistanceCovered] = useState('');
  const [materialMoved, setMaterialMoved] = useState('');
  const [endOdometer, setEndOdometer] = useState('');
  const [endHours, setEndHours] = useState('');
  const [notes, setNotes] = useState('');

  const date = useMemo(() => new Date().toISOString(), []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetId || !operatorId || !siteLocation) {
      alert('assetId, operatorId and siteLocation are required');
      return;
    }

    setSaving(true);
    try {
      await api.post('/fleet/usage', {
        assetId,
        operatorId,
        siteLocation,
        date,
        shift: shift.trim() || undefined,
        operatingHours: operatingHours.trim() || undefined,
        idleHours: idleHours.trim() || undefined,
        distanceCovered: distanceCovered.trim() || undefined,
        materialMoved: materialMoved.trim() || undefined,
        endOdometer: endOdometer.trim() || undefined,
        endHours: endHours.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      router.push('/fleet/usage');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to log usage');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link href="/fleet/usage" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Usage Logs</span>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Log Usage</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Asset ID</label>
            <input value={assetId} onChange={(e) => setAssetId(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Operator ID</label>
            <input value={operatorId} onChange={(e) => setOperatorId(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Site Location</label>
            <input value={siteLocation} onChange={(e) => setSiteLocation(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Shift</label>
            <input value={shift} onChange={(e) => setShift(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Optional" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Operating Hours</label>
            <input value={operatingHours} onChange={(e) => setOperatingHours(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Optional" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Idle Hours</label>
            <input value={idleHours} onChange={(e) => setIdleHours(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Optional" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Distance Covered (km)</label>
            <input value={distanceCovered} onChange={(e) => setDistanceCovered(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Optional" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Material Moved (tonnes)</label>
            <input value={materialMoved} onChange={(e) => setMaterialMoved(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Optional" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Odometer</label>
            <input value={endOdometer} onChange={(e) => setEndOdometer(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Optional" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Hours</label>
            <input value={endHours} onChange={(e) => setEndHours(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Optional" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" rows={3} placeholder="Optional" />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400">
              {saving ? 'Saving...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
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

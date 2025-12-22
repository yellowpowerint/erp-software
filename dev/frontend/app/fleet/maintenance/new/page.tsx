'use client';

import { useState } from 'react';
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
  const [title, setTitle] = useState('');
  const [type, setType] = useState('PREVENTIVE');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetId || !title) {
      alert('assetId and title are required');
      return;
    }
    setSaving(true);
    try {
      const res = await api.post('/fleet/maintenance', {
        assetId,
        type,
        title,
        startDate: new Date().toISOString(),
        status: 'SCHEDULED',
        priority: 'MEDIUM',
      });
      router.push(res.data?.id ? `/fleet/maintenance/${res.data.id}` : '/fleet/maintenance');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to create record');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link href="/fleet/maintenance" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Maintenance</span>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Log Maintenance</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Asset ID</label>
            <input value={assetId} onChange={(e) => setAssetId(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white">
              <option value="PREVENTIVE">Preventive</option>
              <option value="CORRECTIVE">Corrective</option>
              <option value="PREDICTIVE">Predictive</option>
              <option value="EMERGENCY">Emergency</option>
              <option value="INSPECTION">Inspection</option>
              <option value="OVERHAUL">Overhaul</option>
            </select>
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400">
              {saving ? 'Saving...' : 'Create'}
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

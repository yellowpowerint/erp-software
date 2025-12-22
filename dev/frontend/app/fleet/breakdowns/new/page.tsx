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
  const [siteLocation, setSiteLocation] = useState('');
  const [location, setLocation] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('MECHANICAL');
  const [severity, setSeverity] = useState('MEDIUM');
  const [estimatedDowntime, setEstimatedDowntime] = useState('');

  const breakdownDate = useMemo(() => new Date().toISOString(), []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetId || !siteLocation || !location || !title || !description) {
      alert('assetId, siteLocation, location, title and description are required');
      return;
    }

    setSaving(true);
    try {
      const res = await api.post('/fleet/breakdowns', {
        assetId,
        breakdownDate,
        siteLocation,
        location,
        title,
        description,
        category,
        severity,
        estimatedDowntime: estimatedDowntime.trim() ? estimatedDowntime.trim() : undefined,
      });
      router.push(res.data?.id ? `/fleet/breakdowns/${res.data.id}` : '/fleet/breakdowns');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to report breakdown');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link href="/fleet/breakdowns" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Breakdowns</span>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Report Breakdown</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Asset ID</label>
            <input value={assetId} onChange={(e) => setAssetId(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Site Location</label>
            <input value={siteLocation} onChange={(e) => setSiteLocation(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Mining site" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Exact Location</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Where it occurred" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" rows={4} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white">
              <option value="MECHANICAL">Mechanical</option>
              <option value="ELECTRICAL">Electrical</option>
              <option value="HYDRAULIC">Hydraulic</option>
              <option value="ENGINE">Engine</option>
              <option value="TRANSMISSION">Transmission</option>
              <option value="TIRES_TRACKS">Tires/Tracks</option>
              <option value="STRUCTURAL">Structural</option>
              <option value="OPERATOR_ERROR">Operator Error</option>
              <option value="EXTERNAL_DAMAGE">External Damage</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
            <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white">
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Downtime (hours)</label>
            <input value={estimatedDowntime} onChange={(e) => setEstimatedDowntime(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="e.g. 2.5" />
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

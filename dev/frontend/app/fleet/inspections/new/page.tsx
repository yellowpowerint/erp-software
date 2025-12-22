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
  const [inspectorId, setInspectorId] = useState('');
  const [type, setType] = useState('PRE_OPERATION');
  const [overallResult, setOverallResult] = useState('PASS');
  const [score, setScore] = useState('');
  const [findings, setFindings] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');

  const inspectionDate = useMemo(() => new Date().toISOString(), []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!assetId || !inspectorId) {
      alert('assetId and inspectorId are required');
      return;
    }

    setSaving(true);
    try {
      await api.post('/fleet/inspections', {
        assetId,
        inspectorId,
        type,
        overallResult,
        inspectionDate,
        score: score.trim() ? Number(score.trim()) : undefined,
        findings: findings.trim() || undefined,
        recommendations: recommendations.trim() || undefined,
        followUpRequired,
        followUpDate: followUpRequired && followUpDate ? new Date(followUpDate).toISOString() : undefined,
        followUpNotes: followUpNotes.trim() || undefined,
      });
      router.push('/fleet/inspections');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to create inspection');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link href="/fleet/inspections" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Inspections</span>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New Inspection</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Asset ID</label>
            <input value={assetId} onChange={(e) => setAssetId(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Inspector ID</label>
            <input value={inspectorId} onChange={(e) => setInspectorId(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white">
              <option value="PRE_OPERATION">Pre-Operation</option>
              <option value="POST_OPERATION">Post-Operation</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="SAFETY">Safety</option>
              <option value="REGULATORY">Regulatory</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Overall Result</label>
            <select value={overallResult} onChange={(e) => setOverallResult(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white">
              <option value="PASS">Pass</option>
              <option value="FAIL">Fail</option>
              <option value="CONDITIONAL">Conditional</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Score (optional)</label>
            <input value={score} onChange={(e) => setScore(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="0-100" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Findings</label>
            <textarea value={findings} onChange={(e) => setFindings(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" rows={3} placeholder="Optional" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Recommendations</label>
            <textarea value={recommendations} onChange={(e) => setRecommendations(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" rows={3} placeholder="Optional" />
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={followUpRequired} onChange={(e) => setFollowUpRequired(e.target.checked)} />
              Follow-up required
            </label>
          </div>

          {followUpRequired && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Follow-up Date</label>
                <input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Follow-up Notes</label>
                <input value={followUpNotes} onChange={(e) => setFollowUpNotes(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Optional" />
              </div>
            </>
          )}

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

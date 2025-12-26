'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ArrowLeft, CheckCircle, Save, Smartphone } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

type MobileFeatureFlags = {
  home: boolean;
  work: boolean;
  modules: boolean;
  notifications: boolean;
  more: boolean;
};

type MobileConfigAdmin = {
  minimumVersions: { ios: string; android: string };
  storeUrls: { ios: string; android: string };
  featureFlags: MobileFeatureFlags;
  maintenance: { enabled: boolean; message: string };
  forceUpdateMessage: string | null;
};

function MobileSettingsContent() {
  const [config, setConfig] = useState<MobileConfigAdmin | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/settings/mobile/config');
        setConfig(res.data);
      } catch (e) {
        console.error('Failed to load mobile config:', e);
        alert('Failed to load mobile config.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    setSaving(true);
    try {
      const res = await api.put('/settings/mobile/config', config);
      setConfig(res.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('Failed to save mobile config:', err);
      alert('Failed to save mobile config.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!config) return null;

  const setFlag = (k: keyof MobileFeatureFlags, v: boolean) =>
    setConfig({ ...config, featureFlags: { ...config.featureFlags, [k]: v } });

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link href="/settings" className="inline-flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Settings</span>
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Smartphone className="w-8 h-8 text-purple-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mobile App Settings</h1>
              <p className="text-gray-600">Admin controls for mobile config</p>
            </div>
          </div>
          {saved ? (
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Saved</span>
            </div>
          ) : null}
        </div>
      </div>

      <form onSubmit={save} className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Minimum Versions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">iOS</label>
              <input
                value={config.minimumVersions.ios}
                onChange={(e) => setConfig({ ...config, minimumVersions: { ...config.minimumVersions, ios: e.target.value } })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Android</label>
              <input
                value={config.minimumVersions.android}
                onChange={(e) => setConfig({ ...config, minimumVersions: { ...config.minimumVersions, android: e.target.value } })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Store URLs</h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">iOS</label>
              <input
                value={config.storeUrls.ios}
                onChange={(e) => setConfig({ ...config, storeUrls: { ...config.storeUrls, ios: e.target.value } })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Android</label>
              <input
                value={config.storeUrls.android}
                onChange={(e) => setConfig({ ...config, storeUrls: { ...config.storeUrls, android: e.target.value } })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Maintenance Mode</h2>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Enabled</span>
            <button
              type="button"
              onClick={() => setConfig({ ...config, maintenance: { ...config.maintenance, enabled: !config.maintenance.enabled } })}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${config.maintenance.enabled ? 'bg-purple-600' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${config.maintenance.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              value={config.maintenance.message}
              onChange={(e) => setConfig({ ...config, maintenance: { ...config.maintenance, message: e.target.value } })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows={3}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Force Update Message</h2>
          <textarea
            value={config.forceUpdateMessage ?? ''}
            onChange={(e) => setConfig({ ...config, forceUpdateMessage: e.target.value.trim().length ? e.target.value : null })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            rows={3}
          />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Feature Flags</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(['home', 'work', 'modules', 'notifications', 'more'] as const).map((k) => (
              <label key={k} className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-200">
                <span className="text-sm font-medium text-gray-900 capitalize">{k}</span>
                <input type="checkbox" checked={config.featureFlags[k]} onChange={(e) => setFlag(k, e.target.checked)} />
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Link href="/settings" className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save'}</span>
          </button>
        </div>
      </form>
    </DashboardLayout>
  );
}

export default function MobileSettingsPage() {
  return (
    <ProtectedRoute>
      <MobileSettingsContent />
    </ProtectedRoute>
  );
}

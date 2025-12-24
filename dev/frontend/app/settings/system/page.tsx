'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Database, ArrowLeft, Save, Globe, DollarSign, Calendar, Clock, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { menuItems } from '@/lib/config/menu';

interface SystemConfig {
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  address: string;
  currency: string;
  timezone: string;
  dateFormat: string;
  fiscalYearStart: string;
  features: {
    approvals: boolean;
    inventory: boolean;
    finance: boolean;
    hr: boolean;
    safety: boolean;
    ai: boolean;
    reports: boolean;
    modules?: Record<string, boolean>;
  };
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

const getSidebarModuleToggles = () => {
  return menuItems
    .filter((m) => Boolean(m.path))
    .map((m) => ({
      id: m.id,
      label: m.label,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
};

function SystemConfigurationContent() {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await api.get('/settings/config');
      setConfig(response.data);
    } catch (error) {
      console.error('Failed to fetch config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      await api.put('/settings/config', config);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save config:', error);
      alert('Failed to save configuration. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleFeature = (feature: keyof SystemConfig['features']) => {
    if (!config) return;
    setConfig({
      ...config,
      features: {
        ...config.features,
        [feature]: !config.features[feature],
      },
    });
  };

  const toggleModule = (moduleId: string) => {
    if (!config) return;
    setConfig({
      ...config,
      features: {
        ...config.features,
        modules: {
          ...(config.features.modules || {}),
          [moduleId]: !(config.features.modules || {})[moduleId],
        },
      },
    });
  };

  const toggleNotification = (type: keyof SystemConfig['notifications']) => {
    if (!config) return;
    setConfig({
      ...config,
      notifications: {
        ...config.notifications,
        [type]: !config.notifications[type],
      },
    });
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

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link href="/settings" className="inline-flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Settings</span>
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Database className="w-8 h-8 text-green-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">System Configuration</h1>
              <p className="text-gray-600">Configure system settings and preferences</p>
            </div>
          </div>
          {saved && (
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Saved successfully!</span>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSave}>
        {/* Company Information */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <Globe className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Company Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input
                type="text"
                value={config.companyName}
                onChange={(e) => setConfig({ ...config, companyName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Email</label>
              <input
                type="email"
                value={config.companyEmail}
                onChange={(e) => setConfig({ ...config, companyEmail: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Phone</label>
              <input
                type="tel"
                value={config.companyPhone}
                onChange={(e) => setConfig({ ...config, companyPhone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                value={config.address}
                onChange={(e) => setConfig({ ...config, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Regional Settings */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <Clock className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">Regional Settings</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select
                value={config.currency}
                onChange={(e) => setConfig({ ...config, currency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="GHS">GHS - Ghanaian Cedi</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
              <select
                value={config.timezone}
                onChange={(e) => setConfig({ ...config, timezone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="Africa/Accra">Africa/Accra (GMT)</option>
                <option value="America/New_York">America/New York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Format</label>
              <select
                value={config.dateFormat}
                onChange={(e) => setConfig({ ...config, dateFormat: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fiscal Year Start</label>
              <input
                type="text"
                value={config.fiscalYearStart}
                onChange={(e) => setConfig({ ...config, fiscalYearStart: e.target.value })}
                placeholder="MM/DD"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">Format: MM/DD (e.g., 01/01)</p>
            </div>
          </div>
        </div>

        {/* Feature Toggles */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">Module Features</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(config.features)
              .filter(([key]) => key !== 'modules')
              .map(([key, value]) => (
              <div key={key} className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${value ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {key.replace(/_/g, ' ')}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleFeature(key as keyof SystemConfig['features'])}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    value ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      value ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Modules */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <Database className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">Modules (Sidebar)</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getSidebarModuleToggles().map((m) => {
              const enabled = config.features.modules?.[m.id] ?? true;
              return (
                <div key={m.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${enabled ? 'bg-indigo-500' : 'bg-gray-300'}`}></div>
                    <span className="text-sm font-medium text-gray-900">{m.label}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleModule(m.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      enabled ? 'bg-indigo-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-500 mt-4">
            These toggles control which sidebar modules are enabled at the system level.
          </p>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <Calendar className="w-5 h-5 text-yellow-600" />
            <h2 className="text-lg font-semibold text-gray-900">Notification Channels</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(config.notifications).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${value ? 'bg-yellow-500' : 'bg-gray-300'}`}></div>
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {key}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleNotification(key as keyof SystemConfig['notifications'])}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    value ? 'bg-yellow-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      value ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-4">
            Enable or disable notification channels for system alerts and updates
          </p>
        </div>

        {/* Save Button */}
        <div className="flex justify-end space-x-3">
          <Link
            href="/settings"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </DashboardLayout>
  );
}

export default function SystemConfigurationPage() {
  return (
    <ProtectedRoute>
      <SystemConfigurationContent />
    </ProtectedRoute>
  );
}

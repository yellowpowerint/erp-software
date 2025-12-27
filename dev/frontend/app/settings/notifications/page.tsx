'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Bell, ArrowLeft, Save, Mail, Smartphone, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

function NotificationSettingsContent() {
  const [settings, setSettings] = useState<any | null>(null);
  const [providers, setProviders] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [prefsRes, providersRes] = await Promise.all([
          api.get('/settings/notifications/preferences'),
          api.get('/settings/notifications/providers'),
        ]);
        setSettings(prefsRes.data);
        setProviders(providersRes.data);
      } catch (error) {
        console.error('Failed to fetch notification settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await api.put('/settings/notifications/preferences', settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
      alert('Failed to save notification preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestEmail = async () => {
    setSendingTest(true);
    try {
      await api.post('/settings/notifications/test-email', {
        toEmail: testEmail.trim() || undefined,
      });
      alert('Test email sent (check inbox/spam).');
    } catch (error) {
      console.error('Failed to send test email:', error);
      alert('Failed to send test email. Ensure SMTP is configured and try again.');
    } finally {
      setSendingTest(false);
    }
  };

  const toggleEmailSetting = (key: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      email: {
        ...settings.email,
        [key]: !settings.email[key as keyof typeof settings.email],
      },
    });
  };


  const togglePushSetting = (key: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      push: {
        ...settings.push,
        [key]: !settings.push[key as keyof typeof settings.push],
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

  if (!settings) return null;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link href="/settings" className="inline-flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Settings</span>
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Bell className="w-8 h-8 text-yellow-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notification Settings</h1>
              <p className="text-gray-600">Configure your notification preferences</p>
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
        {/* Provider Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Provider Status</h2>
          <div className="text-sm text-gray-700">
            <div className="flex items-center justify-between py-2">
              <span>Email (SMTP)</span>
              <span className={providers?.email?.configured ? 'text-green-600 font-medium' : 'text-gray-600'}>
                {providers?.email?.configured ? 'Configured' : 'Not configured'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span>Push</span>
              <span className="text-gray-600">Not configured</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="Test email recipient (optional)"
              className="md:col-span-2 w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <button
              type="button"
              onClick={handleSendTestEmail}
              disabled={sendingTest}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
            >
              {sendingTest ? 'Sending…' : 'Send Test Email'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            To enable Email notifications, configure SMTP in backend environment variables (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`/`SMTP_PASSWORD`, optional `SMTP_FROM`).
          </p>
        </div>
        {/* Email Notifications */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 rounded-lg p-2">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Email Notifications</h2>
                <p className="text-sm text-gray-600">Receive notifications via email</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => toggleEmailSetting('enabled')}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                settings.email.enabled ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  settings.email.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {settings.email.enabled && (
            <div className="space-y-3 pl-12">
              {Object.entries(settings.email).filter(([key]) => key !== 'enabled').map(([key, value]) => (
                <div key={key} className="flex items-center justify-between py-2">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                    </div>
                    <div className="text-xs text-gray-500">
                      {key === 'approvalRequests' && 'Get notified when someone requests your approval'}
                      {key === 'approvalUpdates' && 'Get notified when your requests are approved or rejected'}
                      {key === 'systemAlerts' && 'Important system notifications and updates'}
                      {key === 'expenseApprovals' && 'Notifications for expense approval requests'}
                      {key === 'inventoryAlerts' && 'Low stock and inventory updates'}
                      {key === 'safetyAlerts' && 'Safety inspections and compliance alerts'}
                      {key === 'weeklyReports' && 'Weekly summary reports via email'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleEmailSetting(key)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      value ? 'bg-blue-500' : 'bg-gray-300'
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
          )}
        </div>


        {/* Push Notifications */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-100 rounded-lg p-2">
                <Smartphone className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Push Notifications</h2>
                <p className="text-sm text-gray-600">Real-time browser notifications</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => togglePushSetting('enabled')}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                settings.push.enabled ? 'bg-purple-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  settings.push.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {settings.push.enabled && (
            <div className="space-y-3 pl-12">
              {Object.entries(settings.push).filter(([key]) => key !== 'enabled').map(([key, value]) => (
                <div key={key} className="flex items-center justify-between py-2">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                    </div>
                    <div className="text-xs text-gray-500">
                      {key === 'approvalRequests' && 'Instant notifications for approval requests'}
                      {key === 'mentions' && 'When someone mentions you in comments'}
                      {key === 'systemAlerts' && 'System updates and maintenance notifications'}
                      {key === 'taskReminders' && 'Reminders for pending tasks and deadlines'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => togglePushSetting(key)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      value ? 'bg-purple-500' : 'bg-gray-300'
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
          )}
        </div>

        {/* Notification Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow p-6 mb-6 border border-blue-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Active Notification Channels</h3>
          <div className="flex space-x-4">
            <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${settings.email.enabled ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
              <Mail className="w-4 h-4" />
              <span className="text-sm font-medium">Email</span>
            </div>
            <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${settings.push.enabled ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
              <Smartphone className="w-4 h-4" />
              <span className="text-sm font-medium">Push</span>
            </div>
          </div>
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
            <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
          </button>
        </div>
      </form>
    </DashboardLayout>
  );
}

export default function NotificationSettingsPage() {
  return (
    <ProtectedRoute>
      <NotificationSettingsContent />
    </ProtectedRoute>
  );
}

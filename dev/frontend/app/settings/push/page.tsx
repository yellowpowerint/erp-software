'use client';
 
import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { UserRole } from '@/types/auth';
import Link from 'next/link';
import api from '@/lib/api';
import { ArrowLeft, Bell, Send } from 'lucide-react';

type PushStatus = {
  provider: string;
  tokenCount: number;
  lastSeenAt: string | null;
};

function PushDiagnosticsContent() {
  const [status, setStatus] = useState<PushStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const [sending, setSending] = useState(false);
  const [toUserId, setToUserId] = useState('');
  const [toPushToken, setToPushToken] = useState('');
  const [title, setTitle] = useState('Test Notification');
  const [body, setBody] = useState('This is a test push notification.');
  const [url, setUrl] = useState('miningerp://notifications');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/settings/push/status');
      setStatus(res.data);
    } catch (e) {
      console.error('Failed to load push status:', e);
      alert('Failed to load push status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const sendTestPush = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const payload: any = {
        title: title.trim() || undefined,
        body: body.trim() || undefined,
        url: url.trim() || undefined,
      };

      if (toPushToken.trim()) payload.toPushToken = toPushToken.trim();
      if (toUserId.trim()) payload.toUserId = toUserId.trim();

      await api.post('/settings/push/test', payload);
      alert('Test push sent.');
      await load();
    } catch (err: any) {
      console.error('Failed to send test push:', err);
      alert(err?.response?.data?.message || 'Failed to send test push.');
    } finally {
      setSending(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link href="/settings" className="inline-flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Settings</span>
        </Link>
        <div className="flex items-center space-x-3">
          <Bell className="w-8 h-8 text-indigo-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Push Diagnostics</h1>
            <p className="text-gray-600">Status</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Provider</span><span className="font-medium">{status?.provider || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Token Count</span><span className="font-medium">{status?.tokenCount ?? 0}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Last Seen</span><span className="font-medium">{status?.lastSeenAt || '-'}</span></div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Send Test Push</h2>
          <form onSubmit={sendTestPush} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To User ID (optional)</label>
              <input
                value={toUserId}
                onChange={(e) => setToUserId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="UUID of user"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Push Token (optional)</label>
              <input
                value={toPushToken}
                onChange={(e) => setToPushToken(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="ExponentPushToken[...]"
              />
              <div className="text-xs text-gray-500 mt-1">If provided, it overrides User ID.</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deep Link URL (optional)</label>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="miningerp://..."
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={sending}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
              >
                <Send className="w-4 h-4" />
                <span>{sending ? 'Sending...' : 'Send Test Push'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function PushDiagnosticsPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]}>
      <PushDiagnosticsContent />
    </ProtectedRoute>
  );
}

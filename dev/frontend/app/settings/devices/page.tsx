'use client';
import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { UserRole } from '@/types/auth';
import Link from 'next/link';
import api from '@/lib/api';
import { ArrowLeft, Smartphone, Search } from 'lucide-react';

type Device = { id: string; userId: string; deviceId: string; platform: string; appVersion: string | null; lastSeenAt: string | null; revoked: boolean; user: { email: string } | null };

function Content() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = async (s?: string) => {
    setLoading(true);
    try {
      const res = await api.get('/settings/mobile/devices', { params: { search: s } });
      setDevices(res.data || []);
    } catch (e) {
      alert('Failed to load devices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const revoke = async (deviceId: string) => {
    if (!confirm('Revoke device?')) return;
    try {
      await api.post('/settings/mobile/devices/revoke', { deviceId });
      await load(search);
    } catch (e) {
      alert('Failed to revoke');
    }
  };

  const unrevoke = async (deviceId: string) => {
    if (!confirm('Unrevoke device?')) return;
    try {
      await api.post('/settings/mobile/devices/unrevoke', { deviceId });
      await load(search);
    } catch (e) {
      alert('Failed to unrevoke');
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link href="/settings" className="inline-flex items-center space-x-2 text-indigo-600 mb-4">
          <ArrowLeft className="w-4 h-4" /><span>Back</span>
        </Link>
        <div className="flex items-center space-x-3">
          <Smartphone className="w-8 h-8 text-slate-700" />
          <div><h1 className="text-2xl font-bold">Mobile Devices</h1></div>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <form onSubmit={(e) => { e.preventDefault(); void load(search); }} className="flex space-x-3">
          <input value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 px-4 py-2 border rounded-lg" placeholder="Search..." />
          <button type="submit" className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg">
            <Search className="w-4 h-4" /><span>Search</span>
          </button>
        </form>
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? <div className="text-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div></div> : devices.length === 0 ? <div className="text-center py-12 text-gray-500">No devices</div> : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Platform</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Version</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Seen</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {devices.map((d) => (
                <tr key={d.id}>
                  <td className="px-6 py-4 text-sm">{d.user?.email || '-'}</td>
                  <td className="px-6 py-4 text-sm">{d.deviceId}</td>
                  <td className="px-6 py-4 text-sm">{d.platform}</td>
                  <td className="px-6 py-4 text-sm">{d.appVersion || '-'}</td>
                  <td className="px-6 py-4 text-sm">{d.lastSeenAt ? new Date(d.lastSeenAt).toLocaleString() : '-'}</td>
                  <td className="px-6 py-4">
                    {d.revoked ? <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">Revoked</span> : <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">Active</span>}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {d.revoked ? (
                      <button onClick={() => unrevoke(d.deviceId)} className="text-green-600 hover:text-green-800">Unrevoke</button>
                    ) : (
                      <button onClick={() => revoke(d.deviceId)} className="text-red-600 hover:text-red-800">Revoke</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function Page() {
  return <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]}><Content /></ProtectedRoute>;
}

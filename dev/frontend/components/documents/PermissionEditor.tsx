'use client';

import { useEffect, useState } from 'react';
import { useDocuments } from '@/hooks/useDocuments';
import api from '@/lib/api';

type PermissionFlags = {
  canView?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canShare?: boolean;
  canSign?: boolean;
};

type UserRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
  department?: string | null;
};

export default function PermissionEditor({ documentId }: { documentId: string }) {
  const { getDocumentPermissions, grantUserDocumentPermission, revokeUserDocumentPermission } = useDocuments();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState<UserRow[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);

  const [flags, setFlags] = useState<Required<PermissionFlags>>({
    canView: true,
    canEdit: false,
    canDelete: false,
    canShare: false,
    canSign: false,
  });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getDocumentPermissions(documentId);
      setData(res);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [documentId]);

  const searchUsers = async () => {
    const q = userSearch.trim();
    if (!q) return;

    const res = await api.get(`/settings/users?search=${encodeURIComponent(q)}`);
    setUserResults((res.data || []) as UserRow[]);
  };

  const grant = async () => {
    if (!selectedUser) return;
    await grantUserDocumentPermission(documentId, selectedUser.id, flags);
    setSelectedUser(null);
    setUserSearch('');
    setUserResults([]);
    await load();
  };

  const revoke = async (userId: string) => {
    if (!confirm('Revoke this user permission?')) return;
    await revokeUserDocumentPermission(documentId, userId);
    await load();
  };

  if (loading) return <div className="p-6 text-sm text-gray-600">Loading permissions...</div>;

  return (
    <div className="p-6 space-y-6">
      {error && <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div>
        <h3 className="text-lg font-medium text-gray-900">User Permissions</h3>
        <p className="text-sm text-gray-600 mt-1">Grant access to a specific user (overrides role/category defaults).</p>
      </div>

      <div className="rounded border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            placeholder="Search user by name/email"
            className="border border-gray-200 rounded px-3 py-2 text-sm"
          />
          <button
            onClick={searchUsers}
            className="px-3 py-2 rounded border border-gray-200 hover:bg-gray-50 text-sm"
          >
            Search
          </button>
          <div className="text-sm text-gray-600 self-center">
            {selectedUser ? `Selected: ${selectedUser.firstName} ${selectedUser.lastName}` : 'No user selected'}
          </div>
        </div>

        {userResults.length > 0 && (
          <div className="mt-3 rounded border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {userResults.map((u) => (
                  <tr key={u.id}>
                    <td className="px-3 py-2 text-sm text-gray-900">{u.firstName} {u.lastName} ({u.email})</td>
                    <td className="px-3 py-2 text-sm text-gray-700">{u.role || ''}</td>
                    <td className="px-3 py-2 text-sm">
                      <button
                        onClick={() => setSelectedUser(u)}
                        className="px-2 py-1 rounded border border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                      >
                        Select
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
          {(
            [
              ['canView', 'View'],
              ['canEdit', 'Edit'],
              ['canDelete', 'Delete'],
              ['canShare', 'Share'],
              ['canSign', 'Sign'],
            ] as Array<[keyof PermissionFlags, string]>
          ).map(([k, label]) => (
            <label key={k} className="flex items-center space-x-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={!!flags[k]}
                onChange={(e) => setFlags((p) => ({ ...p, [k]: e.target.checked }))}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>

        <div className="mt-4">
          <button
            onClick={grant}
            disabled={!selectedUser}
            className="px-3 py-2 rounded bg-indigo-600 text-white text-sm disabled:opacity-50"
          >
            Grant Permissions
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 text-sm font-semibold text-gray-900">Existing user grants</div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Permissions</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expires</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(data?.users || []).map((p: any) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 text-sm text-gray-900">{p.user?.firstName} {p.user?.lastName}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {[
                      p.canView ? 'view' : null,
                      p.canEdit ? 'edit' : null,
                      p.canDelete ? 'delete' : null,
                      p.canShare ? 'share' : null,
                      p.canSign ? 'sign' : null,
                    ].filter(Boolean).join(', ')}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{p.expiresAt ? new Date(p.expiresAt).toLocaleString() : ''}</td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => revoke(p.userId)}
                      className="px-2 py-1 rounded border border-red-200 text-red-700 hover:bg-red-50"
                    >
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
              {(!data?.users || data.users.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-sm text-gray-600">No user-specific permissions.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

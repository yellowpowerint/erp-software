'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, Copy, Link as LinkIcon, User as UserIcon } from 'lucide-react';
import { useDocuments } from '@/hooks/useDocuments';
import { BasicUser, DocumentShare } from '@/types/document';

interface ShareModalProps {
  documentId: string;
  documentName?: string;
  onClose: () => void;
  onShared?: (share: DocumentShare) => void;
}

export default function ShareModal({ documentId, documentName, onClose, onShared }: ShareModalProps) {
  const { getUsers, shareDocument } = useDocuments();

  const [mode, setMode] = useState<'user' | 'public'>('user');
  const [users, setUsers] = useState<BasicUser[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [canEdit, setCanEdit] = useState(false);
  const [canDownload, setCanDownload] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdShare, setCreatedShare] = useState<DocumentShare | null>(null);

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(q),
    );
  }, [users, userSearch]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getUsers({ status: 'ACTIVE' });
        if (!active) return;
        setUsers(data);
      } catch (e: any) {
        if (!active) return;
        setUsers([]);
      }
    })();
    return () => {
      active = false;
    };
  }, [getUsers]);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
  };

  const handleShare = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const share = await shareDocument(documentId, {
        sharedWithId: mode === 'user' ? (selectedUserId || undefined) : undefined,
        generatePublicLink: mode === 'public',
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        canEdit,
        canDownload,
      });

      setCreatedShare(share);
      onShared?.(share);

      if (share.publicUrl) {
        const url = `${window.location.origin}${share.publicUrl}`;
        await handleCopy(url);
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to share document');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black opacity-50" onClick={onClose} />
        <div className="relative bg-white rounded-lg shadow-xl max-w-xl w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Share Document</h2>
              <p className="text-sm text-gray-600 mt-1 truncate">
                {documentName || 'Document'}
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
              <X className="h-5 w-5" />
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mb-4">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setMode('user')}
                className={`px-3 py-1.5 text-sm rounded border ${
                  mode === 'user'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:bg-gray-50'
                } inline-flex items-center space-x-2`}
              >
                <UserIcon className="h-4 w-4" />
                <span>Share with user</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('public')}
                className={`px-3 py-1.5 text-sm rounded border ${
                  mode === 'public'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:bg-gray-50'
                } inline-flex items-center space-x-2`}
              >
                <LinkIcon className="h-4 w-4" />
                <span>Public link</span>
              </button>
            </div>
          </div>

          {mode === 'user' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Select user</label>
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
              />
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select a user --</option>
                {filteredUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName} ({u.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expires</label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty for no expiry.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Permissions</label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={canDownload}
                    onChange={(e) => setCanDownload(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <span>Can download</span>
                </label>
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={canEdit}
                    onChange={(e) => setCanEdit(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <span>Can edit</span>
                </label>
              </div>
            </div>
          </div>

          {createdShare?.publicUrl && (
            <div className="mb-4 rounded border border-gray-200 bg-gray-50 p-3">
              <div className="text-sm font-medium text-gray-900 mb-1">Public share link</div>
              <div className="flex items-center space-x-2">
                <input
                  readOnly
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}${createdShare.publicUrl}`}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
                />
                <button
                  type="button"
                  onClick={async () => {
                    const url = `${window.location.origin}${createdShare.publicUrl}`;
                    await handleCopy(url);
                  }}
                  className="px-3 py-2 rounded bg-white border border-gray-200 hover:bg-gray-100 inline-flex items-center space-x-2"
                >
                  <Copy className="h-4 w-4" />
                  <span className="text-sm">Copy</span>
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 rounded hover:bg-gray-50"
            >
              Close
            </button>
            <button
              type="button"
              disabled={submitting || (mode === 'user' && !selectedUserId)}
              onClick={handleShare}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center space-x-2"
            >
              <span>{submitting ? 'Sharing...' : 'Share'}</span>
            </button>
          </div>

          {mode === 'public' && (
            <p className="text-xs text-gray-500 mt-3">
              Public links are accessible without login (download respects the “Can download” setting).
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useDocuments } from '@/hooks/useDocuments';
import { Document, DocumentShare } from '@/types/document';
import DocumentCard from '@/components/documents/DocumentCard';
import DocumentDetailModal from '@/components/documents/DocumentDetailModal';

type Tab = 'with-me' | 'by-me';

export default function SharedDocumentsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <SharedDocumentsContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function SharedDocumentsContent() {
  const { getSharedWithMe, getSharedByMe, revokeShare, downloadDocument } = useDocuments();

  const [tab, setTab] = useState<Tab>('with-me');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shares, setShares] = useState<DocumentShare[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = tab === 'with-me' ? await getSharedWithMe() : await getSharedByMe();
      setShares(data);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load shared documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shared Documents</h1>
          <p className="text-sm text-gray-600 mt-1">Documents shared with you, and documents you shared with others.</p>
        </div>
      </div>

      <div className="mb-4 flex items-center space-x-2">
        <button
          onClick={() => setTab('with-me')}
          className={`px-3 py-1.5 text-sm rounded border ${
            tab === 'with-me' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50'
          }`}
        >
          Shared with me
        </button>
        <button
          onClick={() => setTab('by-me')}
          className={`px-3 py-1.5 text-sm rounded border ${
            tab === 'by-me' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50'
          }`}
        >
          Shared by me
        </button>
        <button
          onClick={load}
          className="ml-auto px-3 py-1.5 text-sm rounded border border-gray-200 hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {error && <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="text-sm text-gray-600">Loading...</div>
      ) : shares.length === 0 ? (
        <div className="text-sm text-gray-600">No shared documents.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shares.map((s) => (
            <div key={s.id} className="relative">
              <DocumentCard
                document={s.document}
                onView={(doc) => setSelectedDocument(doc)}
                onDownload={async (doc) => {
                  try {
                    const { url, filename } = await downloadDocument(doc.id);
                    const link = window.document.createElement('a');
                    link.href = url;
                    link.download = filename;
                    window.document.body.appendChild(link);
                    link.click();
                    window.document.body.removeChild(link);
                  } catch {
                    alert('Failed to download');
                  }
                }}
                onDelete={
                  tab === 'by-me'
                    ? async () => {
                        if (!confirm('Revoke this share?')) return;
                        await revokeShare(s.id);
                        await load();
                      }
                    : undefined
                }
                onShare={
                  s.publicUrl
                    ? async () => {
                        const url = `${window.location.origin}${s.publicUrl}`;
                        await navigator.clipboard.writeText(url);
                        alert('Public share link copied');
                      }
                    : undefined
                }
              />

              {tab === 'by-me' && (
                <div className="mt-2 text-xs text-gray-600">
                  {s.sharedWith ? `Shared with ${s.sharedWith.firstName} ${s.sharedWith.lastName}` : s.publicUrl ? 'Public link' : ''}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedDocument && (
        <DocumentDetailModal
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
          onUpdate={(updated) => {
            setShares((prev) => prev.map((s) => (s.document.id === updated.id ? { ...s, document: updated } : s)));
            setSelectedDocument(updated);
          }}
          onDelete={() => {
            setSelectedDocument(null);
          }}
        />
      )}
    </div>
  );
}

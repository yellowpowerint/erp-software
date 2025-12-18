'use client';

import { useState, useEffect } from 'react';
import { Grid, List, Upload, ArrowLeft } from 'lucide-react';
import { Document } from '@/types/document';
import { useDocuments } from '@/hooks/useDocuments';
import DocumentCard from '@/components/documents/DocumentCard';
import DocumentDetailModal from '@/components/documents/DocumentDetailModal';
import Link from 'next/link';

type ViewMode = 'grid' | 'list';

export default function MyUploadsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const { getMyUploads, deleteDocument, downloadDocument, loading, error } = useDocuments();

  useEffect(() => {
    loadMyUploads();
  }, []);

  const loadMyUploads = async () => {
    try {
      const docs = await getMyUploads();
      setDocuments(docs);
    } catch (err) {
      console.error('Failed to load my uploads:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/documents"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to All Documents
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">My Uploads</h1>
          <p className="mt-2 text-gray-600">Documents you have uploaded</p>
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {documents.length} {documents.length === 1 ? 'document' : 'documents'}
            </div>

            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${
                  viewMode === 'grid' ? 'bg-white shadow' : 'hover:bg-gray-200'
                }`}
              >
                <Grid className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${
                  viewMode === 'list' ? 'bg-white shadow' : 'hover:bg-gray-200'
                }`}
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Documents grid/list */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading your documents...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No uploads yet</h3>
            <p className="text-gray-600 mb-4">
              You haven’t uploaded any documents yet
            </p>
            <Link
              href="/documents"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go to Documents
            </Link>
          </div>
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                : 'space-y-4'
            }
          >
            {documents.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onView={setSelectedDocument}
                onDownload={async (doc) => {
                  try {
                    const { url, filename } = await downloadDocument(doc.id);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = filename;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  } catch (error) {
                    console.error('Download error:', error);
                    alert('Failed to download document');
                  }
                }}
                onDelete={async (doc) => {
                  if (confirm('Delete this document?')) {
                    try {
                      await deleteDocument(doc.id);
                      loadMyUploads();
                    } catch (error) {
                      console.error('Delete error:', error);
                      alert('Failed to delete document');
                    }
                  }
                }}
                onEdit={setSelectedDocument}
              />
            ))}
          </div>
        )}
      </div>

      {/* Document detail modal */}
      {selectedDocument && (
        <DocumentDetailModal
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
          onUpdate={(updated) => {
            setDocuments(documents.map((doc) => (doc.id === updated.id ? updated : doc)));
            setSelectedDocument(updated);
          }}
          onDelete={() => {
            setDocuments(documents.filter((doc) => doc.id !== selectedDocument.id));
            setSelectedDocument(null);
          }}
        />
      )}
    </div>
  );
}

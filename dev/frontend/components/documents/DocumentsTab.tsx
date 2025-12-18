'use client';

import { useState, useEffect } from 'react';
import { FileText, Download, Eye, Upload as UploadIcon } from 'lucide-react';
import { Document, DocumentCategory } from '@/types/document';
import { useDocuments } from '@/hooks/useDocuments';
import { formatFileSize, getFileIcon } from '@/lib/utils/file';
import { format } from 'date-fns';
import DocumentDetailModal from './DocumentDetailModal';
import DocumentUpload from './DocumentUpload';

interface DocumentsTabProps {
  module: string;
  referenceId: string;
  category?: DocumentCategory;
  allowUpload?: boolean;
}

export default function DocumentsTab({
  module,
  referenceId,
  category = DocumentCategory.OTHER,
  allowUpload = true,
}: DocumentsTabProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const { getDocumentsByModule, downloadDocument, loading, error } = useDocuments();

  useEffect(() => {
    loadDocuments();
  }, [module, referenceId]);

  const loadDocuments = async () => {
    try {
      const docs = await getDocumentsByModule(module, referenceId);
      setDocuments(docs);
    } catch (err) {
      console.error('Failed to load documents:', err);
    }
  };

  const handleDownload = async (doc: Document) => {
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
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900">Documents</h3>
          <span className="text-sm text-gray-500">({documents.length})</span>
        </div>
        {allowUpload && (
          <button
            onClick={() => setShowUpload(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <UploadIcon className="h-4 w-4" />
            <span>Upload</span>
          </button>
        )}
      </div>

      {/* Documents list */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-600">Loading documents...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 text-sm">No documents attached</p>
          {allowUpload && (
            <button
              onClick={() => setShowUpload(true)}
              className="mt-3 text-sm text-blue-600 hover:text-blue-700"
            >
              Upload a document
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="text-2xl flex-shrink-0">
                  {getFileIcon(doc.mimeType)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {doc.originalName}
                  </p>
                  <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
                    <span>{formatFileSize(doc.fileSize)}</span>
                    <span>•</span>
                    <span>{format(new Date(doc.createdAt), 'MMM d, yyyy')}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSelectedDocument(doc)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                  title="View details"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDownload(doc)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black opacity-50" onClick={() => setShowUpload(false)} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Upload Documents</h2>
                <button
                  onClick={() => setShowUpload(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>
              <DocumentUpload
                module={module}
                referenceId={referenceId}
                category={category}
                onUploadComplete={(docs) => {
                  setShowUpload(false);
                  loadDocuments();
                }}
                onUploadError={(error) => {
                  console.error('Upload error:', error);
                }}
              />
            </div>
          </div>
        </div>
      )}

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

'use client';

import { useEffect, useState } from 'react';
import { FileText, Download, Eye, ArrowRight } from 'lucide-react';
import { Document } from '@/types/document';
import { useDocuments } from '@/hooks/useDocuments';
import { formatFileSize, getFileIcon } from '@/lib/utils/file';
import { format } from 'date-fns';
import Link from 'next/link';

interface RecentDocumentsWidgetProps {
  limit?: number;
  onViewDocument?: (document: Document) => void;
}

export default function RecentDocumentsWidget({
  limit = 5,
  onViewDocument,
}: RecentDocumentsWidgetProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const { getRecentDocuments, loading, error } = useDocuments();

  useEffect(() => {
    loadRecentDocuments();
  }, [limit]);

  const loadRecentDocuments = async () => {
    try {
      const docs = await getRecentDocuments(limit);
      setDocuments(docs);
    } catch (err) {
      console.error('Failed to load recent documents:', err);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gray-200 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                <div className="h-2 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>Recent Documents</span>
        </h3>
        <Link
          href="/documents"
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
        >
          <span>View all</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="divide-y divide-gray-200">
        {documents.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No recent documents</p>
          </div>
        ) : (
          documents.map((doc) => (
            <div
              key={doc.id}
              className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => onViewDocument?.(doc)}
            >
              <div className="flex items-start space-x-3">
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
                  <div className="mt-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      {doc.category.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDocument?.(doc);
                    }}
                    className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                    title="View"
                  >
                    <Eye className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

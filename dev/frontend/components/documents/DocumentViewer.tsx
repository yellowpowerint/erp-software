'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { FileText, ZoomIn, ZoomOut, Download } from 'lucide-react';
import { Document } from '@/types/document';

const PdfViewerClient = dynamic(() => import('./PdfViewerClient'), {
  ssr: false,
});

interface DocumentViewerProps {
  document: Document;
  onDownload?: () => void;
}

export default function DocumentViewer({ document, onDownload }: DocumentViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [error, setError] = useState<string | null>(null);

  const isImage = document.mimeType.startsWith('image/');
  const isPDF = document.mimeType === 'application/pdf';
  const isText = document.mimeType.startsWith('text/');

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Viewer toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-900 truncate max-w-md">
            {document.originalName}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {(isImage || isPDF) && (
            <>
              <button
                onClick={handleZoomOut}
                disabled={zoom <= 50}
                className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                title="Zoom out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="text-sm text-gray-600 min-w-[4rem] text-center">
                {zoom}%
              </span>
              <button
                onClick={handleZoomIn}
                disabled={zoom >= 200}
                className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                title="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </>
          )}
          {onDownload && (
            <button
              onClick={onDownload}
              className="ml-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Download</span>
            </button>
          )}
        </div>
      </div>

      {/* Viewer content */}
      <div className="flex-1 overflow-auto p-4">
        {error && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <FileText className="h-16 w-16 text-red-400 mx-auto mb-4" />
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          </div>
        )}

        {!error && isImage && (
          <div className="flex items-center justify-center min-h-full">
            <img
              src={document.fileUrl}
              alt={document.originalName}
              style={{ width: `${zoom}%` }}
              className="max-w-full h-auto"
              onError={() => setError('Failed to load image')}
            />
          </div>
        )}

        {!error && isPDF && (
          <div className="flex items-center justify-center min-h-full">
            <PdfViewerClient
              fileUrl={document.fileUrl}
              zoom={zoom}
              onError={setError}
            />
          </div>
        )}

        {!error && isText && (
          <div className="bg-white rounded-lg shadow-sm p-6 max-w-4xl mx-auto">
            <iframe
              src={document.fileUrl}
              className="w-full h-full min-h-[600px] border-0"
              title={document.originalName}
              onError={() => setError('Failed to load text file')}
            />
          </div>
        )}

        {!error && !isImage && !isPDF && !isText && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Preview not available
              </h3>
              <p className="text-gray-600 mb-4">
                This file type cannot be previewed in the browser.
              </p>
              <p className="text-sm text-gray-500 mb-4">
                File type: {document.mimeType}
              </p>
              {onDownload && (
                <button
                  onClick={onDownload}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center space-x-2 mx-auto"
                >
                  <Download className="h-4 w-4" />
                  <span>Download to view</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

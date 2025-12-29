'use client';

import { useEffect, useState } from 'react';
import { Document as PdfDocument, Page, pdfjs } from 'react-pdf';

interface PdfViewerClientProps {
  fileUrl: string;
  zoom?: number;
  onError?: (message: string) => void;
}

export default function PdfViewerClient({ fileUrl, zoom = 100, onError = () => {} }: PdfViewerClientProps) {
  const [numPages, setNumPages] = useState<number | null>(null);

  useEffect(() => {
    // Use a CDN worker to avoid bundler/canvas issues in Next builds.
    // Use .js instead of .mjs to avoid ES module syntax errors in worker context
    pdfjs.GlobalWorkerOptions.workerSrc =
      'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <PdfDocument
        file={fileUrl}
        onLoadSuccess={(info: { numPages: number }) => setNumPages(info.numPages)}
        onLoadError={() => onError('Failed to load PDF')}
        loading={<div className="text-sm text-gray-600">Loading PDF...</div>}
      >
        {Array.from(new Array(numPages || 0), (_el, index) => (
          <div key={`page_${index + 1}`} className="mb-4 last:mb-0">
            <Page
              pageNumber={index + 1}
              scale={zoom / 100}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </div>
        ))}
      </PdfDocument>
    </div>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { FileText, Loader2 } from 'lucide-react';
import { useDocuments } from '@/hooks/useDocuments';
import { Document } from '@/types/document';
import PDFMerger from '@/components/documents/PDFMerger';
import PDFEditor from '@/components/documents/PDFEditor';
import RedactionTool from '@/components/documents/RedactionTool';
import StampLibrary from '@/components/documents/StampLibrary';
import PdfFormTemplatesPanel from '@/components/documents/PdfFormTemplatesPanel';

type ToolTab = 'merge' | 'edit' | 'redact' | 'stamps' | 'forms';

function ToolsContent() {
  const { getDocuments } = useDocuments();
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ToolTab>('merge');

  useEffect(() => {
    (async () => {
      try {
        const all = await getDocuments();
        setDocs(all);
      } catch (e: any) {
        setError(e?.response?.data?.message || e?.message || 'Failed to load documents');
      } finally {
        setLoading(false);
      }
    })();
  }, [getDocuments]);

  const pdfDocuments = useMemo(
    () => docs.filter((d) => d.mimeType === 'application/pdf'),
    [docs],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="h-8 w-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">PDF Tools</h1>
        </div>
        <p className="text-gray-600">Merge, split, reorder, rotate, watermark, redact, and stamp PDFs in your document library.</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="mb-6 bg-white border border-gray-200 rounded-lg p-2 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('merge')}
          className={
            activeTab === 'merge'
              ? 'px-4 py-2 rounded-md bg-blue-600 text-white text-sm'
              : 'px-4 py-2 rounded-md bg-gray-100 text-gray-700 text-sm hover:bg-gray-200'
          }
        >
          Merge PDFs
        </button>
        <button
          onClick={() => setActiveTab('edit')}
          className={
            activeTab === 'edit'
              ? 'px-4 py-2 rounded-md bg-blue-600 text-white text-sm'
              : 'px-4 py-2 rounded-md bg-gray-100 text-gray-700 text-sm hover:bg-gray-200'
          }
        >
          Edit & Organize
        </button>
        <button
          onClick={() => setActiveTab('redact')}
          className={
            activeTab === 'redact'
              ? 'px-4 py-2 rounded-md bg-blue-600 text-white text-sm'
              : 'px-4 py-2 rounded-md bg-gray-100 text-gray-700 text-sm hover:bg-gray-200'
          }
        >
          Redaction
        </button>
        <button
          onClick={() => setActiveTab('stamps')}
          className={
            activeTab === 'stamps'
              ? 'px-4 py-2 rounded-md bg-blue-600 text-white text-sm'
              : 'px-4 py-2 rounded-md bg-gray-100 text-gray-700 text-sm hover:bg-gray-200'
          }
        >
          Stamps
        </button>
        <button
          onClick={() => setActiveTab('forms')}
          className={
            activeTab === 'forms'
              ? 'px-4 py-2 rounded-md bg-blue-600 text-white text-sm'
              : 'px-4 py-2 rounded-md bg-gray-100 text-gray-700 text-sm hover:bg-gray-200'
          }
        >
          Form Templates
        </button>
      </div>

      {pdfDocuments.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">No PDF documents found in your library yet. Upload a PDF first, then return here.</p>
        </div>
      ) : (
        <>
          {activeTab === 'merge' && <PDFMerger documents={pdfDocuments} />}
          {activeTab === 'edit' && <PDFEditor documents={pdfDocuments} />}
          {activeTab === 'redact' && <RedactionTool documents={pdfDocuments} />}
          {activeTab === 'stamps' && <StampLibrary documents={pdfDocuments} />}
          {activeTab === 'forms' && <PdfFormTemplatesPanel documents={docs} />}
        </>
      )}
    </div>
  );
}

export default function PDFToolsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <ToolsContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}

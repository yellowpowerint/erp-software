'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { FileText, Loader2 } from 'lucide-react';
import { useDocuments } from '@/hooks/useDocuments';
import { Document, DocumentCategory } from '@/types/document';
import PDFMerger from '@/components/documents/PDFMerger';
import PDFEditor from '@/components/documents/PDFEditor';
import RedactionTool from '@/components/documents/RedactionTool';
import StampLibrary from '@/components/documents/StampLibrary';
import PdfFormTemplatesPanel from '@/components/documents/PdfFormTemplatesPanel';
import AuditPackageBuilderPanel from '@/components/documents/AuditPackageBuilderPanel';
import FinalizeToolPanel from '@/components/documents/FinalizeToolPanel';
import ConvertToPdfPanel from '@/components/documents/ConvertToPdfPanel';
import DocumentAiInsightsPanel from '@/components/documents/DocumentAiInsightsPanel';

type ToolTab = 'merge' | 'edit' | 'redact' | 'stamps' | 'forms' | 'audit' | 'finalize' | 'convert' | 'insights';

function ToolsContent() {
  const { getDocuments } = useDocuments();
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ToolTab>('merge');
  const [selectedForConvert, setSelectedForConvert] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('convert:selectedForConvert') || null;
  });
  const [selectedForInsights, setSelectedForInsights] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<DocumentCategory | 'ALL'>(() => {
    if (typeof window === 'undefined') return 'ALL';
    const stored = localStorage.getItem('convert:categoryFilter');
    return (stored as DocumentCategory | 'ALL') || 'ALL';
  });
  const [tagFilter, setTagFilter] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('convert:tagFilter') || '';
  });

  const moduleForSuggestions = useMemo(() => {
    const selectedDoc = docs.find((d) => d.id === selectedForConvert);
    if (selectedDoc) return selectedDoc.module;
    if (docs.length > 0) return docs[0].module;
    return null;
  }, [docs, selectedForConvert]);

  const tagSuggestions = useMemo(() => {
    const counts = new Map<string, number>();
    const sourceDocs = moduleForSuggestions ? docs.filter((d) => d.module === moduleForSuggestions) : docs;
    sourceDocs.forEach((d) => {
      d.tags.forEach((t) => {
        const key = t.toLowerCase();
        counts.set(key, (counts.get(key) || 0) + 1);
      });
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag)
      .slice(0, 8);
  }, [docs, moduleForSuggestions]);

  const loadDocuments = useCallback(async () => {
    try {
      const all = await getDocuments();
      setDocs(all);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [getDocuments]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const pdfDocuments = useMemo(
    () => docs.filter((d) => d.mimeType === 'application/pdf'),
    [docs],
  );

  const nonPdfDocuments = useMemo(() => docs.filter((d) => d.mimeType !== 'application/pdf'), [docs]);

  const filteredNonPdfDocuments = useMemo(() => {
    return nonPdfDocuments.filter((d) => {
      const matchesCategory = categoryFilter === 'ALL' || d.category === categoryFilter;
      const matchesTag =
        !tagFilter || d.tags.some((t) => t.toLowerCase().includes(tagFilter.trim().toLowerCase()));
      return matchesCategory && matchesTag;
    });
  }, [nonPdfDocuments, categoryFilter, tagFilter]);

  useEffect(() => {
    if (!selectedForConvert && filteredNonPdfDocuments.length > 0) {
      setSelectedForConvert(filteredNonPdfDocuments[0].id);
      setActiveTab('convert');
    }
  }, [filteredNonPdfDocuments, selectedForConvert]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (selectedForConvert) localStorage.setItem('convert:selectedForConvert', selectedForConvert);
    else localStorage.removeItem('convert:selectedForConvert');
  }, [selectedForConvert]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('convert:categoryFilter', categoryFilter);
  }, [categoryFilter]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('convert:tagFilter', tagFilter);
  }, [tagFilter]);

  useEffect(() => {
    if (!selectedForInsights && docs.length > 0) {
      setSelectedForInsights(docs[0].id);
    }
  }, [docs, selectedForInsights]);

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
        <p className="text-gray-600">
          Merge, split, convert, analyze, reorder, rotate, watermark, redact, and stamp PDFs in your document library.
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="mb-6 bg-white border border-gray-200 rounded-lg p-2 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('convert')}
          className={
            activeTab === 'convert'
              ? 'px-4 py-2 rounded-md bg-blue-600 text-white text-sm'
              : 'px-4 py-2 rounded-md bg-gray-100 text-gray-700 text-sm hover:bg-gray-200'
          }
        >
          Convert
        </button>
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
        <button
          onClick={() => setActiveTab('audit')}
          className={
            activeTab === 'audit'
              ? 'px-4 py-2 rounded-md bg-blue-600 text-white text-sm'
              : 'px-4 py-2 rounded-md bg-gray-100 text-gray-700 text-sm hover:bg-gray-200'
          }
        >
          Audit Packages
        </button>
        <button
          onClick={() => setActiveTab('finalize')}
          className={
            activeTab === 'finalize'
              ? 'px-4 py-2 rounded-md bg-blue-600 text-white text-sm'
              : 'px-4 py-2 rounded-md bg-gray-100 text-gray-700 text-sm hover:bg-gray-200'
          }
        >
          Finalize
        </button>
        <button
          onClick={() => setActiveTab('insights')}
          className={
            activeTab === 'insights'
              ? 'px-4 py-2 rounded-md bg-blue-600 text-white text-sm'
              : 'px-4 py-2 rounded-md bg-gray-100 text-gray-700 text-sm hover:bg-gray-200'
          }
        >
          AI Insights
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
          {activeTab === 'audit' && <AuditPackageBuilderPanel documents={docs} />}
          {activeTab === 'finalize' && <FinalizeToolPanel documents={docs} />}
          {activeTab === 'convert' && (
            <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Convert to PDF</h2>
                <p className="text-sm text-gray-600">
                  Use CloudConvert-backed conversion to turn office files, images, and scans into PDFs before further processing.
                </p>
              </div>

              {nonPdfDocuments.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                  Only PDFs are in your library right now. Upload Word, Excel, images, or other files to convert them.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-gray-700" htmlFor="convert-category">
                        Filter by category
                      </label>
                      <select
                        id="convert-category"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value as DocumentCategory | 'ALL')}
                      >
                        <option value="ALL">All categories</option>
                        {Object.values(DocumentCategory).map((c) => (
                          <option key={c} value={c}>
                            {c.replace(/_/g, ' ')}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-gray-700" htmlFor="convert-tags">
                        Filter by tag
                      </label>
                      <input
                        id="convert-tags"
                        value={tagFilter}
                        onChange={(e) => setTagFilter(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        placeholder="e.g. vendor, assay, haul-truck"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-gray-700" htmlFor="convert-doc">
                        Select a file
                      </label>
                      <select
                        id="convert-doc"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        value={selectedForConvert ?? ''}
                        onChange={(e) => setSelectedForConvert(e.target.value || null)}
                      >
                        {filteredNonPdfDocuments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.originalName} ({d.mimeType})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-700">
                    <button
                      type="button"
                      onClick={() => {
                        setCategoryFilter('ALL');
                        setTagFilter('');
                        if (filteredNonPdfDocuments[0]) {
                          setSelectedForConvert(filteredNonPdfDocuments[0].id);
                        } else {
                          setSelectedForConvert(null);
                        }
                      }}
                      className="px-3 py-1 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    >
                      Clear filters
                    </button>
                    {tagSuggestions.length > 0 && (
                      <div className="flex flex-wrap gap-1 items-center">
                        <span className="font-medium text-gray-800">Tags:</span>
                        {tagSuggestions.map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setTagFilter(t)}
                            className={`px-2 py-1 rounded-full border text-xs ${
                              tagFilter.toLowerCase() === t
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedForConvert && filteredNonPdfDocuments.some((d) => d.id === selectedForConvert) ? (
                    <ConvertToPdfPanel
                      documentId={selectedForConvert}
                      mimeType={filteredNonPdfDocuments.find((d) => d.id === selectedForConvert)?.mimeType || ''}
                      onConverted={loadDocuments}
                    />
                  ) : (
                    <div className="text-sm text-yellow-800 bg-yellow-50 border border-yellow-200 rounded-md px-3 py-2">
                      Choose a file that matches your filters to start conversion.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">AI Insights</h2>
                <p className="text-sm text-gray-600">
                  Summarize documents, surface anomalies, and suggest categories—helpful for accountants and procurement to spot
                  mismatches before approvals.
                </p>
              </div>

              {docs.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                  No documents yet. Upload a file to generate insights.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <label className="text-sm font-medium text-gray-700" htmlFor="insight-doc">
                      Select a document
                    </label>
                    <select
                      id="insight-doc"
                      className="w-full sm:w-80 border border-gray-300 rounded-md px-3 py-2 text-sm"
                      value={selectedForInsights ?? ''}
                      onChange={(e) => setSelectedForInsights(e.target.value || null)}
                    >
                      {docs.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.originalName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedForInsights && <DocumentAiInsightsPanel documentId={selectedForInsights} />}
                </div>
              )}
            </div>
          )}
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

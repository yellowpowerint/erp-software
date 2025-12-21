'use client';

import { useEffect, useMemo, useState } from 'react';
import { FileText, Loader2, Plus, Trash2, Play, RefreshCw, ExternalLink, AlertCircle } from 'lucide-react';
import { Document } from '@/types/document';
import { useDocuments } from '@/hooks/useDocuments';
import { AuditPackageSpec, DocumentAuditPackageJob, DocumentAuditPackageStatus } from '@/types/audit-packages';

interface AuditPackageBuilderPanelProps {
  documents: Document[];
}

export default function AuditPackageBuilderPanel({ documents }: AuditPackageBuilderPanelProps) {
  const {
    startAuditPackageJob,
    listAuditPackageJobs,
    getAuditPackageJob,
    cancelAuditPackageJob,
    getDocument,
    loading,
  } = useDocuments();

  const pdfDocs = useMemo(() => documents.filter((d) => d.mimeType === 'application/pdf'), [documents]);

  const [title, setTitle] = useState('');
  const [sections, setSections] = useState<AuditPackageSpec['sections']>([
    { title: 'Section 1', documents: [] },
  ]);

  const [jobs, setJobs] = useState<DocumentAuditPackageJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<DocumentAuditPackageJob | null>(null);

  const [error, setError] = useState<string | null>(null);

  const refreshJobs = async () => {
    setError(null);
    try {
      const j = await listAuditPackageJobs();
      setJobs(j);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load jobs');
    }
  };

  const refreshSelectedJob = async () => {
    if (!selectedJobId) return;
    setError(null);
    try {
      const j = await getAuditPackageJob(selectedJobId);
      setSelectedJob(j);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load job');
    }
  };

  useEffect(() => {
    refreshJobs();
  }, []);

  useEffect(() => {
    if (selectedJobId) {
      refreshSelectedJob();
    } else {
      setSelectedJob(null);
    }
  }, [selectedJobId]);

  const addSection = () => {
    setSections((prev) => [
      ...prev,
      { title: `Section ${prev.length + 1}`, documents: [] },
    ]);
  };

  const removeSection = (index: number) => {
    setSections((prev) => prev.filter((_, i) => i !== index));
  };

  const updateSectionTitle = (index: number, newTitle: string) => {
    setSections((prev) => prev.map((s, i) => (i === index ? { ...s, title: newTitle } : s)));
  };

  const addDocToSection = (index: number, documentId: string) => {
    const doc = pdfDocs.find((d) => d.id === documentId);
    if (!doc) return;

    setSections((prev) =>
      prev.map((s, i) => {
        if (i !== index) return s;
        if (s.documents.some((d) => d.documentId === documentId)) return s;
        return {
          ...s,
          documents: [...s.documents, { documentId, label: doc.originalName }],
        };
      }),
    );
  };

  const removeDocFromSection = (sectionIndex: number, docIndex: number) => {
    setSections((prev) =>
      prev.map((s, i) => {
        if (i !== sectionIndex) return s;
        return { ...s, documents: s.documents.filter((_, di) => di !== docIndex) };
      }),
    );
  };

  const start = async () => {
    setError(null);
    try {
      const spec: AuditPackageSpec = { sections };
      const job = await startAuditPackageJob(title, spec);
      await refreshJobs();
      setSelectedJobId(job.id);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to start audit package job');
    }
  };

  const cancel = async () => {
    if (!selectedJobId) return;
    setError(null);
    try {
      await cancelAuditPackageJob(selectedJobId);
      await refreshJobs();
      await refreshSelectedJob();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to cancel job');
    }
  };

  const openOutput = async () => {
    if (!selectedJob?.outputDocumentId) return;
    try {
      const doc = await getDocument(selectedJob.outputDocumentId);
      if (doc?.fileUrl) {
        window.open(doc.fileUrl, '_blank');
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to open output document');
    }
  };

  const statusBadge = (status: DocumentAuditPackageStatus) => {
    const base = 'px-2 py-1 rounded text-xs font-medium';
    if (status === DocumentAuditPackageStatus.COMPLETED) return `${base} bg-green-100 text-green-800`;
    if (status === DocumentAuditPackageStatus.FAILED) return `${base} bg-red-100 text-red-800`;
    if (status === DocumentAuditPackageStatus.CANCELLED) return `${base} bg-gray-100 text-gray-800`;
    if (status === DocumentAuditPackageStatus.PROCESSING) return `${base} bg-blue-100 text-blue-800`;
    return `${base} bg-yellow-100 text-yellow-800`;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">Audit Packages</h2>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Package Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="e.g., FY2025 Procurement Audit"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-gray-900">Sections</div>
            <button
              onClick={addSection}
              className="px-3 py-2 text-sm bg-gray-100 text-gray-800 rounded hover:bg-gray-200 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Section
            </button>
          </div>

          <div className="space-y-3">
            {sections.map((s, i) => (
              <div key={i} className="border border-gray-200 rounded p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <input
                    value={s.title}
                    onChange={(e) => updateSectionTitle(i, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  {sections.length > 1 && (
                    <button
                      onClick={() => removeSection(i)}
                      className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div className="md:col-span-2">
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      defaultValue=""
                      onChange={(e) => {
                        const id = e.target.value;
                        if (id) addDocToSection(i, id);
                        e.currentTarget.value = '';
                      }}
                    >
                      <option value="">Add PDF…</option>
                      {pdfDocs.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.originalName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="text-xs text-gray-600 flex items-center">
                    {s.documents.length} document(s)
                  </div>
                </div>

                {s.documents.length > 0 && (
                  <div className="space-y-2">
                    {s.documents.map((d, di) => (
                      <div key={`${d.documentId}-${di}`} className="flex items-center justify-between border border-gray-100 rounded p-2">
                        <div className="text-sm text-gray-900 truncate">{d.label || d.documentId}</div>
                        <button
                          onClick={() => removeDocFromSection(i, di)}
                          className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={start}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Start Job
            </button>
            <button
              onClick={refreshJobs}
              disabled={loading}
              className="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-gray-900">Recent Jobs</div>
          </div>

          <div>
            <select
              value={selectedJobId ?? ''}
              onChange={(e) => setSelectedJobId(e.target.value || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">Select job…</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} — {j.status}
                </option>
              ))}
            </select>
          </div>

          {selectedJob && (
            <div className="border border-gray-200 rounded p-3 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-medium text-gray-900 truncate">{selectedJob.title}</div>
                <div className={statusBadge(selectedJob.status)}>{selectedJob.status}</div>
              </div>

              {selectedJob.errorMessage && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
                  {selectedJob.errorMessage}
                </div>
              )}

              <div className="text-xs text-gray-600">
                Created: {new Date(selectedJob.createdAt).toLocaleString()}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={refreshSelectedJob}
                  disabled={loading}
                  className="px-3 py-2 text-sm bg-gray-100 text-gray-800 rounded hover:bg-gray-200 disabled:opacity-50"
                >
                  Refresh Status
                </button>

                {(selectedJob.status === DocumentAuditPackageStatus.PENDING ||
                  selectedJob.status === DocumentAuditPackageStatus.PROCESSING) && (
                  <button
                    onClick={cancel}
                    disabled={loading}
                    className="px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                )}

                {selectedJob.status === DocumentAuditPackageStatus.COMPLETED && selectedJob.outputDocumentId && (
                  <button
                    onClick={openOutput}
                    disabled={loading}
                    className="px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open Output
                  </button>
                )}
              </div>
            </div>
          )}

          {jobs.length === 0 && (
            <div className="text-sm text-gray-600">No jobs yet. Start one from the builder.</div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, ExternalLink, Loader2, Play, RefreshCw, Trash2, Plus } from 'lucide-react';
import { Document as DocType } from '@/types/document';
import { useDocuments } from '@/hooks/useDocuments';
import { DocumentFinalizeJob, DocumentFinalizeStatus, FinalizeRedaction, FinalizeJobOptions } from '@/types/finalize';
import { Document as PdfDocument, Page, pdfjs } from 'react-pdf';

type DragState = {
  page: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
} | null;

function sanitizeFilename(name: string) {
  return name.replace(/[^\w.-]/g, '_');
}

export default function FinalizeToolPanel({ documents }: { documents: DocType[] }) {
  const {
    startFinalizeJob,
    listFinalizeJobs,
    getFinalizeJob,
    cancelFinalizeJob,
    getDocument,
    loading,
  } = useDocuments();

  const pdfDocs = useMemo(() => documents.filter((d) => d.mimeType === 'application/pdf'), [documents]);

  const [documentId, setDocumentId] = useState(pdfDocs[0]?.id || '');
  const doc = useMemo(() => pdfDocs.find((d) => d.id === documentId) || null, [pdfDocs, documentId]);

  const [fileName, setFileName] = useState<string>('finalized.pdf');

  const [cleanupRasterize, setCleanupRasterize] = useState<boolean>(true);
  const [density, setDensity] = useState<number>(200);
  const [jpegQuality, setJpegQuality] = useState<number>(75);
  const [grayscale, setGrayscale] = useState<boolean>(false);
  const [normalize, setNormalize] = useState<boolean>(false);
  const [sharpen, setSharpen] = useState<boolean>(false);

  const [hasWatermark, setHasWatermark] = useState<boolean>(false);
  const [watermarkText, setWatermarkText] = useState<string>('CONFIDENTIAL');
  const [allowPrint, setAllowPrint] = useState<boolean>(true);
  const [allowCopy, setAllowCopy] = useState<boolean>(true);
  const [isPasswordProtected, setIsPasswordProtected] = useState<boolean>(false);
  const [password, setPassword] = useState<string>('');

  const [selectedPage, setSelectedPage] = useState<number>(1);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [drawMode, setDrawMode] = useState<boolean>(true);

  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [drag, setDrag] = useState<DragState>(null);

  const [redactions, setRedactions] = useState<FinalizeRedaction[]>([]);

  const [jobs, setJobs] = useState<DocumentFinalizeJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<DocumentFinalizeJob | null>(null);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    pdfjs.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs';
  }, []);

  useEffect(() => {
    setError(null);
    setNumPages(null);
    setSelectedPage(1);
    setRedactions([]);
    setSelectedJobId(null);
    setSelectedJob(null);
  }, [documentId]);

  const refreshJobs = async () => {
    if (!documentId) return;
    setError(null);
    try {
      const j = await listFinalizeJobs(documentId);
      setJobs(j);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load finalize jobs');
    }
  };

  const refreshSelectedJob = async () => {
    if (!selectedJobId) return;
    setError(null);
    try {
      const j = await getFinalizeJob(selectedJobId);
      setSelectedJob(j);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load finalize job');
    }
  };

  useEffect(() => {
    refreshJobs();
  }, [documentId]);

  useEffect(() => {
    if (selectedJobId) {
      refreshSelectedJob();
    } else {
      setSelectedJob(null);
    }
  }, [selectedJobId]);

  const dragRect = useMemo(() => {
    if (!drag) return null;
    const left = Math.min(drag.startX, drag.currentX);
    const top = Math.min(drag.startY, drag.currentY);
    const width = Math.abs(drag.currentX - drag.startX);
    const height = Math.abs(drag.currentY - drag.startY);
    return { left, top, width, height };
  }, [drag]);

  const addRedactionFromRect = (page: number, left: number, top: number, width: number, height: number) => {
    const el = overlayRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    if (width < 3 || height < 3) return;

    const x = left / rect.width;
    const y = top / rect.height;
    const w = width / rect.width;
    const h = height / rect.height;

    setRedactions((prev) => [
      ...prev,
      {
        page,
        x: Number(x.toFixed(4)),
        y: Number(y.toFixed(4)),
        width: Number(w.toFixed(4)),
        height: Number(h.toFixed(4)),
      },
    ]);
  };

  const startDrag = (e: React.MouseEvent) => {
    if (!drawMode) return;
    const el = overlayRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
    setDrag({ page: selectedPage, startX: x, startY: y, currentX: x, currentY: y });
  };

  const moveDrag = (e: React.MouseEvent) => {
    if (!drawMode) return;
    if (!drag) return;
    const el = overlayRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
    setDrag({ ...drag, currentX: x, currentY: y });
  };

  const endDrag = () => {
    if (!dragRect || !drag) {
      setDrag(null);
      return;
    }

    addRedactionFromRect(drag.page, dragRect.left, dragRect.top, dragRect.width, dragRect.height);
    setDrag(null);
  };

  const removeRedaction = (index: number) => {
    setRedactions((prev) => prev.filter((_, i) => i !== index));
  };

  const updateRedaction = (index: number, patch: Partial<FinalizeRedaction>) => {
    setRedactions((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const startJob = async () => {
    if (!documentId) return;

    setError(null);

    try {
      const options: FinalizeJobOptions = {
        fileName: sanitizeFilename(fileName || 'finalized.pdf'),
        cleanup: {
          rasterize: cleanupRasterize,
          density,
          jpegQuality,
          grayscale,
          normalize,
          sharpen,
        },
        redactions: redactions.length > 0 ? redactions : undefined,
        security: {
          hasWatermark,
          watermarkText,
          allowPrint,
          allowCopy,
          isPasswordProtected,
          password: isPasswordProtected ? password : undefined,
        },
      };

      const job = await startFinalizeJob(documentId, options);
      await refreshJobs();
      setSelectedJobId(job.id);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to start finalize job');
    }
  };

  const cancel = async () => {
    if (!selectedJobId) return;
    setError(null);
    try {
      await cancelFinalizeJob(selectedJobId);
      await refreshJobs();
      await refreshSelectedJob();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to cancel job');
    }
  };

  const openOutput = async () => {
    if (!documentId) return;
    try {
      const latest = await getDocument(documentId);
      if (latest?.fileUrl) {
        window.open(latest.fileUrl, '_blank');
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to open document');
    }
  };

  const statusBadge = (status: DocumentFinalizeStatus) => {
    const base = 'px-2 py-1 rounded text-xs font-medium';
    if (status === DocumentFinalizeStatus.COMPLETED) return `${base} bg-green-100 text-green-800`;
    if (status === DocumentFinalizeStatus.FAILED) return `${base} bg-red-100 text-red-800`;
    if (status === DocumentFinalizeStatus.CANCELLED) return `${base} bg-gray-100 text-gray-800`;
    if (status === DocumentFinalizeStatus.PROCESSING) return `${base} bg-blue-100 text-blue-800`;
    return `${base} bg-yellow-100 text-yellow-800`;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Finalize (Scan Cleanup + Permanent Redaction + Integrity Seal)</h2>
          <p className="text-sm text-gray-600">Creates a new PDF version and records a tamper-evident integrity seal.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">PDF Document</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={documentId}
              onChange={(e) => setDocumentId(e.target.value)}
            >
              {pdfDocs.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.originalName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Output Filename</label>
            <input
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="finalized.pdf"
            />
          </div>

          <div className="border border-gray-200 rounded p-3 space-y-3">
            <div className="text-sm font-medium text-gray-900">Scan Cleanup</div>

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={cleanupRasterize} onChange={(e) => setCleanupRasterize(e.target.checked)} />
              Rasterize + rebuild PDF
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Density</label>
                <input
                  type="number"
                  value={density}
                  onChange={(e) => setDensity(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">JPEG Quality</label>
                <input
                  type="number"
                  value={jpegQuality}
                  onChange={(e) => setJpegQuality(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  min={10}
                  max={100}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={grayscale} onChange={(e) => setGrayscale(e.target.checked)} />
                Grayscale
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={normalize} onChange={(e) => setNormalize(e.target.checked)} />
                Normalize
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={sharpen} onChange={(e) => setSharpen(e.target.checked)} />
                Sharpen
              </label>
            </div>
          </div>

          <div className="border border-gray-200 rounded p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-900">Permanent Redactions</div>
              <button
                onClick={() => setRedactions((prev) => [...prev, { page: 1, x: 0.1, y: 0.1, width: 0.3, height: 0.06 }])}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-800 rounded hover:bg-gray-200 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={drawMode} onChange={(e) => setDrawMode(e.target.checked)} />
              Draw mode
            </label>

            {redactions.length === 0 ? (
              <div className="text-sm text-gray-600">No redactions added.</div>
            ) : (
              <div className="space-y-2">
                {redactions.map((r, i) => (
                  <div key={i} className="border border-gray-100 rounded p-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-600">Redaction #{i + 1}</div>
                      <button
                        onClick={() => removeRedaction(i)}
                        className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      <input
                        type="number"
                        value={r.page}
                        onChange={(e) => updateRedaction(i, { page: Number(e.target.value) })}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="page"
                      />
                      <input
                        type="number"
                        value={r.x}
                        onChange={(e) => updateRedaction(i, { x: Number(e.target.value) })}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                        step="0.0001"
                        placeholder="x"
                      />
                      <input
                        type="number"
                        value={r.y}
                        onChange={(e) => updateRedaction(i, { y: Number(e.target.value) })}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                        step="0.0001"
                        placeholder="y"
                      />
                      <input
                        type="number"
                        value={r.width}
                        onChange={(e) => updateRedaction(i, { width: Number(e.target.value) })}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                        step="0.0001"
                        placeholder="width"
                      />
                      <input
                        type="number"
                        value={r.height}
                        onChange={(e) => updateRedaction(i, { height: Number(e.target.value) })}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                        step="0.0001"
                        placeholder="height"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border border-gray-200 rounded p-3 space-y-3">
            <div className="text-sm font-medium text-gray-900">Security</div>

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={hasWatermark} onChange={(e) => setHasWatermark(e.target.checked)} />
              Watermark
            </label>

            <input
              value={watermarkText}
              onChange={(e) => setWatermarkText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              disabled={!hasWatermark}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={allowPrint} onChange={(e) => setAllowPrint(e.target.checked)} />
                Allow print
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={allowCopy} onChange={(e) => setAllowCopy(e.target.checked)} />
                Allow copy
              </label>
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={isPasswordProtected} onChange={(e) => setIsPasswordProtected(e.target.checked)} />
              Password protected (app-enforced)
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              disabled={!isPasswordProtected}
              placeholder="Password"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={startJob}
              disabled={loading || !documentId}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Start Finalize Job
            </button>
            <button
              onClick={refreshJobs}
              disabled={loading || !documentId}
              className="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="border border-gray-200 rounded p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-900">Preview</div>
              <div className="text-xs text-gray-600">Page {selectedPage}{numPages ? ` / ${numPages}` : ''}</div>
            </div>

            {doc?.fileUrl ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={selectedPage}
                    onChange={(e) => setSelectedPage(Math.max(1, Number(e.target.value) || 1))}
                    className="w-28 px-2 py-1 border border-gray-300 rounded text-sm"
                    min={1}
                  />
                  <div className="text-xs text-gray-600">Select page to draw redactions</div>
                </div>

                <div className="relative border border-gray-200 rounded overflow-hidden">
                  <div
                    ref={overlayRef}
                    className="absolute inset-0 z-10"
                    onMouseDown={startDrag}
                    onMouseMove={moveDrag}
                    onMouseUp={endDrag}
                    onMouseLeave={endDrag}
                  >
                    {dragRect && drawMode && (
                      <div
                        className="absolute border-2 border-red-600 bg-red-600/10"
                        style={{ left: dragRect.left, top: dragRect.top, width: dragRect.width, height: dragRect.height }}
                      />
                    )}

                    {redactions
                      .filter((r) => r.page === selectedPage)
                      .map((r, idx) => (
                        <div
                          key={idx}
                          className="absolute bg-black/40 border border-black"
                          style={{
                            left: `${r.x * 100}%`,
                            top: `${r.y * 100}%`,
                            width: `${r.width * 100}%`,
                            height: `${r.height * 100}%`,
                          }}
                        />
                      ))}
                  </div>

                  <PdfDocument
                    file={doc.fileUrl}
                    onLoadSuccess={(loaded) => setNumPages(loaded.numPages)}
                    onLoadError={() => setError('Failed to load PDF preview')}
                    loading={<div className="p-4 text-sm text-gray-600">Loading PDF…</div>}
                  >
                    <Page pageNumber={selectedPage} width={520} renderTextLayer={false} renderAnnotationLayer={false} />
                  </PdfDocument>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-600">Select a PDF document to preview.</div>
            )}
          </div>

          <div className="border border-gray-200 rounded p-3 space-y-3">
            <div className="text-sm font-medium text-gray-900">Finalize Jobs</div>

            <select
              value={selectedJobId ?? ''}
              onChange={(e) => setSelectedJobId(e.target.value || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              disabled={!documentId}
            >
              <option value="">Select job…</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {new Date(j.createdAt).toLocaleString()} — {j.status}
                </option>
              ))}
            </select>

            {selectedJob && (
              <div className="border border-gray-100 rounded p-3 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm text-gray-900 truncate">Job {selectedJob.id}</div>
                  <div className={statusBadge(selectedJob.status)}>{selectedJob.status}</div>
                </div>

                {selectedJob.errorMessage && (
                  <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
                    {selectedJob.errorMessage}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={refreshSelectedJob}
                    disabled={loading}
                    className="px-3 py-2 text-sm bg-gray-100 text-gray-800 rounded hover:bg-gray-200 disabled:opacity-50"
                  >
                    Refresh Status
                  </button>

                  {(selectedJob.status === DocumentFinalizeStatus.PENDING ||
                    selectedJob.status === DocumentFinalizeStatus.PROCESSING) && (
                    <button
                      onClick={cancel}
                      disabled={loading}
                      className="px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  )}

                  {selectedJob.status === DocumentFinalizeStatus.COMPLETED && (
                    <button
                      onClick={openOutput}
                      disabled={loading}
                      className="px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open Document
                    </button>
                  )}
                </div>
              </div>
            )}

            {jobs.length === 0 && <div className="text-sm text-gray-600">No finalize jobs yet.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

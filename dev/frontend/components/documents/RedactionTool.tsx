'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import api from '@/lib/api';
import { Document as DocType } from '@/types/document';
import { Download, Loader2, Plus, Trash2 } from 'lucide-react';
import { Document as PdfDocument, Page, pdfjs } from 'react-pdf';

const PdfViewerClient = dynamic(() => import('./PdfViewerClient'), {
  ssr: false,
  loading: () => <div className="text-sm text-gray-600">Loading PDF preview...</div>,
});

function sanitizeFilename(name: string) {
  return name.replace(/[^\w.-]/g, '_');
}

function getFilenameFromContentDisposition(contentDisposition?: string | null): string | null {
  if (!contentDisposition) return null;
  const match = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(contentDisposition);
  const raw = decodeURIComponent(match?.[1] || match?.[2] || '').trim();
  return raw || null;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

type Redaction = { page: number; x: number; y: number; width: number; height: number };

type DragState = {
  page: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
} | null;

export default function RedactionTool({ documents }: { documents: DocType[] }) {
  const [documentId, setDocumentId] = useState(documents[0]?.id || '');
  const doc = useMemo(() => documents.find((d) => d.id === documentId) || null, [documents, documentId]);

  const [density, setDensity] = useState<number>(200);
  const [fileName, setFileName] = useState<string>('redacted.pdf');

  const [selectedPage, setSelectedPage] = useState<number>(1);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [drawMode, setDrawMode] = useState<boolean>(true);

  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [drag, setDrag] = useState<DragState>(null);

  const [redactions, setRedactions] = useState<Redaction[]>([
    { page: 1, x: 0.1, y: 0.1, width: 0.3, height: 0.06 },
  ]);

  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFilename, setPreviewFilename] = useState<string>('redacted.pdf');

  useEffect(() => {
    return () => {
      if (previewUrl) {
        window.URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    pdfjs.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs';
  }, []);

  useEffect(() => {
    setError(null);
    setNumPages(null);
    setSelectedPage(1);
    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }, [documentId]);

  const getRelativePoint = (clientX: number, clientY: number) => {
    const el = overlayRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, clientY - rect.top));
    return { x, y, width: rect.width, height: rect.height };
  };

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

    setRedactions((prev) => [...prev, { page, x: Number(x.toFixed(4)), y: Number(y.toFixed(4)), width: Number(w.toFixed(4)), height: Number(h.toFixed(4)) }]);
  };

  const addRedaction = () => {
    setRedactions((prev) => [...prev, { page: 1, x: 0.1, y: 0.1, width: 0.3, height: 0.06 }]);
  };

  const clearPageRedactions = (page: number) => {
    setRedactions((prev) => prev.filter((r) => r.page !== page));
  };

  const removeRedaction = (index: number) => {
    setRedactions((prev) => prev.filter((_, i) => i !== index));
  };

  const updateRedaction = (index: number, patch: Partial<Redaction>) => {
    setRedactions((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const validate = () => {
    if (!documentId) throw new Error('Select a PDF');
    if (!redactions || redactions.length === 0) throw new Error('Add at least one redaction');

    for (const r of redactions) {
      if (![r.page, r.x, r.y, r.width, r.height].every((v) => Number.isFinite(v))) {
        throw new Error('All redaction fields must be numbers');
      }
      if (r.page < 1) throw new Error('page must be >= 1');
      if ([r.x, r.y, r.width, r.height].some((v) => v < 0 || v > 1)) {
        throw new Error('x/y/width/height must be normalized between 0 and 1');
      }
      if (r.width <= 0 || r.height <= 0) throw new Error('width/height must be > 0');
    }
  };

  const apply = async () => {
    setError(null);
    setIsApplying(true);
    try {
      validate();

      if (previewUrl) {
        window.URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }

      const outName = sanitizeFilename(fileName || 'redacted.pdf');

      const response = await api.post(
        `/documents/${documentId}/redact`,
        {
          redactions,
          density,
          fileName: outName,
        },
        { responseType: 'blob' },
      );

      const cd = response.headers?.['content-disposition'] as string | undefined;
      const resolved = getFilenameFromContentDisposition(cd) || outName;
      setPreviewFilename(resolved);

      const url = window.URL.createObjectURL(new Blob([response.data]));
      setPreviewUrl(url);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to apply redaction');
    } finally {
      setIsApplying(false);
    }
  };

  const downloadPreview = () => {
    if (!previewUrl) return;
    fetch(previewUrl)
      .then((r) => r.blob())
      .then((blob) => downloadBlob(blob, previewFilename))
      .catch(() => setError('Failed to download preview file'));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Redaction Tool</h2>
        <p className="text-sm text-gray-600 mb-4">Draw black boxes on a page (click-drag) or edit normalized coordinates (0..1).</p>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">{error}</div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">PDF</label>
          <select
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            value={documentId}
            onChange={(e) => setDocumentId(e.target.value)}
          >
            {documents.map((d) => (
              <option key={d.id} value={d.id}>
                {d.originalName}
              </option>
            ))}
          </select>
        </div>

        <div className="border border-gray-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="text-sm font-medium text-gray-900">Draw redactions</div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={drawMode} onChange={(e) => setDrawMode(e.target.checked)} />
              Draw mode
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Page</label>
              <input
                type="number"
                min={1}
                max={numPages || undefined}
                value={selectedPage}
                onChange={(e) => setSelectedPage(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
              {numPages ? <div className="text-xs text-gray-500 mt-1">Total pages: {numPages}</div> : null}
            </div>

            <div className="md:col-span-2 flex items-end justify-end gap-2">
              <button
                onClick={() => clearPageRedactions(selectedPage)}
                className="px-3 py-2 rounded-md bg-gray-100 text-gray-700 text-sm hover:bg-gray-200"
              >
                Clear page {selectedPage}
              </button>
            </div>
          </div>

          {!doc ? (
            <div className="text-sm text-gray-600">Select a PDF to start.</div>
          ) : (
            <div className="relative">
              <PdfDocument
                file={doc.fileUrl}
                onLoadSuccess={(info: any) => {
                  const pages = Number(info?.numPages);
                  if (Number.isFinite(pages) && pages > 0) {
                    setNumPages(pages);
                    setSelectedPage((prev) => Math.min(Math.max(1, prev), pages));
                  }
                }}
                onLoadError={() => setError('Failed to load PDF for redaction drawing')}
                loading={<div className="text-sm text-gray-600">Loading PDF...</div>}
              >
                <div className="relative inline-block">
                  <Page pageNumber={selectedPage} width={520} renderTextLayer={false} renderAnnotationLayer={false} />
                  <div
                    ref={overlayRef}
                    className="absolute inset-0"
                    style={{ cursor: drawMode ? 'crosshair' : 'default' }}
                    onMouseDown={(e) => {
                      if (!drawMode) return;
                      const p = getRelativePoint(e.clientX, e.clientY);
                      if (!p) return;
                      setDrag({
                        page: selectedPage,
                        startX: p.x,
                        startY: p.y,
                        currentX: p.x,
                        currentY: p.y,
                      });
                    }}
                    onMouseMove={(e) => {
                      if (!drawMode) return;
                      setDrag((prev) => {
                        if (!prev) return prev;
                        const p = getRelativePoint(e.clientX, e.clientY);
                        if (!p) return prev;
                        return { ...prev, currentX: p.x, currentY: p.y };
                      });
                    }}
                    onMouseUp={() => {
                      if (!drawMode) return;
                      if (!dragRect || !drag) return;
                      addRedactionFromRect(drag.page, dragRect.left, dragRect.top, dragRect.width, dragRect.height);
                      setDrag(null);
                    }}
                    onMouseLeave={() => {
                      if (!drawMode) return;
                      setDrag(null);
                    }}
                  >
                    {redactions
                      .filter((r) => r.page === selectedPage)
                      .map((r, idx) => (
                        <div
                          key={`r-${idx}`}
                          className="absolute bg-black"
                          style={{
                            left: `${r.x * 100}%`,
                            top: `${r.y * 100}%`,
                            width: `${r.width * 100}%`,
                            height: `${r.height * 100}%`,
                            opacity: 0.85,
                          }}
                        />
                      ))}
                    {dragRect ? (
                      <div
                        className="absolute border-2 border-red-600 bg-red-200"
                        style={{ left: dragRect.left, top: dragRect.top, width: dragRect.width, height: dragRect.height, opacity: 0.35 }}
                      />
                    ) : null}
                  </div>
                </div>
              </PdfDocument>
              <div className="text-xs text-gray-500 mt-2">
                Tip: The black boxes you draw correspond to rasterized page coordinates; verify the preview after applying.
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Raster density</label>
            <input
              type="number"
              min={72}
              value={density}
              onChange={(e) => setDensity(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Output filename</label>
            <input
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              placeholder="redacted.pdf"
            />
          </div>
        </div>

        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-gray-900">Redactions</div>
          <button
            onClick={addRedaction}
            className="px-3 py-2 rounded-md bg-gray-100 text-gray-700 text-sm hover:bg-gray-200 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="grid grid-cols-6 gap-2 px-3 py-2 bg-gray-50 text-xs font-medium text-gray-700">
            <div>Page</div>
            <div>X</div>
            <div>Y</div>
            <div>W</div>
            <div>H</div>
            <div></div>
          </div>
          <div className="divide-y divide-gray-200">
            {redactions.map((r, idx) => (
              <div key={idx} className="grid grid-cols-6 gap-2 px-3 py-2 items-center">
                <input
                  type="number"
                  min={1}
                  value={r.page}
                  onChange={(e) => updateRedaction(idx, { page: Number(e.target.value) })}
                  className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                />
                <input
                  type="number"
                  step={0.01}
                  value={r.x}
                  onChange={(e) => updateRedaction(idx, { x: Number(e.target.value) })}
                  className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                />
                <input
                  type="number"
                  step={0.01}
                  value={r.y}
                  onChange={(e) => updateRedaction(idx, { y: Number(e.target.value) })}
                  className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                />
                <input
                  type="number"
                  step={0.01}
                  value={r.width}
                  onChange={(e) => updateRedaction(idx, { width: Number(e.target.value) })}
                  className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                />
                <input
                  type="number"
                  step={0.01}
                  value={r.height}
                  onChange={(e) => updateRedaction(idx, { height: Number(e.target.value) })}
                  className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                />
                <button
                  onClick={() => removeRedaction(idx)}
                  className="p-2 rounded hover:bg-red-50 justify-self-end"
                  title="Remove"
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end">
          <button
            onClick={apply}
            disabled={isApplying}
            className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isApplying ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Apply redaction
          </button>
        </div>

        <div className="mt-3 text-xs text-gray-500">
          Tip: Start with density 200. Higher density increases quality but also file size and processing time.
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Preview</h2>
        <p className="text-sm text-gray-600 mb-4">Preview the redacted output before downloading.</p>

        {!previewUrl ? (
          <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center text-sm text-gray-600">
            Apply redactions to generate a preview.
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-gray-900 truncate">{previewFilename}</div>
              <button
                onClick={downloadPreview}
                className="px-3 py-2 rounded-md bg-green-600 text-white text-sm hover:bg-green-700 flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </button>
            </div>
            <PdfViewerClient fileUrl={previewUrl} zoom={90} onError={() => setError('Failed to preview redacted PDF')} />
          </>
        )}

        {doc && (
          <div className="mt-4 text-xs text-gray-500">
            Source: {doc.originalName}
          </div>
        )}
      </div>
    </div>
  );
}

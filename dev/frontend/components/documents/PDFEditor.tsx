'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import api from '@/lib/api';
import { Document as DocType } from '@/types/document';
import { Download, Loader2, RotateCw, Scissors, Hash, Droplet, ArrowUp, ArrowDown, FileText } from 'lucide-react';
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

function parseNumberList(input: string): number[] {
  const trimmed = (input || '').trim();
  if (!trimmed) return [];

  const parts = trimmed.split(',').map((p) => p.trim()).filter(Boolean);
  const out: number[] = [];

  for (const part of parts) {
    if (part.includes('-')) {
      const [a, b] = part.split('-').map((x) => x.trim());
      const start = Number(a);
      const end = Number(b);
      if (!Number.isFinite(start) || !Number.isFinite(end)) {
        throw new Error(`Invalid range: ${part}`);
      }
      const s = Math.min(start, end);
      const e = Math.max(start, end);
      for (let i = s; i <= e; i++) out.push(i);
    } else {
      const n = Number(part);
      if (!Number.isFinite(n)) {
        throw new Error(`Invalid page number: ${part}`);
      }
      out.push(n);
    }
  }

  return Array.from(new Set(out));
}

export default function PDFEditor({ documents }: { documents: DocType[] }) {
  const [documentId, setDocumentId] = useState(documents[0]?.id || '');
  const doc = useMemo(() => documents.find((d) => d.id === documentId) || null, [documents, documentId]);

  const [numPages, setNumPages] = useState<number | null>(null);

  const [order, setOrder] = useState<number[]>([]);
  const [pagesInput, setPagesInput] = useState<string>('');

  const [rotationDegrees, setRotationDegrees] = useState<number>(90);

  const [pageNumberPosition, setPageNumberPosition] = useState<'bottom-right' | 'bottom-center' | 'bottom-left' | 'top-right' | 'top-center' | 'top-left'>('bottom-right');
  const [pageNumberStartAt, setPageNumberStartAt] = useState<number>(1);

  const [watermarkText, setWatermarkText] = useState<string>('CONFIDENTIAL');
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(0.15);
  const [watermarkRotation, setWatermarkRotation] = useState<number>(-35);

  const [headerText, setHeaderText] = useState<string>('');
  const [footerText, setFooterText] = useState<string>('');

  const [compressRasterize, setCompressRasterize] = useState(false);
  const [compressDensity, setCompressDensity] = useState<number>(180);
  const [compressJpegQuality, setCompressJpegQuality] = useState<number>(75);

  const [outputFileName, setOutputFileName] = useState<string>('edited.pdf');

  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFilename, setPreviewFilename] = useState<string>('edited.pdf');

  const [thumbDragIndex, setThumbDragIndex] = useState<number | null>(null);

  useEffect(() => {
    pdfjs.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs';
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        window.URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    setError(null);
    setNumPages(null);
    setOrder([]);
    setPagesInput('');
    setOutputFileName('edited.pdf');

    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }, [documentId]);

  const ensureOrderInitialized = () => {
    if (!numPages) {
      setError('Wait for the PDF to load (page count unknown).');
      return null;
    }

    if (order.length === numPages) return order;

    const initial = Array.from({ length: numPages }, (_, i) => i + 1);
    setOrder(initial);
    return initial;
  };

  const move = (index: number, delta: number) => {
    setOrder((prev) => {
      const next = prev.length > 0 ? [...prev] : [];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      const tmp = next[index];
      next[index] = next[target];
      next[target] = tmp;
      return next;
    });
  };

  const moveToIndex = (from: number, to: number) => {
    setOrder((prev) => {
      if (from < 0 || from >= prev.length || to < 0 || to >= prev.length) return prev;
      if (from === to) return prev;
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  const removeFromOrder = (index: number) => {
    setOrder((prev) => prev.filter((_, i) => i !== index));
  };

  const setPreviewFromResponse = async (response: any, fallbackName: string) => {
    const cd = response.headers?.['content-disposition'] as string | undefined;
    const filename = getFilenameFromContentDisposition(cd) || fallbackName;

    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

    setPreviewFilename(filename);
    const url = window.URL.createObjectURL(new Blob([response.data]));
    setPreviewUrl(url);
  };

  const doAction = async (action: () => Promise<any>) => {
    setError(null);
    setIsWorking(true);
    try {
      await action();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Operation failed');
    } finally {
      setIsWorking(false);
    }
  };

  const downloadPreview = () => {
    if (!previewUrl) return;
    fetch(previewUrl)
      .then((r) => r.blob())
      .then((blob) => downloadBlob(blob, previewFilename))
      .catch(() => setError('Failed to download preview file'));
  };

  const splitPdf = async () => {
    await doAction(async () => {
      const response = await api.post(`/documents/${documentId}/split`, {}, { responseType: 'blob' });
      const cd = response.headers?.['content-disposition'] as string | undefined;
      const filename = getFilenameFromContentDisposition(cd) || `split-${documentId}.zip`;
      downloadBlob(new Blob([response.data]), filename);
    });
  };

  const extractPages = async () => {
    await doAction(async () => {
      const pages = parseNumberList(pagesInput);
      if (pages.length === 0) throw new Error('Enter pages to extract, e.g. 1-3,5');

      const fileName = sanitizeFilename(outputFileName || `extracted-${documentId}.pdf`);
      const response = await api.post(`/documents/${documentId}/extract-pages`, { pages, fileName }, { responseType: 'blob' });
      await setPreviewFromResponse(response, fileName);
    });
  };

  const reorderPages = async () => {
    await doAction(async () => {
      const currentOrder = ensureOrderInitialized();
      if (!currentOrder) return;

      const fileName = sanitizeFilename(outputFileName || `reordered-${documentId}.pdf`);

      // If pages were deleted (order length differs), use extract-pages which supports ordered subsets.
      if (numPages && currentOrder.length !== numPages) {
        const response = await api.post(
          `/documents/${documentId}/extract-pages`,
          { pages: currentOrder, fileName },
          { responseType: 'blob' },
        );
        await setPreviewFromResponse(response, fileName);
        return;
      }

      const response = await api.post(
        `/documents/${documentId}/reorder`,
        { order: currentOrder, fileName },
        { responseType: 'blob' },
      );
      await setPreviewFromResponse(response, fileName);
    });
  };

  const rotate = async () => {
    await doAction(async () => {
      const pages = pagesInput ? parseNumberList(pagesInput) : undefined;
      const fileName = sanitizeFilename(outputFileName || `rotated-${documentId}.pdf`);
      const response = await api.post(
        `/documents/${documentId}/rotate`,
        { rotationDegrees, pages, fileName },
        { responseType: 'blob' },
      );
      await setPreviewFromResponse(response, fileName);
    });
  };

  const addPageNumbers = async () => {
    await doAction(async () => {
      const fileName = sanitizeFilename(outputFileName || `numbered-${documentId}.pdf`);
      const response = await api.post(
        `/documents/${documentId}/add-page-numbers`,
        {
          position: pageNumberPosition,
          startAt: pageNumberStartAt,
          fileName,
        },
        { responseType: 'blob' },
      );
      await setPreviewFromResponse(response, fileName);
    });
  };

  const addWatermark = async () => {
    await doAction(async () => {
      const text = (watermarkText || '').trim();
      if (!text) throw new Error('Watermark text is required');

      const fileName = sanitizeFilename(outputFileName || `watermarked-${documentId}.pdf`);
      const response = await api.post(
        `/documents/${documentId}/watermark`,
        {
          text,
          opacity: watermarkOpacity,
          rotationDegrees: watermarkRotation,
          fileName,
        },
        { responseType: 'blob' },
      );
      await setPreviewFromResponse(response, fileName);
    });
  };

  const addHeadersFooters = async () => {
    await doAction(async () => {
      const fileName = sanitizeFilename(outputFileName || `headers-footers-${documentId}.pdf`);
      const response = await api.post(
        `/documents/${documentId}/add-headers-footers`,
        {
          headerText,
          footerText,
          fileName,
        },
        { responseType: 'blob' },
      );
      await setPreviewFromResponse(response, fileName);
    });
  };

  const compress = async () => {
    await doAction(async () => {
      const fileName = sanitizeFilename(outputFileName || `compressed-${documentId}.pdf`);
      const response = await api.post(
        `/documents/${documentId}/compress`,
        {
          rasterize: compressRasterize,
          density: compressDensity,
          jpegQuality: compressJpegQuality,
          fileName,
        },
        { responseType: 'blob' },
      );
      await setPreviewFromResponse(response, fileName);
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Edit & Organize</h2>
        <p className="text-sm text-gray-600 mb-4">Split, extract, reorder, rotate, page-number, watermark, header/footer, and compress PDFs.</p>

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

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Pages (for extract/rotate)</label>
          <input
            value={pagesInput}
            onChange={(e) => setPagesInput(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            placeholder="e.g. 1-3,5"
          />
          <div className="text-xs text-gray-500 mt-1">Leave blank to rotate all pages. For extract, this field is required.</div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Output filename</label>
          <input
            value={outputFileName}
            onChange={(e) => setOutputFileName(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            placeholder="edited.pdf"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <button
            onClick={splitPdf}
            disabled={isWorking}
            className="px-4 py-2 rounded-md bg-gray-100 text-gray-800 text-sm hover:bg-gray-200 flex items-center gap-2"
          >
            <Scissors className="h-4 w-4" />
            Split (ZIP)
          </button>

          <button
            onClick={extractPages}
            disabled={isWorking}
            className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700 flex items-center gap-2"
          >
            {isWorking ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            Extract pages
          </button>

          <button
            onClick={reorderPages}
            disabled={isWorking}
            className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700 flex items-center gap-2"
          >
            {isWorking ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
            Apply reorder
          </button>

          <button
            onClick={rotate}
            disabled={isWorking}
            className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700 flex items-center gap-2"
          >
            {isWorking ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}
            Rotate
          </button>

          <button
            onClick={addPageNumbers}
            disabled={isWorking}
            className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700 flex items-center gap-2"
          >
            {isWorking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Hash className="h-4 w-4" />}
            Add page numbers
          </button>

          <button
            onClick={addWatermark}
            disabled={isWorking}
            className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700 flex items-center gap-2"
          >
            {isWorking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Droplet className="h-4 w-4" />}
            Watermark
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="border border-gray-200 rounded-lg p-3">
            <div className="text-sm font-medium text-gray-900 mb-2">Rotate</div>
            <select
              value={rotationDegrees}
              onChange={(e) => setRotationDegrees(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value={0}>0</option>
              <option value={90}>90</option>
              <option value={180}>180</option>
              <option value={270}>270</option>
            </select>
          </div>

          <div className="border border-gray-200 rounded-lg p-3">
            <div className="text-sm font-medium text-gray-900 mb-2">Page numbers</div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={pageNumberPosition}
                onChange={(e) => setPageNumberPosition(e.target.value as any)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="bottom-right">Bottom right</option>
                <option value="bottom-center">Bottom center</option>
                <option value="bottom-left">Bottom left</option>
                <option value="top-right">Top right</option>
                <option value="top-center">Top center</option>
                <option value="top-left">Top left</option>
              </select>
              <input
                type="number"
                min={1}
                value={pageNumberStartAt}
                onChange={(e) => setPageNumberStartAt(Number(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="Start"
              />
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-3">
            <div className="text-sm font-medium text-gray-900 mb-2">Header / Footer</div>
            <input
              value={headerText}
              onChange={(e) => setHeaderText(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mb-2"
              placeholder="Header text"
            />
            <input
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              placeholder="Footer text"
            />
            <button
              onClick={addHeadersFooters}
              disabled={isWorking}
              className="mt-2 w-full px-3 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              Apply header/footer
            </button>
          </div>

          <div className="border border-gray-200 rounded-lg p-3">
            <div className="text-sm font-medium text-gray-900 mb-2">Compress</div>
            <label className="flex items-center gap-2 text-sm text-gray-700 mb-2">
              <input
                type="checkbox"
                checked={compressRasterize}
                onChange={(e) => setCompressRasterize(e.target.checked)}
              />
              Rasterize (strong compression)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                min={72}
                value={compressDensity}
                onChange={(e) => setCompressDensity(Number(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="Density"
              />
              <input
                type="number"
                min={10}
                max={100}
                value={compressJpegQuality}
                onChange={(e) => setCompressJpegQuality(Number(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="JPEG quality"
              />
            </div>
            <button
              onClick={compress}
              disabled={isWorking}
              className="mt-2 w-full px-3 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              Compress
            </button>
          </div>

          <div className="border border-gray-200 rounded-lg p-3 md:col-span-2">
            <div className="text-sm font-medium text-gray-900 mb-2">Watermark</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <input
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="CONFIDENTIAL"
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  step={0.05}
                  min={0}
                  max={1}
                  value={watermarkOpacity}
                  onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                  placeholder="Opacity"
                />
                <input
                  type="number"
                  value={watermarkRotation}
                  onChange={(e) => setWatermarkRotation(Number(e.target.value))}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                  placeholder="Rotation"
                />
                <button
                  onClick={addWatermark}
                  disabled={isWorking}
                  className="px-3 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-3 py-2 bg-gray-50 text-xs font-medium text-gray-700">Page order</div>
          <div className="p-3">
            <div className="text-xs text-gray-500 mb-2">
              This list is initialized after the PDF loads and the page count is known.
            </div>
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={() => ensureOrderInitialized()}
                className="px-3 py-2 rounded-md bg-gray-100 text-gray-700 text-sm hover:bg-gray-200"
              >
                Initialize order
              </button>
              <div className="text-sm text-gray-600">Pages: {numPages ?? '...'}</div>
            </div>
            <div className="max-h-56 overflow-auto border border-gray-200 rounded-md">
              {order.length === 0 ? (
                <div className="p-3 text-sm text-gray-600">No order loaded yet.</div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {order.map((p, idx) => (
                    <li key={`${p}-${idx}`} className="p-2 flex items-center justify-between">
                      <div className="text-sm text-gray-900">Page {p}</div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => move(idx, -1)}
                          disabled={idx === 0}
                          className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
                          title="Move up"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => move(idx, 1)}
                          disabled={idx === order.length - 1}
                          className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
                          title="Move down"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => removeFromOrder(idx)}
                          className="p-2 rounded hover:bg-red-50"
                          title="Delete page"
                        >
                          <span className="text-xs text-red-700 font-medium">Del</span>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-3 py-2 bg-gray-50 text-xs font-medium text-gray-700">Thumbnails (drag to reorder)</div>
          <div className="p-3">
            {!doc ? (
              <div className="text-sm text-gray-600">No PDF selected.</div>
            ) : order.length === 0 ? (
              <div className="text-sm text-gray-600">Initialize the order to see thumbnails.</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <PdfDocument
                  file={doc.fileUrl}
                  onLoadError={() => setError('Failed to load PDF for thumbnails')}
                  loading={<div className="text-sm text-gray-600">Loading thumbnails...</div>}
                >
                  {order.slice(0, 20).map((pageNumber, idx) => (
                    <div
                      key={`thumb-${pageNumber}-${idx}`}
                      className="border border-gray-200 rounded-md p-2 bg-white cursor-move"
                      draggable
                      onDragStart={() => setThumbDragIndex(idx)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (thumbDragIndex === null) return;
                        moveToIndex(thumbDragIndex, idx);
                        setThumbDragIndex(null);
                      }}
                      onDragEnd={() => setThumbDragIndex(null)}
                    >
                      <div className="text-xs text-gray-700 mb-1">Page {pageNumber}</div>
                      <Page
                        pageNumber={pageNumber}
                        width={140}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                      />
                    </div>
                  ))}
                </PdfDocument>
              </div>
            )}
            {order.length > 20 && (
              <div className="text-xs text-gray-500 mt-2">Showing first 20 pages only.</div>
            )}
          </div>
        </div>

        {doc && (
          <PdfDocument
            file={doc.fileUrl}
            onLoadSuccess={(info: any) => {
              const pages = Number(info?.numPages);
              if (Number.isFinite(pages) && pages > 0) {
                setNumPages(pages);
                setOrder((prev) => (prev.length === pages ? prev : Array.from({ length: pages }, (_, i) => i + 1)));
              }
            }}
            onLoadError={() => {
              setError('Failed to load PDF page count');
            }}
            className="hidden"
          />
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Preview</h2>
        <p className="text-sm text-gray-600 mb-4">Preview the most recent output before downloading.</p>

        {!previewUrl ? (
          <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center text-sm text-gray-600">
            Run an operation to generate an output preview.
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
            <PdfViewerClient fileUrl={previewUrl} zoom={90} onError={() => setError('Failed to preview output PDF')} />
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

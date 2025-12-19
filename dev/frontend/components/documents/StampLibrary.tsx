'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import api from '@/lib/api';
import { Document as DocType } from '@/types/document';
import { Download, Loader2 } from 'lucide-react';

const PdfViewerClient = dynamic(() => import('./PdfViewerClient'), {
  ssr: false,
  loading: () => <div className="text-sm text-gray-600">Loading PDF preview...</div>,
});

const PRESET_STAMPS = ['APPROVED', 'PAID', 'CONFIDENTIAL', 'URGENT'];

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

export default function StampLibrary({ documents }: { documents: DocType[] }) {
  const [documentId, setDocumentId] = useState(documents[0]?.id || '');
  const doc = useMemo(() => documents.find((d) => d.id === documentId) || null, [documents, documentId]);

  const [stampText, setStampText] = useState('APPROVED');
  const [page, setPage] = useState<number>(1);
  const [fontSize, setFontSize] = useState<number>(36);
  const [x, setX] = useState<number | ''>('');
  const [y, setY] = useState<number | ''>('');
  const [rotationDegrees, setRotationDegrees] = useState<number>(0);
  const [fileName, setFileName] = useState<string>('stamped.pdf');

  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFilename, setPreviewFilename] = useState<string>('stamped.pdf');

  useEffect(() => {
    return () => {
      if (previewUrl) {
        window.URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const applyStamp = async () => {
    setError(null);
    if (!documentId) {
      setError('Select a PDF');
      return;
    }

    const text = (stampText || '').trim();
    if (!text) {
      setError('Stamp text is required');
      return;
    }

    setIsApplying(true);
    try {
      if (previewUrl) {
        window.URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }

      const payload: any = {
        text,
        page,
        fontSize,
        rotationDegrees,
        fileName: sanitizeFilename(fileName || 'stamped.pdf'),
      };

      if (x !== '') payload.x = Number(x);
      if (y !== '') payload.y = Number(y);

      const response = await api.post(`/documents/${documentId}/stamp`, payload, { responseType: 'blob' });

      const cd = response.headers?.['content-disposition'] as string | undefined;
      const resolved = getFilenameFromContentDisposition(cd) || payload.fileName;
      setPreviewFilename(resolved);

      const url = window.URL.createObjectURL(new Blob([response.data]));
      setPreviewUrl(url);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to apply stamp');
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
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Stamp Library</h2>
        <p className="text-sm text-gray-600 mb-4">Apply pre-made or custom stamps (APPROVED, CONFIDENTIAL, etc.).</p>

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

        <div className="mb-3">
          <div className="text-sm font-medium text-gray-700 mb-2">Quick stamps</div>
          <div className="flex flex-wrap gap-2">
            {PRESET_STAMPS.map((s) => (
              <button
                key={s}
                onClick={() => setStampText(s)}
                className={
                  stampText === s
                    ? 'px-3 py-2 rounded-md bg-blue-600 text-white text-sm'
                    : 'px-3 py-2 rounded-md bg-gray-100 text-gray-700 text-sm hover:bg-gray-200'
                }
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stamp text</label>
            <input
              value={stampText}
              onChange={(e) => setStampText(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Page</label>
            <input
              type="number"
              min={1}
              value={page}
              onChange={(e) => setPage(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Font size</label>
            <input
              type="number"
              min={8}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rotation (0/90/180/270)</label>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">X (optional, PDF units)</label>
            <input
              type="number"
              value={x}
              onChange={(e) => setX(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              placeholder="auto"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Y (optional, PDF units)</label>
            <input
              type="number"
              value={y}
              onChange={(e) => setY(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              placeholder="auto"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Output filename</label>
          <input
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            placeholder="stamped.pdf"
          />
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            onClick={applyStamp}
            disabled={isApplying}
            className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isApplying ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Apply Stamp
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Preview</h2>
        <p className="text-sm text-gray-600 mb-4">Preview the stamped output before downloading.</p>

        {!previewUrl ? (
          <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center text-sm text-gray-600">
            Apply a stamp to generate a preview.
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
            <PdfViewerClient fileUrl={previewUrl} zoom={90} onError={() => setError('Failed to preview stamped PDF')} />
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

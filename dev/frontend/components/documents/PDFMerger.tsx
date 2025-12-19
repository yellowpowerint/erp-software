'use client';

import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { Document as DocType } from '@/types/document';
import dynamic from 'next/dynamic';
import { ArrowDown, ArrowUp, Download, Loader2, Trash2 } from 'lucide-react';

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

export default function PDFMerger({ documents }: { documents: DocType[] }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [mergeFileName, setMergeFileName] = useState<string>('merged.pdf');
  const [isMerging, setIsMerging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFilename, setPreviewFilename] = useState<string>('merged.pdf');

  useEffect(() => {
    return () => {
      if (previewUrl) {
        window.URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const selectedDocs = useMemo(() => {
    const map = new Map(documents.map((d) => [d.id, d] as const));
    return selectedIds.map((id) => map.get(id)).filter(Boolean) as DocType[];
  }, [documents, selectedIds]);

  const addDoc = (id: string) => {
    if (!id) return;
    if (selectedIds.includes(id)) return;
    setSelectedIds((prev) => [...prev, id]);
  };

  const removeDoc = (id: string) => {
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  };

  const move = (index: number, delta: number) => {
    setSelectedIds((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      const tmp = next[index];
      next[index] = next[target];
      next[target] = tmp;
      return next;
    });
  };

  const moveToIndex = (from: number, to: number) => {
    setSelectedIds((prev) => {
      if (from < 0 || from >= prev.length || to < 0 || to >= prev.length) return prev;
      if (from === to) return prev;
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  const merge = async () => {
    setError(null);
    if (selectedIds.length < 2) {
      setError('Select at least 2 PDFs to merge.');
      return;
    }

    setIsMerging(true);
    try {
      if (previewUrl) {
        window.URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }

      const fileName = sanitizeFilename(mergeFileName || 'merged.pdf');
      const response = await api.post('/documents/merge', { documentIds: selectedIds, fileName }, { responseType: 'blob' });

      const cd = response.headers?.['content-disposition'] as string | undefined;
      const resolvedName = getFilenameFromContentDisposition(cd) || fileName;
      setPreviewFilename(resolvedName);

      const url = window.URL.createObjectURL(new Blob([response.data]));
      setPreviewUrl(url);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to merge PDFs');
    } finally {
      setIsMerging(false);
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
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Merge PDFs</h2>
        <p className="text-sm text-gray-600 mb-4">Select PDFs, reorder them, then generate a merged file.</p>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">{error}</div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Add PDF</label>
          <select
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            defaultValue=""
            onChange={(e) => {
              addDoc(e.target.value);
              e.currentTarget.value = '';
            }}
          >
            <option value="">Select a PDF...</option>
            {documents.map((d) => (
              <option key={d.id} value={d.id} disabled={selectedIds.includes(d.id)}>
                {d.originalName}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Output filename</label>
          <input
            value={mergeFileName}
            onChange={(e) => setMergeFileName(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            placeholder="merged.pdf"
          />
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-3 py-2 bg-gray-50 text-xs font-medium text-gray-700">Merge order</div>
          <ul className="divide-y divide-gray-200">
            {selectedDocs.length === 0 && (
              <li className="p-3 text-sm text-gray-600">No PDFs selected yet.</li>
            )}
            {selectedDocs.map((doc, idx) => (
              <li
                key={doc.id}
                className="p-3 flex items-center justify-between gap-2 cursor-move"
                draggable
                onDragStart={() => setDragIndex(idx)}
                onDragOver={(e) => {
                  e.preventDefault();
                }}
                onDrop={() => {
                  if (dragIndex === null) return;
                  moveToIndex(dragIndex, idx);
                  setDragIndex(null);
                }}
                onDragEnd={() => setDragIndex(null)}
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{doc.originalName}</div>
                  <div className="text-xs text-gray-600 truncate">{doc.id}</div>
                </div>
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
                    disabled={idx === selectedDocs.length - 1}
                    className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
                    title="Move down"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => removeDoc(doc.id)}
                    className="p-2 rounded hover:bg-red-50"
                    title="Remove"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            onClick={() => {
              if (previewUrl) {
                window.URL.revokeObjectURL(previewUrl);
                setPreviewUrl(null);
              }
              setSelectedIds([]);
              setError(null);
            }}
            className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 text-sm hover:bg-gray-200"
          >
            Clear
          </button>
          <button
            onClick={merge}
            disabled={isMerging}
            className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isMerging ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Merge
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Preview</h2>
        <p className="text-sm text-gray-600 mb-4">Preview the merged output before downloading.</p>

        {!previewUrl ? (
          <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center text-sm text-gray-600">
            Run a merge to generate a preview.
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
            <PdfViewerClient fileUrl={previewUrl} zoom={90} onError={() => setError('Failed to preview merged PDF')} />
          </>
        )}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { Document as PdfDocument, Page, pdfjs } from 'react-pdf';
import { Loader2, Trash2, Users } from 'lucide-react';
import { useDocuments } from '@/hooks/useDocuments';
import { AnnotationType, Document, DocumentAnnotation, DocumentViewerPresence } from '@/types/document';
import AnnotationToolbar from './AnnotationToolbar';

interface CollaborativeViewerProps {
  document: Document;
}

type PageBox = { width: number; height: number };

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function formatName(u: { firstName: string; lastName: string }) {
  return `${u.firstName} ${u.lastName}`.trim();
}

export default function CollaborativeViewer({ document }: CollaborativeViewerProps) {
  const {
    listAnnotations,
    addAnnotation,
    deleteAnnotation,
    presenceHeartbeat,
    listPresenceViewers,
  } = useDocuments();

  const [numPages, setNumPages] = useState<number>(0);
  const [activeTool, setActiveTool] = useState<AnnotationType>('HIGHLIGHT');
  const [color, setColor] = useState<string>('#FDE047');

  const [annotations, setAnnotations] = useState<DocumentAnnotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState(true);

  const [viewers, setViewers] = useState<DocumentViewerPresence[]>([]);

  const pageRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const [pageBoxes, setPageBoxes] = useState<Record<number, PageBox>>({});

  useEffect(() => {
    // Use CDN worker to avoid bundler/canvas issues.
    // Use .js instead of .mjs to avoid ES module syntax errors in worker context
    pdfjs.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
  }, []);

  const reloadAnnotations = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listAnnotations(document.id);
      setAnnotations(data);
      setCanEdit(true);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Failed to load annotations';
      setError(msg);
      // if forbidden, disable editing
      if (e?.response?.status === 403) {
        setCanEdit(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const reloadViewers = async () => {
    try {
      const data = await listPresenceViewers(document.id);
      setViewers(data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    reloadAnnotations();
    reloadViewers();

    const hb = setInterval(() => {
      presenceHeartbeat(document.id).catch(() => undefined);
    }, 15000);

    const vw = setInterval(() => {
      reloadViewers();
    }, 30000);

    return () => {
      clearInterval(hb);
      clearInterval(vw);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document.id]);

  // Keep page container sizes updated for overlay positioning
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      const next: Record<number, PageBox> = {};
      for (let i = 1; i <= numPages; i++) {
        const el = pageRefs.current[i];
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        next[i] = { width: rect.width, height: rect.height };
      }
      setPageBoxes(next);
    });

    for (let i = 1; i <= numPages; i++) {
      const el = pageRefs.current[i];
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [numPages]);

  const annotationsByPage = useMemo(() => {
    const map: Record<number, DocumentAnnotation[]> = {};
    for (const a of annotations) {
      const p = a.pageNumber;
      if (!map[p]) map[p] = [];
      map[p].push(a);
    }
    return map;
  }, [annotations]);

  const handlePageClick = async (pageNumber: number, e: ReactMouseEvent) => {
    if (!canEdit) return;
    const el = pageRefs.current[pageNumber];
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const x = clamp01((e.clientX - rect.left) / rect.width);
    const y = clamp01((e.clientY - rect.top) / rect.height);

    // basic default sizes (normalized)
    const w = activeTool === 'NOTE' || activeTool === 'TEXT' ? 0.02 : 0.18;
    const h = activeTool === 'NOTE' || activeTool === 'TEXT' ? 0.02 : 0.05;

    let content: string | undefined;
    if (activeTool === 'NOTE' || activeTool === 'TEXT') {
      content = prompt(activeTool === 'NOTE' ? 'Note text:' : 'Text:') || undefined;
    }

    try {
      await addAnnotation(document.id, {
        type: activeTool,
        pageNumber,
        coordinates: {
          x,
          y,
          w,
          h,
        },
        content,
        color,
      });
      await reloadAnnotations();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Failed to add annotation');
      if (err?.response?.status === 403) setCanEdit(false);
    }
  };

  const renderOverlay = (pageNumber: number) => {
    const box = pageBoxes[pageNumber];
    const items = annotationsByPage[pageNumber] || [];

    if (!box || items.length === 0) return null;

    return (
      <div className="absolute inset-0 pointer-events-none">
        {items.map((a) => {
          const coords = (a.coordinates || {}) as any;
          const x = typeof coords.x === 'number' ? coords.x : 0;
          const y = typeof coords.y === 'number' ? coords.y : 0;
          const w = typeof coords.w === 'number' ? coords.w : 0.12;
          const h = typeof coords.h === 'number' ? coords.h : 0.04;

          const left = x * box.width;
          const top = y * box.height;
          const width = w * box.width;
          const height = h * box.height;

          const isHighlight = a.type === 'HIGHLIGHT';
          const isRect = a.type === 'RECTANGLE';
          const isNote = a.type === 'NOTE' || a.type === 'TEXT';

          const style: React.CSSProperties = {
            left,
            top,
            width,
            height,
            background: isHighlight ? a.color || color : 'transparent',
            opacity: isHighlight ? 0.35 : 1,
            border: isRect ? `2px solid ${a.color || color}` : isNote ? `2px solid ${a.color || color}` : 'none',
            borderRadius: isNote ? 6 : 2,
          };

          return (
            <div key={a.id} className="absolute" style={style}>
              {isNote && (
                <div className="pointer-events-none text-[10px] text-gray-900 bg-white/80 px-1 rounded">
                  {a.content ? a.content.slice(0, 24) : a.type}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <AnnotationToolbar
        activeTool={activeTool}
        onChangeTool={setActiveTool}
        color={color}
        onChangeColor={setColor}
        canEdit={canEdit}
      />

      <div className="px-4 py-2 bg-white border-b border-gray-200 flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Click on the page to place an annotation.
          {!canEdit ? <span className="ml-2 text-xs text-red-600">(Read-only: no edit permission)</span> : null}
        </div>
        <div className="flex items-center space-x-2 text-xs text-gray-600">
          <Users className="h-4 w-4" />
          <span>{viewers.length} viewing</span>
          {viewers.slice(0, 3).map((v) => (
            <span key={v.userId} className="px-2 py-0.5 bg-gray-100 rounded">
              {formatName(v)}
            </span>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <PdfDocument
                file={document.fileUrl}
                onLoadSuccess={(info: { numPages: number }) => setNumPages(info.numPages)}
                onLoadError={() => setError('Failed to load PDF')}
                loading={<div className="text-sm text-gray-600">Loading PDF...</div>}
              >
                {Array.from(new Array(numPages || 0), (_el, index) => {
                  const pageNumber = index + 1;
                  return (
                    <div
                      key={`page_${pageNumber}`}
                      className="relative mb-6 last:mb-0"
                      ref={(el) => {
                        pageRefs.current[pageNumber] = el;
                      }}
                      onClick={(e) => handlePageClick(pageNumber, e)}
                      style={{ cursor: canEdit ? 'crosshair' : 'default' }}
                    >
                      <Page pageNumber={pageNumber} scale={1.25} renderTextLayer={false} renderAnnotationLayer={false} />
                      {renderOverlay(pageNumber)}
                    </div>
                  );
                })}
              </PdfDocument>

              {loading && (
                <div className="mt-4 flex items-center space-x-2 text-sm text-gray-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading annotations...</span>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-900">Annotations</h4>
                <button
                  type="button"
                  onClick={reloadAnnotations}
                  className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-50"
                >
                  Refresh
                </button>
              </div>

              {annotations.length === 0 ? (
                <div className="text-sm text-gray-600">No annotations yet.</div>
              ) : (
                <div className="space-y-2">
                  {annotations.map((a) => (
                    <div key={a.id} className="border border-gray-200 rounded p-2">
                      <div className="text-xs text-gray-600 flex items-center justify-between">
                        <span>
                          Page {a.pageNumber} · {a.type}
                        </span>
                        <button
                          type="button"
                          disabled={!canEdit}
                          onClick={async () => {
                            if (!confirm('Delete this annotation?')) return;
                            await deleteAnnotation(a.id);
                            await reloadAnnotations();
                          }}
                          className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      {a.content ? <div className="mt-1 text-sm text-gray-900">{a.content}</div> : null}
                      <div className="mt-1 text-xs text-gray-500">By {formatName(a.author)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

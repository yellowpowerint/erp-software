'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { FileText, Loader2, CheckCircle, XCircle, Ban, Clock3, AlertTriangle, Download } from 'lucide-react';
import { useDocuments } from '@/hooks/useDocuments';
import { DocumentConversionJob, DocumentConversionStatus } from '@/types/conversion';

interface ConvertToPdfPanelProps {
  documentId: string;
  mimeType: string;
  onConverted: (documentId: string) => Promise<void>;
  onAfterConvertNavigate?: (documentId: string) => void;
}

const supportedFormats = {
  Documents: ['doc', 'docx', 'odt', 'rtf', 'txt', 'html', 'msg', 'eml'],
  Spreadsheets: ['xls', 'xlsx', 'csv', 'ods'],
  Presentations: ['ppt', 'pptx', 'odp'],
  Images: ['jpg', 'jpeg', 'png', 'tiff', 'heic', 'webp', 'bmp'],
  CAD_PDF: ['pdf', 'svg'],
};

const miningContexts = ['Vendor invoice', 'Purchase order', 'Delivery note', 'Assay report', 'Inspection photo'];

const statusTone: Record<DocumentConversionStatus | 'IDLE', { chip: string; text: string }> = {
  IDLE: { chip: 'bg-gray-100 text-gray-700', text: 'Ready' },
  [DocumentConversionStatus.PENDING]: { chip: 'bg-amber-100 text-amber-800', text: 'Queued' },
  [DocumentConversionStatus.PROCESSING]: { chip: 'bg-blue-100 text-blue-800', text: 'Processing' },
  [DocumentConversionStatus.COMPLETED]: { chip: 'bg-green-100 text-green-800', text: 'Completed' },
  [DocumentConversionStatus.FAILED]: { chip: 'bg-red-100 text-red-800', text: 'Failed' },
  [DocumentConversionStatus.CANCELLED]: { chip: 'bg-gray-200 text-gray-700', text: 'Cancelled' },
};

export default function ConvertToPdfPanel({
  documentId,
  mimeType,
  onConverted,
  onAfterConvertNavigate,
}: ConvertToPdfPanelProps) {
  const {
    convertDocumentToPdf,
    getConversionJob,
    listConversionJobs,
    cancelConversionJob,
    downloadDocument,
    loading,
  } = useDocuments();

  const [job, setJob] = useState<DocumentConversionJob | null>(null);
  const [history, setHistory] = useState<DocumentConversionJob[]>([]);
  const [error, setError] = useState<string | null>(null);

  const shouldShow = useMemo(() => mimeType !== 'application/pdf', [mimeType]);

  const loadHistory = async () => {
    try {
      const jobs = await listConversionJobs(documentId);
      setHistory(jobs);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load conversion jobs');
    }
  };

  useEffect(() => {
    if (!shouldShow) return;
    loadHistory();
  }, [documentId, shouldShow]);

  useEffect(() => {
    if (!job) return;

    if (
      job.status !== DocumentConversionStatus.PENDING &&
      job.status !== DocumentConversionStatus.PROCESSING
    ) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const latest = await getConversionJob(job.id);
        setJob(latest);

        if (latest.status === DocumentConversionStatus.COMPLETED) {
          await onConverted(documentId);
          onAfterConvertNavigate?.(documentId);
          await loadHistory();
        }

        if (
          latest.status === DocumentConversionStatus.FAILED ||
          latest.status === DocumentConversionStatus.CANCELLED
        ) {
          await loadHistory();
        }
      } catch (e: any) {
        setError(e?.response?.data?.message || e?.message || 'Failed to refresh conversion job');
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [job?.id, job?.status]);

  const startConversion = async () => {
    setError(null);
    try {
      const created = await convertDocumentToPdf(documentId);
      setJob(created);
      await loadHistory();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to start conversion');
    }
  };

  const cancel = async () => {
    if (!job) return;
    setError(null);
    try {
      await cancelConversionJob(job.id);
      const latest = await getConversionJob(job.id);
      setJob(latest);
      await loadHistory();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to cancel conversion');
    }
  };

  if (!shouldShow) {
    return null;
  }

  const status = job?.status ?? 'IDLE';
  const tone = statusTone[status];
  const isActive =
    job?.status === DocumentConversionStatus.PENDING || job?.status === DocumentConversionStatus.PROCESSING;
  const canDownload = job?.status === DocumentConversionStatus.COMPLETED;

  const downloadLatest = async () => {
    if (!job || !canDownload) return;
    try {
      const { url, filename } = await downloadDocument(documentId);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to download converted PDF');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 border border-gray-200 rounded-lg bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <h4 className="text-base font-semibold text-gray-900">Convert to PDF</h4>
                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${tone.chip}`}>
                  {tone.text}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                Standardize office files, spreadsheets, images, and logs to PDF for approvals, audits, and archiving.
              </p>
              <div className="flex flex-wrap gap-2">
                {miningContexts.map((c) => (
                  <span key={c} className="rounded-full bg-gray-100 text-gray-700 text-xs px-2 py-1">
                    {c}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={startConversion}
                disabled={loading || isActive}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isActive ? 'Converting…' : 'Convert now'}
              </button>
              {isActive && (
                <button
                  onClick={cancel}
                  disabled={loading}
                  className="px-3 py-2 text-sm bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 disabled:opacity-50"
                >
                  Cancel
                </button>
              )}
              {canDownload && (
                <button
                  onClick={downloadLatest}
                  className="px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              <AlertTriangle className="h-4 w-4 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-3">
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-700">
              <div className="flex items-center gap-1">
                <Clock3 className="h-4 w-4 text-gray-500" />
                <span>Attempts: {job ? `${job.attempts}/${job.maxAttempts}` : '0/3'}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-medium">Type:</span>
                <span className="rounded bg-white px-2 py-1 border border-gray-200">
                  {mimeType || 'Unknown'}
                </span>
              </div>
              {job?.errorMessage && (
                <span className="text-red-700 font-medium truncate">Error: {job.errorMessage}</span>
              )}
            </div>
          </div>

          <div className="rounded-md border border-gray-200 bg-white px-4 py-3">
            <div className="text-sm font-medium text-gray-800 mb-2">Supported formats (CloudConvert)</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs text-gray-700">
              {Object.entries(supportedFormats).map(([label, items]) => (
                <div key={label} className="space-y-1">
                  <div className="text-gray-900 font-semibold">{label}</div>
                  <div className="flex flex-wrap gap-1">
                    {items.map((i) => (
                      <span key={i} className="px-2 py-1 rounded bg-gray-100 text-gray-700 border border-gray-200">
                        {i.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs text-gray-600">
              Tip: Converting first keeps vendor invoices, lab results, and equipment photos consistent for approval workflows.
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>
              Need a different file?{' '}
              <Link href="/documents" className="text-blue-600 hover:underline">
                Upload another document
              </Link>
            </span>
            <span className="italic">CloudConvert-backed • version-safe</span>
          </div>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg bg-white p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h5 className="text-sm font-semibold text-gray-900">Conversion status</h5>
          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${tone.chip}`}>
            {tone.text}
          </span>
        </div>

        <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-3 text-xs text-gray-800 space-y-1">
          <div className="flex items-center justify-between">
            <span>Status</span>
            <span className="font-semibold">{tone.text}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Attempts</span>
            <span className="font-semibold">{job ? `${job.attempts}/${job.maxAttempts}` : '0/3'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Last update</span>
            <span>{job ? new Date(job.updatedAt || job.createdAt).toLocaleString() : '–'}</span>
          </div>
        </div>

        {history.length > 0 ? (
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-800">Recent conversions</div>
            <div className="space-y-1">
              {history.slice(0, 5).map((h) => {
                const ht = statusTone[h.status];
                return (
                  <div
                    key={h.id}
                    className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`inline-flex rounded-full px-2 py-0.5 font-medium ${ht.chip}`}>{ht.text}</span>
                      <span className="text-gray-800 truncate">{h.errorMessage ? `Error: ${h.errorMessage}` : 'OK'}</span>
                    </div>
                    <span className="text-gray-500">{new Date(h.createdAt).toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-xs text-gray-600">No conversions yet. Start a run to see history.</div>
        )}
      </div>
    </div>
  );
}

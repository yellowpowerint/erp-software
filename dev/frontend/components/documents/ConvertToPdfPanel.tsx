'use client';

import { useEffect, useMemo, useState } from 'react';
import { FileText, Loader2, CheckCircle, XCircle, Ban } from 'lucide-react';
import { useDocuments } from '@/hooks/useDocuments';
import { DocumentConversionJob, DocumentConversionStatus } from '@/types/conversion';

interface ConvertToPdfPanelProps {
  documentId: string;
  mimeType: string;
  onConverted: () => Promise<void>;
}

export default function ConvertToPdfPanel({ documentId, mimeType, onConverted }: ConvertToPdfPanelProps) {
  const {
    convertDocumentToPdf,
    getConversionJob,
    listConversionJobs,
    cancelConversionJob,
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
          await onConverted();
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

  const status = job?.status;

  const statusIcon =
    status === DocumentConversionStatus.PROCESSING || status === DocumentConversionStatus.PENDING ? (
      <Loader2 className="h-4 w-4 animate-spin" />
    ) : status === DocumentConversionStatus.COMPLETED ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : status === DocumentConversionStatus.CANCELLED ? (
      <Ban className="h-4 w-4 text-gray-500" />
    ) : status === DocumentConversionStatus.FAILED ? (
      <XCircle className="h-4 w-4 text-red-600" />
    ) : (
      <FileText className="h-4 w-4" />
    );

  const canCancel =
    job?.status === DocumentConversionStatus.PENDING || job?.status === DocumentConversionStatus.PROCESSING;

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            {statusIcon}
            <h4 className="text-sm font-medium text-gray-900">Convert to PDF</h4>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Converts this document into a PDF and saves it as a new version.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={startConversion}
            disabled={loading || canCancel}
            className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {canCancel ? 'Converting…' : 'Convert to PDF'}
          </button>

          {canCancel && (
            <button
              onClick={cancel}
              disabled={loading}
              className="px-3 py-2 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {error && <div className="mt-3 text-sm text-red-600">{error}</div>}

      {job && (
        <div className="mt-3 text-xs text-gray-700">
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <div>
              <span className="font-medium">Status:</span> {job.status}
            </div>
            <div>
              <span className="font-medium">Attempts:</span> {job.attempts}/{job.maxAttempts}
            </div>
            {job.errorMessage && (
              <div className="text-red-700">
                <span className="font-medium">Error:</span> {job.errorMessage}
              </div>
            )}
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="mt-4">
          <div className="text-xs font-medium text-gray-700 mb-2">Recent conversions</div>
          <div className="space-y-2">
            {history.slice(0, 5).map((h) => (
              <div key={h.id} className="flex items-center justify-between text-xs bg-white border border-gray-200 rounded p-2">
                <div className="text-gray-700 truncate">
                  {h.status}
                  {h.errorMessage ? ` — ${h.errorMessage}` : ''}
                </div>
                <div className="text-gray-500">{new Date(h.createdAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

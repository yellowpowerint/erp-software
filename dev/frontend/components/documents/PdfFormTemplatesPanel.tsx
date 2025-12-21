'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, FileText, Plus, Trash2 } from 'lucide-react';
import { useDocuments } from '@/hooks/useDocuments';
import { Document } from '@/types/document';
import { DocumentFormTemplate } from '@/types/forms';

interface PdfFormTemplatesPanelProps {
  documents: Document[];
}

export default function PdfFormTemplatesPanel({ documents }: PdfFormTemplatesPanelProps) {
  const { listFormTemplates, createFormTemplate, deleteFormTemplate, loading } = useDocuments();

  const [templates, setTemplates] = useState<DocumentFormTemplate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocId, setSelectedDocId] = useState<string>('');

  const pdfDocs = useMemo(() => documents.filter((d) => d.mimeType === 'application/pdf'), [documents]);

  const load = async () => {
    setError(null);
    try {
      const list = await listFormTemplates();
      setTemplates(list);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load templates');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    if (!selectedDocId) return;
    setError(null);
    try {
      await createFormTemplate(selectedDocId);
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to create template');
    }
  };

  const remove = async (templateId: string) => {
    setError(null);
    try {
      await deleteFormTemplate(templateId);
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to delete template');
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">Form Templates</h2>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">Create template from PDF document</label>
          <select
            value={selectedDocId}
            onChange={(e) => setSelectedDocId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Select PDF…</option>
            {pdfDocs.map((d) => (
              <option key={d.id} value={d.id}>
                {d.originalName} (v{d.version})
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={create}
            disabled={loading || !selectedDocId}
            className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create
          </button>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-gray-900">Templates</div>
          <button
            onClick={load}
            disabled={loading}
            className="px-3 py-1.5 text-sm bg-gray-100 text-gray-800 rounded hover:bg-gray-200 disabled:opacity-50"
          >
            Refresh
          </button>
        </div>

        {loading && templates.length === 0 ? (
          <div className="flex items-center gap-2 text-gray-700">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : templates.length === 0 ? (
          <div className="text-sm text-gray-600">No templates yet.</div>
        ) : (
          <div className="space-y-2">
            {templates.map((t) => (
              <div key={t.id} className="flex items-center justify-between border border-gray-200 rounded p-3">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {t.document?.originalName || t.documentId}
                  </div>
                  <div className="text-xs text-gray-600">
                    v{t.documentVersion} • {t.fieldCount} field(s) • {new Date(t.createdAt).toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={() => remove(t.id)}
                  disabled={loading}
                  className="px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, FileText, Save, Eye, CheckCircle, Plus, XCircle, PenLine } from 'lucide-react';
import { useDocuments } from '@/hooks/useDocuments';
import {
  DocumentFormDraft,
  DocumentFormDraftStatus,
  DocumentFormFieldSchema,
  DocumentFormTemplate,
} from '@/types/forms';
import SignatureCapture from './SignatureCapture';

interface FillableFormsPanelProps {
  documentId: string;
  onFinalized: () => Promise<void>;
}

export default function FillableFormsPanel({ documentId, onFinalized }: FillableFormsPanelProps) {
  const {
    createFormTemplate,
    listFormDrafts,
    createFormDraft,
    getFormDraft,
    updateFormDraft,
    renderFormDraft,
    finalizeFormDraft,
    cancelFormDraft,
    loading,
  } = useDocuments();

  const [template, setTemplate] = useState<DocumentFormTemplate | null>(null);
  const [schema, setSchema] = useState<DocumentFormFieldSchema[]>([]);

  const [drafts, setDrafts] = useState<DocumentFormDraft[]>([]);
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DocumentFormDraft | null>(null);

  const [values, setValues] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);

  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [signatureReason, setSignatureReason] = useState<string>('');
  const [showSignatureCapture, setShowSignatureCapture] = useState(false);

  const canEdit = useMemo(() => !!template, [template]);

  const loadTemplate = async () => {
    setError(null);
    try {
      const t = await createFormTemplate(documentId);
      setTemplate(t);
      setSchema((t.fieldSchema || []) as any);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to extract form template');
    }
  };

  const loadDrafts = async () => {
    setError(null);
    try {
      const list = await listFormDrafts(documentId);
      setDrafts(list);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load drafts');
    }
  };

  const loadDraft = async (draftId: string) => {
    setError(null);
    try {
      const d = await getFormDraft(draftId);
      setDraft(d);
      setSelectedDraftId(draftId);
      setValues(d.values || {});
      setSignatureData(d.signatureData || null);
      setSignatureReason(d.signatureReason || '');
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load draft');
    }
  };

  useEffect(() => {
    loadTemplate();
    loadDrafts();
  }, [documentId]);

  useEffect(() => {
    if (selectedDraftId) {
      loadDraft(selectedDraftId);
    }
  }, [selectedDraftId]);

  const createDraft = async () => {
    setError(null);
    try {
      const d = await createFormDraft(documentId, template?.id);
      await loadDrafts();
      await loadDraft(d.id);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to create draft');
    }
  };

  const saveDraft = async () => {
    if (!draft) return;
    setError(null);
    try {
      const updated = await updateFormDraft(draft.id, {
        values,
        signatureData,
        signatureReason: signatureReason || null,
        signatureType: signatureData ? 'DRAWN' : null,
        signatureMetadata: signatureData
          ? {
              placement: {
                page: 1,
                x: 50,
                y: 50,
                width: 150,
                height: 50,
              },
            }
          : undefined,
      });
      setDraft(updated);
      await loadDrafts();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to save draft');
    }
  };

  const previewDraft = async () => {
    if (!draft) return;
    setError(null);
    try {
      const blob = await renderFormDraft(draft.id);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to render preview');
    }
  };

  const finalize = async () => {
    if (!draft) return;
    setError(null);
    try {
      await finalizeFormDraft(draft.id);
      await onFinalized();
      await loadDrafts();
      await loadDraft(draft.id);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to finalize draft');
    }
  };

  const cancel = async () => {
    if (!draft) return;
    setError(null);
    try {
      await cancelFormDraft(draft.id);
      await loadDrafts();
      setDraft(null);
      setSelectedDraftId(null);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to cancel draft');
    }
  };

  const renderField = (field: DocumentFormFieldSchema) => {
    const v = values[field.name];

    if (field.type === 'PDFCheckBox') {
      return (
        <label className="flex items-center gap-2 text-sm text-gray-800">
          <input
            type="checkbox"
            checked={!!v}
            onChange={(e) => setValues((prev) => ({ ...prev, [field.name]: e.target.checked }))}
            className="h-4 w-4"
            disabled={draft?.status !== DocumentFormDraftStatus.DRAFT}
          />
          {field.name}
        </label>
      );
    }

    if ((field.type === 'PDFDropdown' || field.type === 'PDFOptionList' || field.type === 'PDFRadioGroup') && field.options) {
      return (
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-700">{field.name}</label>
          <select
            value={v ?? ''}
            onChange={(e) => setValues((prev) => ({ ...prev, [field.name]: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            disabled={draft?.status !== DocumentFormDraftStatus.DRAFT}
          >
            <option value="">Select…</option>
            {field.options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
      );
    }

    return (
      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-700">{field.name}</label>
        <input
          type="text"
          value={v ?? ''}
          onChange={(e) => setValues((prev) => ({ ...prev, [field.name]: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          disabled={draft?.status !== DocumentFormDraftStatus.DRAFT}
        />
      </div>
    );
  };

  if (!template && loading) {
    return (
      <div className="border border-gray-200 rounded-lg p-4 bg-white">
        <div className="flex items-center gap-2 text-gray-700">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading form fields…
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-blue-600" />
          <h4 className="text-sm font-medium text-gray-900">Fillable Forms</h4>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadTemplate}
            disabled={loading}
            className="px-3 py-2 text-sm bg-gray-100 text-gray-800 rounded hover:bg-gray-200 disabled:opacity-50"
          >
            Refresh Fields
          </button>
          <button
            onClick={createDraft}
            disabled={loading || !canEdit}
            className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Draft
          </button>
        </div>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      {schema.length === 0 ? (
        <div className="text-sm text-gray-600">
          No fillable form fields detected in this PDF.
        </div>
      ) : (
        <div className="text-xs text-gray-600">
          Detected {schema.length} field(s). Create a draft to start filling.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-700">Draft</label>
          <select
            value={selectedDraftId ?? ''}
            onChange={(e) => setSelectedDraftId(e.target.value || null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Select draft…</option>
            {drafts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.status} — {new Date(d.createdAt).toLocaleString()}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end gap-2">
          <button
            onClick={saveDraft}
            disabled={loading || !draft || draft.status !== DocumentFormDraftStatus.DRAFT}
            className="px-3 py-2 text-sm bg-gray-900 text-white rounded hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Save Draft
          </button>
          <button
            onClick={previewDraft}
            disabled={loading || !draft}
            className="px-3 py-2 text-sm bg-gray-100 text-gray-800 rounded hover:bg-gray-200 disabled:opacity-50 flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            Preview
          </button>
          <button
            onClick={finalize}
            disabled={loading || !draft || draft.status !== DocumentFormDraftStatus.DRAFT}
            className="px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Finalize
          </button>
          <button
            onClick={cancel}
            disabled={loading || !draft || draft.status !== DocumentFormDraftStatus.DRAFT}
            className="px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
          >
            <XCircle className="h-4 w-4" />
            Cancel
          </button>
        </div>
      </div>

      {draft && draft.status === DocumentFormDraftStatus.FINALIZED && draft.outputFileUrl && (
        <div className="text-sm text-green-700">
          Finalized. Output saved as a new document version.
        </div>
      )}

      {draft && draft.status === DocumentFormDraftStatus.DRAFT && (
        <div className="border-t border-gray-200 pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {schema.map((f) => (
              <div key={f.name}>{renderField(f)}</div>
            ))}
          </div>

          <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PenLine className="h-4 w-4 text-gray-700" />
                <div className="text-sm font-medium text-gray-900">Fill & Sign (Optional)</div>
              </div>
              <button
                onClick={() => setShowSignatureCapture((v) => !v)}
                className="px-3 py-2 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100"
              >
                {signatureData ? 'Replace Signature' : 'Add Signature'}
              </button>
            </div>

            <div className="mt-3 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Reason (optional)</label>
                <input
                  value={signatureReason}
                  onChange={(e) => setSignatureReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., Approved, Reviewed"
                />
              </div>

              {signatureData && (
                <div className="bg-white border border-gray-200 rounded p-2">
                  <div className="text-xs text-gray-600 mb-2">Signature preview</div>
                  <img src={signatureData} alt="Signature" className="max-h-24" />
                </div>
              )}

              {showSignatureCapture && (
                <SignatureCapture
                  onSave={(data) => {
                    setSignatureData(data);
                    setShowSignatureCapture(false);
                  }}
                  onCancel={() => setShowSignatureCapture(false)}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import { DocumentCategory } from '@/types/document';
import { Brain, RefreshCw, AlertTriangle } from 'lucide-react';

type AiInsight = {
  id: string;
  summary?: string | null;
  entities?: any;
  suggestedCategory?: DocumentCategory | null;
  suggestedTags?: string[];
  anomalies?: any;
  analyzedAt?: string;
  updatedAt?: string;
};

export default function DocumentAiInsightsPanel({ documentId }: { documentId: string }) {
  const [insight, setInsight] = useState<AiInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (force: boolean) => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.post<AiInsight>(`/ai/documents/${documentId}/analyze`, { force });
        setInsight(res.data);
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Failed to analyze document');
      } finally {
        setLoading(false);
      }
    },
    [documentId]
  );

  useEffect(() => {
    load(false);
  }, [load]);

  const warnings: string[] = Array.isArray(insight?.anomalies?.warnings) ? insight!.anomalies.warnings : [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Brain className="h-5 w-5 text-indigo-600" />
          <h3 className="text-lg font-medium text-gray-900">AI Insights</h3>
        </div>
        <button
          onClick={() => load(true)}
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 flex items-center space-x-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Analyzing…' : 'Re-analyze'}</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 text-sm text-red-700">{error}</div>
      )}

      {!error && !insight && (
        <div className="text-sm text-gray-600">No AI insights available yet.</div>
      )}

      {insight && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-700 mb-2">Summary</div>
              <div className="text-sm text-gray-900 whitespace-pre-wrap">
                {insight.summary || 'No summary available.'}
              </div>
            </div>

            {warnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-yellow-800 mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  <div className="text-sm font-medium">Warnings</div>
                </div>
                <ul className="text-sm text-yellow-900 space-y-1">
                  {warnings.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-700 mb-2">Suggested Category</div>
              <div className="text-sm text-gray-900">
                {insight.suggestedCategory ? String(insight.suggestedCategory).replace(/_/g, ' ') : 'N/A'}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-700 mb-2">Entities</div>
              <pre className="text-xs text-gray-800 whitespace-pre-wrap break-words">
                {JSON.stringify(insight.entities ?? {}, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

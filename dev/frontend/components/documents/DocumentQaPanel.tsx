'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { MessageCircle, Send } from 'lucide-react';

type QaSource = {
  documentId: string;
  snippet: string;
};

type QaResponse = {
  answer: string;
  confidence?: number;
  sources?: QaSource[];
};

export default function DocumentQaPanel({ documentId }: { documentId: string }) {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QaResponse | null>(null);

  const ask = async () => {
    const q = question.trim();
    if (!q) return;

    setLoading(true);
    setError(null);
    try {
      const res = await api.post<QaResponse>(`/ai/documents/${documentId}/qa`, { question: q });
      setResult(res.data);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to get an answer');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center space-x-2">
        <MessageCircle className="h-5 w-5 text-indigo-600" />
        <h3 className="text-lg font-medium text-gray-900">Document Q&A</h3>
      </div>

      <div className="flex gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') ask();
          }}
          placeholder="Ask a question about this document…"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={ask}
          disabled={loading || !question.trim()}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 flex items-center space-x-2"
          type="button"
        >
          <Send className="h-4 w-4" />
          <span>{loading ? 'Asking…' : 'Ask'}</span>
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">{error}</div>}

      {result && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="text-sm font-medium text-gray-700">Answer</div>
          <div className="text-sm text-gray-900 whitespace-pre-wrap">{result.answer}</div>

          {typeof result.confidence === 'number' && (
            <div className="text-xs text-gray-600">Confidence: {(result.confidence * 100).toFixed(0)}%</div>
          )}

          {Array.isArray(result.sources) && result.sources.length > 0 && (
            <div>
              <div className="text-xs font-medium text-gray-700 mb-1">Sources</div>
              <div className="space-y-2">
                {result.sources.map((s, idx) => (
                  <div key={idx} className="text-xs text-gray-800 bg-gray-50 border border-gray-200 rounded p-2">
                    {s.snippet}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

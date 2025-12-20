'use client';

import { useMemo, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { DocumentCategory } from '@/types/document';
import { Brain, Search, Loader2 } from 'lucide-react';
import Link from 'next/link';

type SmartSearchResult = {
  id: string;
  score: number;
  document: {
    id: string;
    originalName: string;
    category: DocumentCategory | string;
    module: string;
    referenceId?: string | null;
    createdAt: string;
  };
};

export default function DocumentSmartSearchPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <DocumentSmartSearchContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function DocumentSmartSearchContent() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<DocumentCategory | ''>('');
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SmartSearchResult[]>([]);

  const canSearch = query.trim().length > 0 && !loading;

  const runSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await api.post<SmartSearchResult[]>('/ai/documents/smart-search', {
        query: query.trim(),
        category: category || undefined,
        limit,
      });
      setResults(Array.isArray(res.data) ? res.data : []);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Smart Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const topHint = useMemo(() => {
    if (!results.length) return null;
    const best = results[0];
    return best ? `Top match score: ${(best.score * 100).toFixed(1)}%` : null;
  }, [results]);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Brain className="h-8 w-8 text-indigo-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Smart Search</h1>
            <p className="text-gray-600">AI-ranked search across document text, metadata, and insights.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Ask a natural query, e.g. 'invoice from acme in november' or 'safety incident timeline'"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') runSearch();
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              onClick={runSearch}
              disabled={!canSearch}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
              type="button"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              <span>{loading ? 'Searching…' : 'Search'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category (optional)</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as DocumentCategory | '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Categories</option>
                {Object.values(DocumentCategory).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max results</label>
              <select
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {[5, 10, 15, 25, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <div className="text-sm text-gray-600">{topHint || 'Search results are ranked by relevance score.'}</div>
            </div>
          </div>

          {error && (
            <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Searching documents…</p>
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Brain className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No results</h3>
          <p className="text-gray-600">
            Try a broader query or remove filters.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Results</h2>
              <p className="text-sm text-gray-600">{results.length} match(es)</p>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {results.map((r) => (
              <div key={r.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 truncate">{r.document.originalName}</div>
                    <div className="mt-1 text-sm text-gray-600">
                      <span className="mr-3">Category: {String(r.document.category).replace(/_/g, ' ')}</span>
                      <span className="mr-3">Module: {r.document.module}</span>
                      {r.document.referenceId && <span className="mr-3">Ref: {r.document.referenceId}</span>}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">Created: {new Date(r.document.createdAt).toLocaleString()}</div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Score</div>
                      <div className="text-sm font-semibold text-indigo-700">{(r.score * 100).toFixed(1)}%</div>
                    </div>

                    <Link
                      href={`/documents?id=${encodeURIComponent(r.document.id)}`}
                      className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
                    >
                      Open
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useMemo, useState } from 'react';
import { Eye, Loader2 } from 'lucide-react';
import type { CsvModule, ExportPreviewResult } from '@/types/csv';
import { useCSV } from '@/hooks/useCSV';

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let v = bytes;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export default function ExportPreview(props: {
  module: CsvModule;
  columns: string[];
  filters?: any;
  context?: any;
}) {
  const { module, columns, filters, context } = props;
  const { previewExport } = useCSV();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExportPreviewResult | null>(null);

  const cols = useMemo(() => columns.filter(Boolean), [columns]);

  const runPreview = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await previewExport(module, { columns: cols, filters: filters || {}, limit: 20, context });
      setResult(res);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to preview export');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-gray-900">Export Preview</div>
          <div className="text-xs text-gray-500">Preview first 20 rows and estimate file size</div>
        </div>
        <button
          onClick={runPreview}
          disabled={loading || !cols.length}
          className="inline-flex items-center px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Eye className="w-4 h-4 mr-2" />}
          Preview
        </button>
      </div>

      {error ? <div className="mt-3 text-sm text-red-600">{error}</div> : null}

      {result ? (
        <div className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500">Total rows</div>
              <div className="text-lg font-semibold text-gray-900">{result.totalRows}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500">Estimated size</div>
              <div className="text-lg font-semibold text-gray-900">{formatBytes(result.estimatedSizeBytes)}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500">Columns</div>
              <div className="text-sm text-gray-900 break-words">{cols.join(', ')}</div>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto border rounded-lg">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {cols.map((c) => (
                    <th key={c} className="text-left px-3 py-2 font-medium text-gray-700 whitespace-nowrap">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(result.previewRows || []).map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {cols.map((c) => (
                      <td key={c} className="px-3 py-2 text-gray-700 whitespace-nowrap">
                        {row?.[c] == null ? '' : String(row[c])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}

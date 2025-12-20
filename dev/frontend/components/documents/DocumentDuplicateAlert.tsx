'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

type DuplicateDoc = {
  id: string;
  originalName: string;
  category: string;
  module: string;
  referenceId?: string | null;
  createdAt: string;
};

export default function DocumentDuplicateAlert({ documentId }: { documentId: string }) {
  const [dupes, setDupes] = useState<DuplicateDoc[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.post<DuplicateDoc[]>('/ai/documents/detect-duplicates', { documentId });
      setDupes(Array.isArray(res.data) ? res.data : []);
    } catch {
      setDupes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [documentId]);

  if (loading) return null;
  if (!dupes.length) return null;

  return (
    <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow-700 mt-0.5" />
          <div>
            <div className="text-sm font-medium text-yellow-900">Possible duplicates detected</div>
            <div className="text-xs text-yellow-800 mt-1">
              {dupes.slice(0, 3).map((d) => (
                <div key={d.id} className="truncate">
                  {d.originalName}
                  <span className="text-yellow-700"> · {format(new Date(d.createdAt), 'PP')}</span>
                </div>
              ))}
              {dupes.length > 3 && <div className="text-yellow-700">+{dupes.length - 3} more</div>}
            </div>
          </div>
        </div>
        <button
          onClick={load}
          className="text-xs text-yellow-900 hover:text-yellow-950 underline"
          type="button"
        >
          Recheck
        </button>
      </div>
    </div>
  );
}

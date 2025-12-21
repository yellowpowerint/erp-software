'use client';

import type { ColumnMapping } from '@/types/csv';

export default function ColumnMapper(props: {
  headers: string[];
  mappings: ColumnMapping[];
  onChange: (next: ColumnMapping[]) => void;
}) {
  const { headers, mappings, onChange } = props;

  const setMapping = (idx: number, sourceColumn: string | null) => {
    const next = mappings.map((m, i) => (i === idx ? { ...m, sourceColumn } : m));
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {mappings.map((m, idx) => (
        <div key={`${m.key}-${idx}`} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
          <div className="text-sm font-medium text-gray-800">
            {m.header}
            {m.required ? <span className="text-red-600"> *</span> : null}
          </div>
          <div className="md:col-span-2">
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={m.sourceColumn ?? ''}
              onChange={(e) => setMapping(idx, e.target.value ? e.target.value : null)}
            >
              <option value="">Unmapped</option>
              {headers.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>
        </div>
      ))}
    </div>
  );
}

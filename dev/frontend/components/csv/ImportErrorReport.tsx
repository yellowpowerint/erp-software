'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Download, RefreshCcw, Loader2 } from 'lucide-react';
import { unparse } from 'papaparse';
import { saveAs } from 'file-saver';
import type { ColumnMapping, CsvModule } from '@/types/csv';
import { useCSV } from '@/hooks/useCSV';

function defaultKeysForModule(module: CsvModule): Array<{ key: string; required: boolean }> {
  if (module === 'inventory') {
    return [
      { key: 'itemCode', required: true },
      { key: 'name', required: true },
      { key: 'category', required: true },
      { key: 'unit', required: true },
      { key: 'warehouseCode', required: false },
      { key: 'warehouseId', required: false },
    ];
  }

  if (module === 'inventory_movements') {
    return [
      { key: 'itemCode', required: true },
      { key: 'movementType', required: true },
      { key: 'quantity', required: true },
      { key: 'warehouseCode', required: false },
      { key: 'warehouseId', required: false },
    ];
  }

  if (module === 'suppliers') {
    return [{ key: 'name', required: true }, { key: 'email', required: false }];
  }

  if (module === 'employees') {
    return [
      { key: 'employeeId', required: false },
      { key: 'firstName', required: true },
      { key: 'lastName', required: true },
      { key: 'email', required: true },
      { key: 'department', required: true },
      { key: 'position', required: true },
      { key: 'hireDate', required: true },
    ];
  }

  if (module === 'projects') {
    return [
      { key: 'projectCode', required: true },
      { key: 'name', required: true },
      { key: 'startDate', required: true },
    ];
  }

  if (module === 'project_tasks') {
    return [{ key: 'title', required: true }];
  }

  return [
    { key: 'assetCode', required: true },
    { key: 'name', required: true },
    { key: 'category', required: true },
    { key: 'purchaseDate', required: true },
    { key: 'purchasePrice', required: true },
  ];
}

export default function ImportErrorReport(props: {
  jobId: string;
  module: CsvModule;
  context?: any;
  onReimportStarted?: (jobId: string) => void;
}) {
  const { jobId, module, context, onReimportStarted } = props;
  const { getImportErrors, startImport } = useCSV();

  const [loading, setLoading] = useState(false);
  const [reimporting, setReimporting] = useState(false);
  const [errors, setErrors] = useState<any[]>([]);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      setLoading(true);
      setErrMsg(null);
      try {
        const list = await getImportErrors(jobId);
        if (mounted) {
          setErrors(Array.isArray(list) ? list : []);
        }
      } catch (e: any) {
        if (mounted) {
          setErrMsg(e?.response?.data?.message || e?.message || 'Failed to load import errors');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, [jobId]);

  const grouped = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const e of errors || []) {
      const k = String(e?.message || 'Unknown error');
      map.set(k, [...(map.get(k) || []), e]);
    }
    return Array.from(map.entries()).map(([message, items]) => ({ message, items }));
  }, [errors]);

  const downloadErrorCsv = () => {
    const rows = (errors || []).map((e) => ({
      rowNumber: e?.rowNumber,
      message: e?.message,
      ...(e?.rowData ? e.rowData : {}),
    }));
    const csv = unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, `import-errors-${jobId}.csv`);
  };

  const reimportFailedRowsOnly = async () => {
    // Requires rowData in error payloads.
    const rows = (errors || []).map((e) => e?.rowData).filter(Boolean);
    if (!rows.length) {
      throw new Error('No failed row data available to re-import');
    }

    // Build a CSV file from failed row data
    const csv = unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const file = new File([blob], `failed-rows-${jobId}.csv`, { type: 'text/csv' });

    const keys = defaultKeysForModule(module);
    const headers = Object.keys(rows[0] || {});

    const mappings: ColumnMapping[] = keys.map((k) => {
      const h = headers.find((x) => x.toLowerCase() === k.key.toLowerCase()) || null;
      return { key: k.key, header: k.key, sourceColumn: h, required: k.required };
    });

    setReimporting(true);
    try {
      const mergedContext = context || {};
      const newJob = await startImport(module, file, mappings, mergedContext);
      onReimportStarted?.(newJob.id);
      return newJob;
    } finally {
      setReimporting(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <div className="text-sm font-semibold text-gray-900">Import Error Report</div>
          </div>
          <div className="text-xs text-gray-500">Job: {jobId}</div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={downloadErrorCsv}
            disabled={!errors.length}
            className="inline-flex items-center px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm disabled:opacity-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Errors CSV
          </button>

          <button
            onClick={() => reimportFailedRowsOnly().catch((e) => setErrMsg(e?.message || 'Failed to re-import failed rows'))}
            disabled={!errors.length || reimporting}
            className="inline-flex items-center px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-sm disabled:opacity-50"
          >
            {reimporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCcw className="w-4 h-4 mr-2" />}
            Re-import failed rows only
          </button>
        </div>
      </div>

      {loading ? <div className="mt-3 text-sm text-gray-600">Loading errors…</div> : null}
      {errMsg ? <div className="mt-3 text-sm text-red-600">{errMsg}</div> : null}

      {!loading && !errors.length ? <div className="mt-3 text-sm text-gray-600">No errors found.</div> : null}

      {grouped.length ? (
        <div className="mt-4 space-y-3">
          {grouped.map((g) => (
            <div key={g.message} className="border rounded-lg p-3">
              <div className="text-sm font-medium text-gray-900">{g.message}</div>
              <div className="text-xs text-gray-500 mt-1">Occurrences: {g.items.length}</div>
              <div className="mt-2 max-h-40 overflow-auto text-xs text-gray-700 font-mono">
                {g.items.slice(0, 50).map((e: any, idx: number) => (
                  <div key={idx}>
                    Row {e?.rowNumber}: {e?.rowData ? JSON.stringify(e.rowData) : ''}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

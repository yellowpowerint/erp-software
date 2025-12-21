'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, Upload, Download } from 'lucide-react';
import type { ColumnMapping, CsvModule, CsvUploadValidationResult, ImportJob } from '@/types/csv';
import { useCSV } from '@/hooks/useCSV';
import ColumnMapper from '@/components/csv/ColumnMapper';

function buildDefaultMappings(headers: string[], keys: Array<{ key: string; required: boolean }>): ColumnMapping[] {
  return keys.map((k) => {
    const match = headers.find((h) => h.toLowerCase() === k.key.toLowerCase()) || null;
    return {
      key: k.key,
      header: k.key,
      sourceColumn: match,
      required: k.required,
    };
  });
}

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

export default function ImportModal(props: {
  open: boolean;
  onClose: () => void;
  module: CsvModule;
  title: string;
  context?: any;
}) {
  const { open, onClose, module, title, context } = props;

  const { loading, error, uploadCSV, startImport, getImportJob, getSampleTemplateUrl } = useCSV();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CsvUploadValidationResult | null>(null);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [job, setJob] = useState<ImportJob | null>(null);
  const [duplicateStrategy, setDuplicateStrategy] = useState<'skip' | 'update' | 'error'>('error');

  const requiredKeys = useMemo(() => defaultKeysForModule(module), [module]);

  useEffect(() => {
    if (!open) {
      setFile(null);
      setPreview(null);
      setMappings([]);
      setJob(null);
      setDuplicateStrategy('error');
    }
  }, [open]);

  useEffect(() => {
    if (!preview?.headers?.length) return;
    setMappings((prev) => (prev.length ? prev : buildDefaultMappings(preview.headers, requiredKeys)));
  }, [preview?.headers, requiredKeys]);

  useEffect(() => {
    if (!job?.id) return;

    const t = setInterval(async () => {
      try {
        const next = await getImportJob(job.id);
        setJob(next);
        if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(next.status)) {
          clearInterval(t);
        }
      } catch {
        // ignore
      }
    }, 2000);

    return () => clearInterval(t);
  }, [job?.id]);

  const canStart = !!file && !!preview && mappings.every((m) => !m.required || !!m.sourceColumn);

  const start = async () => {
    if (!file) return;

    const mergedContext = {
      ...(context || {}),
      duplicateStrategy,
    };

    const created = await startImport(module, file, mappings, mergedContext);
    setJob(created);
  };

  const previewFile = async () => {
    if (!file) return;
    const result = await uploadCSV(file, module);
    setPreview(result);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-600">Upload a CSV and map columns before importing.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">CSV File</label>
              <input
                type="file"
                accept=".csv,text/csv"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setFile(f);
                  setPreview(null);
                  setMappings([]);
                  setJob(null);
                }}
              />
              {file ? <div className="text-xs text-gray-500 mt-1">{file.name}</div> : null}
            </div>

            <a
              href={getSampleTemplateUrl(module)}
              className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Sample CSV
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duplicate handling</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={duplicateStrategy}
                onChange={(e) => setDuplicateStrategy(e.target.value as any)}
              >
                <option value="error">Error on duplicates</option>
                <option value="skip">Skip duplicates</option>
                <option value="update">Update existing</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={previewFile}
                disabled={!file || loading}
                className="w-full inline-flex items-center justify-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
              >
                <Upload className="w-4 h-4 mr-2" />
                Preview & Map
              </button>
            </div>
          </div>

          {error ? <div className="text-sm text-red-600">{error}</div> : null}

          {preview ? (
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold text-gray-900">Column Mapping</div>
                <div className="text-xs text-gray-500">Rows detected: {preview.totalRows}</div>
              </div>
              <ColumnMapper headers={preview.headers} mappings={mappings} onChange={setMappings} />
            </div>
          ) : null}

          {job ? (
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900">Import Job</div>
                <div className="text-xs text-gray-500">{job.id}</div>
              </div>
              <div className="mt-2 text-sm text-gray-700">
                Status: <span className="font-medium">{job.status}</span>
              </div>
              <div className="mt-1 text-sm text-gray-700">
                Progress: {job.processedRows}/{job.totalRows}
              </div>
              {job.errorRows ? <div className="mt-1 text-sm text-red-600">Errors: {job.errorRows}</div> : null}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">
            Close
          </button>
          <button
            onClick={start}
            disabled={!canStart || loading}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            Start Import
          </button>
        </div>
      </div>
    </div>
  );
}

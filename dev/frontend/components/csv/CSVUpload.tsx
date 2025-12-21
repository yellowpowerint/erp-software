'use client';

import { useEffect, useMemo, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Download, Upload, RefreshCcw } from 'lucide-react';
import type { ColumnMapping, CsvModule, CsvUploadValidationResult, ImportJob, ExportJob } from '@/types/csv';
import { useCSV } from '@/hooks/useCSV';

const MODULES: Array<{ value: CsvModule; label: string }> = [
  { value: 'inventory', label: 'Inventory Items' },
  { value: 'warehouses', label: 'Warehouses' },
  { value: 'suppliers', label: 'Suppliers' },
  { value: 'employees', label: 'Employees' },
  { value: 'projects', label: 'Projects' },
  { value: 'assets', label: 'Assets' },
];

function formatPercent(n: number, total: number) {
  if (!total) return '0%';
  return `${Math.round((n * 100) / total)}%`;
}

export default function CSVUpload() {
  const {
    loading,
    error,
    uploadCSV,
    startImport,
    getImportJob,
    startExport,
    getExportJob,
    downloadExport,
    getSampleTemplateUrl,
  } = useCSV();

  const [module, setModule] = useState<CsvModule>('inventory');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CsvUploadValidationResult | null>(null);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [importJob, setImportJob] = useState<ImportJob | null>(null);
  const [exportJob, setExportJob] = useState<ExportJob | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'text/csv': ['.csv'] },
    multiple: false,
    onDrop: (accepted) => {
      const f = accepted?.[0];
      if (f) {
        setFile(f);
        setPreview(null);
        setMappings([]);
        setImportJob(null);
      }
    },
  });

  const headers = preview?.headers || [];

  const requiredKeys = useMemo(() => {
    // These must mirror backend defaults. Keep minimal for 17.1.
    if (module === 'inventory') return ['itemCode', 'name', 'category', 'unit', 'warehouseId'];
    if (module === 'warehouses') return ['code', 'name', 'location'];
    if (module === 'suppliers') return ['name'];
    if (module === 'employees') return ['employeeId', 'firstName', 'lastName', 'email', 'department', 'position', 'hireDate'];
    if (module === 'projects') return ['projectCode', 'name', 'startDate'];
    return ['assetCode', 'name', 'category', 'purchaseDate', 'purchasePrice'];
  }, [module]);

  const defaultMappings = useMemo((): ColumnMapping[] => {
    // Simple: map matching headers by name
    return requiredKeys.map((k) => {
      const h = headers.find((x) => x.toLowerCase() === k.toLowerCase()) || null;
      return {
        key: k,
        header: k,
        sourceColumn: h,
        required: true,
      };
    });
  }, [headers, requiredKeys]);

  useEffect(() => {
    if (headers.length && defaultMappings.length) {
      setMappings((prev) => (prev.length ? prev : defaultMappings));
    }
  }, [headers, defaultMappings]);

  const handlePreview = async () => {
    if (!file) return;
    const result = await uploadCSV(file, module);
    setPreview(result);
  };

  const handleStartImport = async () => {
    if (!file) return;
    const job = await startImport(module, file, mappings);
    setImportJob(job);
  };

  const handleStartExport = async () => {
    // For 17.1: export the default module columns based on preview required keys.
    const columns = Array.from(new Set([...requiredKeys]));
    const job = await startExport(module, columns, {});
    setExportJob(job);
  };

  const handleDownloadExport = async () => {
    if (!exportJob) return;
    const { blob, fileName } = await downloadExport(exportJob.id, exportJob.fileName);
    const url = URL.createObjectURL(blob);

    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  useEffect(() => {
    if (!importJob) return;

    const t = setInterval(async () => {
      try {
        const next = await getImportJob(importJob.id);
        setImportJob(next);
        if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(next.status)) {
          clearInterval(t);
        }
      } catch {
        // ignore
      }
    }, 2000);

    return () => clearInterval(t);
  }, [importJob?.id]);

  useEffect(() => {
    if (!exportJob) return;

    const t = setInterval(async () => {
      try {
        const next = await getExportJob(exportJob.id);
        setExportJob(next);
        if (['COMPLETED', 'FAILED'].includes(next.status)) {
          clearInterval(t);
        }
      } catch {
        // ignore
      }
    }, 2000);

    return () => clearInterval(t);
  }, [exportJob?.id]);

  const canImport = !!file && !!preview && mappings.every((m) => !m.required || !!m.sourceColumn);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">CSV Import / Export</h2>
            <p className="text-sm text-gray-600">Upload a CSV, preview it, map columns, then import or export.</p>
          </div>
          <a
            href={getSampleTemplateUrl(module)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Sample
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Module</label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              value={module}
              onChange={(e) => {
                setModule(e.target.value as CsvModule);
                setPreview(null);
                setMappings([]);
                setImportJob(null);
                setExportJob(null);
              }}
            >
              {MODULES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">CSV File</label>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-md p-4 text-sm cursor-pointer ${
                isDragActive ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300 bg-white'
              }`}
            >
              <input {...getInputProps()} />
              {file ? (
                <div className="flex items-center justify-between">
                  <div className="text-gray-800">
                    <div className="font-medium">{file.name}</div>
                    <div className="text-xs text-gray-500">{Math.round(file.size / 1024)} KB</div>
                  </div>
                  <button
                    className="text-xs text-gray-600 hover:text-gray-900"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      setPreview(null);
                      setMappings([]);
                      setImportJob(null);
                    }}
                  >
                    Clear
                  </button>
                </div>
              ) : (
                <div className="text-gray-600">Drag & drop a .csv here, or click to select</div>
              )}
            </div>
          </div>
        </div>

        {error && <div className="mt-4 text-sm text-red-600">{error}</div>}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={handlePreview}
            disabled={!file || loading}
            className="inline-flex items-center px-3 py-2 rounded-md text-sm bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            Preview
          </button>

          <button
            onClick={handleStartImport}
            disabled={!canImport || loading}
            className="inline-flex items-center px-3 py-2 rounded-md text-sm bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
          >
            <Upload className="w-4 h-4 mr-2" />
            Start Import
          </button>

          <button
            onClick={handleStartExport}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 rounded-md text-sm bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50"
          >
            Export CSV
          </button>

          {exportJob?.status === 'COMPLETED' && (
            <button
              className="inline-flex items-center px-3 py-2 rounded-md text-sm border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50"
              onClick={handleDownloadExport}
              disabled={loading}
            >
              <Download className="w-4 h-4 mr-2" />
              Download Export
            </button>
          )}
        </div>
      </div>

      {preview && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-md font-semibold text-gray-900">Preview</h3>
              <p className="text-xs text-gray-500">Total rows detected: {preview.totalRows}</p>
            </div>
          </div>

          <div className="overflow-auto border border-gray-200 rounded-md">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">#</th>
                  {preview.headers.slice(0, 8).map((h) => (
                    <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-gray-600">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.previewRows.slice(0, 10).map((r) => (
                  <tr key={r.rowNumber} className="border-t border-gray-100">
                    <td className="px-3 py-2 text-xs text-gray-500">{r.rowNumber}</td>
                    {preview.headers.slice(0, 8).map((h) => (
                      <td key={h} className="px-3 py-2 text-xs text-gray-800">
                        {String(r.data?.[h] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Column Mapping</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {mappings.map((m, idx) => (
                <div key={m.key} className="border border-gray-200 rounded-md p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-gray-800">{m.key}</div>
                    {m.required && <div className="text-xs text-red-600">required</div>}
                  </div>
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={m.sourceColumn || ''}
                    onChange={(e) => {
                      const v = e.target.value || null;
                      setMappings((prev) => {
                        const next = [...prev];
                        next[idx] = { ...next[idx], sourceColumn: v };
                        return next;
                      });
                    }}
                  >
                    <option value="">-- Not Mapped --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {importJob && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-md font-semibold text-gray-900 mb-2">Import Job</h3>
          <div className="text-sm text-gray-700">Status: {importJob.status}</div>
          <div className="text-sm text-gray-700">Progress: {formatPercent(importJob.processedRows, importJob.totalRows)}</div>
          <div className="text-xs text-gray-500">{importJob.processedRows}/{importJob.totalRows} processed</div>
          <div className="text-xs text-gray-500">{importJob.successRows} success, {importJob.errorRows} errors</div>
        </div>
      )}

      {exportJob && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-md font-semibold text-gray-900 mb-2">Export Job</h3>
          <div className="text-sm text-gray-700">Status: {exportJob.status}</div>
          <div className="text-xs text-gray-500">Rows: {exportJob.totalRows}</div>
        </div>
      )}
    </div>
  );
}

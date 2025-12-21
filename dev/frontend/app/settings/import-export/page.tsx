'use client';

import { useEffect, useMemo, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@/types/auth';
import type { ExportJob, ImportJob } from '@/types/csv';
import { useCSV } from '@/hooks/useCSV';
import ImportErrorReport from '@/components/csv/ImportErrorReport';

function formatDate(value?: string | null) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

function ImportExportPageContent() {
  const { user } = useAuth();
  const { listImportHistory, listExportHistory, downloadExport, rollbackImport } = useCSV();

  const [tab, setTab] = useState<'imports' | 'exports'>('imports');
  const [loading, setLoading] = useState(true);
  const [imports, setImports] = useState<ImportJob[]>([]);
  const [exports, setExports] = useState<ExportJob[]>([]);
  const [expandedImportId, setExpandedImportId] = useState<string | null>(null);

  const [moduleFilter, setModuleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const canRollback = !!user && [UserRole.SUPER_ADMIN, UserRole.CEO, UserRole.IT_MANAGER].includes(user.role);

  const refresh = async () => {
    setLoading(true);
    try {
      const [i, e] = await Promise.all([listImportHistory(), listExportHistory()]);
      setImports(i);
      setExports(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh().catch(() => undefined);
  }, []);

  const filteredImports = useMemo(() => {
    return imports.filter((j) => {
      if (moduleFilter !== 'ALL' && j.module !== moduleFilter) return false;
      if (statusFilter !== 'ALL' && j.status !== statusFilter) return false;
      return true;
    });
  }, [imports, moduleFilter, statusFilter]);

  const filteredExports = useMemo(() => {
    return exports.filter((j) => {
      if (moduleFilter !== 'ALL' && j.module !== moduleFilter) return false;
      if (statusFilter !== 'ALL' && j.status !== statusFilter) return false;
      return true;
    });
  }, [exports, moduleFilter, statusFilter]);

  const rollback = async (jobId: string) => {
    if (!confirm('Rollback this import? This will attempt to revert created/updated records.')) return;
    await rollbackImport(jobId);
    await refresh();
  };

  const downloadExportFile = async (job: ExportJob) => {
    const { blob, fileName } = await downloadExport(job.id, job.fileName);
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

  const modules = useMemo(() => {
    const set = new Set<string>();
    for (const j of imports) set.add(j.module);
    for (const j of exports) set.add(j.module);
    return Array.from(set).sort();
  }, [imports, exports]);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Import/Export History</h1>
        <p className="text-gray-600">View CSV jobs, download error reports, and rollback imports (admins).</p>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="px-4 py-3 border-b flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTab('imports')}
              className={`px-3 py-2 rounded-lg text-sm ${tab === 'imports' ? 'bg-indigo-600 text-white' : 'border border-gray-300 hover:bg-gray-50'}`}
            >
              Imports
            </button>
            <button
              onClick={() => setTab('exports')}
              className={`px-3 py-2 rounded-lg text-sm ${tab === 'exports' ? 'bg-indigo-600 text-white' : 'border border-gray-300 hover:bg-gray-50'}`}
            >
              Exports
            </button>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="ALL">All modules</option>
              {modules.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="ALL">All statuses</option>
              {(tab === 'imports'
                ? ['PENDING', 'VALIDATING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED']
                : ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']
              ).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <button
              onClick={() => refresh()}
              className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm"
            >
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-gray-600">Loading…</div>
        ) : tab === 'imports' ? (
          <div className="p-4 space-y-3">
            {filteredImports.length === 0 ? <div className="text-sm text-gray-600">No import jobs found.</div> : null}

            {filteredImports.map((j) => {
              const expandable = j.status === 'FAILED' || (j.errorRows || 0) > 0;
              return (
                <div key={j.id} className="border rounded-lg">
                  <div className="p-4 flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{j.module}</div>
                      <div className="text-xs text-gray-500">{j.originalName}</div>
                      <div className="mt-1 text-xs text-gray-500">Created: {formatDate(j.createdAt)}</div>
                      <div className="mt-1 text-xs text-gray-500">Status: {j.status}</div>
                      <div className="mt-1 text-xs text-gray-500">
                        Progress: {j.processedRows}/{j.totalRows} (success {j.successRows}, errors {j.errorRows})
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {expandable ? (
                        <button
                          onClick={() => setExpandedImportId(expandedImportId === j.id ? null : j.id)}
                          className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm"
                        >
                          {expandedImportId === j.id ? 'Hide errors' : 'View errors'}
                        </button>
                      ) : null}

                      {canRollback && ['COMPLETED', 'FAILED'].includes(j.status) ? (
                        <button
                          onClick={() => rollback(j.id)}
                          className="px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm"
                        >
                          Rollback
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {expandedImportId === j.id ? (
                    <div className="p-4 border-t bg-gray-50">
                      <ImportErrorReport
                        jobId={j.id}
                        module={j.module as any}
                        context={j.context}
                        onReimportStarted={() => refresh()}
                      />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {filteredExports.length === 0 ? <div className="text-sm text-gray-600">No export jobs found.</div> : null}

            {filteredExports.map((j) => (
              <div key={j.id} className="border rounded-lg p-4 flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-gray-900">{j.module}</div>
                  <div className="text-xs text-gray-500">{j.fileName}</div>
                  <div className="mt-1 text-xs text-gray-500">Created: {formatDate(j.createdAt)}</div>
                  <div className="mt-1 text-xs text-gray-500">Status: {j.status}</div>
                  <div className="mt-1 text-xs text-gray-500">Rows: {j.totalRows}</div>
                </div>

                <div>
                  {j.status === 'COMPLETED' ? (
                    <button
                      onClick={() => downloadExportFile(j)}
                      className="px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-sm"
                    >
                      Download
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function ImportExportPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN, UserRole.CEO, UserRole.IT_MANAGER]}>
      <ImportExportPageContent />
    </ProtectedRoute>
  );
}

'use client';

import { useMemo, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useCSV } from '@/hooks/useCSV';
import { saveAs } from 'file-saver';
import { UserRole } from '@/types/auth';

export default function DataMigrationPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN, UserRole.IT_MANAGER]}>
      <DataMigrationPageContent />
    </ProtectedRoute>
  );
}

function DataMigrationPageContent() {
  const { exportFullBackup, validateBackup, importBackup } = useCSV();

  const [exporting, setExporting] = useState(false);
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [validateResult, setValidateResult] = useState<any | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canImport = useMemo(() => !!file, [file]);

  const doExport = async () => {
    setExporting(true);
    setMessage(null);
    setError(null);
    try {
      const res = await exportFullBackup();
      // res.fileUrl is a backend-served URL; download via browser
      const response = await fetch(res.fileUrl);
      const blob = await response.blob();
      saveAs(blob, res.fileName.split('/').pop() || 'backup.json.gz');
      setMessage('Backup exported successfully.');
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to export backup');
    } finally {
      setExporting(false);
    }
  };

  const doValidate = async () => {
    if (!file) return;
    setValidating(true);
    setMessage(null);
    setError(null);
    try {
      const res = await validateBackup(file);
      setValidateResult(res);
      setMessage(res.valid ? 'Backup is valid.' : 'Backup is invalid.');
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to validate backup');
    } finally {
      setValidating(false);
    }
  };

  const doImport = async () => {
    if (!file) return;
    const confirmText = 'Type RESTORE to confirm overwriting system data.';
    const entered = prompt(confirmText);
    if (entered !== 'RESTORE') return;

    setImporting(true);
    setMessage(null);
    setError(null);
    try {
      const res = await importBackup(file, true);
      setMessage(res.message || 'Backup restored.');
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to import backup');
    } finally {
      setImporting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Data Migration</h1>
        <p className="text-gray-600">Export full backup, validate backups, and restore (overwrite) when needed.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900">Export Full Backup</h2>
          <p className="text-sm text-gray-600 mt-1">Generates a gzipped JSON backup (.{`json.gz`}).</p>

          <button
            onClick={() => doExport()}
            disabled={exporting}
            className="mt-4 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {exporting ? 'Exporting…' : 'Export Backup'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900">Validate / Restore Backup</h2>
          <p className="text-sm text-gray-600 mt-1">Validate file integrity before restoring. Restore requires overwrite confirmation.</p>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Backup file (.json.gz)</label>
            <input
              type="file"
              accept=".gz,application/gzip"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setFile(f);
                setValidateResult(null);
              }}
            />
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={() => doValidate()}
              disabled={!canImport || validating}
              className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm disabled:opacity-50"
            >
              {validating ? 'Validating…' : 'Validate'}
            </button>
            <button
              onClick={() => doImport()}
              disabled={!canImport || importing}
              className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm disabled:opacity-50"
            >
              {importing ? 'Restoring…' : 'Restore (Overwrite)'}
            </button>
          </div>

          {validateResult ? (
            <div className="mt-4 border rounded-lg p-3 bg-gray-50">
              <div className="text-sm font-semibold text-gray-900">Validation</div>
              <div className="text-sm text-gray-700 mt-1">Valid: {String(!!validateResult.valid)}</div>
              {validateResult.errors?.length ? (
                <div className="mt-2 text-sm text-red-700">
                  {validateResult.errors.map((x: string, idx: number) => (
                    <div key={idx}>{x}</div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {message ? <div className="mt-4 text-sm text-green-700">{message}</div> : null}
      {error ? <div className="mt-4 text-sm text-red-700">{error}</div> : null}
    </DashboardLayout>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import type { CsvModule, ScheduledExport } from '@/types/csv';
import { useCSV } from '@/hooks/useCSV';
import { UserRole } from '@/types/auth';

const MODULES: Array<{ value: CsvModule; label: string }> = [
  { value: 'inventory', label: 'Inventory Items' },
  { value: 'inventory_movements', label: 'Inventory Movements' },
  { value: 'warehouses', label: 'Warehouses' },
  { value: 'suppliers', label: 'Suppliers' },
  { value: 'employees', label: 'Employees' },
  { value: 'projects', label: 'Projects' },
  { value: 'project_tasks', label: 'Project Tasks' },
  { value: 'assets', label: 'Assets' },
];

export default function ScheduledExportsPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN, UserRole.CEO, UserRole.CFO, UserRole.IT_MANAGER]}>
      <ScheduledExportsPageContent />
    </ProtectedRoute>
  );
}

function ScheduledExportsPageContent() {
  const {
    createScheduledExport,
    listScheduledExports,
    setScheduledExportActive,
    getScheduledExportRuns,
  } = useCSV();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [items, setItems] = useState<ScheduledExport[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [runs, setRuns] = useState<any[]>([]);

  const [name, setName] = useState('');
  const [module, setModule] = useState<CsvModule>('inventory');
  const [schedule, setSchedule] = useState('0 7 * * 1');
  const [recipients, setRecipients] = useState('');
  const [columnsText, setColumnsText] = useState('');
  const [filtersText, setFiltersText] = useState('{}');
  const [contextText, setContextText] = useState('{}');

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listScheduledExports();
      setItems(res);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load schedules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh().catch(() => undefined);
  }, []);

  const selected = useMemo(() => items.find((x) => x.id === selectedId) || null, [items, selectedId]);

  const loadRuns = async (id: string) => {
    const res = await getScheduledExportRuns(id);
    setRuns(res);
  };

  useEffect(() => {
    if (!selectedId) return;
    loadRuns(selectedId).catch(() => undefined);
  }, [selectedId]);

  const create = async () => {
    setError(null);
    let filters: any = {};
    let ctx: any = {};
    try {
      filters = filtersText ? JSON.parse(filtersText) : {};
    } catch {
      throw new Error('Filters must be valid JSON');
    }
    try {
      ctx = contextText ? JSON.parse(contextText) : {};
    } catch {
      throw new Error('Context must be valid JSON');
    }

    const cols = columnsText
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    const to = recipients
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);

    const created = await createScheduledExport({
      name,
      module,
      filters,
      columns: cols,
      context: Object.keys(ctx || {}).length ? ctx : undefined,
      schedule,
      recipients: to,
      format: 'csv',
      isActive: true,
    });

    setName('');
    setRecipients('');
    setColumnsText('');
    setFiltersText('{}');
    setContextText('{}');

    await refresh();
    setSelectedId(created.id);
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    await setScheduledExportActive(id, isActive);
    await refresh();
    if (selectedId === id) {
      await loadRuns(id);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Scheduled Exports</h1>
        <p className="text-gray-600">Create cron-based scheduled exports and email delivery.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900">Create Scheduled Export</h2>

          {error ? <div className="mt-3 text-sm text-red-600">{error}</div> : null}

          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Module</label>
              <select value={module} onChange={(e) => setModule(e.target.value as CsvModule)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {MODULES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cron / Schedule</label>
              <input value={schedule} onChange={(e) => setSchedule(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono" />
              <div className="text-xs text-gray-500 mt-1">Examples: daily | weekly | monthly | or cron (e.g. 0 7 * * 1)</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recipients (comma-separated emails)</label>
              <input value={recipients} onChange={(e) => setRecipients(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Columns (comma-separated)</label>
              <input value={columnsText} onChange={(e) => setColumnsText(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filters (JSON)</label>
              <textarea value={filtersText} onChange={(e) => setFiltersText(e.target.value)} rows={4} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Context (JSON)</label>
              <textarea value={contextText} onChange={(e) => setContextText(e.target.value)} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono" />
              <div className="text-xs text-gray-500 mt-1">For project tasks scheduled export, include {`{"projectId":"..."}`}</div>
            </div>

            <button
              onClick={() => create().catch((e: any) => setError(e?.message || 'Failed to create schedule'))}
              disabled={!name || !recipients || !columnsText}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              Create Schedule
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Schedules</h2>
            <button onClick={() => refresh()} className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm">
              Refresh
            </button>
          </div>

          {loading ? <div className="mt-3 text-sm text-gray-600">Loading…</div> : null}

          <div className="mt-4 space-y-3">
            {items.length === 0 ? <div className="text-sm text-gray-600">No scheduled exports found.</div> : null}

            {items.map((s) => (
              <div key={s.id} className={`border rounded-lg p-4 ${selectedId === s.id ? 'border-indigo-400' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{s.name}</div>
                    <div className="text-xs text-gray-500">{s.module}</div>
                    <div className="text-xs text-gray-500 mt-1">Next: {s.nextRunAt ? new Date(s.nextRunAt).toLocaleString() : '-'}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedId(selectedId === s.id ? null : s.id)}
                      className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm"
                    >
                      Details
                    </button>
                    <button
                      onClick={() => toggleActive(s.id, !s.isActive).catch((e: any) => setError(e?.message || 'Failed to update'))}
                      className={`px-3 py-2 rounded-lg text-sm ${s.isActive ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-green-600 text-white hover:bg-green-700'}`}
                    >
                      {s.isActive ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </div>

                {selectedId === s.id ? (
                  <div className="mt-3 border-t pt-3">
                    <div className="text-sm text-gray-700">Schedule: <span className="font-mono">{s.schedule}</span></div>
                    <div className="text-sm text-gray-700 mt-1">Recipients: {s.recipients.join(', ')}</div>

                    <div className="mt-3">
                      <div className="text-sm font-semibold text-gray-900">Recent Runs</div>
                      <div className="mt-2 space-y-2">
                        {runs.length === 0 ? <div className="text-sm text-gray-600">No runs yet.</div> : null}
                        {runs.map((r) => (
                          <div key={r.id} className="border rounded-lg p-3">
                            <div className="text-sm text-gray-900">Status: {r.status}</div>
                            <div className="text-xs text-gray-500">Created: {new Date(r.createdAt).toLocaleString()}</div>
                            {r.errorMessage ? <div className="text-xs text-red-600 mt-1">{r.errorMessage}</div> : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>

      {selected ? null : null}
    </DashboardLayout>
  );
}

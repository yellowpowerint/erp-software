'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { ArrowLeft, Download, FileText, RefreshCw } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

type FleetCostRow = {
  id: string;
  costDate: string;
  assetId: string;
  asset?: { id: string; assetCode: string; name: string };
  category: string;
  description: string;
  amount: string;
  currency: string;
  invoiceNumber?: string;
  receiptUrl?: string;
};

type PagedCosts = {
  data: FleetCostRow[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type ExportJob = { id: string; status: string };

const COST_CATEGORIES = [
  'FUEL',
  'MAINTENANCE',
  'REPAIRS',
  'INSURANCE',
  'REGISTRATION',
  'PERMITS',
  'TIRES',
  'PARTS',
  'LABOR',
  'EXTERNAL_SERVICE',
  'DEPRECIATION',
  'OTHER',
] as const;

function joinUrl(base: any, path: string) {
  const b = String(base || '').replace(/\/+$/, '');
  const p = String(path || '').replace(/^\/+/, '');
  return `${b}/${p}`;
}

function canManageFleet(role?: string) {
  return !!role && ['SUPER_ADMIN', 'CEO', 'CFO', 'OPERATIONS_MANAGER', 'WAREHOUSE_MANAGER', 'DEPARTMENT_HEAD'].includes(role);
}

function Inner() {
  const { user } = useAuth();
  const canManage = useMemo(() => canManageFleet(user?.role), [user?.role]);

  const [assetId, setAssetId] = useState('');
  const [category, setCategory] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<PagedCosts | null>(null);
  const [loading, setLoading] = useState(false);

  const [newCost, setNewCost] = useState({
    assetId: '',
    costDate: '',
    category: 'MAINTENANCE',
    description: '',
    amount: '',
    currency: 'GHS',
    invoiceNumber: '',
    receiptUrl: '',
  });
  const [creating, setCreating] = useState(false);

  const params = useMemo(() => {
    const p: any = { page, pageSize: 25 };
    if (assetId.trim()) p.assetId = assetId.trim();
    if (category.trim()) p.category = category.trim();
    if (from) p.from = from;
    if (to) p.to = to;
    return p;
  }, [assetId, category, from, to, page]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/fleet/costs', { params });
      setRows(res.data);
    } catch (e) {
      console.error('Failed to load fleet costs:', e);
      setRows(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const createCost = async () => {
    if (!canManage) return;
    const assetIdVal = newCost.assetId.trim();
    if (!assetIdVal) {
      alert('Asset ID is required');
      return;
    }
    if (!newCost.costDate) {
      alert('Cost date is required');
      return;
    }
    const amountNum = Number(newCost.amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      alert('Amount must be a valid number > 0');
      return;
    }
    if (!newCost.description.trim()) {
      alert('Description is required');
      return;
    }

    setCreating(true);
    try {
      await api.post('/fleet/costs', {
        assetId: assetIdVal,
        costDate: newCost.costDate,
        category: newCost.category,
        description: newCost.description.trim(),
        amount: String(amountNum),
        currency: newCost.currency.trim() || 'GHS',
        invoiceNumber: newCost.invoiceNumber.trim() || undefined,
        receiptUrl: newCost.receiptUrl.trim() || undefined,
      });

      setNewCost({
        assetId: '',
        costDate: '',
        category: 'MAINTENANCE',
        description: '',
        amount: '',
        currency: 'GHS',
        invoiceNumber: '',
        receiptUrl: '',
      });
      setPage(1);
      await load();
    } catch (e) {
      console.error('Failed to create fleet cost:', e);
      alert('Failed to create cost.');
    } finally {
      setCreating(false);
    }
  };

  const startExportAndPoll = async (exportParams: any) => {
    if (!canManage) return;
    try {
      const res = await api.get('/fleet/export/costs', { params: exportParams });
      const job: ExportJob | undefined = res.data?.data;
      if (!job?.id) return;

      const jobId = job.id;
      const startedAt = Date.now();

      while (Date.now() - startedAt < 60_000) {
        const statusRes = await api.get(`/csv/export/${jobId}`);
        const j: ExportJob | undefined = statusRes.data?.data;
        if (!j) break;
        if (j.status === 'COMPLETED') {
          const url = joinUrl(api.defaults.baseURL, `/csv/export/${jobId}/download`);
          window.open(url, '_blank');
          return;
        }
        if (j.status === 'FAILED') {
          alert('Export failed. Please try again or check export history.');
          return;
        }
        await new Promise((r) => setTimeout(r, 2000));
      }

      alert('Export is still processing. You can find it under CSV Export History.');
    } catch (e) {
      console.error('Export failed to start:', e);
      alert('Failed to start export.');
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link href="/fleet" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Fleet</span>
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fleet Reports</h1>
            <p className="text-gray-600 mt-1">Cost records, filters, and exports</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/fleet/analytics"
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 bg-white rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Analytics
            </Link>
            <button
              onClick={load}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 bg-white rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Asset ID</label>
            <input value={assetId} onChange={(e) => setAssetId(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Optional" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
            <input value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="e.g. FUEL" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={() => {
                setPage(1);
                load();
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Apply
            </button>
            {canManage && (
              <button
                onClick={() => startExportAndPoll({
                  assetId: assetId.trim() || undefined,
                  category: category.trim() || undefined,
                  from: from || undefined,
                  to: to || undefined,
                })}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 bg-white rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            )}
          </div>
        </div>
      </div>

      {canManage && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Fleet Cost</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Asset ID</label>
              <input
                value={newCost.assetId}
                onChange={(e) => setNewCost((s) => ({ ...s, assetId: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="FleetAsset ID"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Cost Date</label>
              <input
                type="date"
                value={newCost.costDate}
                onChange={(e) => setNewCost((s) => ({ ...s, costDate: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
              <select
                value={newCost.category}
                onChange={(e) => setNewCost((s) => ({ ...s, category: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
              >
                {COST_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Amount</label>
              <input
                value={newCost.amount}
                onChange={(e) => setNewCost((s) => ({ ...s, amount: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="0.00"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
              <input
                value={newCost.description}
                onChange={(e) => setNewCost((s) => ({ ...s, description: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="e.g. service invoice, replacement part, permit fee"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Currency</label>
              <input
                value={newCost.currency}
                onChange={(e) => setNewCost((s) => ({ ...s, currency: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="GHS"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Invoice #</label>
              <input
                value={newCost.invoiceNumber}
                onChange={(e) => setNewCost((s) => ({ ...s, invoiceNumber: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Optional"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">Receipt URL</label>
              <input
                value={newCost.receiptUrl}
                onChange={(e) => setNewCost((s) => ({ ...s, receiptUrl: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Optional"
              />
            </div>
            <div className="md:col-span-1 flex items-end">
              <button
                onClick={createCost}
                disabled={creating}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {creating ? 'Saving…' : 'Add Cost'}
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Tip: for best UX you can copy an Asset ID from Fleet Asset Registry. We can upgrade this to a searchable dropdown later.
          </p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading costs...</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Records</div>
                <div className="text-gray-900 font-medium">{rows?.total ?? 0}</div>
              </div>
              <div>
                <div className="text-gray-500">Page</div>
                <div className="text-gray-900 font-medium">{rows?.page ?? 1} / {rows?.totalPages ?? 1}</div>
              </div>
              <div>
                <div className="text-gray-500">Tip</div>
                <div className="text-gray-900 font-medium">Use exports for full datasets.</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rows?.data?.length ? (
                  rows.data.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-700">{new Date(r.costDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {r.asset?.assetCode || r.assetId}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{r.category}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{r.description}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">₵{Number(r.amount || 0).toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">No records.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <button
              disabled={(rows?.page ?? 1) <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-4 py-2 border border-gray-300 bg-white rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Previous
            </button>
            <div className="text-sm text-gray-600">Page {rows?.page ?? 1} of {rows?.totalPages ?? 1}</div>
            <button
              disabled={(rows?.page ?? 1) >= (rows?.totalPages ?? 1)}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 border border-gray-300 bg-white rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}

export default function Page() {
  return (
    <ProtectedRoute>
      <Inner />
    </ProtectedRoute>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { ArrowLeft, BarChart3, Download, RefreshCw } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, Legend } from 'recharts';
import { useAuth } from '@/lib/auth-context';

type CostCategoryRow = { category: string; amount: string };

type AnalyticsDashboard = {
  totalCostMTD: string;
  totalCostYTD: string;
  fuelCostMTD: string;
  fuelQuantityMTD: string;
  lowFuelTanks: number;
  overdueMaintenance: number;
  upcomingMaintenance: number;
  activeBreakdowns: number;
  costByCategory: Array<{ category: string; amount: string }>;
  costTrend: Array<{ month: string; total: string }>;
};

type UtilizationResponse = {
  overallUtilization: string;
  utilizationByType: Array<{ type: string; utilization: string; hours: string }>;
  utilizationBySite: Array<{ site: string; utilization: string; hours: string }>;
};

type PerformanceRow = {
  assetId: string;
  assetCode: string;
  name: string;
  failures: number;
  mtbfHours: string;
  mttrHours: string;
  availabilityRate: string;
};

type PerformanceResponse = {
  assets: PerformanceRow[];
};

type TcoResponse = {
  assetId: string;
  assetCode: string;
  name: string;
  totals: {
    fuel: string;
    maintenance: string;
    repairs: string;
    other: string;
    depreciation: string;
  };
  total: string;
};

type ExportJob = {
  id: string;
  status: string;
  fileUrl?: string;
  fileName?: string;
};

function joinUrl(base: any, path: string) {
  const b = String(base || '').replace(/\/+$/, '');
  const p = String(path || '').replace(/^\/+/, '');
  return `${b}/${p}`;
}

function toDateInputValue(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function canManageFleet(role?: string) {
  return !!role && ['SUPER_ADMIN', 'CEO', 'CFO', 'OPERATIONS_MANAGER', 'WAREHOUSE_MANAGER', 'DEPARTMENT_HEAD'].includes(role);
}

function Inner() {
  const { user } = useAuth();
  const canManage = useMemo(() => canManageFleet(user?.role), [user?.role]);

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const [dashboard, setDashboard] = useState<AnalyticsDashboard | null>(null);
  const [breakdown, setBreakdown] = useState<{ total: string; costByCategory: CostCategoryRow[] } | null>(null);
  const [utilization, setUtilization] = useState<UtilizationResponse | null>(null);
  const [performance, setPerformance] = useState<PerformanceResponse | null>(null);

  const [tcoAssetId, setTcoAssetId] = useState('');
  const [tco, setTco] = useState<TcoResponse | null>(null);
  const [tcoLoading, setTcoLoading] = useState(false);

  const [loading, setLoading] = useState(false);

  const params = useMemo(() => {
    const p: any = {};
    if (from) p.from = from;
    if (to) p.to = to;
    return p;
  }, [from, to]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [dashRes, breakdownRes, utilRes, perfRes] = await Promise.all([
        api.get('/fleet/analytics/dashboard'),
        api.get('/fleet/analytics/cost-breakdown', { params: Object.keys(params).length ? params : { days: 30 } }),
        api.get('/fleet/analytics/utilization', { params: Object.keys(params).length ? params : { days: 30 } }),
        api.get('/fleet/analytics/performance', { params: Object.keys(params).length ? params : { days: 30 } }),
      ]);
      setDashboard(dashRes.data);
      setBreakdown(breakdownRes.data);
      setUtilization(utilRes.data);
      setPerformance(perfRes.data);
    } catch (e) {
      console.error('Failed to load fleet analytics:', e);
      setDashboard(null);
      setBreakdown(null);
      setUtilization(null);
      setPerformance(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const defaultRange = useMemo(() => {
    const now = new Date();
    const toD = toDateInputValue(now);
    const fromD = toDateInputValue(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000));
    return { from: from || fromD, to: to || toD };
  }, [from, to]);

  const startExportAndPoll = async (path: string, exportParams: any) => {
    if (!canManage) return;
    try {
      const res = await api.get(path, { params: exportParams });
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

  const categoryChartData = useMemo(() => {
    return (breakdown?.costByCategory || []).slice(0, 10).map((x) => ({
      category: x.category,
      amount: Number(x.amount || 0),
    }));
  }, [breakdown]);

  const trendChartData = useMemo(() => {
    return (dashboard?.costTrend || []).map((x) => ({
      month: x.month,
      total: Number(x.total || 0),
    }));
  }, [dashboard]);

  const utilizationByTypeData = useMemo(() => {
    return (utilization?.utilizationByType || []).map((x) => ({
      type: x.type,
      utilization: Number(x.utilization || 0),
      hours: Number(x.hours || 0),
    }));
  }, [utilization]);

  const loadTco = async () => {
    const id = tcoAssetId.trim();
    if (!id) {
      alert('Enter an Asset ID');
      return;
    }
    setTcoLoading(true);
    try {
      const res = await api.get(`/fleet/analytics/tco/${id}`);
      setTco(res.data);
    } catch (e) {
      console.error('Failed to load TCO:', e);
      setTco(null);
      alert('Failed to load TCO for that asset.');
    } finally {
      setTcoLoading(false);
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
            <h1 className="text-2xl font-bold text-gray-900">Fleet Analytics</h1>
            <p className="text-gray-600 mt-1">Costs, utilization, and performance KPIs</p>
          </div>
          <button
            onClick={loadAll}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 bg-white rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div className="md:col-span-2 flex items-end gap-2">
            <button
              onClick={loadAll}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Apply
            </button>
            <button
              onClick={() => {
                setFrom('');
                setTo('');
              }}
              className="px-4 py-2 border border-gray-300 bg-white rounded-lg hover:bg-gray-50 transition-colors"
            >
              Reset
            </button>

            {canManage && (
              <button
                onClick={() => startExportAndPoll('/fleet/export/cost-breakdown', { from: from || undefined, to: to || undefined })}
                className="ml-auto inline-flex items-center gap-2 px-4 py-2 border border-gray-300 bg-white rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export Cost Breakdown CSV
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Total Cost (MTD)</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">₵{Number(dashboard?.totalCostMTD || 0).toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Total Cost (YTD)</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">₵{Number(dashboard?.totalCostYTD || 0).toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Low Fuel Tanks</div>
          <div className="text-2xl font-bold text-orange-600 mt-1">{dashboard?.lowFuelTanks ?? 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Active Breakdowns</div>
          <div className="text-2xl font-bold text-red-600 mt-1">{dashboard?.activeBreakdowns ?? 0}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">Cost Breakdown</h2>
          </div>
          {!categoryChartData.length ? (
            <p className="text-sm text-gray-500">No cost data available for this range.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={categoryChartData} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="category" width={120} />
                <Tooltip />
                <Bar dataKey="amount" fill="#4f46e5" name="Amount" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">Cost Trend (12 months)</h2>
          </div>
          {!trendChartData.length ? (
            <p className="text-sm text-gray-500">No trend data available yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trendChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#4f46e5" name="Total" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Utilization by Type</h2>
            {canManage && (
              <button
                onClick={() => startExportAndPoll('/fleet/export/utilization/by-type', { from: defaultRange.from, to: defaultRange.to })}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 bg-white rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            )}
          </div>
          {!utilizationByTypeData.length ? (
            <p className="text-sm text-gray-500">No utilization data available.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={utilizationByTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="utilization" fill="#10b981" name="Utilization" />
              </BarChart>
            </ResponsiveContainer>
          )}
          <p className="text-xs text-gray-500 mt-2">Utilization is an approximation based on operating hours logged in the selected period.</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Performance (Top Failures)</h2>
            {canManage && (
              <button
                onClick={() => startExportAndPoll('/fleet/export/performance', { from: defaultRange.from, to: defaultRange.to })}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 bg-white rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            )}
          </div>
          {performance?.assets?.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Asset</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Failures</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Availability</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {performance.assets
                    .slice()
                    .sort((a, b) => (b.failures || 0) - (a.failures || 0))
                    .slice(0, 10)
                    .map((a) => (
                      <tr key={a.assetId} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-700">{a.assetCode || a.assetId}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{a.failures}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{(Number(a.availabilityRate || 0) * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No performance data available.</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">More</h2>
        <p className="text-sm text-gray-600 mb-3">For detailed cost records and exports, go to the Reports page.</p>
        <Link
          href="/fleet/reports"
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Open Fleet Reports
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Asset Total Cost of Ownership (TCO)</h2>
            <p className="text-sm text-gray-600">Enter an Asset ID to compute TCO from fuel, maintenance, breakdown repairs, and fleet costs.</p>
          </div>
          {canManage && (
            <button
              onClick={() => {
                const id = tcoAssetId.trim();
                if (!id) {
                  alert('Enter an Asset ID');
                  return;
                }
                startExportAndPoll('/fleet/export/tco', { assetId: id });
              }}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 bg-white rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export TCO CSV
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Asset ID</label>
            <input
              value={tcoAssetId}
              onChange={(e) => setTcoAssetId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="FleetAsset ID"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={loadTco}
              disabled={tcoLoading}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {tcoLoading ? 'Loading…' : 'Compute TCO'}
            </button>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setTcoAssetId('');
                setTco(null);
              }}
              className="w-full px-4 py-2 border border-gray-300 bg-white rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        {tco && (
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-2 bg-gray-50 rounded-lg p-4">
              <div className="text-xs text-gray-500">Asset</div>
              <div className="text-sm font-semibold text-gray-900 mt-1">{tco.assetCode || tco.assetId}</div>
              <div className="text-sm text-gray-700">{tco.name}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-xs text-gray-500">Fuel</div>
              <div className="text-lg font-semibold text-gray-900">₵{Number(tco.totals.fuel || 0).toLocaleString()}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-xs text-gray-500">Maintenance</div>
              <div className="text-lg font-semibold text-gray-900">₵{Number(tco.totals.maintenance || 0).toLocaleString()}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-xs text-gray-500">Repairs</div>
              <div className="text-lg font-semibold text-gray-900">₵{Number(tco.totals.repairs || 0).toLocaleString()}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-xs text-gray-500">Other + Depreciation</div>
              <div className="text-lg font-semibold text-gray-900">₵{(Number(tco.totals.other || 0) + Number(tco.totals.depreciation || 0)).toLocaleString()}</div>
            </div>
            <div className="md:col-span-6 bg-indigo-50 border border-indigo-100 rounded-lg p-4">
              <div className="text-xs text-indigo-700">Total TCO</div>
              <div className="text-2xl font-bold text-indigo-900">₵{Number(tco.total || 0).toLocaleString()}</div>
            </div>
          </div>
        )}
      </div>
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

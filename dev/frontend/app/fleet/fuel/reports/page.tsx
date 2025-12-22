'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

type GroupRow = {
  key: string;
  count: number;
  liters: string;
  cost: string;
};

function Inner() {
  const { user } = useAuth();
  const canManage = useMemo(() => {
    return !!user && ['SUPER_ADMIN', 'CEO', 'CFO', 'OPERATIONS_MANAGER', 'WAREHOUSE_MANAGER', 'DEPARTMENT_HEAD'].includes(user.role);
  }, [user]);

  const [groupBy, setGroupBy] = useState('ASSET');
  const [siteLocation, setSiteLocation] = useState('');
  const [assetId, setAssetId] = useState('');

  const [report, setReport] = useState<any>(null);
  const [anomalies, setAnomalies] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const params = useMemo(() => {
    const p: any = { groupBy };
    if (siteLocation.trim()) p.siteLocation = siteLocation.trim();
    if (assetId.trim()) p.assetId = assetId.trim();
    return p;
  }, [groupBy, siteLocation, assetId]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [repRes, anRes] = await Promise.all([
          api.get('/fleet/fuel/consumption', { params }),
          canManage ? api.get('/fleet/fuel/anomalies', { params: { assetId: assetId.trim() || undefined, days: 60 } }) : Promise.resolve({ data: null }),
        ]);
        setReport(repRes.data);
        setAnomalies(anRes.data);
      } catch (e) {
        console.error('Failed to load fuel reports:', e);
        setReport(null);
        setAnomalies(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [params, canManage, assetId]);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link href="/fleet/fuel" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Fuel</span>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Fuel Reports</h1>
        <p className="text-gray-600 mt-1">Consumption summaries and anomaly detection</p>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Group By</label>
            <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white">
              <option value="ASSET">Asset</option>
              <option value="SITE">Site</option>
              <option value="FUEL_TYPE">Fuel Type</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Site Location</label>
            <input value={siteLocation} onChange={(e) => setSiteLocation(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Optional" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Asset ID</label>
            <input value={assetId} onChange={(e) => setAssetId(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Optional" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading reports...</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Records</div>
                <div className="text-gray-900 font-medium">{report?.total?.records ?? 0}</div>
              </div>
              <div>
                <div className="text-gray-500">Total Liters</div>
                <div className="text-gray-900 font-medium">{report?.total?.liters ?? '0'}</div>
              </div>
              <div>
                <div className="text-gray-500">Total Cost</div>
                <div className="text-gray-900 font-medium">₵{Number(report?.total?.cost || 0).toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Group</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Records</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Liters</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(report?.groups as GroupRow[] | undefined)?.length ? (
                  report.groups.map((g: GroupRow) => (
                    <tr key={g.key} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-700">{g.key}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{g.count}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{g.liters}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">₵{Number(g.cost || 0).toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      No data.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {canManage && anomalies?.anomalies?.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <h2 className="text-lg font-semibold text-gray-900">Anomalies (last {anomalies.days} days)</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Asset</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Efficiency</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Avg</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {anomalies.anomalies.slice(0, 25).map((a: any) => (
                      <tr key={a.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-700">{new Date(a.transactionDate).toLocaleString()}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{a.assetId}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{a.severity}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{a.fuelEfficiency}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{a.avgFuelEfficiency}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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

'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { Filter, Plus, Search, Truck, Download, Upload } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import ImportModal from '@/components/csv/ImportModal';
import ExportModal from '@/components/csv/ExportModal';

type FleetAsset = {
  id: string;
  assetCode: string;
  name: string;
  type: string;
  category: string;
  status: string;
  condition: string;
  currentLocation: string;
  operator?: { id: string; firstName: string; lastName: string; role: string } | null;
  _count?: { documents: number; assignments: number };
};

type FleetAssetsResponse = {
  data: FleetAsset[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

function FleetAssetsContent() {
  const { user } = useAuth();

  const [resp, setResp] = useState<FleetAssetsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [type, setType] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [condition, setCondition] = useState('ALL');
  const [location, setLocation] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const canManage = user && ['SUPER_ADMIN', 'CEO', 'CFO', 'OPERATIONS_MANAGER', 'WAREHOUSE_MANAGER'].includes(user.role);

  const params = useMemo(() => {
    const p: any = { page, pageSize: 25 };
    if (type !== 'ALL') p.type = type;
    if (status !== 'ALL') p.status = status;
    if (condition !== 'ALL') p.condition = condition;
    if (location.trim()) p.location = location.trim();
    if (search.trim()) p.search = search.trim();
    return p;
  }, [type, status, condition, location, search, page]);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const res = await api.get('/fleet/assets', { params });
      setResp(res.data);
    } catch (e) {
      console.error('Failed to fetch fleet assets:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [params]);

  const getStatusColor = (s: string) => {
    const colors: any = {
      ACTIVE: 'bg-green-100 text-green-800',
      IN_MAINTENANCE: 'bg-orange-100 text-orange-800',
      BREAKDOWN: 'bg-red-100 text-red-800',
      STANDBY: 'bg-gray-100 text-gray-800',
      DECOMMISSIONED: 'bg-gray-200 text-gray-800',
      SOLD: 'bg-gray-200 text-gray-800',
    };
    return colors[s] || 'bg-gray-100 text-gray-800';
  };

  const getConditionColor = (c: string) => {
    const colors: any = {
      EXCELLENT: 'text-green-600',
      GOOD: 'text-blue-600',
      FAIR: 'text-yellow-600',
      POOR: 'text-orange-600',
      CRITICAL: 'text-red-600',
    };
    return colors[c] || 'text-gray-600';
  };

  const totalPages = resp?.totalPages ?? 1;

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fleet Asset Registry</h1>
          <p className="text-gray-600 mt-1">Register vehicles, heavy machinery, and mining equipment</p>
        </div>
        {canManage && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setExportOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-5 h-5" />
              Export
            </button>
            <button
              onClick={() => setImportOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Upload className="w-5 h-5" />
              Import
            </button>
            <Link
              href="/fleet/assets/new"
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Asset
            </Link>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Search (code, name, reg no, serial...)"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={type}
              onChange={(e) => {
                setPage(1);
                setType(e.target.value);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="ALL">All Types</option>
              <option value="VEHICLE">Vehicle</option>
              <option value="HEAVY_MACHINERY">Heavy Machinery</option>
              <option value="DRILLING_EQUIPMENT">Drilling Equipment</option>
              <option value="PROCESSING_EQUIPMENT">Processing Equipment</option>
              <option value="SUPPORT_EQUIPMENT">Support Equipment</option>
              <option value="TRANSPORT">Transport</option>
            </select>
          </div>

          <select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="IN_MAINTENANCE">In Maintenance</option>
            <option value="BREAKDOWN">Breakdown</option>
            <option value="STANDBY">Standby</option>
            <option value="DECOMMISSIONED">Decommissioned</option>
            <option value="SOLD">Sold</option>
          </select>

          <select
            value={condition}
            onChange={(e) => {
              setPage(1);
              setCondition(e.target.value);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="ALL">All Conditions</option>
            <option value="EXCELLENT">Excellent</option>
            <option value="GOOD">Good</option>
            <option value="FAIR">Fair</option>
            <option value="POOR">Poor</option>
            <option value="CRITICAL">Critical</option>
          </select>

          <input
            value={location}
            onChange={(e) => {
              setPage(1);
              setLocation(e.target.value);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Filter by location/site"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading fleet assets...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Condition</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Docs</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {resp?.data?.length ? (
                resp.data.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`/fleet/assets/${a.id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-900">
                        {a.assetCode}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{a.name}</div>
                      <div className="text-xs text-gray-500">{a.category}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {a.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(a.status)}`}>{a.status}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-semibold ${getConditionColor(a.condition)}`}>{a.condition}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{a.currentLocation}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {a._count?.documents ?? 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link href={`/fleet/assets/${a.id}`} className="text-indigo-600 hover:text-indigo-900">
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p>No fleet assets found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing page {resp?.page ?? 1} of {totalPages} ({resp?.total ?? 0} total)
            </p>
            <div className="flex gap-2">
              <button
                disabled={(resp?.page ?? 1) <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Prev
              </button>
              <button
                disabled={(resp?.page ?? 1) >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      <ImportModal
        open={importOpen}
        onClose={() => {
          setImportOpen(false);
          fetchAssets();
        }}
        module="fleet_assets"
        title="Import Fleet Assets"
      />

      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        module="fleet_assets"
        title="Export Fleet Assets"
        filters={{ type, status, condition, location, search }}
      />
    </DashboardLayout>
  );
}

export default function FleetAssetsPage() {
  return (
    <ProtectedRoute>
      <FleetAssetsContent />
    </ProtectedRoute>
  );
}

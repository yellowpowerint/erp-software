'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { AlertTriangle, ClipboardList, Truck } from 'lucide-react';

type FleetDashboard = {
  totalAssets: number;
  activeAssets: number;
  inMaintenance: number;
  breakdowns: number;
  expiringDocuments: number;
  criticalAssets: number;
};

type FleetAlerts = {
  daysAhead: number;
  counts: {
    documents: number;
    insurance: number;
    permits: number;
    inspections: number;
  };
};

type FleetAnalyticsDashboard = {
  totalCostMTD: string;
  totalCostYTD: string;
  lowFuelTanks: number;
  overdueMaintenance: number;
  upcomingMaintenance: number;
  activeBreakdowns: number;
};

function FleetDashboardContent() {
  const [dashboard, setDashboard] = useState<FleetDashboard | null>(null);
  const [alerts, setAlerts] = useState<FleetAlerts | null>(null);
  const [analytics, setAnalytics] = useState<FleetAnalyticsDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [dashRes, alertsRes] = await Promise.all([
          api.get('/fleet/dashboard'),
          api.get('/fleet/alerts', { params: { daysAhead: 30 } }),
        ]);
        setDashboard(dashRes.data);
        setAlerts(alertsRes.data);

        try {
          const aRes = await api.get('/fleet/analytics/dashboard');
          setAnalytics(aRes.data);
        } catch (e) {
          // non-blocking; dashboard must still render if analytics is unavailable
          setAnalytics(null);
        }
      } catch (e) {
        console.error('Failed to load fleet dashboard:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fleet Management</h1>
          <p className="text-gray-600 mt-1">Fleet asset registry, assignments, and compliance tracking</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/fleet/assets"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            View Assets
          </Link>
          <Link
            href="/fleet/assignments"
            className="px-4 py-2 border border-gray-300 bg-white rounded-lg hover:bg-gray-50 transition-colors"
          >
            Assignments
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading fleet dashboard...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Total Assets</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{dashboard?.totalAssets ?? 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{dashboard?.activeAssets ?? 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">In Maintenance</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{dashboard?.inMaintenance ?? 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Breakdowns</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{dashboard?.breakdowns ?? 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Critical Assets</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{dashboard?.criticalAssets ?? 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Expiring Docs (30d)</p>
              <p className="text-2xl font-bold text-indigo-600 mt-1">{dashboard?.expiringDocuments ?? 0}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-2 mb-4">
                <Truck className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-semibold text-gray-900">Quick Links</h2>
              </div>
              <div className="space-y-2">
                <Link className="block text-indigo-600 hover:text-indigo-800" href="/fleet/assets">
                  Fleet Asset Registry
                </Link>
                <Link className="block text-indigo-600 hover:text-indigo-800" href="/fleet/assets/new">
                  Register New Asset
                </Link>
                <Link className="block text-indigo-600 hover:text-indigo-800" href="/fleet/assignments">
                  Current Assignments
                </Link>
                <Link className="block text-indigo-600 hover:text-indigo-800" href="/fleet/analytics">
                  Analytics
                </Link>
                <Link className="block text-indigo-600 hover:text-indigo-800" href="/fleet/reports">
                  Reports
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                <h2 className="text-lg font-semibold text-gray-900">Compliance Alerts</h2>
              </div>
              {alerts ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Documents</span>
                    <span className="font-semibold">{alerts.counts.documents}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Insurance</span>
                    <span className="font-semibold">{alerts.counts.insurance}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Permits</span>
                    <span className="font-semibold">{alerts.counts.permits}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Inspections</span>
                    <span className="font-semibold">{alerts.counts.inspections}</span>
                  </div>
                  <p className="text-xs text-gray-500 pt-2">Showing items expiring within {alerts.daysAhead} days.</p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No alert data available.</p>
              )}
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-2 mb-4">
                <ClipboardList className="w-5 h-5 text-gray-700" />
                <h2 className="text-lg font-semibold text-gray-900">Notes</h2>
              </div>
              <p className="text-sm text-gray-600">
                Session 19.5 adds cost analysis, reporting, and dashboard analytics. Use Analytics for KPIs and trend
                views, and Reports for cost records and exports.
              </p>
            </div>
          </div>

          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-600">Total Cost (MTD)</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">₵{Number(analytics.totalCostMTD || 0).toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-600">Total Cost (YTD)</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">₵{Number(analytics.totalCostYTD || 0).toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-600">Overdue Maintenance</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{analytics.overdueMaintenance ?? 0}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-600">Low Fuel Tanks</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{analytics.lowFuelTanks ?? 0}</p>
              </div>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}

export default function FleetDashboardPage() {
  return (
    <ProtectedRoute>
      <FleetDashboardContent />
    </ProtectedRoute>
  );
}

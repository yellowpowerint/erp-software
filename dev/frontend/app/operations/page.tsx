'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { HardHat, Plus, ClipboardList, Users, FileText, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

interface Stats {
  totalProductionLogs: number;
  todayLogs: number;
  activeShifts: number;
  totalFieldReports: number;
  productionByActivity: Record<string, number>;
}

function OperationsContent() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/operations/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading operations...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Operations Dashboard</h1>
        <p className="text-gray-600 mt-1">Monitor daily production, shifts, and field operations</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Production Logs</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalProductionLogs}</p>
              </div>
              <div className="bg-indigo-100 p-3 rounded-lg">
                <ClipboardList className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today&apos;s Logs</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.todayLogs}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Shifts</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{stats.activeShifts}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Field Reports</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{stats.totalFieldReports}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Today's Production by Activity */}
      {stats && Object.keys(stats.productionByActivity).length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Today&apos;s Production by Activity</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.productionByActivity).map(([activity, quantity]) => (
              <div key={activity} className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 capitalize">{activity.replace('_', ' ').toLowerCase()}</p>
                <p className="text-2xl font-bold text-indigo-600 mt-1">{quantity.toFixed(1)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/operations/production"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-indigo-100 p-3 rounded-lg">
              <ClipboardList className="w-8 h-8 text-indigo-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">Production Logs</h3>
              <p className="text-sm text-gray-600 mt-1">Record daily production activities and equipment usage</p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-indigo-600 font-medium">View Logs →</span>
          </div>
        </Link>

        <Link
          href="/operations/shifts"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">Shift Planning</h3>
              <p className="text-sm text-gray-600 mt-1">Manage shift schedules and crew assignments</p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-blue-600 font-medium">Manage Shifts →</span>
          </div>
        </Link>

        <Link
          href="/operations/field-reports"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-purple-100 p-3 rounded-lg">
              <FileText className="w-8 h-8 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">Field Reports</h3>
              <p className="text-sm text-gray-600 mt-1">Submit and review field observations and findings</p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-purple-600 font-medium">View Reports →</span>
          </div>
        </Link>
      </div>
    </DashboardLayout>
  );
}

export default function OperationsPage() {
  return (
    <ProtectedRoute>
      <OperationsContent />
    </ProtectedRoute>
  );
}

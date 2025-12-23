'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import QuickActions from '@/components/dashboard/QuickActions';
import ProductionChart from '@/components/dashboard/ProductionChart';
import ExpenseChart from '@/components/dashboard/ExpenseChart';
import { getRoleBasedStats } from '@/lib/get-role-stats';
import { AlertCircle, Clock } from 'lucide-react';
import RecentDocumentsWidget from '@/components/documents/RecentDocumentsWidget';
import api from '@/lib/api';

type DashboardOverview = {
  generatedAt: string;
  currency: string;
  kpis: {
    pendingApprovals: number;
    pendingInvoices: number;
    pendingPurchaseRequests: number;
    pendingExpenses: number;
    pendingRequisitions: number;
    pendingPayments: number;
    activeProjects: number;
    activeEmployees: number;
    openIncidents: number;
    totalStockItems: number;
    lowStockItems: number;
    outOfStockItems: number;
    mtdProduction: number;
    mtdExpenses: number;
    ytdProduction: number;
  };
  productionByMonth: Array<{ month: string; production: number }>;
  expensesByCategory: Array<{ category: string; amount: number; budget: number }>;
  recentActivity: Array<{
    id: string;
    timestamp: string;
    action: string;
    module: string | null;
    userId: string;
    userName: string | null;
    userEmail: string | null;
    details: unknown | null;
  }>;
};

function DashboardContent() {
  const { user } = useAuth();

  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const nowUtc = new Date();
      const day = nowUtc.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      });
      const time = nowUtc.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'UTC',
      });

      setCurrentTime(`${day} • ${time} GMT`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchOverview = async () => {
      if (!user) return;
      setOverviewLoading(true);
      try {
        const response = await api.get('/settings/dashboard-overview');
        if (!mounted) return;
        setOverview(response.data);
      } catch (error) {
        console.error('Failed to fetch dashboard overview:', error);
        if (!mounted) return;
        setOverview(null);
      } finally {
        if (!mounted) return;
        setOverviewLoading(false);
      }
    };

    fetchOverview();
    return () => {
      mounted = false;
    };
  }, [user]);

  const formatNumber = (value: number) => new Intl.NumberFormat('en-GB').format(value);
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: overview?.currency || 'GHS',
      maximumFractionDigits: 0,
    }).format(value);
  const formatTons = (value: number) => `${formatNumber(Math.round(value))} tons`;

  const stats = user
    ? getRoleBasedStats(user.role).map((s) => {
        const key = s.key;
        if (!key || !overview) return s;
        const raw = (overview.kpis as any)[key];
        if (raw === undefined || raw === null) return s;

        if (key === 'mtdExpenses') return { ...s, value: formatCurrency(Number(raw) || 0) };
        if (key === 'mtdProduction' || key === 'ytdProduction')
          return { ...s, value: formatTons(Number(raw) || 0) };
        return { ...s, value: formatNumber(Number(raw) || 0) };
      })
    : [];

  const recentActivities =
    overview?.recentActivity?.map((a) => {
      const timestamp = a.timestamp ? new Date(a.timestamp) : null;
      return {
        action: a.action,
        user: a.userName || a.userEmail || 'System',
        time: timestamp
          ? timestamp.toLocaleString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : '',
      };
    }) || [];

  return (
    <DashboardLayout>
      {/* Welcome Section */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-gray-600 mt-1">
            {`Here's what's happening with your operations today.`}
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600 bg-white rounded-lg shadow px-4 py-2">
          <Clock className="w-4 h-4 text-indigo-600" />
          <span className="font-medium">Current Time (GMT)</span>
          <span className="text-gray-900">{currentTime}</span>
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <p className="text-gray-600 text-sm">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-2">{stat.change}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ProductionChart data={overview?.productionByMonth || []} />
        <ExpenseChart data={overview?.expensesByCategory || []} />
      </div>

      {/* Three Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="p-6">
            {overviewLoading ? (
              <p className="text-sm text-gray-500">Loading recent activity…</p>
            ) : recentActivities.length === 0 ? (
              <p className="text-sm text-gray-500">
                No recent activity yet.
              </p>
            ) : (
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                      <p className="text-xs text-gray-500">
                        {activity.user} • {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Alerts & Profile */}
        <div className="space-y-6">
          <RecentDocumentsWidget limit={5} />

          {/* Alerts */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-2 mb-4">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              <h2 className="text-lg font-semibold text-gray-900">Alerts</h2>
            </div>
            {overviewLoading ? (
              <p className="text-sm text-gray-500">Loading alerts…</p>
            ) : !overview ? (
              <p className="text-sm text-gray-500">No alert data available.</p>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Pending Approvals</span>
                  <span className="font-medium text-gray-900">
                    {formatNumber(overview.kpis.pendingApprovals || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Low Stock Items</span>
                  <span className="font-medium text-gray-900">
                    {formatNumber(overview.kpis.lowStockItems || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Open Incidents</span>
                  <span className="font-medium text-gray-900">
                    {formatNumber(overview.kpis.openIncidents || 0)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Profile</h2>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm font-medium text-gray-900">{user?.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Role</p>
                <p className="text-sm font-medium text-gray-900">{user?.role}</p>
              </div>
              {user?.department && (
                <div>
                  <p className="text-xs text-gray-500">Department</p>
                  <p className="text-sm font-medium text-gray-900">{user.department}</p>
                </div>
              )}
              {user?.position && (
                <div>
                  <p className="text-xs text-gray-500">Position</p>
                  <p className="text-sm font-medium text-gray-900">{user.position}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </DashboardLayout>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

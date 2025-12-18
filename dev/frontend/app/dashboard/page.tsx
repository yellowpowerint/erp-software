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

  const stats = user ? getRoleBasedStats(user.role) : [];

  const recentActivities: Array<{ action: string; user: string; time: string }> = [];

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
        <ProductionChart />
        <ExpenseChart />
      </div>

      {/* Three Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="p-6">
            {recentActivities.length === 0 ? (
              <p className="text-sm text-gray-500">
                No recent activity yet. As your team starts using the system, key events
                will appear here.
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
            <p className="text-sm text-gray-500">
              Alerts for low stock, safety incidents, and pending approvals will appear
              here as the system is used.
            </p>
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

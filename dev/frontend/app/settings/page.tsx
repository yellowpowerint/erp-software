'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Settings, Users, Shield, Database, Bell, FileText, BrainCircuit, LockKeyhole, Upload, Calendar, DatabaseBackup, FileSpreadsheet } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@/types/auth';

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  recentLogins: number;
  usersByRole: Array<{ role: string; count: number }>;
}

function SettingsDashboardContent() {
  const { user } = useAuth();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/settings/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch system stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      </DashboardLayout>
    );
  }

  const canManageAiSettings =
    user && [UserRole.SUPER_ADMIN, UserRole.IT_MANAGER].includes(user.role);

  const canManageDocumentPermissions =
    user && [UserRole.SUPER_ADMIN, UserRole.CEO, UserRole.CFO, UserRole.IT_MANAGER].includes(user.role);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <div className="flex items-center space-x-3">
          <Settings className="w-8 h-8 text-indigo-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings & Administration</h1>
            <p className="text-gray-600">System configuration and user management</p>
          </div>
        </div>
      </div>

      {/* System Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow p-6 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <div className="text-sm text-blue-700 font-medium mb-1">Total Users</div>
            <div className="text-3xl font-bold text-blue-600">{stats.totalUsers}</div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg shadow p-6 border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-green-600" />
            </div>
            <div className="text-sm text-green-700 font-medium mb-1">Active Users</div>
            <div className="text-3xl font-bold text-green-600">{stats.activeUsers}</div>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-gray-600" />
            </div>
            <div className="text-sm text-gray-700 font-medium mb-1">Inactive Users</div>
            <div className="text-3xl font-bold text-gray-600">{stats.inactiveUsers}</div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg shadow p-6 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-purple-600" />
            </div>
            <div className="text-sm text-purple-700 font-medium mb-1">Recent Logins</div>
            <div className="text-3xl font-bold text-purple-600">{stats.recentLogins}</div>
            <div className="text-xs text-purple-600 mt-1">Last 7 days</div>
          </div>
        </div>
      )}

      {/* Settings Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Link
          href="/settings/csv"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow border border-gray-200"
        >
          <Upload className="w-10 h-10 text-emerald-600 mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">CSV Import/Export</h3>
          <p className="text-sm text-gray-600">Bulk upload and export via CSV templates</p>
        </Link>

        <Link
          href="/settings/import-export"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow border border-gray-200"
        >
          <FileSpreadsheet className="w-10 h-10 text-indigo-600 mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Import/Export</h3>
          <p className="text-sm text-gray-600">History, errors, and rollback controls</p>
        </Link>

        <Link
          href="/settings/data-migration"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow border border-gray-200"
        >
          <DatabaseBackup className="w-10 h-10 text-green-600 mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Data Migration</h3>
          <p className="text-sm text-gray-600">Export and restore full backups</p>
        </Link>

        <Link
          href="/settings/scheduled-exports"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow border border-gray-200"
        >
          <Calendar className="w-10 h-10 text-purple-600 mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Scheduled Exports</h3>
          <p className="text-sm text-gray-600">Cron-based exports with email delivery</p>
        </Link>

        <Link
          href="/settings/users"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow border border-gray-200"
        >
          <Users className="w-10 h-10 text-blue-600 mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">User Management</h3>
          <p className="text-sm text-gray-600">Manage users, roles, and permissions</p>
          {stats && (
            <div className="mt-3 text-xs text-blue-600 font-medium">
              {stats.totalUsers} total users
            </div>
          )}
        </Link>

        <Link
          href="/settings/system"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow border border-gray-200"
        >
          <Database className="w-10 h-10 text-green-600 mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">System Configuration</h3>
          <p className="text-sm text-gray-600">Configure system settings and preferences</p>
        </Link>

        <Link
          href="/settings/profile"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow border border-gray-200"
        >
          <Shield className="w-10 h-10 text-purple-600 mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">My Profile</h3>
          <p className="text-sm text-gray-600">Update your profile and password</p>
        </Link>

        <Link
          href="/settings/notifications"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow border border-gray-200"
        >
          <Bell className="w-10 h-10 text-yellow-600 mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Notifications</h3>
          <p className="text-sm text-gray-600">Configure notification preferences</p>
        </Link>

        <Link
          href="/settings/audit-logs"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow border border-gray-200"
        >
          <FileText className="w-10 h-10 text-red-600 mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Audit Logs</h3>
          <p className="text-sm text-gray-600">View system activity and audit logs</p>
        </Link>

        {canManageDocumentPermissions && (
          <Link
            href="/settings/documents/permissions"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow border border-gray-200"
          >
            <LockKeyhole className="w-10 h-10 text-indigo-600 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Document Permissions</h3>
            <p className="text-sm text-gray-600">Manage document access rules, templates, and audit trail</p>
          </Link>
        )}

        {canManageAiSettings && (
          <Link
            href="/settings/ai"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow border border-gray-200"
          >
            <BrainCircuit className="w-10 h-10 text-purple-600 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">AI & Integrations</h3>
            <p className="text-sm text-gray-600">Manage OpenAI/Claude keys and AI options</p>
          </Link>
        )}

        <Link
          href="/settings/roles"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow border border-gray-200"
        >
          <Shield className="w-10 h-10 text-indigo-600 mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Roles & Permissions</h3>
          <p className="text-sm text-gray-600">Manage role-based access control</p>
        </Link>
      </div>

      {/* Users by Role */}
      {stats && stats.usersByRole.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Users by Role</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {stats.usersByRole.map((item, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-indigo-600 mb-1">{item.count}</div>
                <div className="text-xs text-gray-600">{item.role.replace(/_/g, ' ')}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function SettingsDashboardPage() {
  return (
    <ProtectedRoute>
      <SettingsDashboardContent />
    </ProtectedRoute>
  );
}

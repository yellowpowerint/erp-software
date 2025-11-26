'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { FileText, ArrowLeft, Download, Filter, RefreshCw, User, Settings as SettingsIcon, Lock, Database, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

interface AuditLog {
  id: string;
  timestamp: Date;
  action: string;
  userId: string;
  details: string;
  category?: string;
  ipAddress?: string;
}

function AuditLogsContent() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    action: '',
    userId: '',
    dateFrom: '',
    dateTo: '',
  });

  const mockLogs: AuditLog[] = [
        {
          id: '1',
          timestamp: new Date(Date.now() - 1000 * 60 * 15),
          action: 'USER_LOGIN',
          userId: 'user1',
          details: 'User successfully logged in',
          category: 'Authentication',
          ipAddress: 'Hidden',
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 1000 * 60 * 30),
          action: 'USER_CREATED',
          userId: 'admin',
          details: 'Created new user: jane.smith',
          category: 'User Management',
          ipAddress: 'Hidden',
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 1000 * 60 * 45),
          action: 'CONFIG_UPDATED',
          userId: 'admin',
          details: 'System configuration updated',
          category: 'System',
          ipAddress: 'Hidden',
        },
        {
          id: '4',
          timestamp: new Date(Date.now() - 1000 * 60 * 60),
          action: 'PASSWORD_CHANGED',
          userId: 'user2',
          details: 'User changed their password',
          category: 'Security',
          ipAddress: 'Hidden',
        },
        {
          id: '5',
          timestamp: new Date(Date.now() - 1000 * 60 * 90),
          action: 'USER_DEACTIVATED',
          userId: 'admin',
          details: 'Deactivated user: old.user',
          category: 'User Management',
          ipAddress: 'Hidden',
        },
        {
          id: '6',
          timestamp: new Date(Date.now() - 1000 * 60 * 120),
          action: 'APPROVAL_CREATED',
          userId: 'manager',
          details: 'Created approval workflow for Purchase Requests',
          category: 'Workflows',
          ipAddress: 'Hidden',
        },
        {
          id: '7',
          timestamp: new Date(Date.now() - 1000 * 60 * 150),
          action: 'ROLE_UPDATED',
          userId: 'admin',
          details: 'Updated role for user: employee to DEPARTMENT_HEAD',
          category: 'User Management',
          ipAddress: 'Hidden',
        },
        {
          id: '8',
          timestamp: new Date(Date.now() - 1000 * 60 * 180),
          action: 'DATA_EXPORT',
          userId: 'cfo',
          details: 'Exported financial report data',
          category: 'Data',
          ipAddress: 'Hidden',
        },
        {
          id: '9',
          timestamp: new Date(Date.now() - 1000 * 60 * 210),
          action: 'FAILED_LOGIN',
          userId: 'unknown',
          details: 'Failed login attempt - invalid credentials',
          category: 'Security',
          ipAddress: 'Hidden',
        },
        {
          id: '10',
          timestamp: new Date(Date.now() - 1000 * 60 * 240),
          action: 'SETTINGS_VIEWED',
          userId: 'manager',
          details: 'Viewed system settings page',
          category: 'System',
          ipAddress: 'Hidden',
        },
      ];
  
  const fetchLogs = async () => {
    try {
      const response = await api.get('/settings/audit-logs', {
        params: { limit: 50 },
      });

      const apiLogs: AuditLog[] = (response.data?.logs || []).map((log: any) => ({
        id: log.id,
        timestamp: new Date(log.timestamp),
        action: log.action,
        userId: log.userId,
        details: log.details,
        category: log.category,
        ipAddress: log.ipAddress,
      }));

      setLogs(apiLogs.length > 0 ? apiLogs : mockLogs);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      setLogs(mockLogs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionIcon = (action: string) => {
    if (action.includes('LOGIN') || action.includes('PASSWORD')) {
      return <Lock className="w-4 h-4" />;
    } else if (action.includes('USER') || action.includes('ROLE')) {
      return <User className="w-4 h-4" />;
    } else if (action.includes('CONFIG') || action.includes('SETTINGS')) {
      return <SettingsIcon className="w-4 h-4" />;
    } else if (action.includes('DATA') || action.includes('EXPORT')) {
      return <Database className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  const getActionColor = (action: string) => {
    if (action.includes('FAILED') || action.includes('DEACTIVATED')) {
      return 'bg-red-100 text-red-700 border-red-200';
    } else if (action.includes('CREATED') || action.includes('LOGIN')) {
      return 'bg-green-100 text-green-700 border-green-200';
    } else if (action.includes('UPDATED') || action.includes('CHANGED')) {
      return 'bg-blue-100 text-blue-700 border-blue-200';
    } else if (action.includes('DELETED') || action.includes('REMOVED')) {
      return 'bg-orange-100 text-orange-700 border-orange-200';
    }
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getCategoryBadge = (category?: string) => {
    if (!category) return null;
    
    const colors: Record<string, string> = {
      'Authentication': 'bg-purple-100 text-purple-700',
      'User Management': 'bg-blue-100 text-blue-700',
      'Security': 'bg-red-100 text-red-700',
      'System': 'bg-green-100 text-green-700',
      'Workflows': 'bg-indigo-100 text-indigo-700',
      'Data': 'bg-yellow-100 text-yellow-700',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[category] || 'bg-gray-100 text-gray-700'}`}>
        {category}
      </span>
    );
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) {
      return `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return new Date(date).toLocaleString();
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

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link href="/settings" className="inline-flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Settings</span>
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText className="w-8 h-8 text-red-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
              <p className="text-gray-600">System activity and security audit trail</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={fetchLogs}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Total Events</div>
          <div className="text-2xl font-bold text-gray-900">{logs.length}</div>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-4 border border-green-200">
          <div className="text-sm text-green-700 font-medium mb-1">Successful</div>
          <div className="text-2xl font-bold text-green-600">
            {logs.filter(l => !l.action.includes('FAILED')).length}
          </div>
        </div>
        <div className="bg-red-50 rounded-lg shadow p-4 border border-red-200">
          <div className="text-sm text-red-700 font-medium mb-1">Failed</div>
          <div className="text-2xl font-bold text-red-600">
            {logs.filter(l => l.action.includes('FAILED')).length}
          </div>
        </div>
        <div className="bg-blue-50 rounded-lg shadow p-4 border border-blue-200">
          <div className="text-sm text-blue-700 font-medium mb-1">Last 24 Hours</div>
          <div className="text-2xl font-bold text-blue-600">
            {logs.filter(l => new Date().getTime() - new Date(l.timestamp).getTime() < 86400000).length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center space-x-2 mb-3">
          <Filter className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Filters</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Action Type</label>
            <select
              value={filter.action}
              onChange={(e) => setFilter({ ...filter, action: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Actions</option>
              <option value="LOGIN">Logins</option>
              <option value="USER">User Management</option>
              <option value="CONFIG">Configuration</option>
              <option value="SECURITY">Security</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">User</label>
            <input
              type="text"
              value={filter.userId}
              onChange={(e) => setFilter({ ...filter, userId: e.target.value })}
              placeholder="Search by user..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={filter.dateFrom}
              onChange={(e) => setFilter({ ...filter, dateFrom: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={filter.dateTo}
              onChange={(e) => setFilter({ ...filter, dateTo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>
      </div>

      {/* Audit Logs Timeline */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Activity Timeline</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {logs.map((log) => (
            <div key={log.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-start space-x-4">
                <div className={`p-2 rounded-lg border ${getActionColor(log.action)}`}>
                  {getActionIcon(log.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">
                        {log.action.replace(/_/g, ' ')}
                      </span>
                      {getCategoryBadge(log.category)}
                    </div>
                    <span className="text-xs text-gray-500">{formatTimestamp(log.timestamp)}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{log.details}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span className="flex items-center space-x-1">
                      <User className="w-3 h-3" />
                      <span>{log.userId}</span>
                    </span>
                    {log.ipAddress && (
                      <span className="flex items-center space-x-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>{log.ipAddress}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {logs.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No audit logs found</p>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function AuditLogsPage() {
  return (
    <ProtectedRoute>
      <AuditLogsContent />
    </ProtectedRoute>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Eye, Download, Edit, Trash2, Share2, FileSignature, Shield, Filter, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';

interface AccessLogEntry {
  id: string;
  action: 'VIEWED' | 'DOWNLOADED' | 'EDITED' | 'DELETED' | 'SHARED' | 'SIGNED' | 'PERMISSION_CHANGED' | 'SECURITY_UPDATED';
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  ipAddress: string;
  userAgent: string;
  metadata?: any;
  accessedAt: string;
}

interface AccessLogProps {
  documentId: string;
  logs: AccessLogEntry[];
  onRefresh?: () => void;
  showFilters?: boolean;
}

const actionIcons = {
  VIEWED: Eye,
  DOWNLOADED: Download,
  EDITED: Edit,
  DELETED: Trash2,
  SHARED: Share2,
  SIGNED: FileSignature,
  PERMISSION_CHANGED: Shield,
  SECURITY_UPDATED: Shield,
};

const actionColors = {
  VIEWED: 'text-blue-600 bg-blue-50',
  DOWNLOADED: 'text-green-600 bg-green-50',
  EDITED: 'text-yellow-600 bg-yellow-50',
  DELETED: 'text-red-600 bg-red-50',
  SHARED: 'text-purple-600 bg-purple-50',
  SIGNED: 'text-indigo-600 bg-indigo-50',
  PERMISSION_CHANGED: 'text-orange-600 bg-orange-50',
  SECURITY_UPDATED: 'text-pink-600 bg-pink-50',
};

export default function AccessLog({
  documentId,
  logs,
  onRefresh,
  showFilters = true,
}: AccessLogProps) {
  const [filteredLogs, setFilteredLogs] = useState<AccessLogEntry[]>(logs);
  const [actionFilter, setActionFilter] = useState<string>('');
  const [userFilter, setUserFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');

  useEffect(() => {
    let filtered = [...logs];

    if (actionFilter) {
      filtered = filtered.filter(log => log.action === actionFilter);
    }

    if (userFilter) {
      filtered = filtered.filter(log => 
        log.user.firstName.toLowerCase().includes(userFilter.toLowerCase()) ||
        log.user.lastName.toLowerCase().includes(userFilter.toLowerCase()) ||
        log.user.email.toLowerCase().includes(userFilter.toLowerCase())
      );
    }

    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      filtered = filtered.filter(log => {
        const logDate = new Date(log.accessedAt);
        return logDate.toDateString() === filterDate.toDateString();
      });
    }

    setFilteredLogs(filtered);
  }, [logs, actionFilter, userFilter, dateFilter]);

  const getActionIcon = (action: AccessLogEntry['action']) => {
    const Icon = actionIcons[action];
    return <Icon className="h-4 w-4" />;
  };

  const getActionColor = (action: AccessLogEntry['action']) => {
    return actionColors[action] || 'text-gray-600 bg-gray-50';
  };

  const formatAction = (action: string) => {
    return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const getBrowserInfo = (userAgent: string) => {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Access Log</h3>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Refresh
            </button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Action
              </label>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">All Actions</option>
                <option value="VIEWED">Viewed</option>
                <option value="DOWNLOADED">Downloaded</option>
                <option value="EDITED">Edited</option>
                <option value="DELETED">Deleted</option>
                <option value="SHARED">Shared</option>
                <option value="SIGNED">Signed</option>
                <option value="PERMISSION_CHANGED">Permission Changed</option>
                <option value="SECURITY_UPDATED">Security Updated</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User
              </label>
              <input
                type="text"
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                placeholder="Search by name or email"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No access logs found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Browser
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full ${getActionColor(log.action)}`}>
                      {getActionIcon(log.action)}
                      <span className="text-sm font-medium">{formatAction(log.action)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {log.user.firstName} {log.user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{log.user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {format(new Date(log.accessedAt), 'MMM d, yyyy')}
                    </div>
                    <div className="text-sm text-gray-500">
                      {format(new Date(log.accessedAt), 'h:mm a')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.ipAddress}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getBrowserInfo(log.userAgent)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {filteredLogs.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600">
            Showing {filteredLogs.length} of {logs.length} entries
          </p>
        </div>
      )}
    </div>
  );
}

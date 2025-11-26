'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Calendar, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

interface LeaveRequest {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: string;
  createdAt: string;
  employee: {
    employeeId: string;
    firstName: string;
    lastName: string;
    department: string;
    position: string;
  };
}

function LeaveRequestsPageContent() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchLeaves();
  }, [filter]);

  const fetchLeaves = async () => {
    try {
      const url = filter ? `/hr/leave-requests?status=${filter}` : '/hr/leave-requests';
      const response = await api.get(url);
      setLeaves(response.data);
    } catch (error) {
      console.error('Failed to fetch leave requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.put(`/hr/leave-requests/${id}/status`, { status: 'APPROVED', approvedById: 'current-user' });
      fetchLeaves();
      alert('Leave request approved');
    } catch (error) {
      console.error('Failed to approve leave:', error);
      alert('Failed to approve leave request');
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Reason for rejection:');
    if (!reason) return;

    try {
      await api.put(`/hr/leave-requests/${id}/status`, { status: 'REJECTED', rejectionReason: reason });
      fetchLeaves();
      alert('Leave request rejected');
    } catch (error) {
      console.error('Failed to reject leave:', error);
      alert('Failed to reject leave request');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link href="/hr" className="inline-flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to HR Dashboard</span>
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Calendar className="w-8 h-8 text-yellow-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Leave Requests</h1>
              <p className="text-gray-600">Manage employee leave applications</p>
            </div>
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Requests</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {leaves.map((leave) => (
              <div key={leave.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="font-medium text-gray-900">
                        {leave.employee.firstName} {leave.employee.lastName}
                      </span>
                      <span className="text-sm text-gray-500">({leave.employee.employeeId})</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(leave.status)}`}>
                        {leave.status}
                      </span>
                      <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800 capitalize">
                        {leave.leaveType.toLowerCase().replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>{leave.employee.department} - {leave.employee.position}</div>
                      <div className="flex items-center space-x-4">
                        <span>From: {new Date(leave.startDate).toLocaleDateString()}</span>
                        <span>To: {new Date(leave.endDate).toLocaleDateString()}</span>
                        <span className="font-medium">{leave.totalDays} day(s)</span>
                      </div>
                      <div className="mt-2">
                        <span className="font-medium">Reason:</span> {leave.reason}
                      </div>
                    </div>
                  </div>
                  {leave.status === 'PENDING' && (
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleApprove(leave.id)}
                        className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleReject(leave.id)}
                        className="flex items-center space-x-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  Requested on: {new Date(leave.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && leaves.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Leave Requests</h3>
            <p className="text-gray-600">No leave requests found</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function LeaveRequestsPage() {
  return (
    <ProtectedRoute>
      <LeaveRequestsPageContent />
    </ProtectedRoute>
  );
}

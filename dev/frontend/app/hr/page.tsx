'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Users, UserCheck, Calendar, ClipboardList, TrendingUp, AlertCircle, Briefcase } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

interface HrStats {
  totalEmployees: number;
  activeEmployees: number;
  pendingLeaves: number;
  todayAttendance: number;
  employeesByDepartment: Array<{ department: string; count: number }>;
}

function HrDashboardContent() {
  const [stats, setStats] = useState<HrStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/hr/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch HR stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading HR data...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <div className="flex items-center space-x-3">
          <Users className="w-8 h-8 text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900">HR & Personnel Management</h1>
        </div>
        <p className="text-gray-600 mt-1">Employee management, attendance, and performance tracking</p>
      </div>

      {stats && (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-5 h-5 text-gray-500" />
                <span className="text-2xl font-bold text-gray-900">{stats.totalEmployees}</span>
              </div>
              <p className="text-sm text-gray-600">Total Employees</p>
            </div>

            <div className="bg-green-50 rounded-lg shadow p-6 border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <UserCheck className="w-5 h-5 text-green-600" />
                <span className="text-2xl font-bold text-green-600">{stats.activeEmployees}</span>
              </div>
              <p className="text-sm text-green-700 font-medium">Active Employees</p>
            </div>

            <div className="bg-yellow-50 rounded-lg shadow p-6 border border-yellow-200">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="w-5 h-5 text-yellow-600" />
                <span className="text-2xl font-bold text-yellow-600">{stats.pendingLeaves}</span>
              </div>
              <p className="text-sm text-yellow-700 font-medium">Pending Leave Requests</p>
            </div>

            <div className="bg-blue-50 rounded-lg shadow p-6 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <ClipboardList className="w-5 h-5 text-blue-600" />
                <span className="text-2xl font-bold text-blue-600">{stats.todayAttendance}</span>
              </div>
              <p className="text-sm text-blue-700 font-medium">Today&apos;s Attendance</p>
            </div>
          </div>

          {/* Pending Leaves Alert */}
          {stats.pendingLeaves > 0 && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-3" />
                <p className="text-sm text-yellow-700">
                  <span className="font-medium">{stats.pendingLeaves} leave request(s)</span> awaiting approval
                </p>
              </div>
            </div>
          )}

          {/* Department Breakdown */}
          {stats.employeesByDepartment.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-indigo-600" />
                Employees by Department
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.employeesByDepartment.map((dept, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-indigo-600">{dept.count}</div>
                    <div className="text-sm text-gray-600">{dept.department}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Link
              href="/hr/employees"
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <Users className="w-8 h-8 text-indigo-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">Employees</h3>
              <p className="text-sm text-gray-600">Manage employee profiles and information</p>
            </Link>

            <Link
              href="/hr/attendance"
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <UserCheck className="w-8 h-8 text-green-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">Attendance</h3>
              <p className="text-sm text-gray-600">Track daily attendance and work hours</p>
            </Link>

            <Link
              href="/hr/leave-requests"
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <Calendar className="w-8 h-8 text-yellow-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">Leave Requests</h3>
              <p className="text-sm text-gray-600">Manage employee leave applications</p>
            </Link>

            <Link
              href="/hr/recruitment"
              className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg shadow p-6 hover:shadow-lg transition-shadow border border-purple-200"
            >
              <Briefcase className="w-8 h-8 text-purple-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1 flex items-center">
                Recruitment
                <span className="ml-2 text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">AI</span>
              </h3>
              <p className="text-sm text-gray-600">AI-powered talent acquisition</p>
            </Link>

            <Link
              href="/hr/performance"
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <ClipboardList className="w-8 h-8 text-orange-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">Performance</h3>
              <p className="text-sm text-gray-600">Employee performance reviews</p>
            </Link>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}

export default function HrDashboardPage() {
  return (
    <ProtectedRoute>
      <HrDashboardContent />
    </ProtectedRoute>
  );
}

'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Users, ArrowLeft, TrendingUp, Calendar, Award, UserCheck } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import ExportReportPDFButton from '@/components/documents/ExportReportPDFButton';

interface HRReport {
  summary: {
    totalEmployees: number;
    activeEmployees: number;
    averageAttendance: number;
    approvedLeaves: number;
    completedTrainings: number;
  };
  employeesByDepartment: Array<{ department: string; count: number }>;
  employeesByStatus: Array<{ status: string; count: number }>;
}

function HRReportsContent() {
  const [data, setData] = useState<HRReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      let url = '/reports/hr';
      if (dateRange.startDate || dateRange.endDate) {
        const params = new URLSearchParams();
        if (dateRange.startDate) params.append('startDate', dateRange.startDate);
        if (dateRange.endDate) params.append('endDate', dateRange.endDate);
        url += '?' + params.toString();
      }
      const response = await api.get(url);
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch HR report:', error);
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

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link href="/reports" className="inline-flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Reports</span>
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Users className="w-8 h-8 text-purple-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">HR Reports</h1>
              <p className="text-gray-600">Employee, attendance, and performance analytics</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {data && (
              <ExportReportPDFButton
                title="HR Report"
                reportData={data}
                module="reports"
                category="AUDIT_DOCUMENT"
                referenceId="hr-report"
                buttonText="Export as PDF"
              />
            )}
            <button
              onClick={fetchReport}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <button
            onClick={fetchReport}
            className="mt-5 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
          >
            Apply Filter
          </button>
        </div>
      </div>

      {data && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg shadow p-6 border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <div className="text-sm text-purple-700 font-medium mb-1">Total Employees</div>
              <div className="text-3xl font-bold text-purple-600">{data.summary.totalEmployees}</div>
              <div className="text-xs text-purple-600 mt-1">
                {data.summary.activeEmployees} active
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg shadow p-6 border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <UserCheck className="w-8 h-8 text-green-600" />
              </div>
              <div className="text-sm text-green-700 font-medium mb-1">Active Employees</div>
              <div className="text-3xl font-bold text-green-600">{data.summary.activeEmployees}</div>
              <div className="text-xs text-green-600 mt-1">
                {((data.summary.activeEmployees / data.summary.totalEmployees) * 100).toFixed(1)}% of total
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg shadow p-6 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
              <div className="text-sm text-blue-700 font-medium mb-1">Avg Attendance</div>
              <div className="text-3xl font-bold text-blue-600">{data.summary.averageAttendance.toFixed(1)}%</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className={`h-2 rounded-full ${
                    data.summary.averageAttendance >= 95 ? 'bg-green-600' :
                    data.summary.averageAttendance >= 85 ? 'bg-blue-600' :
                    data.summary.averageAttendance >= 75 ? 'bg-yellow-600' : 'bg-red-600'
                  }`}
                  style={{ width: `${data.summary.averageAttendance}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg shadow p-6 border border-yellow-200">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="w-8 h-8 text-yellow-600" />
              </div>
              <div className="text-sm text-yellow-700 font-medium mb-1">Approved Leaves</div>
              <div className="text-3xl font-bold text-yellow-600">{data.summary.approvedLeaves}</div>
              <div className="text-xs text-yellow-600 mt-1">Last 30 days</div>
            </div>

            <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-lg shadow p-6 border border-pink-200">
              <div className="flex items-center justify-between mb-2">
                <Award className="w-8 h-8 text-pink-600" />
              </div>
              <div className="text-sm text-pink-700 font-medium mb-1">Trainings Completed</div>
              <div className="text-3xl font-bold text-pink-600">{data.summary.completedTrainings}</div>
              <div className="text-xs text-pink-600 mt-1">This period</div>
            </div>
          </div>

          {/* Employees by Department */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center space-x-3 mb-4">
              <Users className="w-6 h-6 text-purple-600" />
              <h2 className="text-lg font-semibold text-gray-900">Employees by Department</h2>
            </div>
            
            {data.employeesByDepartment.length > 0 ? (
              <div className="space-y-3">
                {data.employeesByDepartment.map((item, index) => {
                  const percentage = (item.count / data.summary.totalEmployees) * 100;
                  return (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{item.department}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">{item.count} employees</span>
                          <span className="text-xs text-gray-500">({percentage.toFixed(1)}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-indigo-500 h-3 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No department data available</p>
            )}
          </div>

          {/* Employees by Status and Metrics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Employees by Status */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center space-x-3 mb-4">
                <UserCheck className="w-6 h-6 text-green-600" />
                <h2 className="text-lg font-semibold text-gray-900">Employee Status</h2>
              </div>
              
              <div className="space-y-3">
                {data.employeesByStatus.map((item, index) => {
                  const percentage = (item.count / data.summary.totalEmployees) * 100;
                  let statusColor = 'bg-gray-500';
                  if (item.status === 'ACTIVE') statusColor = 'bg-green-500';
                  else if (item.status === 'ON_LEAVE') statusColor = 'bg-yellow-500';
                  else if (item.status === 'SUSPENDED') statusColor = 'bg-orange-500';
                  else if (item.status === 'TERMINATED') statusColor = 'bg-red-500';

                  return (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${statusColor}`}></div>
                        <span className="text-sm font-medium text-gray-700">{item.status}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-gray-900">{item.count}</span>
                        <span className="text-xs text-gray-500">({percentage.toFixed(1)}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Award className="w-6 h-6 text-pink-600" />
                <h2 className="text-lg font-semibold text-gray-900">Key Metrics</h2>
              </div>

              <div className="space-y-4">
                {/* Attendance Rate */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Average Attendance Rate</span>
                    <span className="text-lg font-bold text-blue-600">{data.summary.averageAttendance.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${
                        data.summary.averageAttendance >= 95 ? 'bg-green-600' :
                        data.summary.averageAttendance >= 85 ? 'bg-blue-600' :
                        data.summary.averageAttendance >= 75 ? 'bg-yellow-600' : 'bg-red-600'
                      }`}
                      style={{ width: `${data.summary.averageAttendance}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
                </div>

                {/* Active Employee Rate */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Active Employee Rate</span>
                    <span className="text-lg font-bold text-green-600">
                      {((data.summary.activeEmployees / data.summary.totalEmployees) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-green-600 h-3 rounded-full"
                      style={{ width: `${(data.summary.activeEmployees / data.summary.totalEmployees) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{data.summary.activeEmployees} of {data.summary.totalEmployees} employees</p>
                </div>

                {/* Training Completion */}
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-4 border border-pink-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-pink-700">Training Completion</p>
                      <p className="text-2xl font-bold text-pink-600 mt-1">{data.summary.completedTrainings}</p>
                      <p className="text-xs text-pink-600 mt-1">Trainings completed</p>
                    </div>
                    <Award className="w-12 h-12 text-pink-400" />
                  </div>
                </div>

                {/* Leave Management */}
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-yellow-700">Leave Approvals</p>
                      <p className="text-2xl font-bold text-yellow-600 mt-1">{data.summary.approvedLeaves}</p>
                      <p className="text-xs text-yellow-600 mt-1">Approved in last 30 days</p>
                    </div>
                    <Calendar className="w-12 h-12 text-yellow-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}

export default function HRReportsPage() {
  return (
    <ProtectedRoute>
      <HRReportsContent />
    </ProtectedRoute>
  );
}

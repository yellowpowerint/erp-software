'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Shield, ArrowLeft, CheckCircle, XCircle, AlertTriangle, TrendingUp, Users, Award, Calendar } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import ExportReportPDFButton from '@/components/documents/ExportReportPDFButton';

interface SafetyReport {
  summary: {
    totalInspections: number;
    passedInspections: number;
    failedInspections: number;
    passRate: number;
    completedTrainings: number;
    totalParticipants: number;
    activeCertifications: number;
    expiringCertifications: number;
    completedDrills: number;
    averageDrillRating: number;
  };
  inspectionsByStatus: Array<{ status: string; count: number }>;
}

function SafetyReportsContent() {
  const [data, setData] = useState<SafetyReport | null>(null);
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
      let url = '/reports/safety';
      if (dateRange.startDate || dateRange.endDate) {
        const params = new URLSearchParams();
        if (dateRange.startDate) params.append('startDate', dateRange.startDate);
        if (dateRange.endDate) params.append('endDate', dateRange.endDate);
        url += '?' + params.toString();
      }
      const response = await api.get(url);
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch safety report:', error);
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
            <Shield className="w-8 h-8 text-green-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Safety Reports</h1>
              <p className="text-gray-600">Safety inspections, training, and compliance analytics</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {data && (
              <ExportReportPDFButton
                title="Safety Report"
                reportData={data}
                module="reports"
                category="SAFETY_REPORT"
                referenceId="safety-report"
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
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow p-6 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <div className="text-sm text-blue-700 font-medium mb-1">Total Inspections</div>
              <div className="text-3xl font-bold text-blue-600">{data.summary.totalInspections}</div>
              <div className="text-xs text-blue-600 mt-1">All inspections</div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg shadow p-6 border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div className="text-sm text-green-700 font-medium mb-1">Passed</div>
              <div className="text-3xl font-bold text-green-600">{data.summary.passedInspections}</div>
              <div className="text-xs text-green-600 mt-1">
                {data.summary.passRate.toFixed(1)}% pass rate
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-lg shadow p-6 border border-red-200">
              <div className="flex items-center justify-between mb-2">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <div className="text-sm text-red-700 font-medium mb-1">Failed</div>
              <div className="text-3xl font-bold text-red-600">{data.summary.failedInspections}</div>
              <div className="text-xs text-red-600 mt-1">
                {((data.summary.failedInspections / data.summary.totalInspections) * 100).toFixed(1)}% failure rate
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg shadow p-6 border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <div className="text-sm text-purple-700 font-medium mb-1">Training Participants</div>
              <div className="text-3xl font-bold text-purple-600">{data.summary.totalParticipants}</div>
              <div className="text-xs text-purple-600 mt-1">
                {data.summary.completedTrainings} trainings
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg shadow p-6 border border-yellow-200">
              <div className="flex items-center justify-between mb-2">
                <AlertTriangle className="w-8 h-8 text-yellow-600" />
              </div>
              <div className="text-sm text-yellow-700 font-medium mb-1">Expiring Certs</div>
              <div className="text-3xl font-bold text-yellow-600">{data.summary.expiringCertifications}</div>
              <div className="text-xs text-yellow-600 mt-1">
                Within 30 days
              </div>
            </div>
          </div>

          {/* Inspection Pass Rate Card */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center space-x-3 mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">Inspection Pass Rate</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-5xl font-bold text-green-600 mb-2">{data.summary.passRate.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Overall Pass Rate</div>
                <div className="w-full bg-gray-200 rounded-full h-4 mt-3">
                  <div
                    className={`h-4 rounded-full ${
                      data.summary.passRate >= 95 ? 'bg-green-600' :
                      data.summary.passRate >= 85 ? 'bg-blue-600' :
                      data.summary.passRate >= 75 ? 'bg-yellow-600' : 'bg-red-600'
                    }`}
                    style={{ width: `${data.summary.passRate}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <span className="text-3xl font-bold text-green-600">{data.summary.passedInspections}</span>
                </div>
                <p className="text-sm text-green-700 font-medium">Passed Inspections</p>
                <p className="text-xs text-green-600 mt-1">Meeting safety standards</p>
              </div>

              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <div className="flex items-center justify-between mb-2">
                  <XCircle className="w-6 h-6 text-red-600" />
                  <span className="text-3xl font-bold text-red-600">{data.summary.failedInspections}</span>
                </div>
                <p className="text-sm text-red-700 font-medium">Failed Inspections</p>
                <p className="text-xs text-red-600 mt-1">Require corrective action</p>
              </div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Inspections by Status */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Shield className="w-6 h-6 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Inspections by Status</h2>
              </div>

              <div className="space-y-3">
                {data.inspectionsByStatus.map((item, index) => {
                  const percentage = data.summary.totalInspections > 0 
                    ? (item.count / data.summary.totalInspections) * 100 
                    : 0;
                  let statusColor = 'bg-gray-500';
                  let bgColor = 'bg-gray-50';
                  let borderColor = 'border-gray-200';
                  
                  if (item.status === 'COMPLETED') {
                    statusColor = 'bg-green-500';
                    bgColor = 'bg-green-50';
                    borderColor = 'border-green-200';
                  } else if (item.status === 'SCHEDULED') {
                    statusColor = 'bg-blue-500';
                    bgColor = 'bg-blue-50';
                    borderColor = 'border-blue-200';
                  } else if (item.status === 'IN_PROGRESS') {
                    statusColor = 'bg-yellow-500';
                    bgColor = 'bg-yellow-50';
                    borderColor = 'border-yellow-200';
                  } else if (item.status === 'CANCELLED') {
                    statusColor = 'bg-red-500';
                    bgColor = 'bg-red-50';
                    borderColor = 'border-red-200';
                  }

                  return (
                    <div key={index} className={`flex items-center justify-between ${bgColor} p-4 rounded-lg border ${borderColor}`}>
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

            {/* Safety Certifications */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Award className="w-6 h-6 text-indigo-600" />
                <h2 className="text-lg font-semibold text-gray-900">Safety Certifications</h2>
              </div>

              <div className="space-y-4">
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-4 border border-indigo-200">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-indigo-700">Active Certifications</p>
                      <p className="text-3xl font-bold text-indigo-600 mt-1">{data.summary.activeCertifications}</p>
                    </div>
                    <Award className="w-12 h-12 text-indigo-400" />
                  </div>
                  <p className="text-xs text-indigo-600">Currently valid</p>
                </div>

                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-200">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-yellow-700">Expiring Soon</p>
                      <p className="text-3xl font-bold text-yellow-600 mt-1">{data.summary.expiringCertifications}</p>
                    </div>
                    <AlertTriangle className="w-12 h-12 text-yellow-400" />
                  </div>
                  <p className="text-xs text-yellow-600">Renewal required within 30 days</p>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-purple-700">Training Sessions</p>
                      <p className="text-3xl font-bold text-purple-600 mt-1">{data.summary.completedTrainings}</p>
                    </div>
                    <Users className="w-12 h-12 text-purple-400" />
                  </div>
                  <p className="text-xs text-purple-600">{data.summary.totalParticipants} total participants</p>
                </div>
              </div>
            </div>
          </div>

          {/* Safety Drills Performance */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Calendar className="w-6 h-6 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Safety Drills Performance</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                <div className="text-sm text-blue-700 font-medium mb-1">Completed Drills</div>
                <div className="text-4xl font-bold text-blue-600 mb-2">{data.summary.completedDrills}</div>
                <p className="text-xs text-blue-600">Safety drills conducted</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
                <div className="text-sm text-green-700 font-medium mb-1">Average Rating</div>
                <div className="flex items-baseline space-x-1 mb-2">
                  <span className="text-4xl font-bold text-green-600">{data.summary.averageDrillRating.toFixed(1)}</span>
                  <span className="text-xl text-green-600">/5.0</span>
                </div>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <div
                      key={star}
                      className={`w-5 h-5 ${
                        star <= Math.round(data.summary.averageDrillRating)
                          ? 'text-yellow-500'
                          : 'text-gray-300'
                      }`}
                    >
                      ★
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
                <div className="text-sm text-purple-700 font-medium mb-1">Compliance Rate</div>
                <div className="text-4xl font-bold text-purple-600 mb-2">
                  {data.summary.passRate.toFixed(0)}%
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ width: `${data.summary.passRate}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}

export default function SafetyReportsPage() {
  return (
    <ProtectedRoute>
      <SafetyReportsContent />
    </ProtectedRoute>
  );
}

'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Shield, CheckCircle, AlertTriangle, Calendar, Award, Users, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

interface SafetyStats {
  totalInspections: number;
  pendingInspections: number;
  failedInspections: number;
  totalTrainings: number;
  upcomingTrainings: number;
  activeCertifications: number;
  expiringCertifications: number;
  scheduledDrills: number;
}

function SafetyDashboardContent() {
  const [stats, setStats] = useState<SafetyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/safety/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch safety stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading safety data...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <div className="flex items-center space-x-3">
          <Shield className="w-8 h-8 text-green-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Safety & Compliance</h1>
            <p className="text-gray-600">Safety inspections, training, and compliance management</p>
          </div>
        </div>
      </div>

      {stats && (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="w-5 h-5 text-gray-500" />
                <span className="text-2xl font-bold text-gray-900">{stats.totalInspections}</span>
              </div>
              <p className="text-sm text-gray-600">Total Inspections</p>
            </div>

            <div className="bg-yellow-50 rounded-lg shadow p-6 border border-yellow-200">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-5 h-5 text-yellow-600" />
                <span className="text-2xl font-bold text-yellow-600">{stats.pendingInspections}</span>
              </div>
              <p className="text-sm text-yellow-700 font-medium">Pending Inspections</p>
            </div>

            <div className="bg-red-50 rounded-lg shadow p-6 border border-red-200">
              <div className="flex items-center justify-between mb-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="text-2xl font-bold text-red-600">{stats.failedInspections}</span>
              </div>
              <p className="text-sm text-red-700 font-medium">Failed Inspections</p>
            </div>

            <div className="bg-blue-50 rounded-lg shadow p-6 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="text-2xl font-bold text-blue-600">{stats.upcomingTrainings}</span>
              </div>
              <p className="text-sm text-blue-700 font-medium">Upcoming Trainings</p>
            </div>
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Trainings</p>
                <p className="text-xl font-bold text-gray-900">{stats.totalTrainings}</p>
              </div>
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>

            <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Certifications</p>
                <p className="text-xl font-bold text-green-600">{stats.activeCertifications}</p>
              </div>
              <Award className="w-8 h-8 text-green-400" />
            </div>

            <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Expiring Soon</p>
                <p className="text-xl font-bold text-orange-600">{stats.expiringCertifications}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-400" />
            </div>

            <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Scheduled Drills</p>
                <p className="text-xl font-bold text-purple-600">{stats.scheduledDrills}</p>
              </div>
              <Shield className="w-8 h-8 text-purple-400" />
            </div>
          </div>

          {/* Alerts */}
          {(stats.pendingInspections > 0 || stats.expiringCertifications > 0) && (
            <div className="space-y-3 mb-6">
              {stats.pendingInspections > 0 && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <div className="flex items-center">
                    <TrendingUp className="w-5 h-5 text-yellow-600 mr-3" />
                    <p className="text-sm text-yellow-700">
                      <span className="font-medium">{stats.pendingInspections} inspection(s)</span> require attention
                    </p>
                  </div>
                </div>
              )}
              {stats.expiringCertifications > 0 && (
                <div className="bg-orange-50 border-l-4 border-orange-400 p-4">
                  <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 text-orange-600 mr-3" />
                    <p className="text-sm text-orange-700">
                      <span className="font-medium">{stats.expiringCertifications} certification(s)</span> expiring soon
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/safety/inspections"
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <CheckCircle className="w-8 h-8 text-green-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">Inspections</h3>
              <p className="text-sm text-gray-600">Equipment and facility inspections</p>
            </Link>

            <Link
              href="/safety/trainings"
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <Users className="w-8 h-8 text-blue-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">Training</h3>
              <p className="text-sm text-gray-600">Safety training sessions</p>
            </Link>

            <Link
              href="/safety/certifications"
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <Award className="w-8 h-8 text-yellow-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">Certifications</h3>
              <p className="text-sm text-gray-600">Employee safety certifications</p>
            </Link>

            <Link
              href="/safety/drills"
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <Shield className="w-8 h-8 text-purple-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">Safety Drills</h3>
              <p className="text-sm text-gray-600">Emergency drills and exercises</p>
            </Link>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}

export default function SafetyDashboardPage() {
  return (
    <ProtectedRoute>
      <SafetyDashboardContent />
    </ProtectedRoute>
  );
}

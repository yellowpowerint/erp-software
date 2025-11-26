'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Briefcase, Users, FileText, Calendar, ArrowLeft, TrendingUp, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

interface RecruitmentStats {
  totalJobs: number;
  openJobs: number;
  totalCandidates: number;
  totalApplications: number;
  pendingScreening: number;
  scheduledInterviews: number;
}

function RecruitmentDashboardContent() {
  const [stats, setStats] = useState<RecruitmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setError(null);
      const response = await api.get('/hr/recruitment/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch recruitment stats:', error);
      setError('Failed to load recruitment stats. You can still use the quick links below.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading recruitment data...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link href="/hr" className="inline-flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to HR Dashboard</span>
        </Link>
        <div className="flex items-center space-x-3">
          <Briefcase className="w-8 h-8 text-indigo-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Recruitment & Talent Acquisition</h1>
            <p className="text-gray-600">AI-powered recruitment management system</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          {error}
        </div>
      )}

      {stats && (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <Briefcase className="w-5 h-5 text-gray-500" />
                <span className="text-2xl font-bold text-gray-900">{stats.totalJobs}</span>
              </div>
              <p className="text-sm text-gray-600">Total Jobs</p>
            </div>

            <div className="bg-green-50 rounded-lg shadow p-6 border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <Briefcase className="w-5 h-5 text-green-600" />
                <span className="text-2xl font-bold text-green-600">{stats.openJobs}</span>
              </div>
              <p className="text-sm text-green-700 font-medium">Open Positions</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-5 h-5 text-gray-500" />
                <span className="text-2xl font-bold text-gray-900">{stats.totalCandidates}</span>
              </div>
              <p className="text-sm text-gray-600">Candidates</p>
            </div>

            <div className="bg-blue-50 rounded-lg shadow p-6 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span className="text-2xl font-bold text-blue-600">{stats.totalApplications}</span>
              </div>
              <p className="text-sm text-blue-700 font-medium">Applications</p>
            </div>

            <div className="bg-yellow-50 rounded-lg shadow p-6 border border-yellow-200">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-5 h-5 text-yellow-600" />
                <span className="text-2xl font-bold text-yellow-600">{stats.pendingScreening}</span>
              </div>
              <p className="text-sm text-yellow-700 font-medium">Pending Screening</p>
            </div>

            <div className="bg-purple-50 rounded-lg shadow p-6 border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                <span className="text-2xl font-bold text-purple-600">{stats.scheduledInterviews}</span>
              </div>
              <p className="text-sm text-purple-700 font-medium">Interviews Scheduled</p>
            </div>
          </div>

          {/* Alerts */}
          {stats.pendingScreening > 0 && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-3" />
                <p className="text-sm text-yellow-700">
                  <span className="font-medium">{stats.pendingScreening} application(s)</span> awaiting AI screening
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/hr/recruitment/jobs"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <Briefcase className="w-8 h-8 text-indigo-600 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">Job Postings</h3>
          <p className="text-sm text-gray-600">Create and manage job listings with AI</p>
        </Link>

        <Link
          href="/hr/recruitment/candidates"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <Users className="w-8 h-8 text-green-600 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">Candidates</h3>
          <p className="text-sm text-gray-600">Browse and manage candidate profiles</p>
        </Link>

        <Link
          href="/hr/recruitment/screening"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <TrendingUp className="w-8 h-8 text-yellow-600 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">AI Screening</h3>
          <p className="text-sm text-gray-600">Screen candidates with AI-powered analysis</p>
        </Link>

        <Link
          href="/hr/recruitment/interviews"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <Calendar className="w-8 h-8 text-purple-600 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">Interviews</h3>
          <p className="text-sm text-gray-600">Schedule and manage interviews</p>
        </Link>
      </div>

      {/* AI Features */}
      <div className="mt-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🤖 AI-Powered Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-1">Job Description Generator</h4>
            <p className="text-xs text-gray-600">AI creates comprehensive job descriptions</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-1">CV Parsing</h4>
            <p className="text-xs text-gray-600">Extract skills and experience automatically</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-1">Candidate Screening</h4>
            <p className="text-xs text-gray-600">AI ranks candidates by job fit</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-1">Interview Summaries</h4>
            <p className="text-xs text-gray-600">Generate AI interview summaries</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function RecruitmentDashboardPage() {
  return (
    <ProtectedRoute>
      <RecruitmentDashboardContent />
    </ProtectedRoute>
  );
}

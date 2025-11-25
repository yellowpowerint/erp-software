'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { FileText, Plus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

interface FieldReport {
  id: string;
  reportDate: string;
  location: string;
  reportedBy: string;
  title: string;
  description: string;
  findings: string;
  recommendations: string;
  priority: string;
  project?: {
    projectCode: string;
    name: string;
  };
}

function FieldReportsContent() {
  const { user } = useAuth();
  const [reports, setReports] = useState<FieldReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    reportDate: new Date().toISOString().split('T')[0],
    location: '',
    reportedBy: user ? `${user.firstName} ${user.lastName}` : '',
    title: '',
    description: '',
    findings: '',
    recommendations: '',
    priority: 'MEDIUM',
  });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await api.get('/operations/field-reports');
      setReports(response.data);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/operations/field-reports', formData);
      alert('Field report submitted successfully!');
      setShowForm(false);
      setFormData({
        reportDate: new Date().toISOString().split('T')[0],
        location: '',
        reportedBy: user ? `${user.firstName} ${user.lastName}` : '',
        title: '',
        description: '',
        findings: '',
        recommendations: '',
        priority: 'MEDIUM',
      });
      fetchReports();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to submit report');
    }
  };

  const canCreate = user && ['SUPER_ADMIN', 'OPERATIONS_MANAGER', 'EMPLOYEE'].includes(user.role);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading reports...</p>
        </div>
      </DashboardLayout>
    );
  }

  const getPriorityColor = (priority: string) => {
    const colors: any = {
      LOW: 'bg-gray-100 text-gray-800',
      MEDIUM: 'bg-blue-100 text-blue-800',
      HIGH: 'bg-orange-100 text-orange-800',
      CRITICAL: 'bg-red-100 text-red-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link href="/operations" className="inline-flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Operations</span>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Field Reports</h1>
            <p className="text-gray-600 mt-1">Document field observations and findings</p>
          </div>
          {canCreate && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Plus className="w-5 h-5" />
              <span>{showForm ? 'Cancel' : 'New Report'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Submit Field Report</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Report Date *</label>
                <input
                  type="date"
                  value={formData.reportDate}
                  onChange={(e) => setFormData({ ...formData, reportDate: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Tarkwa Mine Site, Pit B"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reported By *</label>
                <input
                  type="text"
                  value={formData.reportedBy}
                  onChange={(e) => setFormData({ ...formData, reportedBy: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority *</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Brief title of the report"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Detailed description of observations..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Findings</label>
              <textarea
                value={formData.findings}
                onChange={(e) => setFormData({ ...formData, findings: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Key findings and observations..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Recommendations</label>
              <textarea
                value={formData.recommendations}
                onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Recommended actions..."
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Submit Report
            </button>
          </form>
        </div>
      )}

      {/* Reports List */}
      <div className="space-y-4">
        {reports.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Field Reports</h3>
            <p className="text-gray-600">Submit your first field report to get started.</p>
          </div>
        ) : (
          reports.map((report) => (
            <div key={report.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{report.title}</h3>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(report.priority)}`}>
                      {report.priority}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>📍 {report.location}</span>
                    <span>👤 {report.reportedBy}</span>
                    <span>📅 {new Date(report.reportDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">Description:</p>
                  <p className="text-sm text-gray-600">{report.description}</p>
                </div>
                {report.findings && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Findings:</p>
                    <p className="text-sm text-gray-600">{report.findings}</p>
                  </div>
                )}
                {report.recommendations && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Recommendations:</p>
                    <p className="text-sm text-gray-600">{report.recommendations}</p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}

export default function FieldReportsPage() {
  return (
    <ProtectedRoute>
      <FieldReportsContent />
    </ProtectedRoute>
  );
}

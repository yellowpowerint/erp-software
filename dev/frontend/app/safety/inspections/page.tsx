'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { CheckCircle, ArrowLeft, Plus, X } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

interface Inspection {
  id: string;
  inspectionId: string;
  type: string;
  status: string;
  title: string;
  location: string;
  scheduledDate: string;
  completedDate?: string;
  inspectorName?: string;
  passed?: boolean;
  score?: number;
  actionRequired: boolean;
}

function InspectionsPageContent() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    type: 'EQUIPMENT',
    title: '',
    location: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    inspectorName: '',
  });

  useEffect(() => {
    fetchInspections();
  }, []);

  const fetchInspections = async () => {
    try {
      const response = await api.get('/safety/inspections');
      setInspections(response.data);
    } catch (error) {
      console.error('Failed to fetch inspections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/safety/inspections', {
        ...formData,
        scheduledDate: new Date(formData.scheduledDate),
      });

      alert('Inspection scheduled successfully!');
      setShowModal(false);
      fetchInspections();
      setFormData({
        type: 'EQUIPMENT',
        title: '',
        location: '',
        scheduledDate: new Date().toISOString().split('T')[0],
        inspectorName: '',
      });
    } catch (error) {
      console.error('Failed to create inspection:', error);
      alert('Failed to schedule inspection');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      SCHEDULED: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-gray-100 text-gray-800',
      FAILED: 'bg-red-100 text-red-800',
      PASSED: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link href="/safety" className="inline-flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Safety Dashboard</span>
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Safety Inspections</h1>
              <p className="text-gray-600">Equipment and facility safety inspections</p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Inspection</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {inspections.map((insp) => (
              <div key={insp.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{insp.title}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(insp.status)}`}>
                        {insp.status.replace('_', ' ')}
                      </span>
                      {insp.passed !== null && (
                        <span className={`px-2 py-1 text-xs font-medium rounded ${insp.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {insp.passed ? 'PASSED' : 'FAILED'}
                        </span>
                      )}
                      {insp.actionRequired && (
                        <span className="px-2 py-1 text-xs font-medium rounded bg-orange-100 text-orange-800">
                          ACTION REQUIRED
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex items-center space-x-4">
                        <span>ID: <span className="font-mono">{insp.inspectionId}</span></span>
                        <span>Type: <span className="capitalize">{insp.type.toLowerCase().replace('_', ' ')}</span></span>
                        <span>Location: {insp.location}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span>Scheduled: {new Date(insp.scheduledDate).toLocaleDateString()}</span>
                        {insp.completedDate && (
                          <span>Completed: {new Date(insp.completedDate).toLocaleDateString()}</span>
                        )}
                        {insp.inspectorName && <span>Inspector: {insp.inspectorName}</span>}
                        {insp.score && <span className="font-medium">Score: {insp.score}%</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && inspections.length === 0 && (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Inspections</h3>
            <p className="text-gray-600">Schedule your first safety inspection</p>
          </div>
        )}
      </div>

      {/* Create Inspection Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Schedule Inspection</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Inspection Type *</label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="EQUIPMENT">Equipment</option>
                  <option value="VEHICLE">Vehicle</option>
                  <option value="FACILITY">Facility</option>
                  <option value="WORKPLACE">Workplace</option>
                  <option value="FIRE_SAFETY">Fire Safety</option>
                  <option value="ELECTRICAL">Electrical</option>
                  <option value="CONFINED_SPACE">Confined Space</option>
                  <option value="CHEMICAL_STORAGE">Chemical Storage</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., Monthly Equipment Inspection"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., Mining Site A"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date *</label>
                <input
                  type="date"
                  required
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Inspector Name</label>
                <input
                  type="text"
                  value={formData.inspectorName}
                  onChange={(e) => setFormData({ ...formData, inspectorName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., John Doe"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function InspectionsPage() {
  return (
    <ProtectedRoute>
      <InspectionsPageContent />
    </ProtectedRoute>
  );
}

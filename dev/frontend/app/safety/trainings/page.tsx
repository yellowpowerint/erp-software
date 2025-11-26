'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Users, ArrowLeft, Plus, X } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

interface Training {
  id: string;
  trainingId: string;
  type: string;
  status: string;
  title: string;
  location?: string;
  duration: number;
  scheduledDate: string;
  instructorName: string;
  participants: string[];
  completedBy: string[];
  maxParticipants?: number;
  completed: boolean;
}

function TrainingsPageContent() {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    type: 'SAFETY_ORIENTATION',
    title: '',
    description: '',
    location: '',
    duration: 60,
    maxParticipants: 20,
    scheduledDate: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    instructorName: '',
  });

  useEffect(() => {
    fetchTrainings();
  }, []);

  const fetchTrainings = async () => {
    try {
      const response = await api.get('/safety/trainings');
      setTrainings(response.data);
    } catch (error) {
      console.error('Failed to fetch trainings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/safety/trainings', {
        ...formData,
        scheduledDate: new Date(formData.scheduledDate),
      });

      alert('Training scheduled successfully!');
      setShowModal(false);
      fetchTrainings();
      setFormData({
        type: 'SAFETY_ORIENTATION',
        title: '',
        description: '',
        location: '',
        duration: 60,
        maxParticipants: 20,
        scheduledDate: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        instructorName: '',
      });
    } catch (error) {
      console.error('Failed to create training:', error);
      alert('Failed to schedule training');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      SCHEDULED: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
      EXPIRED: 'bg-gray-100 text-gray-800',
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
            <Users className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Safety Training</h1>
              <p className="text-gray-600">Safety training sessions and programs</p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Training</span>
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
            {trainings.map((training) => (
              <div key={training.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{training.title}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(training.status)}`}>
                        {training.status.replace('_', ' ')}
                      </span>
                      {training.completed && (
                        <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">
                          COMPLETED
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex items-center space-x-4">
                        <span>ID: <span className="font-mono">{training.trainingId}</span></span>
                        <span>Type: <span className="capitalize">{training.type.toLowerCase().replace('_', ' ')}</span></span>
                        {training.location && <span>Location: {training.location}</span>}
                      </div>
                      <div className="flex items-center space-x-4">
                        <span>Date: {new Date(training.scheduledDate).toLocaleDateString()}</span>
                        <span>Duration: {training.duration} min</span>
                        <span>Instructor: {training.instructorName}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span>
                          Participants: {training.participants.length}
                          {training.maxParticipants && ` / ${training.maxParticipants}`}
                        </span>
                        {training.completed && (
                          <span>Completed: {training.completedBy.length} attendees</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && trainings.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Trainings</h3>
            <p className="text-gray-600">Schedule your first safety training session</p>
          </div>
        )}
      </div>

      {/* Create Training Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Schedule Training</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Training Type *</label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="SAFETY_ORIENTATION">Safety Orientation</option>
                  <option value="EQUIPMENT_OPERATION">Equipment Operation</option>
                  <option value="EMERGENCY_RESPONSE">Emergency Response</option>
                  <option value="FIRST_AID">First Aid</option>
                  <option value="FIRE_SAFETY">Fire Safety</option>
                  <option value="CONFINED_SPACE">Confined Space</option>
                  <option value="HAZARDOUS_MATERIALS">Hazardous Materials</option>
                  <option value="PPE_USAGE">PPE Usage</option>
                  <option value="INCIDENT_REPORTING">Incident Reporting</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Annual Safety Refresher"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Training Room A"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min) *</label>
                  <input
                    type="number"
                    required
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Participants</label>
                  <input
                    type="number"
                    value={formData.maxParticipants}
                    onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instructor Name *</label>
                <input
                  type="text"
                  required
                  value={formData.instructorName}
                  onChange={(e) => setFormData({ ...formData, instructorName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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

export default function TrainingsPage() {
  return (
    <ProtectedRoute>
      <TrainingsPageContent />
    </ProtectedRoute>
  );
}

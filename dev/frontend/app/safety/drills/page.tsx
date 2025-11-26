'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Shield, ArrowLeft, Plus, X } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

interface Drill {
  id: string;
  drillId: string;
  type: string;
  title: string;
  description?: string;
  location: string;
  scheduledDate: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  expectedCount?: number;
  actualCount?: number;
  participants: string[];
  coordinator: string;
  coordinatorName: string;
  observers: string[];
  completed: boolean;
  completedDate?: string;
  successRating?: number;
  objectives: string[];
  strengths: string[];
  areasForImprovement: string[];
  actionRequired: boolean;
}

function DrillsPageContent() {
  const [drills, setDrills] = useState<Drill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    type: 'FIRE_EVACUATION',
    title: '',
    description: '',
    location: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    expectedCount: 50,
    coordinator: '',
    coordinatorName: '',
  });

  useEffect(() => {
    fetchDrills();
  }, []);

  const fetchDrills = async () => {
    try {
      const response = await api.get('/safety/drills');
      setDrills(response.data);
    } catch (error) {
      console.error('Failed to fetch drills:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/safety/drills', {
        ...formData,
        scheduledDate: new Date(formData.scheduledDate),
        objectives: [],
      });

      alert('Safety drill scheduled successfully!');
      setShowModal(false);
      fetchDrills();
      setFormData({
        type: 'FIRE_EVACUATION',
        title: '',
        description: '',
        location: '',
        scheduledDate: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        expectedCount: 50,
        coordinator: '',
        coordinatorName: '',
      });
    } catch (error) {
      console.error('Failed to create drill:', error);
      alert('Failed to schedule drill');
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      FIRE_EVACUATION: 'bg-red-100 text-red-800',
      EMERGENCY_EVACUATION: 'bg-orange-100 text-orange-800',
      SPILL_RESPONSE: 'bg-yellow-100 text-yellow-800',
      RESCUE_OPERATION: 'bg-blue-100 text-blue-800',
      MEDICAL_EMERGENCY: 'bg-purple-100 text-purple-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
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
            <Shield className="w-8 h-8 text-purple-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Safety Drills</h1>
              <p className="text-gray-600">Emergency drills and exercises</p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Drill</span>
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
            {drills.map((drill) => (
              <div key={drill.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{drill.title}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getTypeColor(drill.type)}`}>
                        {drill.type.replace('_', ' ')}
                      </span>
                      {drill.completed && (
                        <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">
                          COMPLETED
                        </span>
                      )}
                      {drill.actionRequired && !drill.completed && (
                        <span className="px-2 py-1 text-xs font-medium rounded bg-orange-100 text-orange-800">
                          ACTION REQUIRED
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex items-center space-x-4">
                        <span>ID: <span className="font-mono">{drill.drillId}</span></span>
                        <span>Location: {drill.location}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span>Date: {new Date(drill.scheduledDate).toLocaleDateString()}</span>
                        {drill.startTime && <span>Time: {drill.startTime}</span>}
                        {drill.duration && <span>Duration: {drill.duration} min</span>}
                      </div>
                      <div className="flex items-center space-x-4">
                        <span>Coordinator: {drill.coordinatorName}</span>
                        {drill.expectedCount && (
                          <span>Expected: {drill.expectedCount} participants</span>
                        )}
                        {drill.completed && drill.actualCount && (
                          <span>Actual: {drill.actualCount} participants</span>
                        )}
                      </div>
                      {drill.description && (
                        <div className="mt-2 text-gray-700">
                          <span className="font-medium">Description:</span> {drill.description}
                        </div>
                      )}
                      {drill.completed && (
                        <>
                          {drill.successRating && (
                            <div className="mt-2">
                              <span className="font-medium">Success Rating:</span>
                              <div className="flex items-center space-x-2 mt-1">
                                <div className="w-48 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-green-600 h-2 rounded-full"
                                    style={{ width: `${drill.successRating}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium">{drill.successRating}%</span>
                              </div>
                            </div>
                          )}
                          {drill.strengths.length > 0 && (
                            <div className="mt-2">
                              <span className="font-medium text-green-700">Strengths:</span>
                              <ul className="list-disc list-inside ml-2 text-sm">
                                {drill.strengths.map((strength, idx) => (
                                  <li key={idx}>{strength}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {drill.areasForImprovement.length > 0 && (
                            <div className="mt-2">
                              <span className="font-medium text-orange-700">Areas for Improvement:</span>
                              <ul className="list-disc list-inside ml-2 text-sm">
                                {drill.areasForImprovement.map((area, idx) => (
                                  <li key={idx}>{area}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && drills.length === 0 && (
          <div className="text-center py-12">
            <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Safety Drills</h3>
            <p className="text-gray-600">Schedule your first safety drill</p>
          </div>
        )}
      </div>

      {/* Schedule Drill Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Schedule Safety Drill</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Drill Type *</label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="FIRE_EVACUATION">Fire Evacuation</option>
                  <option value="EMERGENCY_EVACUATION">Emergency Evacuation</option>
                  <option value="SPILL_RESPONSE">Spill Response</option>
                  <option value="RESCUE_OPERATION">Rescue Operation</option>
                  <option value="MEDICAL_EMERGENCY">Medical Emergency</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., Quarterly Fire Drill"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Purpose and objectives of the drill"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., Main Office Building"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expected Participants</label>
                <input
                  type="number"
                  value={formData.expectedCount}
                  onChange={(e) => setFormData({ ...formData, expectedCount: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Coordinator ID *</label>
                  <input
                    type="text"
                    required
                    value={formData.coordinator}
                    onChange={(e) => setFormData({ ...formData, coordinator: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="USER-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Coordinator Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.coordinatorName}
                    onChange={(e) => setFormData({ ...formData, coordinatorName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="John Doe"
                  />
                </div>
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
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Schedule Drill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function DrillsPage() {
  return (
    <ProtectedRoute>
      <DrillsPageContent />
    </ProtectedRoute>
  );
}

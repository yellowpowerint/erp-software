'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Calendar, ArrowLeft, Plus, Search, Eye, Trash2, X, Sparkles } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

function InterviewsPageContent() {
  const [interviews, setInterviews] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [formData, setFormData] = useState({
    applicationId: '',
    candidateId: '',
    scheduledDate: '',
    interviewType: 'PHONE',
    location: '',
    duration: 60,
    interviewers: '',
  });

  useEffect(() => {
    fetchInterviews();
    fetchCandidates();
    fetchApplications();
  }, []);

  const fetchInterviews = async () => {
    try {
      const response = await api.get('/hr/recruitment/interviews');
      setInterviews(response.data);
    } catch (error) {
      console.error('Failed to fetch interviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCandidates = async () => {
    try {
      const response = await api.get('/hr/recruitment/candidates');
      setCandidates(response.data);
    } catch (error) {
      console.error('Failed to fetch candidates:', error);
    }
  };

  const fetchApplications = async () => {
    try {
      const response = await api.get('/hr/recruitment/applications');
      setApplications(response.data);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    }
  };

  const handleScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        scheduledDate: new Date(formData.scheduledDate).toISOString(),
        duration: parseInt(formData.duration.toString()),
        interviewers: formData.interviewers.split(',').map(s => s.trim()).filter(Boolean),
      };
      await api.post('/hr/recruitment/interviews', payload);
      setShowScheduleModal(false);
      setFormData({ applicationId: '', candidateId: '', scheduledDate: '', interviewType: 'PHONE', location: '', duration: 60, interviewers: '' });
      fetchInterviews();
    } catch (error) {
      console.error('Failed to schedule interview:', error);
      alert('Failed to schedule interview');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this interview?')) return;
    try {
      await api.delete(`/hr/recruitment/interviews/${id}`);
      fetchInterviews();
    } catch (error) {
      alert('Failed to delete interview');
    }
  };

  const handleGenerateSummary = async (id: string) => {
    if (!confirm('Generate AI summary for this interview?')) return;
    try {
      await api.post(`/hr/recruitment/generate-interview-summary/${id}`);
      alert('AI summary generated successfully');
      fetchInterviews();
    } catch (error) {
      alert('Failed to generate summary');
    }
  };

  const filteredInterviews = interviews.filter(i =>
    `${i.candidate?.firstName} ${i.candidate?.lastName} ${i.interviewType} ${i.location}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <Link href="/hr/recruitment" className="inline-flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Recruitment</span>
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Calendar className="w-8 h-8 text-purple-600" />
            <h1 className="text-2xl font-bold text-gray-900">Interviews</h1>
          </div>
          <button onClick={() => setShowScheduleModal(true)} className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
            <Plus className="w-4 h-4" />
            <span>Schedule Interview</span>
          </button>
        </div>
      </div>

      <div className="mb-4 relative">
        <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
        <input type="text" placeholder="Search interviews..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded" />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {filteredInterviews.length === 0 ? (
          <p className="text-gray-600 text-center py-8">No interviews scheduled</p>
        ) : (
          <div className="space-y-4">
            {filteredInterviews.map((interview) => (
              <div key={interview.id} className="border rounded p-4 hover:border-purple-300 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">
                      {interview.candidate?.firstName} {interview.candidate?.lastName} - {interview.interviewType}
                    </h3>
                    <p className="text-sm text-gray-600">Scheduled: {new Date(interview.scheduledDate).toLocaleString()}</p>
                    {interview.location && <p className="text-sm text-gray-600">Location: {interview.location}</p>}
                    {interview.duration && <p className="text-sm text-gray-600">Duration: {interview.duration} minutes</p>}
                    {interview.rating && <p className="text-sm text-gray-600">Rating: {interview.rating}/5</p>}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={px-2 py-1 text-xs rounded }>
                      {interview.status}
                    </span>
                    {interview.status === 'COMPLETED' && !interview.aiSummary && (
                      <button onClick={() => handleGenerateSummary(interview.id)} className="p-2 text-purple-600 hover:bg-purple-50 rounded" title="Generate AI Summary">
                        <Sparkles className="w-4 h-4" />
                      </button>
                    )}
                    <Link href={/hr/recruitment/interviews/} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                      <Eye className="w-4 h-4" />
                    </Link>
                    <button onClick={() => handleDelete(interview.id)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Schedule Interview</h2>
              <button onClick={() => setShowScheduleModal(false)} className="text-gray-500 hover:text-gray-700"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleScheduleInterview} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Application *</label>
                <select required value={formData.applicationId} onChange={(e) => setFormData({ ...formData, applicationId: e.target.value })} className="w-full border rounded px-3 py-2">
                  <option value="">Select application...</option>
                  {applications.map(app => (
                    <option key={app.id} value={app.id}>
                      {app.candidate?.firstName} {app.candidate?.lastName} - {app.jobPosting?.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Candidate *</label>
                <select required value={formData.candidateId} onChange={(e) => setFormData({ ...formData, candidateId: e.target.value })} className="w-full border rounded px-3 py-2">
                  <option value="">Select candidate...</option>
                  {candidates.map(c => (
                    <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Interview Type *</label>
                <select required value={formData.interviewType} onChange={(e) => setFormData({ ...formData, interviewType: e.target.value })} className="w-full border rounded px-3 py-2">
                  <option value="PHONE">Phone</option>
                  <option value="VIDEO">Video</option>
                  <option value="IN_PERSON">In Person</option>
                  <option value="TECHNICAL">Technical</option>
                  <option value="BEHAVIORAL">Behavioral</option>
                  <option value="FINAL">Final</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Scheduled Date & Time *</label>
                <input type="datetime-local" required value={formData.scheduledDate} onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="Office, Zoom link, etc." />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
                <input type="number" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })} className="w-full border rounded px-3 py-2" min="15" step="15" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Interviewers (comma-separated)</label>
                <input type="text" value={formData.interviewers} onChange={(e) => setFormData({ ...formData, interviewers: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="John Doe, Jane Smith" />
              </div>
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setShowScheduleModal(false)} className="px-4 py-2 border rounded hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">Schedule Interview</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function InterviewsPage() {
  return (
    <ProtectedRoute>
      <InterviewsPageContent />
    </ProtectedRoute>
  );
}

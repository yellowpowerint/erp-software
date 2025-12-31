'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Calendar, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

function InterviewsPageContent() {
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInterviews();
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
        <div className="flex items-center space-x-3">
          <Calendar className="w-8 h-8 text-purple-600" />
          <h1 className="text-2xl font-bold text-gray-900">Interviews</h1>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {interviews.length === 0 ? (
          <p className="text-gray-600 text-center py-8">No interviews scheduled</p>
        ) : (
          <div className="space-y-4">
            {interviews.map((interview) => (
              <div key={interview.id} className="border rounded p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">
                    {interview.candidate?.firstName} {interview.candidate?.lastName} - {interview.interviewType}
                  </h3>
                  <span className={`px-2 py-1 text-xs rounded ${
                    interview.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                    interview.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' :
                    interview.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {interview.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Scheduled: {new Date(interview.scheduledDate).toLocaleString()}
                </p>
                {interview.location && (
                  <p className="text-sm text-gray-600">Location: {interview.location}</p>
                )}
                {interview.duration && (
                  <p className="text-sm text-gray-600">Duration: {interview.duration} minutes</p>
                )}
                {interview.rating && (
                  <p className="text-sm text-gray-600">Rating: {interview.rating}/5</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
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

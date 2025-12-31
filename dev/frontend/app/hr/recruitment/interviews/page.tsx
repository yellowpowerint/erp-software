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
                <h3 className="font-semibold">{interview.title}</h3>
                <p className="text-sm text-gray-600">{interview.scheduledAt}</p>
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

'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Users, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

function CandidatesPageContent() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      const response = await api.get('/hr/recruitment/candidates');
      setCandidates(response.data);
    } catch (error) {
      console.error('Failed to fetch candidates:', error);
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
          <Users className="w-8 h-8 text-green-600" />
          <h1 className="text-2xl font-bold text-gray-900">Candidates</h1>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {candidates.length === 0 ? (
          <p className="text-gray-600 text-center py-8">No candidates found</p>
        ) : (
          <div className="space-y-4">
            {candidates.map((candidate) => (
              <div key={candidate.id} className="border rounded p-4">
                <div className="flex justify-between mb-2"><h3 className="font-semibold">{candidate.firstName} {candidate.lastName}</h3><span className="px-2 py-1 text-xs rounded bg-gray-100">{candidate.status}</span></div><p className="text-sm text-gray-600">{candidate.email}</p>{candidate.phone && <p className="text-sm text-gray-600">Phone: {candidate.phone}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function CandidatesPage() {
  return (
    <ProtectedRoute>
      <CandidatesPageContent />
    </ProtectedRoute>
  );
}

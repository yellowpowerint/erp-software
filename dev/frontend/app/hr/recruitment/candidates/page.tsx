'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Users, ArrowLeft, Plus, Search, Eye, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

function CandidatesPageContent() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', resumeText: '', source: 'DIRECT',
  });

  useEffect(() => { fetchCandidates(); }, []);

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

  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/hr/recruitment/candidates', formData);
      setShowAddModal(false);
      setFormData({ firstName: '', lastName: '', email: '', phone: '', resumeText: '', source: 'DIRECT' });
      fetchCandidates();
    } catch (error) {
      console.error('Failed to add candidate:', error);
      alert('Failed to add candidate');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await api.delete(/hr/recruitment/candidates/);
      fetchCandidates();
    } catch (error) {
      alert('Failed to delete candidate');
    }
  };

  const filteredCandidates = candidates.filter(c =>
    ${c.firstName}  .toLowerCase().includes(searchTerm.toLowerCase())
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
            <Users className="w-8 h-8 text-green-600" />
            <h1 className="text-2xl font-bold text-gray-900">Candidates</h1>
          </div>
          <button onClick={() => setShowAddModal(true)} className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            <Plus className="w-4 h-4" />
            <span>Add Candidate</span>
          </button>
        </div>
      </div>

      <div className="mb-4 relative">
        <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
        <input type="text" placeholder="Search candidates..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded" />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {filteredCandidates.length === 0 ? (
          <p className="text-gray-600 text-center py-8">No candidates found</p>
        ) : (
          <div className="space-y-4">
            {filteredCandidates.map((candidate) => (
              <div key={candidate.id} className="border rounded p-4 hover:border-green-300 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{candidate.firstName} {candidate.lastName}</h3>
                    <p className="text-sm text-gray-600">{candidate.email}</p>
                    {candidate.phone && <p className="text-sm text-gray-600">Phone: {candidate.phone}</p>}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 text-xs rounded bg-gray-100">{candidate.status}</span>
                    <Link href={/hr/recruitment/candidates/} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                      <Eye className="w-4 h-4" />
                    </Link>
                    <button onClick={() => handleDelete(candidate.id)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add New Candidate</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddCandidate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">First Name *</label>
                  <input type="text" required value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Last Name *</label>
                  <input type="text" required value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="w-full border rounded px-3 py-2" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Resume/CV Text</label>
                <textarea value={formData.resumeText} onChange={(e) => setFormData({ ...formData, resumeText: e.target.value })} className="w-full border rounded px-3 py-2" rows={4} placeholder="Paste resume text here..." />
              </div>
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Add Candidate</button>
              </div>
            </form>
          </div>
        </div>
      )}
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

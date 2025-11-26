'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Award, ArrowLeft, Plus, X, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

interface Certification {
  id: string;
  certificationId: string;
  employeeId: string;
  employeeName: string;
  certType: string;
  certName: string;
  certNumber?: string;
  issuingBody: string;
  issueDate: string;
  expiryDate: string;
  renewalDate?: string;
  status: string;
  verifiedBy?: string;
  verifiedDate?: string;
}

function CertificationsPageContent() {
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    employeeName: '',
    certType: 'Safety Training',
    certName: '',
    certNumber: '',
    issuingBody: '',
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
  });

  useEffect(() => {
    fetchCertifications();
  }, []);

  const fetchCertifications = async () => {
    try {
      const response = await api.get('/safety/certifications');
      setCertifications(response.data);
    } catch (error) {
      console.error('Failed to fetch certifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/safety/certifications', {
        ...formData,
        issueDate: new Date(formData.issueDate),
        expiryDate: new Date(formData.expiryDate),
      });

      alert('Certification added successfully!');
      setShowModal(false);
      fetchCertifications();
      setFormData({
        employeeId: '',
        employeeName: '',
        certType: 'Safety Training',
        certName: '',
        certNumber: '',
        issuingBody: '',
        issueDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
      });
    } catch (error) {
      console.error('Failed to create certification:', error);
      alert('Failed to add certification');
    }
  };

  const handleRenew = async (id: string) => {
    const months = prompt('Enter renewal period in months (e.g., 12):');
    if (!months) return;

    const issueDate = new Date();
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + parseInt(months));

    try {
      await api.put(`/safety/certifications/${id}/renew`, {
        issueDate,
        expiryDate,
        renewalDate: new Date(),
      });

      alert('Certification renewed successfully!');
      fetchCertifications();
    } catch (error) {
      console.error('Failed to renew certification:', error);
      alert('Failed to renew certification');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800',
      EXPIRING_SOON: 'bg-orange-100 text-orange-800',
      EXPIRED: 'bg-red-100 text-red-800',
      SUSPENDED: 'bg-yellow-100 text-yellow-800',
      REVOKED: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
            <Award className="w-8 h-8 text-yellow-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Safety Certifications</h1>
              <p className="text-gray-600">Employee safety certifications and licenses</p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            <Plus className="w-4 h-4" />
            <span>Add Certification</span>
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
            {certifications.map((cert) => {
              const daysUntilExpiry = getDaysUntilExpiry(cert.expiryDate);
              const isExpiring = daysUntilExpiry > 0 && daysUntilExpiry <= 30;
              const isExpired = daysUntilExpiry <= 0;

              return (
                <div key={cert.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{cert.certName}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(cert.status)}`}>
                          {cert.status.replace('_', ' ')}
                        </span>
                        {isExpiring && !isExpired && (
                          <span className="px-2 py-1 text-xs font-medium rounded bg-orange-100 text-orange-800 flex items-center">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            EXPIRING SOON
                          </span>
                        )}
                        {isExpired && (
                          <span className="px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-800">
                            EXPIRED
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center space-x-4">
                          <span>ID: <span className="font-mono">{cert.certificationId}</span></span>
                          <span>Employee: <span className="font-medium">{cert.employeeName}</span> ({cert.employeeId})</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span>Type: {cert.certType}</span>
                          {cert.certNumber && <span>Number: {cert.certNumber}</span>}
                          <span>Issuing Body: {cert.issuingBody}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span>Issued: {new Date(cert.issueDate).toLocaleDateString()}</span>
                          <span className={`font-medium ${isExpired ? 'text-red-600' : isExpiring ? 'text-orange-600' : 'text-gray-900'}`}>
                            Expires: {new Date(cert.expiryDate).toLocaleDateString()}
                            {daysUntilExpiry > 0 && ` (${daysUntilExpiry} days)`}
                            {isExpired && ' (EXPIRED)'}
                          </span>
                          {cert.renewalDate && (
                            <span>Last Renewed: {new Date(cert.renewalDate).toLocaleDateString()}</span>
                          )}
                        </div>
                        {cert.verifiedBy && (
                          <div className="flex items-center space-x-2 text-green-600">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>Verified by {cert.verifiedBy} on {new Date(cert.verifiedDate!).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      {(cert.status === 'ACTIVE' || cert.status === 'EXPIRING_SOON' || cert.status === 'EXPIRED') && (
                        <button
                          onClick={() => handleRenew(cert.id)}
                          className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm"
                        >
                          Renew
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {!loading && certifications.length === 0 && (
          <div className="text-center py-12">
            <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Certifications</h3>
            <p className="text-gray-600">Add your first employee certification</p>
          </div>
        )}
      </div>

      {/* Add Certification Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Add Certification</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID *</label>
                  <input
                    type="text"
                    required
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                    placeholder="EMP-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.employeeName}
                    onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Certification Type *</label>
                <input
                  type="text"
                  required
                  value={formData.certType}
                  onChange={(e) => setFormData({ ...formData, certType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                  placeholder="e.g., Safety Training, First Aid"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Certification Name *</label>
                <input
                  type="text"
                  required
                  value={formData.certName}
                  onChange={(e) => setFormData({ ...formData, certName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                  placeholder="e.g., First Aid Level 2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Certificate Number</label>
                <input
                  type="text"
                  value={formData.certNumber}
                  onChange={(e) => setFormData({ ...formData, certNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                  placeholder="e.g., CERT-12345"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Issuing Body *</label>
                <input
                  type="text"
                  required
                  value={formData.issuingBody}
                  onChange={(e) => setFormData({ ...formData, issuingBody: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                  placeholder="e.g., Ghana Safety Authority"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.issueDate}
                    onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
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
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                >
                  Add Certification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function CertificationsPage() {
  return (
    <ProtectedRoute>
      <CertificationsPageContent />
    </ProtectedRoute>
  );
}

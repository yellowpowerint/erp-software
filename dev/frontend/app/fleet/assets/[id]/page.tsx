'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { ArrowLeft, Upload, UserPlus } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

type FleetDocument = {
  id: string;
  type: string;
  name: string;
  fileUrl: string;
  expiryDate?: string | null;
  uploadedAt: string;
};

type FleetAssignment = {
  id: string;
  status: string;
  siteLocation: string;
  startDate: string;
  endDate?: string | null;
  operator: { id: string; firstName: string; lastName: string; email: string; role: string };
  assignedBy: { id: string; firstName: string; lastName: string; email: string; role: string };
  project?: { id: string; projectCode: string; name: string } | null;
};

type FleetAsset = {
  id: string;
  assetCode: string;
  name: string;
  type: string;
  category: string;
  status: string;
  condition: string;
  currentLocation: string;
  make: string;
  model: string;
  year: number;
  registrationNo?: string | null;
  serialNumber?: string | null;
  engineNumber?: string | null;
  chassisNumber?: string | null;
  fuelType: string;
  tankCapacity?: string | null;
  purchaseDate?: string | null;
  purchasePrice?: string | null;
  vendor?: string | null;
  warrantyExpiry?: string | null;
  currentOdometer: string;
  currentHours: string;
  insuranceExpiry?: string | null;
  permitExpiry?: string | null;
  nextInspectionDue?: string | null;
  emissionsExpiry?: string | null;
  operator?: { id: string; firstName: string; lastName: string; email: string; role: string } | null;
  documents: FleetDocument[];
  assignments: FleetAssignment[];
};

function FleetAssetDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [asset, setAsset] = useState<FleetAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [docType, setDocType] = useState('Registration');
  const [docExpiry, setDocExpiry] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({ operatorId: '', siteLocation: '' });

  const canManage = user && ['SUPER_ADMIN', 'CEO', 'CFO', 'OPERATIONS_MANAGER', 'WAREHOUSE_MANAGER'].includes(user.role);

  const assetId = useMemo(() => String((params as any).id || ''), [params]);

  const fetchAsset = async () => {
    try {
      const res = await api.get(`/fleet/assets/${assetId}`);
      setAsset(res.data);
    } catch (e) {
      console.error('Failed to fetch fleet asset:', e);
      alert('Fleet asset not found');
      router.push('/fleet/assets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!assetId) return;
    setLoading(true);
    fetchAsset();
  }, [assetId]);

  const uploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFile) {
      alert('Please choose a file');
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', docFile);
      fd.append('type', docType);
      if (docExpiry) {
        fd.append('expiryDate', new Date(docExpiry).toISOString());
      }

      await api.post(`/fleet/assets/${assetId}/documents`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setDocFile(null);
      setDocExpiry('');
      setDocType('Registration');
      await fetchAsset();
    } catch (err: any) {
      console.error('Failed to upload fleet document:', err);
      alert(err.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const assignOperator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignForm.operatorId || !assignForm.siteLocation) {
      alert('Operator ID and site location are required');
      return;
    }

    try {
      await api.post(`/fleet/assets/${assetId}/assign`, {
        operatorId: assignForm.operatorId,
        siteLocation: assignForm.siteLocation,
      });

      setAssignOpen(false);
      setAssignForm({ operatorId: '', siteLocation: '' });
      await fetchAsset();
    } catch (err: any) {
      console.error('Failed to assign operator:', err);
      alert(err.response?.data?.message || 'Failed to assign operator');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading fleet asset...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!asset) return null;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link href="/fleet/assets" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Fleet Assets</span>
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{asset.name}</h1>
            <p className="text-gray-600 mt-1">{asset.assetCode}</p>
          </div>
          {canManage && (
            <button
              onClick={() => setAssignOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <UserPlus className="w-5 h-5" />
              Assign Operator
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Asset Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Type</p>
                <p className="font-medium text-gray-900">{asset.type}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Category</p>
                <p className="font-medium text-gray-900">{asset.category}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <p className="font-medium text-gray-900">{asset.status}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Condition</p>
                <p className="font-medium text-gray-900">{asset.condition}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Location</p>
                <p className="font-medium text-gray-900">{asset.currentLocation}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Operator</p>
                <p className="font-medium text-gray-900">
                  {asset.operator ? `${asset.operator.firstName} ${asset.operator.lastName}` : '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Make / Model</p>
                <p className="font-medium text-gray-900">{asset.make} {asset.model} ({asset.year})</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Fuel Type</p>
                <p className="font-medium text-gray-900">{asset.fuelType}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Odometer</p>
                <p className="font-medium text-gray-900">{asset.currentOdometer}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Hours</p>
                <p className="font-medium text-gray-900">{asset.currentHours}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Assignments</h2>
            {asset.assignments?.length ? (
              <div className="space-y-3">
                {asset.assignments.map((a) => (
                  <div key={a.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900">{a.siteLocation}</p>
                      <span className="text-xs text-gray-500">{a.status}</span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">
                      Operator: {a.operator.firstName} {a.operator.lastName} ({a.operator.role})
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Start: {new Date(a.startDate).toLocaleString()}
                      {a.endDate ? ` • End: ${new Date(a.endDate).toLocaleString()}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No assignments recorded yet.</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Compliance Dates</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Insurance Expiry</span>
                <span className="font-medium text-gray-900">
                  {asset.insuranceExpiry ? new Date(asset.insuranceExpiry).toLocaleDateString() : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Permit Expiry</span>
                <span className="font-medium text-gray-900">
                  {asset.permitExpiry ? new Date(asset.permitExpiry).toLocaleDateString() : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Next Inspection</span>
                <span className="font-medium text-gray-900">
                  {asset.nextInspectionDue ? new Date(asset.nextInspectionDue).toLocaleDateString() : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Emissions Expiry</span>
                <span className="font-medium text-gray-900">
                  {asset.emissionsExpiry ? new Date(asset.emissionsExpiry).toLocaleDateString() : '-'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Documents</h3>
            {asset.documents?.length ? (
              <div className="space-y-3">
                {asset.documents.map((d) => (
                  <div key={d.id} className="text-sm">
                    <div className="flex items-center justify-between">
                      <a
                        href={d.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 hover:text-indigo-800 truncate max-w-[220px]"
                      >
                        {d.name}
                      </a>
                      <span className="text-xs text-gray-500">{d.type}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {d.expiryDate ? `Expires: ${new Date(d.expiryDate).toLocaleDateString()}` : 'No expiry'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No documents uploaded yet.</p>
            )}

            {canManage && (
              <form onSubmit={uploadDocument} className="mt-6 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                    <input
                      value={docType}
                      onChange={(e) => setDocType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Registration, Insurance, Permit..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Expiry Date</label>
                    <input
                      type="date"
                      value={docExpiry}
                      onChange={(e) => setDocExpiry(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">File</label>
                  <input
                    type="file"
                    onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
                    className="w-full text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>{uploading ? 'Uploading...' : 'Upload Document'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {assignOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Assign Operator</h3>
            <form onSubmit={assignOperator} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Operator User ID</label>
                <input
                  value={assignForm.operatorId}
                  onChange={(e) => setAssignForm({ ...assignForm, operatorId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Paste a user id from Settings > Users"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Site Location</label>
                <input
                  value={assignForm.siteLocation}
                  onChange={(e) => setAssignForm({ ...assignForm, siteLocation: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="e.g., Tarkwa Mine Site"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Assign
                </button>
                <button
                  type="button"
                  onClick={() => setAssignOpen(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function FleetAssetDetailPage() {
  return (
    <ProtectedRoute>
      <FleetAssetDetailContent />
    </ProtectedRoute>
  );
}

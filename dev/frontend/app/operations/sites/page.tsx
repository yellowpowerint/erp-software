'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { MapPin, Plus, Building2, Edit, Trash2, Eye } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import SiteModal from '@/components/operations/SiteModal';
import Link from 'next/link';

interface Site {
  id: string;
  siteCode: string;
  name: string;
  type: string;
  status: string;
  location: string;
  address?: string;
  area?: number;
  areaUnit: string;
  managerName?: string;
  contactPhone?: string;
  establishedDate?: string;
  _count: {
    projects: number;
    productionLogs: number;
    fieldReports: number;
    shifts: number;
    equipmentUsage: number;
  };
}

interface Stats {
  totalSites: number;
  activeSites: number;
  inactiveSites: number;
  sitesByType: Array<{ type: string; _count: number }>;
}

function SitesContent() {
  const { user } = useAuth();
  const [sites, setSites] = useState<Site[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);

  useEffect(() => {
    fetchData();
  }, [typeFilter, statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (typeFilter !== 'ALL') params.type = typeFilter;
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const [sitesRes, statsRes] = await Promise.all([
        api.get('/sites', { params }),
        api.get('/sites/stats'),
      ]);

      setSites(sitesRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to fetch sites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSite = (site: Site) => {
    setSelectedSite(site);
    setModalOpen(true);
  };

  const handleSaveSite = async (data: any) => {
    if (selectedSite) {
      await api.put(`/sites/${selectedSite.id}`, data);
      alert('Site updated successfully!');
    } else {
      await api.post('/sites', data);
      alert('Site created successfully!');
    }
    fetchData();
  };

  const handleDeleteSite = async (id: string) => {
    if (!confirm('Are you sure you want to delete this site?')) return;

    try {
      await api.delete(`/sites/${id}`);
      alert('Site deleted successfully!');
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete site');
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedSite(null);
  };

  const canManage = user && ['SUPER_ADMIN', 'CEO', 'OPERATIONS_MANAGER'].includes(user.role);

  const getStatusColor = (status: string) => {
    const colors: any = {
      ACTIVE: 'bg-green-100 text-green-800',
      INACTIVE: 'bg-gray-100 text-gray-800',
      UNDER_DEVELOPMENT: 'bg-blue-100 text-blue-800',
      SUSPENDED: 'bg-orange-100 text-orange-800',
      CLOSED: 'bg-red-100 text-red-800',
      PLANNED: 'bg-purple-100 text-purple-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getTypeIcon = (type: string) => {
    return <Building2 className="w-5 h-5" />;
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Operational Sites</h1>
            <p className="text-gray-600 mt-1">Manage mining, construction, and operational sites</p>
          </div>
          {canManage && (
            <button
              onClick={() => {
                setSelectedSite(null);
                setModalOpen(true);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Add Site</span>
            </button>
          )}
        </div>
      </div>

      <SiteModal
        open={modalOpen}
        onClose={handleCloseModal}
        site={selectedSite}
        onSave={handleSaveSite}
      />

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total Sites</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalSites}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Active Sites</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats.activeSites}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Inactive Sites</p>
            <p className="text-2xl font-bold text-gray-600 mt-1">{stats.inactiveSites}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Site Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="ALL">All Types</option>
              <option value="MINING">Mining</option>
              <option value="CONSTRUCTION">Construction</option>
              <option value="CLEANING">Cleaning</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="EXPLORATION">Exploration</option>
              <option value="PROCESSING">Processing</option>
              <option value="STORAGE">Storage</option>
              <option value="OFFICE">Office</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="UNDER_DEVELOPMENT">Under Development</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="CLOSED">Closed</option>
              <option value="PLANNED">Planned</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading sites...</p>
        </div>
      ) : sites.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Sites Found</h3>
          <p className="text-gray-600 mb-4">
            Get started by adding your first operational site.
          </p>
          {canManage && (
            <button
              onClick={() => {
                setSelectedSite(null);
                setModalOpen(true);
              }}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Plus className="w-5 h-5" />
              <span>Add Site</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sites.map((site) => (
            <div key={site.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-indigo-100 p-3 rounded-lg">
                      {getTypeIcon(site.type)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{site.name}</h3>
                      <p className="text-sm text-gray-500">{site.siteCode}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">{site.location}</p>
                      {site.address && <p className="text-xs text-gray-500">{site.address}</p>}
                    </div>
                  </div>

                  {site.area && (
                    <p className="text-sm text-gray-600">
                      Area: {site.area} {site.areaUnit}
                    </p>
                  )}

                  {site.managerName && (
                    <p className="text-sm text-gray-600">
                      Manager: {site.managerName}
                    </p>
                  )}

                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Type:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {site.type.replace('_', ' ')}
                    </span>
                  </div>

                  <div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(site.status)}`}>
                      {site.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Projects:</span>
                      <span className="ml-1 font-semibold text-indigo-600">{site._count.projects}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Reports:</span>
                      <span className="ml-1 font-semibold text-indigo-600">{site._count.fieldReports}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Production:</span>
                      <span className="ml-1 font-semibold text-indigo-600">{site._count.productionLogs}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Shifts:</span>
                      <span className="ml-1 font-semibold text-indigo-600">{site._count.shifts}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <Link
                  href={`/operations/sites/${site.id}`}
                  className="flex items-center space-x-1 px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span>View</span>
                </Link>
                {canManage && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditSite(site)}
                      className="flex items-center space-x-1 px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                    {user?.role === 'SUPER_ADMIN' || user?.role === 'CEO' ? (
                      <button
                        onClick={() => handleDeleteSite(site.id)}
                        className="flex items-center space-x-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

export default function SitesPage() {
  return (
    <ProtectedRoute>
      <SitesContent />
    </ProtectedRoute>
  );
}

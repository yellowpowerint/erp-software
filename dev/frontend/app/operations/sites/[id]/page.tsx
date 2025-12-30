'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { MapPin, Building2, Calendar, Phone, Mail, ArrowLeft, Edit, Users, FileText, BarChart3, Clock } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

interface Site {
  id: string;
  siteCode: string;
  name: string;
  type: string;
  status: string;
  location: string;
  address?: string;
  coordinates?: string;
  area?: number;
  areaUnit: string;
  description?: string;
  managerName?: string;
  contactPhone?: string;
  contactEmail?: string;
  operatingHours?: string;
  establishedDate?: string;
  closedDate?: string;
  notes?: string;
  createdAt: string;
  projects: Array<{
    id: string;
    projectCode: string;
    name: string;
    status: string;
    startDate: string;
    endDate?: string;
  }>;
  _count: {
    projects: number;
    productionLogs: number;
    fieldReports: number;
    shifts: number;
    equipmentUsage: number;
  };
}

function SiteDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [site, setSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchSite();
    }
  }, [params.id]);

  const fetchSite = async () => {
    try {
      const response = await api.get(`/sites/${params.id}`);
      setSite(response.data);
    } catch (error) {
      console.error('Failed to fetch site:', error);
      alert('Failed to load site details');
      router.push('/operations/sites');
    } finally {
      setLoading(false);
    }
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

  const getProjectStatusColor = (status: string) => {
    const colors: any = {
      PLANNING: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-green-100 text-green-800',
      ON_HOLD: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-red-100 text-red-800',
      BLOCKED: 'bg-orange-100 text-orange-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading site details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!site) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">Site not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/operations/sites"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{site.name}</h1>
              <p className="text-gray-600 mt-1">{site.siteCode}</p>
            </div>
          </div>
          {canManage && (
            <Link
              href={`/operations/sites?edit=${site.id}`}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Edit className="w-5 h-5" />
              <span>Edit Site</span>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Site Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Type</p>
                <p className="text-base font-medium text-gray-900 mt-1">
                  {site.type.replace('_', ' ')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(site.status)}`}>
                    {site.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Location</p>
                <div className="flex items-start space-x-2 mt-1">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-base font-medium text-gray-900">{site.location}</p>
                    {site.address && <p className="text-sm text-gray-600">{site.address}</p>}
                  </div>
                </div>
              </div>
              {site.coordinates && (
                <div>
                  <p className="text-sm text-gray-600">GPS Coordinates</p>
                  <p className="text-base font-medium text-gray-900 mt-1">{site.coordinates}</p>
                </div>
              )}
              {site.area && (
                <div>
                  <p className="text-sm text-gray-600">Area</p>
                  <p className="text-base font-medium text-gray-900 mt-1">
                    {site.area} {site.areaUnit}
                  </p>
                </div>
              )}
              {site.establishedDate && (
                <div>
                  <p className="text-sm text-gray-600">Established</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <p className="text-base font-medium text-gray-900">
                      {new Date(site.establishedDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {site.description && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">Description</p>
                <p className="text-base text-gray-900 mt-1">{site.description}</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
            <div className="space-y-3">
              {site.managerName && (
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Site Manager</p>
                    <p className="text-base font-medium text-gray-900">{site.managerName}</p>
                  </div>
                </div>
              )}
              {site.contactPhone && (
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="text-base font-medium text-gray-900">{site.contactPhone}</p>
                  </div>
                </div>
              )}
              {site.contactEmail && (
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="text-base font-medium text-gray-900">{site.contactEmail}</p>
                  </div>
                </div>
              )}
              {site.operatingHours && (
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Operating Hours</p>
                    <p className="text-base font-medium text-gray-900">{site.operatingHours}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {site.projects.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Projects</h2>
              <div className="space-y-3">
                {site.projects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/operations/projects/${project.id}`}
                    className="block p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{project.name}</p>
                        <p className="text-sm text-gray-600">{project.projectCode}</p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getProjectStatusColor(project.status)}`}>
                        {project.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      Started: {new Date(project.startDate).toLocaleDateString()}
                      {project.endDate && ` • Ends: ${new Date(project.endDate).toLocaleDateString()}`}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {site.notes && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
              <p className="text-base text-gray-700 whitespace-pre-wrap">{site.notes}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity Summary</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                  <span className="text-sm font-medium text-gray-900">Projects</span>
                </div>
                <span className="text-lg font-bold text-indigo-600">{site._count.projects}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-900">Production Logs</span>
                </div>
                <span className="text-lg font-bold text-green-600">{site._count.productionLogs}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-900">Field Reports</span>
                </div>
                <span className="text-lg font-bold text-blue-600">{site._count.fieldReports}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-gray-900">Shifts</span>
                </div>
                <span className="text-lg font-bold text-purple-600">{site._count.shifts}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link
                href={`/operations/production?siteId=${site.id}`}
                className="block w-full px-4 py-2 text-left text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                View Production Logs
              </Link>
              <Link
                href={`/operations/field-reports?siteId=${site.id}`}
                className="block w-full px-4 py-2 text-left text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                View Field Reports
              </Link>
              <Link
                href={`/operations/shifts?siteId=${site.id}`}
                className="block w-full px-4 py-2 text-left text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                View Shifts
              </Link>
              <Link
                href={`/operations/projects?siteId=${site.id}`}
                className="block w-full px-4 py-2 text-left text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                View All Projects
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function SiteDetailPage() {
  return (
    <ProtectedRoute>
      <SiteDetailContent />
    </ProtectedRoute>
  );
}

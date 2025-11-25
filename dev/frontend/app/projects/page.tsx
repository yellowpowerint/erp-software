'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { FolderKanban, Plus, Filter, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

interface Project {
  id: string;
  projectCode: string;
  name: string;
  description: string;
  status: string;
  priority: string;
  location: string;
  startDate: string;
  endDate: string;
  estimatedBudget: number;
  actualCost: number;
  progress: number;
  _count: { milestones: number; tasks: number };
}

interface Stats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  onHoldProjects: number;
  totalBudget: number;
  totalSpent: number;
}

function ProjectsContent() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  useEffect(() => {
    fetchData();
  }, [statusFilter, priorityFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (priorityFilter !== 'ALL') params.priority = priorityFilter;

      const [projectsRes, statsRes] = await Promise.all([
        api.get('/projects', { params }),
        api.get('/projects/stats'),
      ]);

      setProjects(projectsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const canManage = user && ['SUPER_ADMIN', 'CEO', 'OPERATIONS_MANAGER'].includes(user.role);

  const getStatusColor = (status: string) => {
    const colors: any = {
      PLANNING: 'bg-blue-100 text-blue-800',
      ACTIVE: 'bg-green-100 text-green-800',
      ON_HOLD: 'bg-orange-100 text-orange-800',
      COMPLETED: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors: any = {
      LOW: 'text-gray-600',
      MEDIUM: 'text-blue-600',
      HIGH: 'text-orange-600',
      CRITICAL: 'text-red-600',
    };
    return colors[priority] || 'text-gray-600';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading projects...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
            <p className="text-gray-600 mt-1">Manage mining projects and track progress</p>
          </div>
          {canManage && (
            <Link
              href="/projects/new"
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>New Project</span>
            </Link>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total Projects</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalProjects}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Active</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats.activeProjects}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Completed</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{stats.completedProjects}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">On Hold</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">{stats.onHoldProjects}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total Budget</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">₵{stats.totalBudget.toFixed(0)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total Spent</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">₵{stats.totalSpent.toFixed(0)}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="ALL">All Status</option>
              <option value="PLANNING">Planning</option>
              <option value="ACTIVE">Active</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="ALL">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FolderKanban className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Projects Found</h3>
          <p className="text-gray-600 mb-4">Get started by creating your first mining project.</p>
          {canManage && (
            <Link
              href="/projects/new"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Plus className="w-5 h-5" />
              <span>Create Project</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
                      {project.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{project.projectCode}</p>
                </div>
                <span className={`text-sm font-semibold ${getPriorityColor(project.priority)}`}>
                  {project.priority === 'CRITICAL' && '🔴 '}
                  {project.priority === 'HIGH' && '🟠 '}
                  {project.priority === 'MEDIUM' && '🟡 '}
                  {project.priority === 'LOW' && '🟢 '}
                  {project.priority}
                </span>
              </div>

              {project.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{project.description}</p>
              )}

              {project.location && (
                <p className="text-sm text-gray-500 mb-4">📍 {project.location}</p>
              )}

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-semibold text-gray-900">{project.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all"
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Project Stats */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <p className="text-xs text-gray-500">Milestones</p>
                  <p className="text-sm font-semibold text-gray-900">{project._count.milestones}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Tasks</p>
                  <p className="text-sm font-semibold text-gray-900">{project._count.tasks}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Budget</p>
                  <p className="text-sm font-semibold text-gray-900">
                    ₵{(project.estimatedBudget || 0).toFixed(0)}
                  </p>
                </div>
              </div>

              {/* Dates */}
              <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                <span>Start: {new Date(project.startDate).toLocaleDateString()}</span>
                {project.endDate && (
                  <span>End: {new Date(project.endDate).toLocaleDateString()}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

export default function ProjectsPage() {
  return (
    <ProtectedRoute>
      <ProjectsContent />
    </ProtectedRoute>
  );
}

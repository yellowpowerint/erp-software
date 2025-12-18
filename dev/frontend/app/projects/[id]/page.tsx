'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ArrowLeft, Edit, CheckCircle, Clock, User } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import GeneratePDFButton from '@/components/documents/GeneratePDFButton';

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
  managerId: string;
  notes: string;
  milestones: Array<{
    id: string;
    name: string;
    description: string;
    dueDate: string;
    isCompleted: boolean;
    completedAt: string;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    description: string;
    status: string;
    assignedTo: string;
    dueDate: string;
    isCompleted: boolean;
  }>;
}

function ProjectDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProject();
  }, [params.id]);

  const fetchProject = async () => {
    try {
      const response = await api.get(`/projects/${params.id}`);
      setProject(response.data);
    } catch (error) {
      console.error('Failed to fetch project:', error);
      alert('Project not found');
      router.push('/projects');
    } finally {
      setLoading(false);
    }
  };

  const canManage = user && ['SUPER_ADMIN', 'CEO', 'OPERATIONS_MANAGER'].includes(user.role);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading project...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!project) return null;

  const getStatusColor = (status: string) => {
    const colors: any = {
      PLANNING: 'bg-blue-100 text-blue-800',
      ACTIVE: 'bg-green-100 text-green-800',
      ON_HOLD: 'bg-orange-100 text-orange-800',
      COMPLETED: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-red-100 text-red-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      BLOCKED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const budgetSpent = (project.actualCost / (project.estimatedBudget || 1)) * 100;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link
          href="/projects"
          className="inline-flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects</span>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-gray-600 mt-1">{project.projectCode}</p>
          </div>
          <div className="flex items-center space-x-3">
            <GeneratePDFButton
              documentType="project-report"
              entityId={project.id}
              variant="outline"
              buttonText="Generate PDF Report"
            />

            {canManage && (
              <Link
                href={`/projects/${project.id}/edit`}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Edit className="w-5 h-5" />
                <span>Edit Project</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Overview */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Overview</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Status</label>
                <div className="mt-1">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
                    {project.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-500">Priority</label>
                <p className="font-medium text-gray-900 capitalize">{project.priority}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Location</label>
                <p className="font-medium text-gray-900">{project.location || 'Not specified'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Progress</label>
                <p className="font-medium text-gray-900">{project.progress}%</p>
              </div>
            </div>
            {project.description && (
              <div className="mt-4">
                <label className="text-sm text-gray-500">Description</label>
                <p className="text-gray-900 mt-1">{project.description}</p>
              </div>
            )}
            {project.notes && (
              <div className="mt-4">
                <label className="text-sm text-gray-500">Notes</label>
                <p className="text-gray-900 mt-1">{project.notes}</p>
              </div>
            )}
          </div>

          {/* Milestones */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Milestones</h2>
            {project.milestones.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No milestones created yet</p>
            ) : (
              <div className="space-y-3">
                {project.milestones.map((milestone) => (
                  <div key={milestone.id} className={`p-4 rounded-lg border-2 ${milestone.isCompleted ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          {milestone.isCompleted ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <Clock className="w-5 h-5 text-gray-400" />
                          )}
                          <h3 className={`font-semibold ${milestone.isCompleted ? 'text-green-900' : 'text-gray-900'}`}>
                            {milestone.name}
                          </h3>
                        </div>
                        {milestone.description && (
                          <p className="text-sm text-gray-600 mt-1 ml-7">{milestone.description}</p>
                        )}
                      </div>
                      <span className="text-sm text-gray-600">
                        {new Date(milestone.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tasks */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tasks</h2>
            {project.tasks.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No tasks created yet</p>
            ) : (
              <div className="space-y-3">
                {project.tasks.map((task) => (
                  <div key={task.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {task.isCompleted ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <Clock className="w-5 h-5 text-gray-400" />
                        )}
                        <h4 className="font-medium text-gray-900">{task.title}</h4>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(task.status)}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                    {task.description && (
                      <p className="text-sm text-gray-600 ml-7">{task.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-2 ml-7 text-xs text-gray-500">
                      {task.assignedTo && (
                        <span className="flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>{task.assignedTo}</span>
                        </span>
                      )}
                      {task.dueDate && (
                        <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timeline */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Timeline</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">Start Date</label>
                <p className="text-sm font-medium text-gray-900">{new Date(project.startDate).toLocaleDateString()}</p>
              </div>
              {project.endDate && (
                <div>
                  <label className="text-xs text-gray-500">End Date</label>
                  <p className="text-sm font-medium text-gray-900">{new Date(project.endDate).toLocaleDateString()}</p>
                </div>
              )}
              <div>
                <label className="text-xs text-gray-500">Duration</label>
                <p className="text-sm font-medium text-gray-900">
                  {project.endDate 
                    ? `${Math.ceil((new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24))} days`
                    : 'Ongoing'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Budget */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Budget</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">Estimated Budget</label>
                <p className="text-lg font-semibold text-gray-900">₵{(project.estimatedBudget || 0).toFixed(2)}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Actual Cost</label>
                <p className="text-lg font-semibold text-gray-900">₵{project.actualCost.toFixed(2)}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-2 block">Budget Utilization</label>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${budgetSpent > 100 ? 'bg-red-500' : budgetSpent > 80 ? 'bg-orange-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(budgetSpent, 100)}%` }}
                  ></div>
                </div>
                <p className={`text-sm mt-1 font-semibold ${budgetSpent > 100 ? 'text-red-600' : budgetSpent > 80 ? 'text-orange-600' : 'text-green-600'}`}>
                  {budgetSpent.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Overall Progress</h3>
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-200">
                    {project.progress}% Complete
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-3 mb-4 text-xs flex rounded bg-indigo-200">
                <div
                  style={{ width: `${project.progress}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-600 transition-all"
                ></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
              <div>
                <p className="text-xs text-gray-500">Milestones</p>
                <p className="text-lg font-semibold text-gray-900">
                  {project.milestones.filter(m => m.isCompleted).length}/{project.milestones.length}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Tasks</p>
                <p className="text-lg font-semibold text-gray-900">
                  {project.tasks.filter(t => t.isCompleted).length}/{project.tasks.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function ProjectDetailPage() {
  return (
    <ProtectedRoute>
      <ProjectDetailContent />
    </ProtectedRoute>
  );
}

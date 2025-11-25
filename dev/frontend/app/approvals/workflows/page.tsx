'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Workflow, CheckCircle, XCircle, Plus, RefreshCw } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

interface WorkflowStage {
  id: string;
  stageOrder: number;
  stageName: string;
  approverRoles: string[];
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  type: string;
  isActive: boolean;
  stages: WorkflowStage[];
  createdAt: string;
}

function WorkflowsContent() {
  const { user } = useAuth();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const response = await api.get('/workflows');
      setWorkflows(response.data);
    } catch (error) {
      console.error('Failed to fetch workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const seedDefaultWorkflows = async () => {
    setSeeding(true);
    try {
      await api.post('/workflows/seed');
      alert('Default workflows seeded successfully!');
      fetchWorkflows();
    } catch (error: any) {
      console.error('Failed to seed workflows:', error);
      alert(error.response?.data?.message || 'Failed to seed workflows');
    } finally {
      setSeeding(false);
    }
  };

  const canManage = user && ['SUPER_ADMIN', 'CEO'].includes(user.role);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Approval Workflows</h1>
            <p className="text-gray-600 mt-1">Manage multi-level approval workflows</p>
          </div>
          {canManage && (
            <button
              onClick={seedDefaultWorkflows}
              disabled={seeding}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors"
            >
              {seeding ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Seeding...</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  <span>Seed Default Workflows</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading workflows...</p>
        </div>
      ) : workflows.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Workflow className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Workflows Found</h3>
          <p className="text-gray-600 mb-4">
            Get started by seeding default workflows for common approval processes.
          </p>
          {canManage && (
            <button
              onClick={seedDefaultWorkflows}
              disabled={seeding}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
            >
              <Plus className="w-5 h-5" />
              <span>Seed Default Workflows</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {workflows.map((workflow) => (
            <div key={workflow.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-semibold text-gray-900">{workflow.name}</h3>
                      {workflow.isActive ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{workflow.description}</p>
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        {workflow.type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <h4 className="text-sm font-medium text-gray-900 mb-4">Approval Stages:</h4>
                <div className="space-y-3">
                  {workflow.stages.map((stage, index) => (
                    <div key={stage.id} className="flex items-start">
                      <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-sm font-medium text-indigo-600">
                        {stage.stageOrder}
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-gray-900">{stage.stageName}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Approvers: {stage.approverRoles.join(', ')}
                        </p>
                      </div>
                      {index < workflow.stages.length - 1 && (
                        <div className="ml-2 text-gray-400">→</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Created {new Date(workflow.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Box */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">About Multi-Level Workflows</h3>
        <p className="text-sm text-blue-800 mb-3">
          Multi-level workflows enable sequential approval processes where each stage must be approved before moving to the next stage.
        </p>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Requests automatically route to the correct approver at each stage</li>
          <li>Previous stage approvers can see the full approval history</li>
          <li>If rejected at any stage, the workflow stops and the creator is notified</li>
          <li>Only users with the specified roles can approve at each stage</li>
        </ul>
      </div>
    </DashboardLayout>
  );
}

export default function WorkflowsPage() {
  return (
    <ProtectedRoute>
      <WorkflowsContent />
    </ProtectedRoute>
  );
}

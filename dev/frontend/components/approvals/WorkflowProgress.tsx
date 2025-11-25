'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, Circle, XCircle, Clock } from 'lucide-react';
import api from '@/lib/api';

interface WorkflowStage {
  id: string;
  stageOrder: number;
  stageName: string;
  approverRoles: string[];
}

interface StageAction {
  id: string;
  action: string;
  comments: string;
  createdAt: string;
  stage: {
    stageName: string;
  };
}

interface WorkflowInstance {
  id: string;
  currentStage: number;
  status: string;
  workflow: {
    name: string;
    stages: WorkflowStage[];
  };
  stageActions: StageAction[];
}

interface WorkflowProgressProps {
  itemType: string;
  itemId: string;
}

export default function WorkflowProgress({ itemType, itemId }: WorkflowProgressProps) {
  const [instance, setInstance] = useState<WorkflowInstance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkflowInstance();
  }, [itemType, itemId]);

  const fetchWorkflowInstance = async () => {
    try {
      const response = await api.get(`/workflows/instance/${itemType}/${itemId}`);
      setInstance(response.data);
    } catch (error) {
      console.error('Failed to fetch workflow:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Approval Workflow</h2>
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!instance) {
    return null; // No workflow configured for this item
  }

  const getStageIcon = (stage: WorkflowStage, stageAction?: StageAction) => {
    // If there's a stage action, show result
    if (stageAction) {
      if (stageAction.action === 'APPROVED') {
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      }
      if (stageAction.action === 'REJECTED') {
        return <XCircle className="w-6 h-6 text-red-500" />;
      }
    }

    // If this is the current stage and workflow is pending
    if (stage.stageOrder === instance.currentStage && instance.status === 'PENDING') {
      return <Clock className="w-6 h-6 text-orange-500" />;
    }

    // Future stage
    return <Circle className="w-6 h-6 text-gray-300" />;
  };

  const getStageStatus = (stage: WorkflowStage, stageAction?: StageAction) => {
    if (stageAction) {
      if (stageAction.action === 'APPROVED') return 'Approved';
      if (stageAction.action === 'REJECTED') return 'Rejected';
    }

    if (stage.stageOrder === instance.currentStage && instance.status === 'PENDING') {
      return 'In Progress';
    }

    if (stage.stageOrder < instance.currentStage) {
      return 'Completed';
    }

    return 'Pending';
  };

  const getStageColor = (stage: WorkflowStage, stageAction?: StageAction) => {
    if (stageAction) {
      if (stageAction.action === 'APPROVED') return 'text-green-600';
      if (stageAction.action === 'REJECTED') return 'text-red-600';
    }

    if (stage.stageOrder === instance.currentStage && instance.status === 'PENDING') {
      return 'text-orange-600';
    }

    if (stage.stageOrder < instance.currentStage) {
      return 'text-green-600';
    }

    return 'text-gray-400';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Approval Workflow</h2>
      <p className="text-sm text-gray-600 mb-6">{instance.workflow.name}</p>

      <div className="space-y-6">
        {instance.workflow.stages.map((stage, index) => {
          const stageAction = instance.stageActions.find(
            (sa) => sa.stage.stageName === stage.stageName,
          );
          const isLastStage = index === instance.workflow.stages.length - 1;

          return (
            <div key={stage.id}>
              <div className="flex items-start">
                <div className="flex flex-col items-center">
                  <div className="flex-shrink-0">
                    {getStageIcon(stage, stageAction)}
                  </div>
                  {!isLastStage && (
                    <div className="w-0.5 h-12 bg-gray-200 mt-2"></div>
                  )}
                </div>

                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        Stage {stage.stageOrder}: {stage.stageName}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Approvers: {stage.approverRoles.join(', ')}
                      </p>
                    </div>
                    <span className={`text-sm font-medium ${getStageColor(stage, stageAction)}`}>
                      {getStageStatus(stage, stageAction)}
                    </span>
                  </div>

                  {stageAction && stageAction.comments && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">Comment:</p>
                      <p className="text-sm text-gray-700 mt-1">{stageAction.comments}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(stageAction.createdAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Overall Status */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Overall Status:</span>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              instance.status === 'APPROVED'
                ? 'bg-green-100 text-green-800'
                : instance.status === 'REJECTED'
                ? 'bg-red-100 text-red-800'
                : 'bg-orange-100 text-orange-800'
            }`}
          >
            {instance.status}
          </span>
        </div>
        {instance.status === 'PENDING' && (
          <p className="text-xs text-gray-500 mt-2">
            Awaiting approval at Stage {instance.currentStage} -{' '}
            {instance.workflow.stages.find((s) => s.stageOrder === instance.currentStage)?.stageName}
          </p>
        )}
      </div>
    </div>
  );
}

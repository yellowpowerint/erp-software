'use client';

import { useEffect, useMemo, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Plus, RefreshCw, Workflow as WorkflowIcon } from 'lucide-react';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  status?: string;
}

interface WorkflowStage {
  id: string;
  stageNumber: number;
  name: string;
  approverRole: string | null;
  approverId: string | null;
  approvalType: 'SINGLE' | 'ALL' | 'MAJORITY';
  escalationHours: number | null;
  escalateToId: string | null;
}

interface Workflow {
  id: string;
  name: string;
  description: string | null;
  type: string | null;
  isActive: boolean;
  minAmount: string | null;
  maxAmount: string | null;
  stages: WorkflowStage[];
  createdAt: string;
}

const ROLE_OPTIONS = [
  'SUPER_ADMIN',
  'CEO',
  'CFO',
  'ACCOUNTANT',
  'PROCUREMENT_OFFICER',
  'DEPARTMENT_HEAD',
  'OPERATIONS_MANAGER',
  'WAREHOUSE_MANAGER',
  'EMPLOYEE',
  'IT_MANAGER',
  'HR_MANAGER',
  'SAFETY_OFFICER',
];

const REQUISITION_TYPE_OPTIONS = [
  '',
  'STOCK_REPLENISHMENT',
  'PROJECT_MATERIALS',
  'EQUIPMENT_PURCHASE',
  'MAINTENANCE_PARTS',
  'SAFETY_SUPPLIES',
  'CONSUMABLES',
  'EMERGENCY',
  'CAPITAL_EXPENDITURE',
];

function ProcurementWorkflowsContent() {
  const { user } = useAuth();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    type: '',
    minAmount: '',
    maxAmount: '',
    isActive: true,
    stages: [
      {
        stageNumber: 1,
        name: 'Stage 1',
        approverMode: 'ROLE' as 'ROLE' | 'USER',
        approverRole: 'DEPARTMENT_HEAD',
        approverId: '',
        approvalType: 'SINGLE' as 'SINGLE' | 'ALL' | 'MAJORITY',
        escalationHours: '',
        escalateToId: '',
      },
    ],
  });

  const canManage = user && ['SUPER_ADMIN', 'CEO'].includes(user.role);
  const canView = user && ['SUPER_ADMIN', 'CEO', 'CFO'].includes(user.role);

  const activeUsers = useMemo(
    () => users.filter((u) => (u.status ? u.status === 'ACTIVE' : true)),
    [users],
  );

  useEffect(() => {
    if (!canView) {
      setLoading(false);
      return;
    }

    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [wfRes, usersRes] = await Promise.all([
        api.get('/procurement/workflows'),
        api.get('/settings/users'),
      ]);
      setWorkflows(wfRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      console.error('Failed to load workflows:', err);
    } finally {
      setLoading(false);
    }
  };

  const seedDefault = async () => {
    setSeeding(true);
    try {
      await api.post('/procurement/workflows/seed');
      alert('Default procurement workflows seeded');
      fetchAll();
    } catch (error: any) {
      console.error('Failed to seed workflows:', error);
      alert(error.response?.data?.message || 'Failed to seed workflows');
    } finally {
      setSeeding(false);
    }
  };

  const addStage = () => {
    setForm((prev) => ({
      ...prev,
      stages: [
        ...prev.stages,
        {
          stageNumber: prev.stages.length + 1,
          name: `Stage ${prev.stages.length + 1}`,
          approverMode: 'ROLE',
          approverRole: 'PROCUREMENT_OFFICER',
          approverId: '',
          approvalType: 'SINGLE',
          escalationHours: '',
          escalateToId: '',
        },
      ],
    }));
  };

  const removeStage = (idx: number) => {
    setForm((prev) => {
      const next = prev.stages.filter((_, i) => i !== idx);
      return {
        ...prev,
        stages: next.map((s, i) => ({ ...s, stageNumber: i + 1 })),
      };
    });
  };

  const createWorkflow = async () => {
    if (!form.name.trim()) {
      alert('Please enter a workflow name');
      return;
    }

    if (!form.stages.length) {
      alert('Add at least one stage');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        type: form.type || undefined,
        minAmount: form.minAmount || undefined,
        maxAmount: form.maxAmount || undefined,
        isActive: form.isActive,
        stages: form.stages.map((s) => ({
          stageNumber: s.stageNumber,
          name: s.name,
          approverRole: s.approverMode === 'ROLE' ? s.approverRole : undefined,
          approverId: s.approverMode === 'USER' ? s.approverId : undefined,
          approvalType: s.approvalType,
          escalationHours: s.escalationHours ? Number(s.escalationHours) : undefined,
          escalateToId: s.escalateToId || undefined,
        })),
      };

      await api.post('/procurement/workflows', payload);
      alert('Workflow created');
      setShowCreate(false);
      setForm({
        name: '',
        description: '',
        type: '',
        minAmount: '',
        maxAmount: '',
        isActive: true,
        stages: [
          {
            stageNumber: 1,
            name: 'Stage 1',
            approverMode: 'ROLE',
            approverRole: 'DEPARTMENT_HEAD',
            approverId: '',
            approvalType: 'SINGLE',
            escalationHours: '',
            escalateToId: '',
          },
        ],
      });
      fetchAll();
    } catch (error: any) {
      console.error('Failed to create workflow:', error);
      alert(error.response?.data?.message || 'Failed to create workflow');
    } finally {
      setSaving(false);
    }
  };

  if (!canView) {
    return (
      <DashboardLayout>
        <div className="bg-white rounded-lg shadow p-8">
          <p className="text-gray-700">You do not have access to Procurement Workflows.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Procurement Workflows</h1>
          <p className="text-gray-600 mt-1">Automated approval routing for requisitions</p>
        </div>
        <div className="flex items-center space-x-2">
          {canManage && (
            <button
              onClick={seedDefault}
              disabled={seeding}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
            >
              {seeding ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Seeding...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Seed Defaults</span>
                </>
              )}
            </button>
          )}
          {canManage && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Plus className="w-4 h-4" />
              <span>New Workflow</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading workflows...</p>
        </div>
      ) : workflows.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-10 text-center">
          <WorkflowIcon className="w-14 h-14 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No workflows configured</h3>
          <p className="text-gray-600">Seed defaults or create a workflow.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {workflows.map((wf) => (
            <div key={wf.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{wf.name}</h3>
                    {wf.description && <p className="text-sm text-gray-600 mt-1">{wf.description}</p>}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        {wf.type ? wf.type.replace(/_/g, ' ') : 'Any Type'}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${wf.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                        {wf.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {(wf.minAmount || wf.maxAmount) && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Amount: {wf.minAmount ?? '0'} - {wf.maxAmount ?? '∞'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <h4 className="text-sm font-medium text-gray-900 mb-4">Stages</h4>
                <div className="space-y-3">
                  {wf.stages.map((s) => (
                    <div key={s.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-900">
                          Stage {s.stageNumber}: {s.name}
                        </p>
                        <span className="text-xs font-medium text-gray-600">
                          {s.approvalType}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Approver:{' '}
                        {s.approverId
                          ? `User (${s.approverId})`
                          : s.approverRole
                            ? `Role (${s.approverRole})`
                            : 'Not set'}
                      </div>
                      {(s.escalationHours || s.escalateToId) && (
                        <div className="text-xs text-gray-600 mt-1">
                          Escalation:{' '}
                          {s.escalationHours ? `${s.escalationHours}h` : '—'}
                          {s.escalateToId ? ` → ${s.escalateToId}` : ''}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Workflow</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="e.g. Standard Requisition Approval"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Type (optional)</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {REQUISITION_TYPE_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t ? t.replace(/_/g, ' ') : 'Any Type'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600">Min Amount (optional)</label>
                <input
                  value={form.minAmount}
                  onChange={(e) => setForm((p) => ({ ...p, minAmount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Max Amount (optional)</label>
                <input
                  value={form.maxAmount}
                  onChange={(e) => setForm((p) => ({ ...p, maxAmount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="5000"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm text-gray-600">Description (optional)</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-gray-900">Stages</h4>
                <button
                  onClick={addStage}
                  className="px-3 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200"
                >
                  Add Stage
                </button>
              </div>

              <div className="space-y-4">
                {form.stages.map((s, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-medium text-gray-900">Stage {s.stageNumber}</p>
                      {form.stages.length > 1 && (
                        <button
                          onClick={() => removeStage(idx)}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="text-sm text-gray-600">Stage Name</label>
                        <input
                          value={s.name}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              stages: p.stages.map((x, i) =>
                                i === idx ? { ...x, name: e.target.value } : x,
                              ),
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="text-sm text-gray-600">Approver Mode</label>
                        <select
                          value={s.approverMode}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              stages: p.stages.map((x, i) =>
                                i === idx
                                  ? {
                                      ...x,
                                      approverMode: e.target.value as 'ROLE' | 'USER',
                                    }
                                  : x,
                              ),
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="ROLE">Role</option>
                          <option value="USER">Specific User</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-sm text-gray-600">Approval Type</label>
                        <select
                          value={s.approvalType}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              stages: p.stages.map((x, i) =>
                                i === idx
                                  ? {
                                      ...x,
                                      approvalType: e.target.value as any,
                                    }
                                  : x,
                              ),
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="SINGLE">SINGLE</option>
                          <option value="ALL">ALL</option>
                          <option value="MAJORITY">MAJORITY</option>
                        </select>
                      </div>

                      {s.approverMode === 'ROLE' ? (
                        <div className="md:col-span-2">
                          <label className="text-sm text-gray-600">Approver Role</label>
                          <select
                            value={s.approverRole}
                            onChange={(e) =>
                              setForm((p) => ({
                                ...p,
                                stages: p.stages.map((x, i) =>
                                  i === idx ? { ...x, approverRole: e.target.value } : x,
                                ),
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          >
                            {ROLE_OPTIONS.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="md:col-span-2">
                          <label className="text-sm text-gray-600">Approver User</label>
                          <select
                            value={s.approverId}
                            onChange={(e) =>
                              setForm((p) => ({
                                ...p,
                                stages: p.stages.map((x, i) =>
                                  i === idx ? { ...x, approverId: e.target.value } : x,
                                ),
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          >
                            <option value="">Select user...</option>
                            {activeUsers.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.firstName} {u.lastName} ({u.role})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div>
                        <label className="text-sm text-gray-600">Escalation Hours (optional)</label>
                        <input
                          value={s.escalationHours}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              stages: p.stages.map((x, i) =>
                                i === idx ? { ...x, escalationHours: e.target.value } : x,
                              ),
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="e.g. 24"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-sm text-gray-600">Escalate To (optional)</label>
                        <select
                          value={s.escalateToId}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              stages: p.stages.map((x, i) =>
                                i === idx ? { ...x, escalateToId: e.target.value } : x,
                              ),
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="">None</option>
                          {activeUsers.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.firstName} {u.lastName} ({u.role})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
              <button
                onClick={createWorkflow}
                disabled={saving}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                {saving ? 'Saving...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function ProcurementWorkflowsPage() {
  return (
    <ProtectedRoute>
      <ProcurementWorkflowsContent />
    </ProtectedRoute>
  );
}

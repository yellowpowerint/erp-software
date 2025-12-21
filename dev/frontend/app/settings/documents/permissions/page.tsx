'use client';

import { useEffect, useMemo, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import { ArrowLeft, LockKeyhole, RefreshCw } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@/types/auth';
import { DocumentCategory } from '@/types/document';

type Tab = 'category' | 'templates' | 'audit';

type PermissionFlags = {
  canView?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canShare?: boolean;
  canSign?: boolean;
  canUpload?: boolean;
};

type CategoryPermission = {
  id: string;
  category: DocumentCategory;
  role: UserRole;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
  canSign: boolean;
  canUpload: boolean;
  setBy?: { id: string; firstName: string; lastName: string; email: string };
  createdAt: string;
  updatedAt: string;
};

type PermissionTemplate = {
  id: string;
  name: string;
  description?: string | null;
  category?: DocumentCategory | null;
  module?: string | null;
  roles: any;
  departments?: any;
  isDefault: boolean;
  createdBy?: { id: string; firstName: string; lastName: string; email: string };
  createdAt: string;
  updatedAt: string;
};

type PermissionLog = {
  id: string;
  documentId?: string | null;
  action: string;
  performedBy?: { id: string; firstName: string; lastName: string; email: string; role: UserRole };
  targetUser?: { id: string; firstName: string; lastName: string; email: string; role: UserRole } | null;
  targetRole?: UserRole | null;
  targetDepartment?: string | null;
  reason?: string | null;
  createdAt: string;
  document?: { id: string; originalName: string } | null;
};

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-10 h-6 rounded-full transition-colors ${checked ? 'bg-indigo-600' : 'bg-gray-300'}`}
    >
      <span
        className={`block w-5 h-5 bg-white rounded-full transform transition-transform mt-0.5 ${checked ? 'translate-x-4' : 'translate-x-1'}`}
      />
    </button>
  );
}

export default function DocumentPermissionsSettingsPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN, UserRole.CEO, UserRole.CFO, UserRole.IT_MANAGER]}>
      <DashboardLayout>
        <DocumentPermissionsSettingsContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function DocumentPermissionsSettingsContent() {
  const { user } = useAuth();

  const [tab, setTab] = useState<Tab>('category');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [categoryPermissions, setCategoryPermissions] = useState<CategoryPermission[]>([]);
  const [templates, setTemplates] = useState<PermissionTemplate[]>([]);
  const [audit, setAudit] = useState<PermissionLog[]>([]);

  const [savingKey, setSavingKey] = useState<string | null>(null);

  const categories = useMemo(() => Object.values(DocumentCategory), []);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [catRes, tplRes, auditRes] = await Promise.all([
        api.get('/documents/permissions/categories'),
        api.get('/documents/permissions/templates'),
        api.get('/documents/permissions/audit-log'),
      ]);

      setCategoryPermissions(catRes.data.data || []);
      setTemplates(tplRes.data.data || []);
      setAudit(auditRes.data.data || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load document permission settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const upsertCategoryPermission = async (category: DocumentCategory, role: UserRole, patch: PermissionFlags) => {
    const key = `${category}:${role}`;
    setSavingKey(key);
    try {
      await api.post('/documents/permissions/categories', {
        category,
        role,
        permissions: patch,
      });
      await load();
    } finally {
      setSavingKey(null);
    }
  };

  if (!user) return null;

  return (
    <div>
      <div className="mb-6">
        <Link href="/settings" className="inline-flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Settings</span>
        </Link>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <LockKeyhole className="w-8 h-8 text-indigo-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Document Permissions</h1>
              <p className="text-gray-600">Manage defaults, templates, and audit trail for document access.</p>
            </div>
          </div>

          <button
            onClick={load}
            className="inline-flex items-center space-x-2 px-3 py-2 rounded border border-gray-200 hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="mb-4 flex items-center space-x-2">
        <button
          onClick={() => setTab('category')}
          className={`px-3 py-1.5 text-sm rounded border ${
            tab === 'category' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:bg-gray-50'
          }`}
        >
          Category Defaults
        </button>
        <button
          onClick={() => setTab('templates')}
          className={`px-3 py-1.5 text-sm rounded border ${
            tab === 'templates' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:bg-gray-50'
          }`}
        >
          Templates
        </button>
        <button
          onClick={() => setTab('audit')}
          className={`px-3 py-1.5 text-sm rounded border ${
            tab === 'audit' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:bg-gray-50'
          }`}
        >
          Audit Log
        </button>
      </div>

      {error && <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="text-sm text-gray-600">Loading...</div>
      ) : tab === 'category' ? (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">View</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Edit</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Delete</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Share</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sign</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Upload</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories.map((category) => (
                  <CategoryPermissionRows
                    key={category}
                    category={category as DocumentCategory}
                    rows={categoryPermissions.filter((p) => p.category === category)}
                    onChange={upsertCategoryPermission}
                    savingKey={savingKey}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : tab === 'templates' ? (
        <TemplatesPanel templates={templates} onReload={load} />
      ) : (
        <AuditPanel logs={audit} />
      )}
    </div>
  );
}

function CategoryPermissionRows({
  category,
  rows,
  onChange,
  savingKey,
}: {
  category: DocumentCategory;
  rows: CategoryPermission[];
  onChange: (category: DocumentCategory, role: UserRole, patch: PermissionFlags) => Promise<void>;
  savingKey: string | null;
}) {
  const roles: UserRole[] = [
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.DEPARTMENT_HEAD,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.IT_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.SAFETY_OFFICER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.EMPLOYEE,
  ];

  const getRow = (role: UserRole): CategoryPermission | null => rows.find((r) => r.role === role) || null;

  return (
    <>
      {roles.map((role, idx) => {
        const row = getRow(role);
        const key = `${category}:${role}`;
        const disabled = savingKey === key;

        const v = row?.canView ?? false;
        const e = row?.canEdit ?? false;
        const d = row?.canDelete ?? false;
        const s = row?.canShare ?? false;
        const si = row?.canSign ?? false;
        const u = row?.canUpload ?? false;

        return (
          <tr key={key} className={idx === 0 ? 'bg-gray-50/50' : ''}>
            <td className="px-4 py-3 text-sm text-gray-900 font-medium">{idx === 0 ? category.replace(/_/g, ' ') : ''}</td>
            <td className="px-4 py-3 text-sm text-gray-700">{role.replace(/_/g, ' ')}</td>
            <td className="px-4 py-3">
              <Toggle
                checked={v}
                onChange={(next) => onChange(category, role, { canView: next })}
              />
            </td>
            <td className="px-4 py-3">
              <Toggle
                checked={e}
                onChange={(next) => onChange(category, role, { canEdit: next })}
              />
            </td>
            <td className="px-4 py-3">
              <Toggle
                checked={d}
                onChange={(next) => onChange(category, role, { canDelete: next })}
              />
            </td>
            <td className="px-4 py-3">
              <Toggle
                checked={s}
                onChange={(next) => onChange(category, role, { canShare: next })}
              />
            </td>
            <td className="px-4 py-3">
              <Toggle
                checked={si}
                onChange={(next) => onChange(category, role, { canSign: next })}
              />
            </td>
            <td className="px-4 py-3">
              <Toggle
                checked={u}
                onChange={(next) => onChange(category, role, { canUpload: next })}
              />
            </td>
          </tr>
        );
      })}
    </>
  );
}

function TemplatesPanel({ templates, onReload }: { templates: PermissionTemplate[]; onReload: () => Promise<void> }) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const create = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      await api.post('/documents/permissions/templates', {
        name: name.trim(),
        description: description.trim() || undefined,
        roles: [],
        departments: [],
      });
      setName('');
      setDescription('');
      await onReload();
    } finally {
      setCreating(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    await api.delete(`/documents/permissions/templates/${id}`);
    await onReload();
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
        <div className="text-sm font-semibold text-gray-900 mb-3">Create Template</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            className="border border-gray-200 rounded px-3 py-2 text-sm"
            placeholder="Template name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="border border-gray-200 rounded px-3 py-2 text-sm"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <button
            onClick={create}
            disabled={creating || !name.trim()}
            className="px-3 py-2 rounded bg-indigo-600 text-white text-sm disabled:opacity-50"
          >
            Create
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scope</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Default</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {templates.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">{t.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {t.category ? `Category: ${t.category}` : t.module ? `Module: ${t.module}` : 'Global'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{t.isDefault ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => remove(t.id)}
                      className="px-2 py-1 rounded border border-red-200 text-red-700 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {templates.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-sm text-gray-600">
                    No templates yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AuditPanel({ logs }: { logs: PermissionLog[] }) {
  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">When</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">By</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Target</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Document</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.map((l) => (
              <tr key={l.id}>
                <td className="px-4 py-3 text-sm text-gray-700">{new Date(l.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-gray-900 font-medium">{l.action}</td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {l.performedBy ? `${l.performedBy.firstName} ${l.performedBy.lastName}` : ''}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {l.targetUser
                    ? `${l.targetUser.firstName} ${l.targetUser.lastName}`
                    : l.targetRole
                      ? l.targetRole
                      : l.targetDepartment
                        ? l.targetDepartment
                        : ''}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">{l.document?.originalName || ''}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-sm text-gray-600">
                  No permission log entries.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Users, ArrowLeft, Search, Plus, Edit, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { UserRole } from '@/types/auth';

interface SettingsUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: string;
  status: string;
  department: string | null;
  position: string | null;
  managerId?: string | null;
  reportsToTitles?: any;
  modulePermissions?: any;
  mustChangePassword?: boolean;
  createdAt: string;
  lastLogin: string | null;
}

const MODULES = [
  'DASHBOARD',
  'APPROVALS',
  'INVENTORY',
  'ASSETS',
  'FLEET',
  'OPERATIONS',
  'FINANCE',
  'PROCUREMENT',
  'DOCUMENTS',
  'AI',
  'HR',
  'SAFETY',
  'REPORTS',
  'SETTINGS',
] as const;

type ModuleKey = (typeof MODULES)[number];

const toggleStringInArray = (values: string[], value: string) => {
  if (values.includes(value)) return values.filter((v) => v !== value);
  return [...values, value];
};

const REPORTS_TO_TITLE_GROUPS = [
  {
    label: 'Executive / Senior Management',
    items: ['Managing Director (MD)', 'Chief Operating Officer (COO)', 'Operations Manager', 'Deputy Manager'],
  },
  {
    label: 'Middle Management (Department Heads & Supervision) - Finance & Administration',
    items: ['Finance Manager', 'Accounts Manager', 'Senior Accountant', 'Budget & Cost Control Manager'],
  },
  {
    label: 'Middle Management (Department Heads & Supervision) - Procurement & Supply Chain',
    items: ['Procurement Manager', 'Supply Chain Manager', 'Logistics Manager', 'Warehouse Manager'],
  },
  {
    label: 'Middle Management (Department Heads & Supervision) - Human Resources',
    items: ['HR Manager', 'Training & Development Manager', 'Industrial Relations Manager'],
  },
  {
    label: 'Middle Management (Department Heads & Supervision) - Information Technology',
    items: ['IT Manager', 'Systems & Infrastructure Manager', 'Applications / ERP Manager'],
  },
  {
    label: 'Middle Management (Department Heads & Supervision) - Mining & Technical Operations',
    items: [
      'Mine Manager',
      'Plant Manager',
      'Engineering Manager',
      'Maintenance Manager',
      'Exploration Manager',
      'HSE Manager (Health, Safety & Environment)',
      'Fleet / Transport Manager',
    ],
  },
] as const;

const REPORTS_TO_TITLES = REPORTS_TO_TITLE_GROUPS.flatMap((g) => g.items);

const ROLE_GROUPS = [
  {
    label: 'Executive / Senior Management',
    items: ['Managing Director (MD)', 'Chief Operating Officer (COO)', 'Operations Manager', 'Deputy Manager'],
  },
  {
    label: 'Middle Management (Department Heads & Supervision) - Finance & Administration',
    items: ['Finance Manager', 'Accounts Manager', 'Senior Accountant', 'Budget & Cost Control Manager'],
  },
  {
    label: 'Middle Management (Department Heads & Supervision) - Procurement & Supply Chain',
    items: ['Procurement Manager', 'Supply Chain Manager', 'Logistics Manager', 'Warehouse Manager'],
  },
  {
    label: 'Middle Management (Department Heads & Supervision) - Human Resources',
    items: ['HR Manager', 'Training & Development Manager', 'Industrial Relations Manager'],
  },
  {
    label: 'Middle Management (Department Heads & Supervision) - Information Technology',
    items: ['IT Manager', 'Systems & Infrastructure Manager', 'Applications / ERP Manager'],
  },
  {
    label: 'Middle Management (Department Heads & Supervision) - Mining & Technical Operations',
    items: [
      'Mine Manager',
      'Plant Manager',
      'Engineering Manager',
      'Maintenance Manager',
      'Exploration Manager',
      'HSE Manager (Health, Safety & Environment)',
      'Fleet / Transport Manager',
    ],
  },
  {
    label: 'Junior Management / Officers - Finance',
    items: ['Assistant Finance Manager', 'Accountant', 'Assistant Accountant', 'Payroll Officer'],
  },
  {
    label: 'Junior Management / Officers - Procurement',
    items: ['Senior Procurement Officer', 'Procurement Officer', 'Purchasing Officer'],
  },
  {
    label: 'Junior Management / Officers - Human Resources',
    items: ['Senior HR Officer', 'HR Officer', 'HR/Admin Officer'],
  },
  {
    label: 'Junior Management / Officers - IT',
    items: ['Senior IT Officer', 'IT Officer', 'IT Support Technician'],
  },
  {
    label: 'Junior Management / Officers - Mining & Engineering',
    items: [
      'Senior Mining Engineer',
      'Mining Engineer',
      'Geologist',
      'Surveyor',
      'Mechanical Engineer',
      'Electrical Engineer',
    ],
  },
  {
    label: 'Junior Management / Officers - HSE',
    items: ['Senior Safety Officer', 'Safety Officer', 'Environmental Officer'],
  },
  {
    label: 'Supervisors',
    items: [
      'Shift Supervisor',
      'Pit Supervisor',
      'Plant Supervisor',
      'Maintenance Supervisor',
      'Electrical Supervisor',
      'Mechanical Supervisor',
      'Drill & Blast Supervisor',
      'Warehouse Supervisor',
      'Fleet Supervisor',
    ],
  },
  {
    label: 'Field & Support Staff',
    items: [
      'Heavy Equipment Operators',
      'Drill Operators',
      'Machine Operators',
      'Mechanics',
      'Electricians',
      'Welders',
      'Drivers',
      'Storekeepers',
      'Security Personnel',
      'General Laborers',
    ],
  },
] as const;

const ROLE_TITLES: string[] = ROLE_GROUPS.flatMap((g) => g.items) as unknown as string[];

const buildDefaultModulePermissions = () => {
  const perms: Record<string, any> = {};
  MODULES.forEach((m) => {
    perms[m] = { view: false, create: false, update: false, delete: false };
  });
  return perms;
};

function UserManagementContent() {
  const [users, setUsers] = useState<SettingsUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<SettingsUser | null>(null);
  const [wizardStep, setWizardStep] = useState(0);
  const [isReportsToOpen, setIsReportsToOpen] = useState(false);
  const [isPositionOpen, setIsPositionOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'EMPLOYEE',
    status: 'ACTIVE',
    department: '',
    position: '',
    customPosition: '',
    managerId: '',
    reportsToTitles: [] as string[],
    modulePermissions: buildDefaultModulePermissions(),
    password: '',
    mustChangePassword: true,
  });

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (searchTerm) params.append('search', searchTerm);

      const response = await api.get(`/settings/users?${params.toString()}`);
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchUsers();
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setWizardStep(0);
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      role: 'EMPLOYEE',
      status: 'ACTIVE',
      department: '',
      position: '',
      customPosition: '',
      managerId: '',
      reportsToTitles: [],
      modulePermissions: buildDefaultModulePermissions(),
      password: '',
      mustChangePassword: true,
    });
    setShowModal(true);
  };

  const handleEditUser = (user: SettingsUser) => {
    const positionValue = user.position || '';
    const positionIsKnown = !positionValue || ROLE_TITLES.includes(positionValue);
    setEditingUser(user);
    setWizardStep(0);
    setFormData({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || '',
      role: user.role,
      status: user.status,
      department: user.department || '',
      position: positionIsKnown ? positionValue : 'Other',
      customPosition: positionIsKnown ? '' : positionValue,
      managerId: user.managerId || '',
      reportsToTitles: (user.reportsToTitles as string[]) || [],
      modulePermissions: user.modulePermissions || buildDefaultModulePermissions(),
      password: '',
      mustChangePassword: !!user.mustChangePassword,
    });
    setShowModal(true);
  };

  const validateStep = (step: number) => {
    if (step === 0) {
      if (!formData.firstName || !formData.lastName || !formData.email) {
        alert('Please fill in First Name, Last Name, and Email.');
        return false;
      }
    }
    if (step === 2) {
      if (!formData.position) {
        alert('Please select a Role / Job Title.');
        return false;
      }
      if (formData.position === 'Other' && !formData.customPosition.trim()) {
        alert('Please specify the Role / Job Title.');
        return false;
      }
    }
    if (step === 3) {
      if (!editingUser && formData.password && formData.password.length < 8) {
        alert('Temporary password must be at least 8 characters long.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep(wizardStep)) return;
    setWizardStep((s) => Math.min(s + 1, 3));
  };

  const handleBack = () => {
    setWizardStep((s) => Math.max(s - 1, 0));
  };

  const handleSave = async () => {
    if (!validateStep(wizardStep)) return;

    const payload: any = {
      email: formData.email,
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone || undefined,
      role: formData.role,
      status: formData.status,
      department: formData.department || undefined,
      position:
        formData.position === 'Other'
          ? (formData.customPosition || undefined)
          : formData.position || undefined,
      managerId: formData.managerId || undefined,
      reportsToTitles: formData.reportsToTitles,
      modulePermissions: formData.modulePermissions,
      mustChangePassword: !!formData.mustChangePassword,
    };

    if (!editingUser && formData.password) {
      payload.password = formData.password;
    }

    try {
      if (editingUser) {
        await api.put(`/settings/users/${editingUser.id}`, payload);
      } else {
        await api.post('/settings/users', payload);
      }
      setShowModal(false);
      fetchUsers();
    } catch (error) {
      console.error('Failed to save user:', error);
      alert('Failed to save user. Please try again.');
    }
  };

  const updateModulePermission = (
    moduleKey: ModuleKey,
    permission: 'view' | 'create' | 'update' | 'delete',
    value: boolean,
  ) => {
    setFormData((prev) => ({
      ...prev,
      modulePermissions: {
        ...(prev.modulePermissions || {}),
        [moduleKey]: {
          ...(prev.modulePermissions?.[moduleKey] || {}),
          [permission]: value,
        },
      },
    }));
  };

  const handleToggleStatus = async (user: SettingsUser) => {
    try {
      if (user.status === 'ACTIVE') {
        await api.post(`/settings/users/${user.id}/deactivate`);
      } else {
        await api.post(`/settings/users/${user.id}/activate`);
      }
      fetchUsers();
    } catch (error) {
      console.error('Failed to toggle user status:', error);
      alert('Failed to update user status.');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      ACTIVE: 'bg-green-100 text-green-800 border-green-200',
      INACTIVE: 'bg-gray-100 text-gray-800 border-gray-200',
      SUSPENDED: 'bg-red-100 text-red-800 border-red-200',
    };
    return styles[status as keyof typeof styles] || styles.INACTIVE;
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      SUPER_ADMIN: 'bg-purple-100 text-purple-800',
      CEO: 'bg-pink-100 text-pink-800',
      CFO: 'bg-blue-100 text-blue-800',
      DEPARTMENT_HEAD: 'bg-indigo-100 text-indigo-800',
      EMPLOYEE: 'bg-gray-100 text-gray-800',
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link href="/settings" className="inline-flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Settings</span>
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Users className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600">Manage users, roles, and permissions</p>
            </div>
          </div>
          <button
            onClick={handleCreateUser}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search by name or email..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Roles</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="CEO">CEO</option>
              <option value="CFO">CFO</option>
              <option value="DEPARTMENT_HEAD">Department Head</option>
              <option value="ACCOUNTANT">Accountant</option>
              <option value="HR_MANAGER">HR Manager</option>
              <option value="OPERATIONS_MANAGER">Operations Manager</option>
              <option value="EMPLOYEE">Employee</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      {user.phone && <div className="text-xs text-gray-400">{user.phone}</div>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadge(user.role)}`}>
                      {user.role.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{user.department || '-'}</div>
                    <div className="text-xs text-gray-500">{user.position || '-'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadge(user.status)}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => handleEditUser(user)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Edit user"
                    >
                      <Edit className="w-4 h-4 inline" />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(user)}
                      className={user.status === 'ACTIVE' ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}
                      title={user.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    >
                      {user.status === 'ACTIVE' ? <XCircle className="w-4 h-4 inline" /> : <CheckCircle className="w-4 h-4 inline" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingUser ? 'Edit User' : 'Create New User'}
              </h2>
              <div className="flex items-center justify-between mb-6">
                <div className="text-sm text-gray-600">
                  Step {wizardStep + 1} of 4
                </div>
                <div className="flex items-center space-x-2">
                  {[0, 1, 2, 3].map((s) => (
                    <div
                      key={s}
                      className={`h-2 w-10 rounded-full ${s <= wizardStep ? 'bg-indigo-600' : 'bg-gray-200'}`}
                    />
                  ))}
                </div>
              </div>

              {wizardStep === 0 && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name*</label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name*</label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email*</label>
                    <input
                      type="email"
                      required
                      disabled={!!editingUser}
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              )}

              {wizardStep === 1 && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div />
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Manager / Reports To</label>
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => setIsReportsToOpen((v) => !v)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-left bg-white"
                      >
                        {formData.reportsToTitles.length > 0
                          ? `${formData.reportsToTitles.length} selected`
                          : 'Select reports-to titles'}
                      </button>
                      {isReportsToOpen && (
                        <div className="border border-gray-200 rounded-lg p-3 max-h-60 overflow-y-auto bg-white">
                          {REPORTS_TO_TITLE_GROUPS.map((g) => (
                            <div key={g.label} className="mb-4 last:mb-0">
                              <div className="text-xs font-semibold text-gray-700 mb-2">{g.label}</div>
                              <div className="space-y-2">
                                {g.items.map((t) => (
                                  <label key={t} className="flex items-center space-x-2 text-sm text-gray-700">
                                    <input
                                      type="checkbox"
                                      className="h-4 w-4"
                                      checked={formData.reportsToTitles.includes(t)}
                                      onChange={() =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          reportsToTitles: toggleStringInArray(prev.reportsToTitles, t),
                                        }))
                                      }
                                    />
                                    <span>{t}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">System Access Role*</label>
                      <select
                        required
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="EMPLOYEE">Employee</option>
                        <option value="DEPARTMENT_HEAD">Department Head</option>
                        <option value="ACCOUNTANT">Accountant</option>
                        <option value="HR_MANAGER">HR Manager</option>
                        <option value="OPERATIONS_MANAGER">Operations Manager</option>
                        <option value="CFO">CFO</option>
                        <option value="CEO">CEO</option>
                        <option value="SUPER_ADMIN">Super Admin</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status*</label>
                      <select
                        required
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                        <option value="SUSPENDED">Suspended</option>
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Role*</label>
                      <button
                        type="button"
                        onClick={() => setIsPositionOpen((v) => !v)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-left bg-white"
                      >
                        {formData.position
                          ? formData.position === 'Other'
                            ? formData.customPosition
                              ? `Other: ${formData.customPosition}`
                              : 'Other'
                            : formData.position
                          : 'Select role'}
                      </button>
                      {isPositionOpen && (
                        <div className="border border-gray-200 rounded-lg p-3 max-h-60 overflow-y-auto bg-white">
                          {ROLE_GROUPS.map((g) => (
                            <div key={g.label} className="mb-4 last:mb-0">
                              <div className="text-xs font-semibold text-gray-700 mb-2">{g.label}</div>
                              <div className="space-y-2">
                                {g.items.map((t) => (
                                  <label key={t} className="flex items-center space-x-2 text-sm text-gray-700">
                                    <input
                                      type="checkbox"
                                      className="h-4 w-4"
                                      checked={formData.position === t}
                                      onChange={() =>
                                        setFormData((prev) => {
                                          setIsPositionOpen(false);
                                          return {
                                            ...prev,
                                            position: t,
                                            customPosition: '',
                                          };
                                        })
                                      }
                                    />
                                    <span>{t}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          ))}
                          <div className="pt-2 mt-2 border-t border-gray-100">
                            <label className="flex items-center space-x-2 text-sm text-gray-700">
                              <input
                                type="checkbox"
                                className="h-4 w-4"
                                checked={formData.position === 'Other'}
                                onChange={() =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    position: 'Other',
                                  }))
                                }
                              />
                              <span>Other</span>
                            </label>
                          </div>
                        </div>
                      )}
                    </div>

                    {formData.position === 'Other' && (
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Specify Role / Job Title</label>
                        <input
                          type="text"
                          value={formData.customPosition}
                          onChange={(e) => setFormData({ ...formData, customPosition: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    )}
                  </div>

                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="grid grid-cols-5 bg-gray-50 text-xs font-medium text-gray-600 px-4 py-3">
                      <div>Module</div>
                      <div className="text-center">View</div>
                      <div className="text-center">Create</div>
                      <div className="text-center">Update</div>
                      <div className="text-center">Delete</div>
                    </div>
                    {MODULES.map((m) => (
                      <div key={m} className="grid grid-cols-5 items-center px-4 py-3 border-t border-gray-100">
                        <div className="text-sm text-gray-900">{m.replace(/_/g, ' ')}</div>
                        {(['view', 'create', 'update', 'delete'] as const).map((p) => (
                          <div key={p} className="flex justify-center">
                            <input
                              type="checkbox"
                              checked={!!formData.modulePermissions?.[m]?.[p]}
                              onChange={(e) => updateModulePermission(m, p, e.target.checked)}
                              className="h-4 w-4"
                            />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {wizardStep === 3 && (
                <div className="space-y-4">
                  {!editingUser && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Temporary Password (optional)</label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        If left blank, the system will set a default password.
                      </p>
                    </div>
                  )}

                  <label className="flex items-center space-x-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={!!formData.mustChangePassword}
                      onChange={(e) => setFormData({ ...formData, mustChangePassword: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <span>Force user to change password on first login</span>
                  </label>
                </div>
              )}

              <div className="flex justify-between space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setWizardStep(0);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={wizardStep === 0}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    Back
                  </button>
                  {wizardStep < 3 ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSave}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      {editingUser ? 'Update User' : 'Create User'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function UserManagementPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]}>
      <UserManagementContent />
    </ProtectedRoute>
  );
}

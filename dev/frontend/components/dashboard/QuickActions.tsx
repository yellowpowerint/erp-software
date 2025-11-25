'use client';

import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@/types/auth';
import { Plus, FileText, Package, Users, DollarSign, ClipboardCheck, HardHat, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface QuickAction {
  label: string;
  icon: any;
  href: string;
  color: string;
  roles: UserRole[];
}

const quickActions: QuickAction[] = [
  {
    label: 'Create Invoice',
    icon: FileText,
    href: '/finance/invoices/new',
    color: 'bg-blue-500 hover:bg-blue-600',
    roles: [UserRole.SUPER_ADMIN, UserRole.CFO, UserRole.ACCOUNTANT],
  },
  {
    label: 'New Purchase Request',
    icon: ClipboardCheck,
    href: '/approvals/purchases/new',
    color: 'bg-green-500 hover:bg-green-600',
    roles: [UserRole.SUPER_ADMIN, UserRole.CEO, UserRole.CFO, UserRole.PROCUREMENT_OFFICER, UserRole.DEPARTMENT_HEAD],
  },
  {
    label: 'Add Stock',
    icon: Package,
    href: '/inventory/manage',
    color: 'bg-orange-500 hover:bg-orange-600',
    roles: [UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_MANAGER],
  },
  {
    label: 'New Project',
    icon: HardHat,
    href: '/operations/projects/new',
    color: 'bg-purple-500 hover:bg-purple-600',
    roles: [UserRole.SUPER_ADMIN, UserRole.CEO, UserRole.OPERATIONS_MANAGER],
  },
  {
    label: 'Add Employee',
    icon: Users,
    href: '/hr/employees/new',
    color: 'bg-indigo-500 hover:bg-indigo-600',
    roles: [UserRole.SUPER_ADMIN, UserRole.HR_MANAGER],
  },
  {
    label: 'Report Incident',
    icon: AlertCircle,
    href: '/safety/incidents/new',
    color: 'bg-red-500 hover:bg-red-600',
    roles: [UserRole.SUPER_ADMIN, UserRole.SAFETY_OFFICER, UserRole.OPERATIONS_MANAGER],
  },
  {
    label: 'New Payment',
    icon: DollarSign,
    href: '/finance/payments/new',
    color: 'bg-green-500 hover:bg-green-600',
    roles: [UserRole.SUPER_ADMIN, UserRole.CFO, UserRole.ACCOUNTANT],
  },
];

export default function QuickActions() {
  const { user } = useAuth();

  if (!user) return null;

  const userActions = quickActions.filter((action) =>
    action.roles.includes(user.role)
  );

  if (userActions.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        <Plus className="w-5 h-5 text-gray-400" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {userActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              href={action.href}
              className={`${action.color} text-white p-4 rounded-lg text-center transition-all hover:shadow-lg group`}
            >
              <Icon className="w-6 h-6 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-medium block">{action.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

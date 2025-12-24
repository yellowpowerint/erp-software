"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Shield, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { UserRole } from "@/types/auth";
import { menuItems, type MenuItem } from "@/lib/config/menu";

type CompanyRoleId =
  | "SUPER_ADMIN"
  | "EXEC_SENIOR_MANAGEMENT"
  | "MIDDLE_MANAGEMENT"
  | "JUNIOR_MANAGEMENT_OFFICERS"
  | "SUPERVISORS"
  | "FIELD_SUPPORT_STAFF";

const COMPANY_ROLES: Array<{
  id: CompanyRoleId;
  label: string;
  description: string;
  mappedSystemRoles: UserRole[];
}> = [
  {
    id: "SUPER_ADMIN",
    label: "Super Admin",
    description: "Full administrative access across the system.",
    mappedSystemRoles: [UserRole.SUPER_ADMIN],
  },
  {
    id: "EXEC_SENIOR_MANAGEMENT",
    label: "Executive / Senior Management",
    description: "High-level oversight and approvals across departments.",
    mappedSystemRoles: [UserRole.CEO, UserRole.CFO],
  },
  {
    id: "MIDDLE_MANAGEMENT",
    label: "Middle Management (Department Heads & Supervision)",
    description: "Department-level management and operational supervision.",
    mappedSystemRoles: [
      UserRole.DEPARTMENT_HEAD,
      UserRole.OPERATIONS_MANAGER,
      UserRole.IT_MANAGER,
      UserRole.HR_MANAGER,
      UserRole.WAREHOUSE_MANAGER,
    ],
  },
  {
    id: "JUNIOR_MANAGEMENT_OFFICERS",
    label: "Junior Management / Officers",
    description: "Officers responsible for day-to-day execution within their scope.",
    mappedSystemRoles: [
      UserRole.ACCOUNTANT,
      UserRole.PROCUREMENT_OFFICER,
      UserRole.SAFETY_OFFICER,
    ],
  },
  {
    id: "SUPERVISORS",
    label: "Supervisors",
    description: "On-the-ground supervision and task coordination.",
    mappedSystemRoles: [UserRole.OPERATIONS_MANAGER],
  },
  {
    id: "FIELD_SUPPORT_STAFF",
    label: "Field & Support Staff",
    description: "General staff and support roles with limited access.",
    mappedSystemRoles: [UserRole.EMPLOYEE, UserRole.VENDOR],
  },
];

const flattenMenu = (items: MenuItem[]): MenuItem[] => {
  const out: MenuItem[] = [];
  for (const item of items) {
    out.push(item);
    if (item.children && item.children.length > 0) {
      out.push(...item.children);
    }
  }
  return out;
};

const getRoleModules = (role: UserRole) => {
  const items = flattenMenu(menuItems)
    .filter((m) => Boolean(m.path))
    .filter((m) => m.roles.includes(role));

  // Prefer top-level module labels for an overview
  const topLevel = menuItems
    .filter((m) => Boolean(m.path))
    .filter((m) => m.roles.includes(role))
    .map((m) => m.label);

  const uniqueTop = Array.from(new Set(topLevel)).sort((a, b) => a.localeCompare(b));

  // Also expose a compact list of key pages (paths)
  const keyPages = items
    .map((m) => m.label)
    .filter(Boolean)
    .slice(0, 20);

  return { modules: uniqueTop, keyPagesCount: items.length };
};

const getCompanyRoleModules = (mappedRoles: UserRole[]) => {
  const roleSet = new Set<UserRole>(mappedRoles);

  const accessibleItems = flattenMenu(menuItems)
    .filter((m) => Boolean(m.path))
    .filter((m) => (m.roles || []).some((r) => roleSet.has(r)));

  const topLevelModules = menuItems
    .filter((m) => Boolean(m.path))
    .filter((m) => (m.roles || []).some((r) => roleSet.has(r)))
    .map((m) => m.label);

  const uniqueModules = Array.from(new Set(topLevelModules)).sort((a, b) =>
    a.localeCompare(b),
  );

  const uniquePagesCount = new Set(accessibleItems.map((m) => m.path)).size;

  return { modules: uniqueModules, keyPagesCount: uniquePagesCount };
};

function RolesPermissionsContent() {
  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link
          href="/settings"
          className="inline-flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Settings</span>
        </Link>
        <div className="flex items-center space-x-3">
          <Shield className="w-8 h-8 text-indigo-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Roles &amp; Permissions
            </h1>
            <p className="text-gray-600">
              Overview of company roles and the modules each role can access.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Key Modules / Permissions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {COMPANY_ROLES.map((role) => {
                const { modules, keyPagesCount } = getCompanyRoleModules(
                  role.mappedSystemRoles,
                );
                return (
                <tr key={role.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 align-top">
                    <div className="text-sm font-semibold text-gray-900">
                      {role.label}
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top text-sm text-gray-700">
                    {role.description}
                    <div className="text-xs text-gray-500 mt-1">
                      {keyPagesCount} menu entries available
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top text-sm text-gray-700">
                    <ul className="list-disc list-inside space-y-1">
                      {modules.map((m) => (
                        <li key={m}>{m}</li>
                      ))}
                    </ul>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function RolesPermissionsPage() {
  return (
    <ProtectedRoute
      allowedRoles={[UserRole.SUPER_ADMIN, UserRole.CEO, UserRole.IT_MANAGER]}
    >
      <RolesPermissionsContent />
    </ProtectedRoute>
  );
}

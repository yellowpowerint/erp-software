"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Shield, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { UserRole } from "@/types/auth";
import { menuItems, type MenuItem } from "@/lib/config/menu";

const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: "Super Admin",
  [UserRole.CEO]: "CEO",
  [UserRole.CFO]: "CFO",
  [UserRole.DEPARTMENT_HEAD]: "Department Head",
  [UserRole.ACCOUNTANT]: "Accountant",
  [UserRole.PROCUREMENT_OFFICER]: "Procurement Officer",
  [UserRole.OPERATIONS_MANAGER]: "Operations Manager",
  [UserRole.IT_MANAGER]: "IT Manager",
  [UserRole.HR_MANAGER]: "HR Manager",
  [UserRole.SAFETY_OFFICER]: "Safety Officer",
  [UserRole.WAREHOUSE_MANAGER]: "Warehouse Manager",
  [UserRole.EMPLOYEE]: "Employee",
  [UserRole.VENDOR]: "Vendor",
};

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

function RolesPermissionsContent() {
  const roles = Object.values(UserRole);
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
              Overview of system roles and the modules each role can access.
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
              {roles.map((role) => {
                const { modules, keyPagesCount } = getRoleModules(role);
                return (
                <tr key={role} className="hover:bg-gray-50">
                  <td className="px-6 py-4 align-top">
                    <div className="text-sm font-semibold text-gray-900">
                      {ROLE_LABELS[role]}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {role.replace(/_/g, " ")}
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top text-sm text-gray-700">
                    Access is derived from the current sidebar configuration.
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

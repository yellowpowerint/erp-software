"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Shield, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { UserRole } from "@/types/auth";

const roleDefinitions: Array<{
  role: UserRole;
  name: string;
  description: string;
  modules: string[];
}> = [
  {
    role: UserRole.SUPER_ADMIN,
    name: "Super Admin",
    description: "Full system access including user management, AI keys, and configuration.",
    modules: [
      "All modules",
      "User & role management",
      "System configuration",
      "AI & Integrations settings",
    ],
  },
  {
    role: UserRole.IT_MANAGER,
    name: "IT Manager",
    description: "Manages technical configuration, integrations, and user access.",
    modules: [
      "Settings",
      "AI & Integrations",
      "User Management",
      "Notifications",
    ],
  },
  {
    role: UserRole.CEO,
    name: "Chief Executive Officer",
    description: "Read/approve access across finance, operations, and reports.",
    modules: [
      "Dashboard",
      "Approvals",
      "Finance",
      "Reports",
      "AI Intelligence (read)",
    ],
  },
  {
    role: UserRole.CFO,
    name: "Chief Financial Officer",
    description: "Owns finance, budgets, and high-value approvals.",
    modules: [
      "Finance & Procurement",
      "Approvals",
      "Reports",
    ],
  },
  {
    role: UserRole.OPERATIONS_MANAGER,
    name: "Operations Manager",
    description: "Manages projects, production logs, and field operations.",
    modules: [
      "Operations",
      "Projects",
      "Assets",
      "Inventory (read)",
      "Safety (shared)",
    ],
  },
  {
    role: UserRole.WAREHOUSE_MANAGER,
    name: "Warehouse Manager",
    description: "Responsible for stock, warehouses, and inventory movements.",
    modules: ["Inventory", "Assets (read)", "Reports (inventory)", "Alerts"],
  },
  {
    role: UserRole.EMPLOYEE,
    name: "Employee",
    description: "Standard user access for submitting requests and viewing assigned work.",
    modules: [
      "Dashboard",
      "My Approvals",
      "HR self-service",
      "Assigned projects/tasks",
    ],
  },
];

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
              {roleDefinitions.map((role) => (
                <tr key={role.role} className="hover:bg-gray-50">
                  <td className="px-6 py-4 align-top">
                    <div className="text-sm font-semibold text-gray-900">
                      {role.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {role.role.replace(/_/g, " ")}
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top text-sm text-gray-700">
                    {role.description}
                  </td>
                  <td className="px-6 py-4 align-top text-sm text-gray-700">
                    <ul className="list-disc list-inside space-y-1">
                      {role.modules.map((m) => (
                        <li key={m}>{m}</li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
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

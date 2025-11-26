"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Truck, BarChart3, ArrowLeft, Search } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { UserRole } from "@/types/auth";

interface EquipmentUsage {
  equipment: string;
  usageCount: number;
  totalProduction: number;
  lastUsed: string;
}

interface EquipmentReport {
  totalEquipment: number;
  equipment: EquipmentUsage[];
}

function EquipmentUsageContent() {
  const [report, setReport] = useState<EquipmentReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(30);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - dateRange);
        const endDate = new Date();

        const params = {
          startDate: startDate.toISOString().split("T")[0],
          endDate: endDate.toISOString().split("T")[0],
        };

        const response = await api.get(
          "/operations/reports/equipment-utilization",
          { params },
        );
        setReport(response.data);
      } catch (error) {
        console.error("Failed to fetch equipment utilization:", error);
        setReport({ totalEquipment: 0, equipment: [] });
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [dateRange]);

  const filtered = (report?.equipment || []).filter((item) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return item.equipment.toLowerCase().includes(term);
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
          <p className="text-gray-600 mt-4">Loading equipment usage...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link
          href="/operations"
          className="inline-flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Operations</span>
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Truck className="w-8 h-8 text-indigo-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Equipment Usage
              </h1>
              <p className="text-gray-600">
                Utilization of mining equipment based on production logs.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden sm:block">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Date range
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(parseInt(e.target.value, 10))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={60}>Last 60 days</option>
                <option value={90}>Last 90 days</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {report && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Tracked Equipment</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {report.totalEquipment}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Total Usage Events</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">
              {filtered.reduce((sum, e) => sum + e.usageCount, 0)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Total Production</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {filtered
                .reduce((sum, e) => sum + e.totalProduction, 0)
                .toFixed(1)}
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Search equipment
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="e.g. Excavator, CAT-320D"
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
          <div className="text-sm text-gray-500 flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-gray-400" />
            <span>{filtered.length} equipment item(s)</span>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600">
            No equipment usage data available for the selected period.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Equipment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Usage Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total Production
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Last Used
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map((item) => (
                  <tr key={item.equipment} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {item.equipment}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {item.usageCount}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {item.totalProduction.toFixed(1)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {new Date(item.lastUsed).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function EquipmentUsagePage() {
  return (
    <ProtectedRoute
      allowedRoles={[UserRole.SUPER_ADMIN, UserRole.OPERATIONS_MANAGER]}
    >
      <EquipmentUsageContent />
    </ProtectedRoute>
  );
}

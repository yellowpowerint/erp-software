"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Shield, AlertTriangle, ArrowLeft, Search } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { UserRole } from "@/types/auth";

interface SafetyIncident {
  id: string;
  incidentNumber: string;
  type: string;
  severity: string;
  status: string;
  location: string;
  incidentDate: string;
  reportedBy: string;
  description: string;
  oshaReportable: boolean;
}

function SafetyIncidentsContent() {
  const [incidents, setIncidents] = useState<SafetyIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const response = await api.get("/ai/safety/incidents");
        setIncidents(response.data || []);
      } catch (error) {
        console.error("Failed to fetch safety incidents:", error);
        setIncidents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchIncidents();
  }, []);

  const filtered = incidents.filter((incident) => {
    const term = search.toLowerCase();
    const matchesSearch =
      !term ||
      incident.incidentNumber.toLowerCase().includes(term) ||
      incident.location.toLowerCase().includes(term) ||
      incident.description.toLowerCase().includes(term);

    const matchesSeverity =
      severityFilter === "ALL" || incident.severity === severityFilter;
    const matchesStatus =
      statusFilter === "ALL" || incident.status === statusFilter;

    return matchesSearch && matchesSeverity && matchesStatus;
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
          <p className="text-gray-600 mt-4">Loading safety incidents...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link
          href="/safety"
          className="inline-flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Safety Dashboard</span>
        </Link>
        <div className="flex items-center space-x-3">
          <Shield className="w-8 h-8 text-red-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Incident Reports</h1>
            <p className="text-gray-600">
              Record of safety incidents for compliance review and follow-up.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Incident #, location, or description"
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Severity
            </label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="ALL">All</option>
              <option value="MINOR">Minor</option>
              <option value="MODERATE">Moderate</option>
              <option value="SERIOUS">Serious</option>
              <option value="CRITICAL">Critical</option>
              <option value="FATAL">Fatal</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="ALL">All</option>
              <option value="OPEN">Open</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600">
            No safety incidents recorded yet. Use the AI Safety Assistant to
            report incidents and generate analysis.
          </p>
          <Link
            href="/ai/safety-assistant"
            className="mt-4 inline-flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Open AI Safety Assistant</span>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Incident #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    OSHA
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map((incident) => (
                  <tr key={incident.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-mono text-gray-900">
                      {incident.incidentNumber}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {incident.type.replace(/_/g, " ")}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {incident.severity}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {incident.status.replace(/_/g, " ")}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {incident.location}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {new Date(incident.incidentDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {incident.oshaReportable ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          Reportable
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">
                          N/A
                        </span>
                      )}
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

export default function SafetyIncidentsPage() {
  return (
    <ProtectedRoute
      allowedRoles={[UserRole.SUPER_ADMIN, UserRole.SAFETY_OFFICER]}
    >
      <SafetyIncidentsContent />
    </ProtectedRoute>
  );
}

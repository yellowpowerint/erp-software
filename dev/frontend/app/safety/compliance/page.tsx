"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Shield,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Award,
  Users,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { UserRole } from "@/types/auth";

interface SafetyComplianceSummary {
  totalInspections: number;
  passedInspections: number;
  failedInspections: number;
  inspectionPassRate: number;
  completedTrainings: number;
  totalTrainingParticipants: number;
  activeCertifications: number;
  expiringCertifications: number;
  completedDrills: number;
  averageDrillRating: number;
}

interface SafetyComplianceReport {
  summary: SafetyComplianceSummary;
  inspectionsByStatus: Array<{ status: string; count: number }>;
}

function SafetyComplianceContent() {
  const [report, setReport] = useState<SafetyComplianceReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await api.get("/reports/safety");
        setReport(response.data);
      } catch (error) {
        console.error("Failed to fetch safety compliance report:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
          <p className="text-gray-600 mt-4">Loading safety compliance overview...</p>
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
          <Shield className="w-8 h-8 text-indigo-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Compliance &amp; Certifications</h1>
            <p className="text-gray-600">
              Overview of safety inspections, trainings, certifications, and
              drills.
            </p>
          </div>
        </div>
      </div>

      {report && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <Shield className="w-5 h-5 text-gray-500" />
                <span className="text-2xl font-bold text-gray-900">
                  {report.summary.totalInspections}
                </span>
              </div>
              <p className="text-sm text-gray-600">Total Inspections</p>
            </div>

            <div className="bg-green-50 rounded-lg shadow p-6 border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-2xl font-bold text-green-600">
                  {report.summary.passedInspections}
                </span>
              </div>
              <p className="text-sm text-green-700 font-medium">Passed</p>
              <p className="text-xs text-green-600 mt-1">
                {report.summary.inspectionPassRate.toFixed(1)}% pass rate
              </p>
            </div>

            <div className="bg-red-50 rounded-lg shadow p-6 border border-red-200">
              <div className="flex items-center justify-between mb-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <span className="text-2xl font-bold text-red-600">
                  {report.summary.failedInspections}
                </span>
              </div>
              <p className="text-sm text-red-700 font-medium">Failed</p>
              <p className="text-xs text-red-600 mt-1">
                {report.summary.totalInspections > 0
                  ? (
                      (report.summary.failedInspections /
                        report.summary.totalInspections) * 100
                    ).toFixed(1)
                  : 0}
                % failure rate
              </p>
            </div>

            <div className="bg-blue-50 rounded-lg shadow p-6 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="text-2xl font-bold text-blue-600">
                  {report.summary.totalTrainingParticipants}
                </span>
              </div>
              <p className="text-sm text-blue-700 font-medium">Training Participants</p>
              <p className="text-xs text-blue-600 mt-1">
                {report.summary.completedTrainings} trainings completed
              </p>
            </div>
          </div>

          {/* Certifications & Drills */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <Award className="w-5 h-5 text-indigo-600" />
                <span className="text-2xl font-bold text-indigo-600">
                  {report.summary.activeCertifications}
                </span>
              </div>
              <p className="text-sm text-gray-600">Active Certifications</p>
            </div>

            <div className="bg-yellow-50 rounded-lg shadow p-6 border border-yellow-200">
              <div className="flex items-center justify-between mb-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <span className="text-2xl font-bold text-yellow-600">
                  {report.summary.expiringCertifications}
                </span>
              </div>
              <p className="text-sm text-yellow-700 font-medium">
                Certifications Expiring Soon
              </p>
            </div>

            <div className="bg-purple-50 rounded-lg shadow p-6 border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                <span className="text-2xl font-bold text-purple-600">
                  {report.summary.completedDrills}
                </span>
              </div>
              <p className="text-sm text-purple-700 font-medium">
                Completed Safety Drills
              </p>
              <p className="text-xs text-purple-600 mt-1">
                Avg rating {report.summary.averageDrillRating.toFixed(1)}/5
              </p>
            </div>
          </div>

          {/* Inspections by Status */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Inspections by Status
            </h2>
            <div className="space-y-3">
              {report.inspectionsByStatus.map((item) => (
                <div
                  key={item.status}
                  className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                >
                  <span className="text-sm font-medium text-gray-700">
                    {item.status}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Quick Links to Detailed Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/safety/inspections"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <Shield className="w-8 h-8 text-green-600 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">Inspections</h3>
          <p className="text-sm text-gray-600">
            View and manage detailed safety inspection records.
          </p>
        </Link>

        <Link
          href="/safety/trainings"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <Users className="w-8 h-8 text-blue-600 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">Training Records</h3>
          <p className="text-sm text-gray-600">
            Track completed and upcoming safety trainings.
          </p>
        </Link>

        <Link
          href="/safety/certifications"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <Award className="w-8 h-8 text-yellow-600 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">Certifications</h3>
          <p className="text-sm text-gray-600">
            Manage employee safety certifications and renewals.
          </p>
        </Link>

        <Link
          href="/safety/drills"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <Calendar className="w-8 h-8 text-purple-600 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">Safety Drills</h3>
          <p className="text-sm text-gray-600">
            Review emergency drills and performance.
          </p>
        </Link>
      </div>
    </DashboardLayout>
  );
}

export default function SafetyCompliancePage() {
  return (
    <ProtectedRoute
      allowedRoles={[UserRole.SUPER_ADMIN, UserRole.SAFETY_OFFICER]}
    >
      <SafetyComplianceContent />
    </ProtectedRoute>
  );
}

"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ClipboardList, Users, ArrowLeft, Search, Download, Upload } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { UserRole } from "@/types/auth";
import ImportModal from "@/components/csv/ImportModal";
import ExportModal from "@/components/csv/ExportModal";

interface PerformanceReview {
  id: string;
  employeeId: string;
  reviewPeriod: string;
  reviewDate: string;
  reviewerId: string;
  reviewerName: string;
  overallRating: string;
  technicalSkills?: number;
  communication?: number;
  teamwork?: number;
  productivity?: number;
  leadership?: number;
  strengths?: string;
  areasForImprovement?: string;
  goals?: string;
  comments?: string;
  employee: {
    employeeId: string;
    firstName: string;
    lastName: string;
    department: string | null;
    position: string | null;
  };
}

function PerformanceReviewsContent() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await api.get("/hr/performance-reviews");
        setReviews(response.data || []);
      } catch (error) {
        console.error("Failed to fetch performance reviews:", error);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const filteredReviews = reviews.filter((review) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    const employeeName = `${review.employee.firstName} ${review.employee.lastName}`.toLowerCase();
    return (
      employeeName.includes(term) ||
      review.employee.employeeId.toLowerCase().includes(term) ||
      review.reviewPeriod.toLowerCase().includes(term)
    );
  });

  const canManage =
    user &&
    [UserRole.SUPER_ADMIN, UserRole.HR_MANAGER, UserRole.DEPARTMENT_HEAD].includes(user.role);

  const fetchReviews = async () => {
    try {
      const response = await api.get("/hr/performance-reviews");
      setReviews(response.data || []);
    } catch (error) {
      console.error("Failed to fetch performance reviews:", error);
      setReviews([]);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
          <p className="text-gray-600 mt-4">Loading performance reviews...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link
          href="/hr"
          className="inline-flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to HR Dashboard</span>
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ClipboardList className="w-8 h-8 text-orange-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Performance Reviews
              </h1>
              <p className="text-gray-600">
                View employee performance reviews and ratings.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canManage && (
              <>
                <button
                  onClick={() => setExportOpen(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors inline-flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
                <button
                  onClick={() => setImportOpen(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Import
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Search by employee or period
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="e.g. EMP-001, John Doe, 2025 Q1"
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
          <div className="text-sm text-gray-500 flex items-center space-x-2">
            <Users className="w-4 h-4 text-gray-400" />
            <span>{filteredReviews.length} review(s) found</span>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      {filteredReviews.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600">
            No performance reviews found yet. Reviews will appear here once
            they are recorded in the system.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Review Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Overall Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Reviewer
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReviews.map((review) => (
                  <tr key={review.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="font-medium">
                        {review.employee.firstName} {review.employee.lastName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {review.employee.employeeId} · {review.employee.department || ""}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {review.reviewPeriod}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {new Date(review.reviewDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                        {review.overallRating.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {review.reviewerName}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <ImportModal
        open={importOpen}
        onClose={() => {
          setImportOpen(false);
          fetchReviews();
        }}
        module="hr_performance_reviews"
        title="Import Performance Reviews"
      />

      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        module="hr_performance_reviews"
        title="Export Performance Reviews"
        defaultFilters={{ search }}
      />
    </DashboardLayout>
  );
}

export default function PerformanceReviewsPage() {
  return (
    <ProtectedRoute
      allowedRoles={[
        UserRole.SUPER_ADMIN,
        UserRole.CEO,
        UserRole.HR_MANAGER,
        UserRole.DEPARTMENT_HEAD,
      ]}
    >
      <PerformanceReviewsContent />
    </ProtectedRoute>
  );
}

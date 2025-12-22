'use client';

import Link from 'next/link';
import { BarChart3, TrendingUp } from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';

function ProcurementAnalyticsContent() {
  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Procurement Analytics</h1>
        <p className="text-gray-600 mt-1">Advanced analytics and insights (starter page)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-100 p-3 rounded-lg">
              <TrendingUp className="w-7 h-7 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Explore Reports</h2>
              <p className="text-sm text-gray-600">Use the reports hub to filter and export insights.</p>
            </div>
          </div>
          <div className="mt-4">
            <Link
              href="/procurement/reports"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <BarChart3 className="w-5 h-5" />
              <span>Open Reports</span>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900">Coming next</h2>
          <div className="mt-3 space-y-2 text-sm text-gray-600">
            <div>Spend forecasting</div>
            <div>Vendor risk scoring</div>
            <div>Category-level trends</div>
            <div>Service level compliance</div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function ProcurementAnalyticsPage() {
  return (
    <ProtectedRoute>
      <ProcurementAnalyticsContent />
    </ProtectedRoute>
  );
}

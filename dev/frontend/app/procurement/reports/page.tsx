'use client';

import Link from 'next/link';
import { BarChart3, FileText, TrendingUp } from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';

function ProcurementReportsHubContent() {
  const reports = [
    {
      title: 'Spend Analysis',
      description: 'Spend by month, vendor and site',
      icon: TrendingUp,
      href: '/procurement/reports/spend',
    },
    {
      title: 'Vendor Performance',
      description: 'Ratings, spend and delivery KPIs',
      icon: BarChart3,
      href: '/procurement/reports/vendors',
    },
    {
      title: 'Cycle Time',
      description: 'Requisition-to-receipt cycle time',
      icon: BarChart3,
      href: '/procurement/reports/cycle-time',
    },
    {
      title: 'Compliance',
      description: 'PO approval & invoice matching compliance',
      icon: FileText,
      href: '/procurement/reports/compliance',
    },
    {
      title: 'Pending Actions',
      description: 'Approvals, matches and overdue payments',
      icon: FileText,
      href: '/procurement/reports/pending-actions',
    },
  ];

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Procurement Reports</h1>
        <p className="text-gray-600 mt-1">Reporting & analytics for procurement operations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((r) => (
          <Link
            key={r.href}
            href={r.href}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-all"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-indigo-100 p-3 rounded-lg">
                <r.icon className="w-8 h-8 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{r.title}</h3>
                <p className="text-sm text-gray-600">{r.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900">More reports</h2>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <Link className="text-indigo-600 hover:text-indigo-700" href="/procurement/reports/savings">Savings</Link>
          <Link className="text-indigo-600 hover:text-indigo-700" href="/procurement/reports/equipment">Equipment Procurement</Link>
          <Link className="text-indigo-600 hover:text-indigo-700" href="/procurement/reports/consumables">Consumables Usage</Link>
          <Link className="text-indigo-600 hover:text-indigo-700" href="/procurement/reports/site-spend">Site-wise Spend</Link>
          <Link className="text-indigo-600 hover:text-indigo-700" href="/procurement/reports/safety">Safety Equipment</Link>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function ProcurementReportsHubPage() {
  return (
    <ProtectedRoute>
      <ProcurementReportsHubContent />
    </ProtectedRoute>
  );
}

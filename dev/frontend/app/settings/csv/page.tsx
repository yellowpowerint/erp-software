'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CSVUpload from '@/components/csv/CSVUpload';

function CsvSettingsPageContent() {
  return (
    <DashboardLayout>
      <CSVUpload />
    </DashboardLayout>
  );
}

export default function CsvSettingsPage() {
  return (
    <ProtectedRoute>
      <CsvSettingsPageContent />
    </ProtectedRoute>
  );
}

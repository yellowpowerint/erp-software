'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ArrowLeft, Save, PieChart } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { UserRole } from '@/types/auth';

interface Budget {
  id: string;
  name: string;
  description?: string;
  category: string;
  period: string;
  startDate: string;
  endDate: string;
  allocatedAmount: number;
  spentAmount: number;
  currency: string;
}

function EditBudgetContent() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    allocatedAmount: '',
  });

  useEffect(() => {
    fetchBudget();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchBudget = async () => {
    try {
      const response = await api.get(`/finance/budgets/${params.id}`);
      const data: Budget = response.data;
      setBudget(data);
      setFormData({
        name: data.name,
        description: data.description || '',
        allocatedAmount: String(data.allocatedAmount),
      });
    } catch (error) {
      console.error('Failed to load budget:', error);
      alert('Failed to load budget');
      router.push('/finance/budgets');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await api.put(`/finance/budgets/${params.id}`, {
        name: formData.name,
        description: formData.description || undefined,
        allocatedAmount: parseFloat(formData.allocatedAmount),
      });

      alert('Budget updated successfully!');
      router.push('/finance/budgets');
    } catch (error: any) {
      console.error('Failed to update budget:', error);
      alert(error.response?.data?.message || 'Failed to update budget');
      setSaving(false);
    }
  };

  if (loading || !budget) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading budget...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link
            href="/finance/budgets"
            className="inline-flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Budgets</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Edit Budget</h1>
          <p className="text-gray-600 mt-1">Update basic budget details and allocation</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Summary (read-only context) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 bg-gray-50 rounded-lg p-4">
            <div>
              <p><span className="font-medium">Category:</span> {budget.category}</p>
              <p><span className="font-medium">Period:</span> {budget.period}</p>
            </div>
            <div>
              <p>
                <span className="font-medium">Duration:</span>{' '}
                {new Date(budget.startDate).toLocaleDateString()} -{' '}
                {new Date(budget.endDate).toLocaleDateString()}
              </p>
              <p>
                <span className="font-medium">Spent:</span> {budget.currency}{' '}
                {budget.spentAmount.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Editable fields */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <PieChart className="w-5 h-5 text-indigo-600" />
              <span>Budget Details</span>
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Allocated Amount ({budget.currency}) *
                </label>
                <input
                  type="number"
                  name="allocatedAmount"
                  value={formData.allocatedAmount}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-4 border-t">
            <Link
              href="/finance/budgets"
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center space-x-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

export default function EditBudgetPage() {
  return (
    <ProtectedRoute
      allowedRoles={[
        UserRole.SUPER_ADMIN,
        UserRole.CEO,
        UserRole.CFO,
        UserRole.ACCOUNTANT,
      ]}
    >
      <EditBudgetContent />
    </ProtectedRoute>
  );
}

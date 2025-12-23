'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

type ApprovalsBreakdown = {
  pendingInvoices: number;
  pendingPurchaseRequests: number;
  pendingExpenses: number;
  pendingRequisitions: number;
  pendingPayments: number;
};

interface ApprovalsBreakdownChartProps {
  kpis?: ApprovalsBreakdown | null;
}

export default function ApprovalsBreakdownChart({ kpis }: ApprovalsBreakdownChartProps) {
  const data = kpis
    ? [
        { category: 'Invoices', count: kpis.pendingInvoices || 0 },
        { category: 'PRs', count: kpis.pendingPurchaseRequests || 0 },
        { category: 'Expenses', count: kpis.pendingExpenses || 0 },
        { category: 'Requisitions', count: kpis.pendingRequisitions || 0 },
        { category: 'Payments', count: kpis.pendingPayments || 0 },
      ]
    : [];

  const total = data.reduce((sum, d) => sum + (d.count || 0), 0);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Approvals Breakdown</h2>
      {!kpis ? (
        <p className="text-sm text-gray-500">No approvals data available yet.</p>
      ) : total === 0 ? (
        <p className="text-sm text-gray-500">No pending approvals right now.</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ left: 8, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#4f46e5" name="Pending" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

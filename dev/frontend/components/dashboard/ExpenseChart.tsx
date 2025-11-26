'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data: Array<{ category: string; amount: number; budget: number }> = [];

export default function ExpenseChart() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Expenses (₵)</h2>
      {data.length === 0 ? (
        <p className="text-sm text-gray-500">
          No expense analytics available yet. This chart will populate as finance data is recorded in the system.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="amount" fill="#4f46e5" name="Actual" />
            <Bar dataKey="budget" fill="#10b981" name="Budget" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

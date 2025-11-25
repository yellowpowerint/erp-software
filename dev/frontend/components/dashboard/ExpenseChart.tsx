'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { category: 'Fuel', amount: 15000, budget: 18000 },
  { category: 'Equipment', amount: 12000, budget: 10000 },
  { category: 'Labor', amount: 25000, budget: 24000 },
  { category: 'Maintenance', amount: 8000, budget: 9000 },
  { category: 'Materials', amount: 18000, budget: 20000 },
  { category: 'Other', amount: 5000, budget: 6000 },
];

export default function ExpenseChart() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Expenses (₵)</h2>
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
    </div>
  );
}

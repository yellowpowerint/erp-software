'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { month: 'Jan', production: 4200, target: 4000 },
  { month: 'Feb', production: 3800, target: 4000 },
  { month: 'Mar', production: 4500, target: 4000 },
  { month: 'Apr', production: 4800, target: 4500 },
  { month: 'May', production: 5200, target: 4500 },
  { month: 'Jun', production: 5500, target: 5000 },
];

export default function ProductionChart() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Production Trend (Tons)</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="production" stroke="#4f46e5" strokeWidth={2} name="Actual" />
          <Line type="monotone" dataKey="target" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" name="Target" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

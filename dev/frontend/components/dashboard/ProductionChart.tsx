'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ProductionChartProps {
  data?: Array<{ month: string; production: number }>;
}

export default function ProductionChart({ data = [] }: ProductionChartProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Production Trend (Tons)</h2>
      {data.length === 0 ? (
        <p className="text-sm text-gray-500">
          No production data available yet. This chart will populate as production records are captured in the system.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="production"
              stroke="#4f46e5"
              strokeWidth={2}
              name="Production"
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

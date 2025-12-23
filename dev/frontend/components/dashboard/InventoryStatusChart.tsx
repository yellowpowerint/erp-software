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

type InventoryStatus = {
  totalStockItems: number;
  lowStockItems: number;
  outOfStockItems: number;
};

interface InventoryStatusChartProps {
  kpis?: InventoryStatus | null;
}

export default function InventoryStatusChart({ kpis }: InventoryStatusChartProps) {
  const data = kpis
    ? [
        { status: 'Total', count: kpis.totalStockItems || 0 },
        { status: 'Low', count: kpis.lowStockItems || 0 },
        { status: 'Out', count: kpis.outOfStockItems || 0 },
      ]
    : [];

  const total = kpis?.totalStockItems || 0;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Inventory Status</h2>
      {!kpis ? (
        <p className="text-sm text-gray-500">No inventory data available yet.</p>
      ) : total === 0 ? (
        <p className="text-sm text-gray-500">No stock items recorded yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ left: 8, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="status" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#10b981" name="Count" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

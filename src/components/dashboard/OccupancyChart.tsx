'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface OccupancyChartProps {
  data: Array<{ date: string; rate: number }>;
}

export default function OccupancyChart({ data }: OccupancyChartProps) {
  const formattedData = data.map((d) => ({
    ...d,
    label: new Date(d.date + 'T00:00:00').toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    }),
  }));

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="mb-4 text-sm font-semibold text-gray-900">Occupancy Trend (7 Days)</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={formattedData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={{ stroke: '#e5e7eb' }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={{ stroke: '#e5e7eb' }}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
              }}
              formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Occupancy']}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="rate"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
              name="Occupancy Rate"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

'use client'

import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6']

export default function ScatterClusterChart({
  title,
  xLabel,
  yLabel,
  series,
}: {
  title: string
  xLabel: string
  yLabel: string
  series: { label: string; data: { x: number; y: number; nama: string }[] }[]
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 lg:col-span-2">
      <h3 className="font-semibold text-gray-900 mb-3 text-sm">{title}</h3>
      <ResponsiveContainer width="100%" height={320}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" dataKey="x" name={xLabel} label={{ value: xLabel, position: 'insideBottom', offset: -10, fontSize: 11 }} tick={{ fontSize: 10 }} />
          <YAxis type="number" dataKey="y" name={yLabel} label={{ value: yLabel, angle: -90, position: 'insideLeft', fontSize: 11 }} tick={{ fontSize: 10 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {series.map((s, i) => (
            <Scatter key={s.label} name={s.label} data={s.data} fill={COLORS[i % COLORS.length]} />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || payload.length === 0) return null
  const p = payload[0].payload
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-2 text-xs">
      <p className="font-medium text-gray-900">{p.nama}</p>
      <p className="text-gray-500">x: {p.x} · y: {p.y}</p>
    </div>
  )
}
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
    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 overflow-hidden">
      <h3 className="font-semibold text-gray-900 mb-3 text-sm truncate" title={title}>
        {title}
      </h3>

      <div className="w-full" style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="x"
              name={xLabel}
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name={yLabel}
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              width={36}
            />
            <Tooltip content={<CustomTooltip xLabel={xLabel} yLabel={yLabel} />} />
            {series.map((s, i) => (
              <Scatter key={s.label} name={s.label} data={s.data} fill={COLORS[i % COLORS.length]} r={4} />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Legend & sumbu ditampilkan terpisah di bawah chart supaya tidak pernah tabrakan dengan isi chart */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center mt-2 pt-2 border-t border-gray-50">
        {series.map((s, i) => (
          <span key={s.label} className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
            <span className="truncate max-w-[120px]">{s.label}</span>
          </span>
        ))}
      </div>
      <p className="text-[10px] text-gray-400 text-center mt-1.5">
        Sumbu X: <span className="font-medium">{xLabel}</span> · Sumbu Y: <span className="font-medium">{yLabel}</span>
      </p>
    </div>
  )
}

function CustomTooltip({ active, payload, xLabel, yLabel }: any) {
  if (!active || !payload || payload.length === 0) return null
  const p = payload[0].payload
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-2 text-xs max-w-[200px]">
      <p className="font-medium text-gray-900 truncate">{p.nama}</p>
      <p className="text-gray-500">{xLabel}: {p.x} · {yLabel}: {p.y}</p>
    </div>
  )
}
'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { HistogramBin } from '@/lib/statUtils'

export default function HistogramChart({
  title,
  data,
  color = '#3b82f6',
}: {
  title: string
  data: HistogramBin[]
  color?: string
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h3 className="font-semibold text-gray-900 mb-3 text-sm">{title}</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="range" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={50} />
          <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
          <Tooltip formatter={(v: any) => [`${v} mahasiswa`, 'Jumlah']} />
          <Bar dataKey="count" fill={color} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
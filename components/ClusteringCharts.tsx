'use client'

import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts'

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6']

export default function ClusteringCharts({
  distribusi,
  perProdi,
  radar,
  k,
}: {
  distribusi: any[]
  perProdi: any[]
  radar: any[]
  k: number
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="font-semibold text-gray-900 mb-1">Distribusi Cluster</h3>
        <p className="text-xs text-gray-400 mb-3">Proporsi jumlah mahasiswa per cluster</p>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={distribusi}
              dataKey="jumlah"
              nameKey="cluster"
              cx="50%"
              cy="50%"
              outerRadius={90}
              label={(entry: any) => `${entry.persentase}%`}
            >
              {distribusi.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={((value: any, name: any, props: any) => [
                `${value} mahasiswa (${props.payload.persentase}%)`,
                props.payload.cluster,
              ]) as any}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="font-semibold text-gray-900 mb-1">Cluster per Program Studi</h3>
        <p className="text-xs text-gray-400 mb-3">Sebaran cluster di tiap program studi</p>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={perProdi}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="prodi" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip />
            <Legend />
            {Array.from({ length: k }, (_, i) => (
              <Bar key={i} dataKey={`Cluster ${i + 1}`} stackId="a" fill={COLORS[i % COLORS.length]} radius={i === k - 1 ? [4, 4, 0, 0] : undefined} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 lg:col-span-2">
        <h3 className="font-semibold text-gray-900 mb-1">Karakteristik Centroid per Cluster</h3>
        <p className="text-xs text-gray-400 mb-3">
          Nilai dinormalisasi 0-100 per variabel agar bisa dibandingkan pada skala yang sama (arahkan kursor untuk lihat nilai asli)
        </p>
        <ResponsiveContainer width="100%" height={360}>
          <RadarChart data={radar} outerRadius="70%">
            <PolarGrid />
            <PolarAngleAxis dataKey="variabel" tick={{ fontSize: 12 }} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
            {Array.from({ length: k }, (_, i) => (
              <Radar
                key={i}
                name={`Cluster ${i + 1}`}
                dataKey={`Cluster ${i + 1}`}
                stroke={COLORS[i % COLORS.length]}
                fill={COLORS[i % COLORS.length]}
                fillOpacity={0.25}
              />
            ))}
            <Legend />
            <Tooltip content={<RadarTooltip k={k} />} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function RadarTooltip({ active, payload, label, k }: any) {
  if (!active || !payload || payload.length === 0) return null
  const row = payload[0].payload

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3 text-xs">
      <p className="font-semibold text-gray-900 mb-1.5">{label}</p>
      {Array.from({ length: k }, (_, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
          <span>Cluster {i + 1}: <span className="font-medium">{row[`Cluster ${i + 1}__raw`]}</span></span>
        </div>
      ))}
    </div>
  )
}
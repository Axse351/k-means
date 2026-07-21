'use client'

import { useState } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts'
import { X } from 'lucide-react'

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6']

type ClusterMember = { nim: string; nama: string; prodi: string; angkatan: number }

export default function ClusteringCharts({
  distribusi,
  perProdi,
  radar,
  k,
  membersByCluster,
}: {
  distribusi: any[]
  perProdi: any[]
  radar: any[]
  k: number
  membersByCluster?: Record<string, ClusterMember[]>
}) {
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null)

  const selectedMembers = selectedCluster ? membersByCluster?.[selectedCluster] ?? [] : []
  const selectedColorIndex = selectedCluster ? distribusi.findIndex((d) => d.cluster === selectedCluster) : -1

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="font-semibold text-gray-900 mb-1">Distribusi Cluster</h3>
        <p className="text-xs text-gray-400 mb-3">
          Proporsi jumlah mahasiswa per cluster {membersByCluster && '— klik salah satu bagian untuk lihat detail mahasiswanya'}
        </p>
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
              onClick={(entry: any) => membersByCluster && setSelectedCluster(entry.cluster)}
              cursor={membersByCluster ? 'pointer' : 'default'}
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
            <Legend
              onClick={(entry: any) => membersByCluster && setSelectedCluster(entry.value)}
              wrapperStyle={membersByCluster ? { cursor: 'pointer' } : undefined}
            />
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
            {Array.from({ length: k }, (_, i) => {
              const key = Object.keys(perProdi[0] ?? {}).filter((k2) => k2 !== 'prodi')[i]
              return key ? (
                <Bar key={i} dataKey={key} stackId="a" fill={COLORS[i % COLORS.length]} radius={i === k - 1 ? [4, 4, 0, 0] : undefined} />
              ) : null
            })}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 lg:col-span-2">
        <h3 className="font-semibold text-gray-900 mb-1">Karakteristik Centroid per Cluster</h3>
        <p className="text-xs text-gray-400 mb-3">
          {radar.length > 1
            ? 'Nilai dinormalisasi 0-100 per variabel agar bisa dibandingkan pada skala yang sama (arahkan kursor untuk lihat nilai asli)'
            : 'Nilai rata-rata (centroid) tiap cluster pada skala asli'}
        </p>

        {radar.length > 1 ? (
          <ResponsiveContainer width="100%" height={360}>
            <RadarChart data={radar} outerRadius="70%">
              <PolarGrid />
              <PolarAngleAxis dataKey="variabel" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
              {Array.from({ length: k }, (_, i) => {
                const key = Object.keys(radar[0] ?? {}).filter((k2) => k2 !== 'variabel' && !k2.endsWith('__raw'))[i]
                return key ? (
                  <Radar
                    key={i}
                    name={key}
                    dataKey={key}
                    stroke={COLORS[i % COLORS.length]}
                    fill={COLORS[i % COLORS.length]}
                    fillOpacity={0.25}
                  />
                ) : null
              })}
              <Legend />
              <Tooltip content={<RadarTooltip k={k} radar={radar} />} />
            </RadarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={Array.from({ length: k }, (_, i) => {
                const keys = Object.keys(radar[0] ?? {}).filter((k2) => k2 !== 'variabel' && !k2.endsWith('__raw'))
                const key = keys[i]
                return {
                  cluster: key ?? `Cluster ${i + 1}`,
                  nilai: key ? radar[0]?.[`${key}__raw`] ?? 0 : 0,
                }
              })}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="cluster" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey="nilai" radius={[4, 4, 0, 0]}>
                {Array.from({ length: k }, (_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Panel detail anggota cluster — muncul saat pie chart diklik */}
      {selectedCluster && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setSelectedCluster(null)}>
          <div
            className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] flex flex-col shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[selectedColorIndex % COLORS.length] }}
                />
                <h3 className="font-semibold text-gray-900">{selectedCluster}</h3>
                <span className="text-xs text-gray-400">({selectedMembers.length} mahasiswa)</span>
              </div>
              <button onClick={() => setSelectedCluster(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left sticky top-0">
                  <tr>
                    <th className="p-3">NIM</th>
                    <th className="p-3">Nama</th>
                    <th className="p-3">Prodi</th>
                    <th className="p-3">Angkatan</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedMembers.map((m, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="p-3">{m.nim}</td>
                      <td className="p-3 font-medium text-gray-900">{m.nama}</td>
                      <td className="p-3">{m.prodi}</td>
                      <td className="p-3">{m.angkatan}</td>
                    </tr>
                  ))}
                  {selectedMembers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-gray-400">Tidak ada data</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function RadarTooltip({ active, payload, label, k, radar }: any) {
  if (!active || !payload || payload.length === 0) return null
  const row = payload[0].payload
  const keys = Object.keys(radar[0] ?? {}).filter((k2) => k2 !== 'variabel' && !k2.endsWith('__raw'))

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3 text-xs">
      <p className="font-semibold text-gray-900 mb-1.5">{label}</p>
      {Array.from({ length: k }, (_, i) => {
        const key = keys[i]
        if (!key) return null
        return (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
            <span>{key}: <span className="font-medium">{row[`${key}__raw`]}</span></span>
          </div>
        )
      })}
    </div>
  )
}
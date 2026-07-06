'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

const COLORS_PERFORMA = ['#3b82f6', '#f59e0b', '#ec4899']
const COLORS_PRODI = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']

export default function DashboardCharts({
  performa,
  perProdi,
}: {
  performa: Record<string, number>
  aktivitas: Record<string, number>
  perProdi: Record<string, number>
}) {
  const performaData = Object.entries(performa).map(([name, value]) => ({ name, value }))
  const prodiData = Object.entries(perProdi).map(([name, value]) => ({ name, value }))

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-800 mb-1">Distribusi Mahasiswa per Program Studi</h3>
        <p className="text-xs text-gray-400 mb-4">Jumlah mahasiswa per prodi</p>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={prodiData} dataKey="value" nameKey="name" outerRadius={90} label>
              {prodiData.map((_, i) => (
                <Cell key={i} fill={COLORS_PRODI[i % COLORS_PRODI.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-800 mb-1">Distribusi Performa Akademik</h3>
        <p className="text-xs text-gray-400 mb-4">Proporsi mahasiswa berdasarkan level performa</p>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={performaData} dataKey="value" nameKey="name" outerRadius={90} label>
              {performaData.map((_, i) => (
                <Cell key={i} fill={COLORS_PERFORMA[i % COLORS_PERFORMA.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
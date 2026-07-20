'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function EvaluasiKChart({ data, info }: { data: any[]; info: string }) {
  const best = [...data].sort((a, b) => b.silhouette - a.silhouette)[0]

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h3 className="font-semibold text-gray-900 mb-1">Evaluasi Jumlah Cluster</h3>
      <p className="text-xs text-gray-400 mb-4">{info}</p>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Elbow Method (Inertia)</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="k" label={{ value: 'Jumlah Cluster (K)', position: 'insideBottom', offset: -5, fontSize: 11 }} />
              <YAxis label={{ value: 'Inertia', angle: -90, position: 'insideLeft', fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="inertia" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Silhouette Score</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="k" label={{ value: 'Jumlah Cluster (K)', position: 'insideBottom', offset: -5, fontSize: 11 }} />
              <YAxis domain={[0, 1]} label={{ value: 'Score', angle: -90, position: 'insideLeft', fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="silhouette" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-3 bg-gray-50 rounded-lg p-3">
        💡 Silhouette Score tertinggi ada di <strong>K={best.k}</strong> ({best.silhouette.toFixed(4)}). Namun K yang dipilih sebaiknya juga mempertimbangkan titik siku (elbow) pada grafik kiri dan tujuan analisis (misal: 3 kategori performa).
      </p>
    </div>
  )
}
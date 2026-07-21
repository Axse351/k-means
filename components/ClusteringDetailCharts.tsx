'use client'
import React from 'react'
import HistogramChart from './HistogramChart'
import BoxplotChart from './BoxplotChart'
import ScatterClusterChart from './ScatterClusterChart'
import HeatmapGrid from './HeatmapGrid'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { computeHistogram, computeBoxplotStats } from '@/lib/statUtils'

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6']

type ResultRow = {
  cluster: number
  label: string
  values: Record<string, number>
  nama: string
  jenisKelamin?: string
}

export default function ClusteringDetailCharts({
  variabelList,
  rows,
  k,
  correlationMatrix,
}: {
  variabelList: string[]
  rows: ResultRow[]
  k: number
  correlationMatrix?: { labels: string[]; matrix: number[][] } | null
}) {
  const clusterLabels = Array.from({ length: k }, (_, i) => rows.find((r) => r.cluster === i)?.label ?? `Cluster ${i + 1}`)

  const histograms = variabelList.map((v) => ({
    variabel: v,
    bins: computeHistogram(rows.map((r) => r.values[v]).filter((n) => !isNaN(n))),
  }))

  const boxplots = variabelList.map((v) => ({
    variabel: v,
    groups: Array.from({ length: k }, (_, i) => {
      const values = rows.filter((r) => r.cluster === i).map((r) => r.values[v]).filter((n) => !isNaN(n))
      return {
        label: clusterLabels[i],
        color: COLORS[i % COLORS.length],
        stats: values.length > 0 ? computeBoxplotStats(values) : { min: 0, q1: 0, median: 0, q3: 0, max: 0, mean: 0 },
      }
    }),
  }))

  const scatterSeries = Array.from({ length: k }, (_, i) => {
    const members = rows
      .map((r, idx) => ({ r, idx }))
      .filter(({ r }) => r.cluster === i)

    return {
      label: clusterLabels[i],
      data: members.map(({ r, idx }) => ({
        x: variabelList.length >= 2 ? r.values[variabelList[0]] : idx,
        y: variabelList.length >= 2 ? r.values[variabelList[1]] : r.values[variabelList[0]],
        nama: r.nama,
      })),
    }
  })

  const genderMap: Record<string, Record<number, number>> = {}
  for (const r of rows) {
    const g = r.jenisKelamin === 'P' ? 'Perempuan' : r.jenisKelamin === 'L' ? 'Laki-laki' : '-'
    if (!genderMap[g]) genderMap[g] = {}
    genderMap[g][r.cluster] = (genderMap[g][r.cluster] ?? 0) + 1
  }
  const genderData = Object.entries(genderMap).map(([gender, clusters]) => ({
    gender,
    ...Object.fromEntries(clusterLabels.map((label, i) => [label, clusters[i] ?? 0])),
  }))

  const ringkasan = Array.from({ length: k }, (_, i) => {
    const members = rows.filter((r) => r.cluster === i)
    const row: any = { label: clusterLabels[i], jumlah: members.length }
    for (const v of variabelList) {
      const values = members.map((m) => m.values[v]).filter((n) => !isNaN(n))
      row[`${v}_mean`] = values.length > 0 ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2) : '-'
      row[`${v}_min`] = values.length > 0 ? Math.min(...values).toFixed(2) : '-'
      row[`${v}_max`] = values.length > 0 ? Math.max(...values).toFixed(2) : '-'
    }
    return row
  })

  const heatmapClusterValues = clusterLabels.map((_, i) =>
    variabelList.map((v) => {
      const values = rows.filter((r) => r.cluster === i).map((r) => r.values[v]).filter((n) => !isNaN(n))
      return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
    })
  )

  return (
    <div className="space-y-6 mt-6">
      {/* Histogram distribusi keseluruhan */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Distribusi Data (Sebelum Dikelompokkan)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {histograms.map((h) => (
            <HistogramChart key={h.variabel} title={`Distribusi ${h.variabel}`} data={h.bins} />
          ))}
        </div>
      </div>

      {/* Boxplot per cluster */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Sebaran Nilai per Cluster (Boxplot)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {boxplots.map((b) => (
            <BoxplotChart key={b.variabel} title={`Boxplot ${b.variabel}`} groups={b.groups} />
          ))}
        </div>
      </div>

      {/* Korelasi antar variabel */}
      {correlationMatrix && correlationMatrix.labels.length >= 2 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Korelasi Antar Variabel</h3>
          <HeatmapGrid
            title="Matriks Korelasi Pearson"
            rowLabels={correlationMatrix.labels}
            colLabels={correlationMatrix.labels}
            values={correlationMatrix.matrix}
            colorScale="diverging"
          />
        </div>
      )}

      {/* Heatmap karakteristik cluster */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Heatmap Karakteristik Cluster</h3>
        <HeatmapGrid
          title="Rata-rata Nilai Variabel per Cluster"
          rowLabels={clusterLabels}
          colLabels={variabelList}
          values={heatmapClusterValues}
          colorScale="sequential"
        />
      </div>

      {/* Pairplot */}
      {variabelList.length >= 2 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Hubungan Antar Variabel Berdasarkan Cluster (Pairplot)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {variabelList.flatMap((v1, i) =>
              variabelList.slice(i + 1).map((v2) => {
                const series = Array.from({ length: k }, (_, ci) => ({
                  label: clusterLabels[ci],
                  data: rows
                    .filter((r) => r.cluster === ci)
                    .map((r) => ({ x: r.values[v1], y: r.values[v2], nama: r.nama })),
                }))
                return (
                  <ScatterClusterChart
                    key={`${v1}-${v2}`}
                    title={`${v1} vs ${v2}`}
                    xLabel={v1}
                    yLabel={v2}
                    series={series}
                  />
                )
              })
            )}
          </div>
        </div>
      )}

      {/* Scatter utama (2 variabel pertama, atau index vs nilai jika 1 variabel) */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Visualisasi Hasil Clustering</h3>
        <ScatterClusterChart
          title={variabelList.length >= 2 ? `Persebaran Mahasiswa: ${variabelList[0]} vs ${variabelList[1]}` : `Persebaran Mahasiswa Berdasarkan ${variabelList[0]}`}
          xLabel={variabelList.length >= 2 ? variabelList[0] : 'Urutan Mahasiswa'}
          yLabel={variabelList.length >= 2 ? variabelList[1] : variabelList[0]}
          series={scatterSeries}
        />
      </div>

      {/* Breakdown jenis kelamin */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="font-semibold text-gray-900 mb-3 text-sm">Distribusi Cluster Berdasarkan Jenis Kelamin</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={genderData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="gender" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
            <Tooltip />
            <Legend />
            {clusterLabels.map((label, i) => (
              <Bar key={label} dataKey={label} fill={COLORS[i % COLORS.length]} radius={[3, 3, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Ringkasan statistik */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 text-sm">Ringkasan Statistik per Cluster</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-blue-50 text-left">
              <tr>
                <th className="p-3">Kategori</th>
                <th className="p-3">Jumlah</th>
                {variabelList.map((v) => (
                  <th key={v} className="p-3" colSpan={3}>{v}</th>
                ))}
              </tr>
              <tr className="text-xs text-gray-400">
                <th className="px-3 pb-2"></th>
                <th className="px-3 pb-2"></th>
                {variabelList.map((v) => (
                  <React.Fragment key={v}>
                    <th className="px-3 pb-2">Rata-rata</th>
                    <th className="px-3 pb-2">Min</th>
                    <th className="px-3 pb-2">Max</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {ringkasan.map((r, i) => (
                <tr key={i} className="border-t border-gray-100">
                  <td className="p-3 font-medium">{r.label}</td>
                  <td className="p-3">{r.jumlah}</td>
                  {variabelList.map((v) => (
                    <React.Fragment key={v}>
                      <td className="p-3">{r[`${v}_mean`]}</td>
                      <td className="p-3">{r[`${v}_min`]}</td>
                      <td className="p-3">{r[`${v}_max`]}</td>
                    </React.Fragment>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
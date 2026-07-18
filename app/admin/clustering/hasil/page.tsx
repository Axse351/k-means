import { getClusteringResult } from '@/lib/actions/clustering'
import ClusteringCharts from '@/components/ClusteringCharts'
import Link from 'next/link'

const PAGE_SIZE = 10
const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6']

export default async function ClusteringHasilPage({
  searchParams,
}: {
  searchParams: Promise<{ runId?: string; page?: string; q?: string; prodi?: string; cluster?: string }>
}) {
  const { runId, page, q, prodi, cluster } = await searchParams

  if (!runId) {
    return (
      <div className="p-8">
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <p className="text-gray-400 mb-4">Belum ada hasil clustering yang dipilih.</p>
          <Link href="/admin/clustering" className="text-blue-600 text-sm font-medium hover:underline">
            Jalankan Clustering Baru →
          </Link>
        </div>
      </div>
    )
  }

  const data = await getClusteringResult(runId)
  if (!data) {
    return (
      <div className="p-8">
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400">
          Data hasil clustering tidak ditemukan.
        </div>
      </div>
    )
  }

  const { run, results, centroids } = data
  const allResults = results as any[]

  // ── Distribusi cluster (untuk pie chart) ──
  const distribusi: Record<number, number> = {}
  for (const r of allResults) distribusi[r.cluster] = (distribusi[r.cluster] ?? 0) + 1
  const distribusiData = Object.entries(distribusi)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([clusterIdx, jumlah]) => ({
      cluster: `Cluster ${Number(clusterIdx) + 1}`,
      jumlah,
      persentase: Math.round((jumlah / allResults.length) * 100),
    }))

  // ── Per prodi (untuk bar chart) ──
  const perProdiMap: Record<string, Record<number, number>> = {}
  for (const r of allResults) {
    const p = r.mahasiswa?.prodi ?? '-'
    if (!perProdiMap[p]) perProdiMap[p] = {}
    perProdiMap[p][r.cluster] = (perProdiMap[p][r.cluster] ?? 0) + 1
  }
  const perProdiData = Object.entries(perProdiMap).map(([p, clusters]) => ({
    prodi: p,
    ...Object.fromEntries(Array.from({ length: run.k }, (_, i) => [`Cluster ${i + 1}`, clusters[i] ?? 0])),
  }))

  // ── Centroid: nilai asli + versi ternormalisasi 0-100 untuk radar chart ──
  const centroidByCluster: Record<number, Record<string, number>> = {}
  for (const c of centroids as any[]) {
    if (!centroidByCluster[c.cluster]) centroidByCluster[c.cluster] = {}
    centroidByCluster[c.cluster][c.variabel] = c.nilai
  }
  const variabelList = [...new Set((centroids as any[]).map((c) => c.variabel))]

  const radarData = variabelList.map((variabel) => {
    const rawValues = Array.from({ length: run.k }, (_, i) => centroidByCluster[i]?.[variabel] ?? 0)
    const min = Math.min(...rawValues)
    const max = Math.max(...rawValues)
    const range = max - min || 1

    const row: any = { variabel }
    rawValues.forEach((val, i) => {
      row[`Cluster ${i + 1}`] = Number((((val - min) / range) * 100).toFixed(1))
      row[`Cluster ${i + 1}__raw`] = Number(val.toFixed(2))
    })
    return row
  })

  // ── Filter + pagination untuk tabel ──
  let filtered = allResults
  if (q) {
    const qLower = q.toLowerCase()
    filtered = filtered.filter(
      (r) => r.mahasiswa?.nim?.toString().includes(qLower) || r.mahasiswa?.nama?.toLowerCase().includes(qLower)
    )
  }
  if (prodi) filtered = filtered.filter((r) => r.mahasiswa?.prodi === prodi)
  if (cluster) filtered = filtered.filter((r) => r.cluster === Number(cluster))

  const currentPage = Number(page) || 1
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const from = (currentPage - 1) * PAGE_SIZE
  const paginated = filtered.slice(from, from + PAGE_SIZE)

  const prodiList = [...new Set(allResults.map((r) => r.mahasiswa?.prodi).filter(Boolean))].sort()

  const buildPageLink = (p: number) => {
    const params = new URLSearchParams()
    params.set('runId', runId)
    if (q) params.set('q', q)
    if (prodi) params.set('prodi', prodi)
    if (cluster) params.set('cluster', cluster)
    params.set('page', String(p))
    return `?${params.toString()}`
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Hasil Analisis Clustering</h1>
        <p className="text-gray-500 text-sm mt-1">
          {run.tipe === 'akademik' ? 'Data Akademik' : 'Data Non-Akademik'}
          {run.filter_prodi ? ` · Prodi ${run.filter_prodi}` : ' · Semua Prodi'}
          {run.filter_angkatan ? ` · Angkatan ${run.filter_angkatan}` : ''}
          {' · '}
          {new Date(run.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Sampel" value={run.jumlah_data} />
        <StatCard label="Jumlah Cluster" value={run.k} />
        <StatCard
          label="Silhouette Score"
          value={run.silhouette_score?.toFixed(3) ?? '-'}
          hint={silhouetteHint(run.silhouette_score)}
        />
        <StatCard label="SSE" value={run.sse?.toFixed(2) ?? '-'} />
      </div>

      <ClusteringCharts distribusi={distribusiData} perProdi={perProdiData} radar={radarData} k={run.k} />

      {/* ── Tabel hasil dengan filter + pagination ── */}
      <div className="bg-white border border-gray-200 rounded-xl mt-6 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3 items-center justify-between">
          <h3 className="font-semibold text-gray-900">Detail Hasil per Mahasiswa</h3>
          <form className="flex flex-wrap gap-2" action="">
            <input type="hidden" name="runId" value={runId} />
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Cari NIM / Nama..."
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-48"
            />
            <select name="prodi" defaultValue={prodi ?? ''} className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm">
              <option value="">Semua Prodi</option>
              {prodiList.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <select name="cluster" defaultValue={cluster ?? ''} className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm">
              <option value="">Semua Cluster</option>
              {Array.from({ length: run.k }, (_, i) => (
                <option key={i} value={i}>Cluster {i + 1}</option>
              ))}
            </select>
            <button className="bg-gray-900 text-white px-4 py-1.5 rounded-lg text-sm font-medium">Filter</button>
          </form>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-blue-50 text-left">
            <tr>
              <th className="p-3">NIM</th>
              <th className="p-3">Nama</th>
              <th className="p-3">Prodi</th>
              <th className="p-3">Angkatan</th>
              <th className="p-3">Cluster</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((r, i) => (
              <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="p-3">{r.mahasiswa?.nim}</td>
                <td className="p-3 font-medium text-gray-900">{r.mahasiswa?.nama}</td>
                <td className="p-3">{r.mahasiswa?.prodi}</td>
                <td className="p-3">{r.mahasiswa?.angkatan}</td>
                <td className="p-3">
                  <span
                    className="px-2.5 py-1 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: COLORS[r.cluster % COLORS.length] }}
                  >
                    Cluster {r.cluster + 1}
                  </span>
                </td>
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-400">Tidak ada data yang cocok dengan filter</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex flex-wrap justify-between items-center gap-3 p-4 border-t border-gray-100 text-sm text-gray-500">
          <p>
            Menampilkan {filtered.length === 0 ? 0 : from + 1}-{Math.min(from + PAGE_SIZE, filtered.length)} dari {filtered.length} data
          </p>
          <div className="flex gap-1">
            <Link
              href={buildPageLink(Math.max(1, currentPage - 1))}
              className={`px-3 py-1.5 rounded-lg border border-gray-200 ${currentPage === 1 ? 'pointer-events-none opacity-40' : 'hover:bg-gray-50'}`}
            >
              ‹
            </Link>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .map((p, idx, arr) => (
                <span key={p} className="flex items-center gap-1">
                  {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-gray-300">...</span>}
                  <Link
                    href={buildPageLink(p)}
                    className={`px-3 py-1.5 rounded-lg ${
                      p === currentPage ? 'bg-blue-600 text-white font-medium' : 'border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </Link>
                </span>
              ))}
            <Link
              href={buildPageLink(Math.min(totalPages, currentPage + 1))}
              className={`px-3 py-1.5 rounded-lg border border-gray-200 ${currentPage === totalPages ? 'pointer-events-none opacity-40' : 'hover:bg-gray-50'}`}
            >
              ›
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

function silhouetteHint(score?: number | null) {
  if (score === null || score === undefined) return undefined
  if (score >= 0.7) return 'Struktur cluster kuat'
  if (score >= 0.5) return 'Struktur cluster cukup baik'
  if (score >= 0.25) return 'Struktur cluster lemah'
  return 'Cluster tumpang tindih'
}
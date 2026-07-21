import { getClusteringResult } from '@/lib/actions/clustering'
import ClusteringCharts from '@/components/ClusteringCharts'
import ClusteringDetailCharts from '@/components/ClusteringDetailCharts'
import Link from 'next/link'

const PAGE_SIZE = 10
const EXCLUDED_PAGE_SIZE = 10
const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6']

export default async function ClusteringHasilPage({
  searchParams,
}: {
  searchParams: Promise<{
    runId?: string
    page?: string
    q?: string
    prodi?: string
    cluster?: string
    excludedPage?: string
  }>
}) {
  const { runId, page, q, prodi, cluster, excludedPage } = await searchParams

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
  const excludedData = (run.excluded_data as any[]) ?? []
  const varList = (run.variabel as string[]) ?? []
  const table = run.tipe === 'akademik' ? 'data_akademik' : 'data_non_akademik'

  // ── Distribusi cluster (untuk pie chart) ──
  const distribusi: Record<number, number> = {}
  for (const r of allResults) distribusi[r.cluster] = (distribusi[r.cluster] ?? 0) + 1
  const clusterLabels = Array.from({ length: run.k }, (_, i) => {
    return allResults.find((r) => r.cluster === i)?.label ?? `Cluster ${i + 1}`
  })
  const distribusiData = Object.entries(distribusi)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([clusterIdx, jumlah]) => ({
      cluster: clusterLabels[Number(clusterIdx)],
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
    ...Object.fromEntries(clusterLabels.map((label, i) => [label, clusters[i] ?? 0])),
  }))

  // ── Centroid: nilai asli + versi ternormalisasi 0-100 untuk radar/bar chart ──
  const centroidByCluster: Record<number, Record<string, number>> = {}
  for (const c of centroids as any[]) {
    if (!centroidByCluster[c.cluster]) centroidByCluster[c.cluster] = {}
    centroidByCluster[c.cluster][c.variabel] = c.nilai
  }
  const variabelListCentroid = [...new Set((centroids as any[]).map((c) => c.variabel))]

  const radarData = variabelListCentroid.map((variabel) => {
    const rawValues = Array.from({ length: run.k }, (_, i) => centroidByCluster[i]?.[variabel] ?? 0)
    const min = Math.min(...rawValues)
    const max = Math.max(...rawValues)
    const range = max - min || 1

    const row: any = { variabel }
    rawValues.forEach((val, i) => {
      row[clusterLabels[i]] = Number((((val - min) / range) * 100).toFixed(1))
      row[`${clusterLabels[i]}__raw`] = Number(val.toFixed(2))
    })
    return row
  })

  // ── Detail rows untuk histogram, boxplot, scatter, korelasi ──
  const detailRows = allResults.map((r: any) => {
    const rel = Array.isArray(r.mahasiswa?.[table]) ? r.mahasiswa[table][0] : r.mahasiswa?.[table]
    const values: Record<string, number> = {}
    for (const v of varList) {
      values[v] = rel ? Number(rel[v]) : NaN
    }
    return {
      cluster: r.cluster,
      label: r.label ?? `Cluster ${r.cluster + 1}`,
      values,
      nama: r.mahasiswa?.nama ?? '-',
      jenisKelamin: r.mahasiswa?.jenis_kelamin,
    }
  })

  let correlationMatrix: { labels: string[]; matrix: number[][] } | null = null
  if (varList.length >= 2) {
    const dataPerVar: Record<string, number[]> = {}
    varList.forEach((v) => {
      dataPerVar[v] = detailRows.map((r) => r.values[v]).filter((n) => !isNaN(n))
    })
    const matrix = varList.map((rowLabel) =>
      varList.map((colLabel) => {
        const x = dataPerVar[rowLabel]
        const y = dataPerVar[colLabel]
        const n = Math.min(x.length, y.length)
        if (n === 0) return 0
        const meanX = x.reduce((a, b) => a + b, 0) / n
        const meanY = y.reduce((a, b) => a + b, 0) / n
        let num = 0, dx2 = 0, dy2 = 0
        for (let i = 0; i < n; i++) {
          const dx = x[i] - meanX, dy = y[i] - meanY
          num += dx * dy; dx2 += dx * dx; dy2 += dy * dy
        }
        const denom = Math.sqrt(dx2 * dy2)
        return denom === 0 ? 0 : num / denom
      })
    )
    correlationMatrix = { labels: varList, matrix }
  }

  // ── Filter + pagination untuk tabel utama ──
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
    if (excludedPage) params.set('excludedPage', excludedPage)
    params.set('page', String(p))
    return `?${params.toString()}`
  }

  // ── Pagination untuk data dikecualikan ──
  const excludedCurrentPage = Number(excludedPage) || 1
  const excludedTotalPages = Math.max(1, Math.ceil(excludedData.length / EXCLUDED_PAGE_SIZE))
  const excludedFrom = (excludedCurrentPage - 1) * EXCLUDED_PAGE_SIZE
  const excludedPaginated = excludedData.slice(excludedFrom, excludedFrom + EXCLUDED_PAGE_SIZE)

  const buildExcludedPageLink = (p: number) => {
    const params = new URLSearchParams()
    params.set('runId', runId)
    if (q) params.set('q', q)
    if (prodi) params.set('prodi', prodi)
    if (cluster) params.set('cluster', cluster)
    if (page) params.set('page', page)
    params.set('excludedPage', String(p))
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

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <StatCard label="Total Sampel" value={run.jumlah_data} />
        <StatCard label="Jumlah Cluster" value={run.k} />
        <StatCard
          label="Silhouette Score"
          value={run.silhouette_score?.toFixed(3) ?? '-'}
          hint={silhouetteHint(run.silhouette_score)}
        />
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <p className="text-xs text-gray-400">Davies-Bouldin Index</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{run.dbi_score?.toFixed(4) ?? '-'}</p>
          </div>
          <Link href={`/admin/clustering/evaluasi?runId=${runId}`} className="text-xs text-blue-600 hover:underline mt-1">
            Lihat detail evaluasi →
          </Link>
        </div>
        <StatCard label="Data Dikecualikan" value={excludedData.length} />
      </div>

      <ClusteringCharts distribusi={distribusiData} perProdi={perProdiData} radar={radarData} k={run.k} />

      <ClusteringDetailCharts
        variabelList={varList}
        rows={detailRows}
        k={run.k}
        correlationMatrix={correlationMatrix}
      />

      {excludedData.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl mt-6 overflow-hidden">
          <div className="p-5 pb-3">
            <h3 className="font-semibold text-amber-900 mb-1">
              ⚠️ Data Dikecualikan dari Proses ({excludedData.length})
            </h3>
            <p className="text-xs text-amber-700">
              Mahasiswa berikut tidak diikutkan dalam clustering karena datanya belum lengkap.
            </p>
          </div>

          <div className="overflow-x-auto px-5">
            <table className="w-full text-sm">
              <thead className="text-left text-amber-800">
                <tr>
                  <th className="py-1.5 pr-4">NIM</th>
                  <th className="py-1.5 pr-4">Nama</th>
                  <th className="py-1.5 pr-4">Prodi</th>
                  <th className="py-1.5">Sebab</th>
                </tr>
              </thead>
              <tbody>
                {excludedPaginated.map((ex: any, i: number) => (
                  <tr key={i} className="border-t border-amber-200">
                    <td className="py-1.5 pr-4">{ex.nim}</td>
                    <td className="py-1.5 pr-4">{ex.nama}</td>
                    <td className="py-1.5 pr-4">{ex.prodi}</td>
                    <td className="py-1.5 text-amber-700">{ex.sebab}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap justify-between items-center gap-3 px-5 py-4 mt-2 border-t border-amber-200 text-sm text-amber-700">
            <p>
              Menampilkan {excludedFrom + 1}-{Math.min(excludedFrom + EXCLUDED_PAGE_SIZE, excludedData.length)} dari {excludedData.length} data
            </p>
            <div className="flex gap-1">
              <Link
                href={buildExcludedPageLink(Math.max(1, excludedCurrentPage - 1))}
                className={`px-3 py-1.5 rounded-lg border border-amber-300 ${excludedCurrentPage === 1 ? 'pointer-events-none opacity-40' : 'hover:bg-amber-100'}`}
              >
                ‹
              </Link>
              {Array.from({ length: excludedTotalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === excludedTotalPages || Math.abs(p - excludedCurrentPage) <= 1)
                .map((p, idx, arr) => (
                  <span key={p} className="flex items-center gap-1">
                    {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-amber-400">...</span>}
                    <Link
                      href={buildExcludedPageLink(p)}
                      className={`px-3 py-1.5 rounded-lg ${
                        p === excludedCurrentPage ? 'bg-amber-600 text-white font-medium' : 'border border-amber-300 hover:bg-amber-100'
                      }`}
                    >
                      {p}
                    </Link>
                  </span>
                ))}
              <Link
                href={buildExcludedPageLink(Math.min(excludedTotalPages, excludedCurrentPage + 1))}
                className={`px-3 py-1.5 rounded-lg border border-amber-300 ${excludedCurrentPage === excludedTotalPages ? 'pointer-events-none opacity-40' : 'hover:bg-amber-100'}`}
              >
                ›
              </Link>
            </div>
          </div>
        </div>
      )}

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
              {clusterLabels.map((label, i) => (
                <option key={i} value={i}>{label}</option>
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
              <th className="p-3">Kategori</th>
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
                    {r.label ?? `Cluster ${r.cluster + 1}`}
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
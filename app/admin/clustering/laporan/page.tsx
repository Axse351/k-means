import { getAllClusteringRuns } from '@/lib/actions/clustering'
import ReportActions from '@/components/ReportActions'
import Link from 'next/link'

const PAGE_SIZE = 10

export default async function LaporanPage({
  searchParams,
}: {
  searchParams: Promise<{ tipe?: string; page?: string }>
}) {
  const { tipe, page } = await searchParams
  const currentPage = Number(page) || 1

  const { runs, count } = await getAllClusteringRuns({ tipe, page: currentPage })
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE))
  const from = (currentPage - 1) * PAGE_SIZE

  const buildLink = (p: number, t?: string) => {
    const params = new URLSearchParams()
    if (t) params.set('tipe', t)
    params.set('page', String(p))
    return `?${params.toString()}`
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Laporan Clustering</h1>
        <p className="text-gray-500 text-sm mt-1">Riwayat seluruh proses K-Means yang pernah dijalankan</p>
      </div>

      <div className="flex gap-2 mb-4">
        <Link
          href={buildLink(1)}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${!tipe ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
        >
          Semua
        </Link>
        <Link
          href={buildLink(1, 'akademik')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tipe === 'akademik' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
        >
          Akademik
        </Link>
        <Link
          href={buildLink(1, 'non_akademik')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tipe === 'non_akademik' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
        >
          Non-Akademik
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-blue-50 text-left">
            <tr>
              <th className="p-3">Tanggal</th>
              <th className="p-3">Jenis</th>
              <th className="p-3">Filter</th>
              <th className="p-3">K</th>
              <th className="p-3">Normalisasi</th>
              <th className="p-3">Jumlah Data</th>
              <th className="p-3">Silhouette</th>
              <th className="p-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((run: any) => (
              <tr key={run.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="p-3 whitespace-nowrap">
                  {new Date(run.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                </td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    run.tipe === 'akademik' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {run.tipe === 'akademik' ? 'Akademik' : 'Non-Akademik'}
                  </span>
                </td>
                <td className="p-3 text-gray-500">
                  {run.filter_prodi ?? 'Semua Prodi'}
                  {run.filter_angkatan ? ` · ${run.filter_angkatan}` : ''}
                </td>
                <td className="p-3">{run.k}</td>
                <td className="p-3 capitalize">{run.normalisasi}</td>
                <td className="p-3">{run.jumlah_data}</td>
                <td className="p-3 font-medium">{run.silhouette_score?.toFixed(3) ?? '-'}</td>
                <td className="p-3">
                  <ReportActions runId={run.id} />
                </td>
              </tr>
            ))}
            {runs.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-gray-400">
                  Belum ada riwayat clustering.{' '}
                  <Link href="/admin/clustering" className="text-blue-600 hover:underline">Jalankan sekarang →</Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {count > 0 && (
          <div className="flex flex-wrap justify-between items-center gap-3 p-4 border-t border-gray-100 text-sm text-gray-500">
            <p>Menampilkan {from + 1}-{Math.min(from + PAGE_SIZE, count)} dari {count} laporan</p>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={buildLink(p, tipe)}
                  className={`px-3 py-1.5 rounded-lg ${
                    p === currentPage ? 'bg-blue-600 text-white font-medium' : 'border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
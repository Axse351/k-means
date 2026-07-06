import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import FilterBar from '@/components/FilterBar'
import DeleteButton from '@/components/DeleteButton'
import { deleteMahasiswa } from '@/lib/actions/akademik'
import { Pencil } from 'lucide-react'

const PAGE_SIZE = 10

export default async function DataNonAkademikPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string
    prodi?: string
    angkatan?: string
    page?: string
    hanya_terisi?: string
  }>
}) {
  const { q, prodi, angkatan, page, hanya_terisi } = await searchParams
  const currentPage = Number(page) || 1
  const from = (currentPage - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1
  const filterTerisi = hanya_terisi === '1'

  const supabase = await createClient()

  let query = supabase
    .from('mahasiswa')
    .select(
      filterTerisi
        ? 'id, nim, nama, prodi, angkatan, data_non_akademik!inner(organisasi, publikasi, prestasi, total_skkm)'
        : 'id, nim, nama, prodi, angkatan, data_non_akademik(organisasi, publikasi, prestasi, total_skkm)',
      { count: 'exact' }
    )

  if (q) query = query.or(`nim.ilike.%${q}%,nama.ilike.%${q}%`)
  if (prodi) query = query.eq('prodi', prodi)
  if (angkatan) query = query.eq('angkatan', Number(angkatan))

  const { data: mahasiswaList, count } = await query
    .order('nim', { ascending: true })
    .range(from, to)

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  // Bangun query string filter lain (buat dipakai ulang di link toggle & pagination)
  const baseParams: Record<string, string> = {}
  if (q) baseParams.q = q
  if (prodi) baseParams.prodi = prodi
  if (angkatan) baseParams.angkatan = angkatan

  const toggleHref = filterTerisi
    ? `?${new URLSearchParams(baseParams).toString()}`
    : `?${new URLSearchParams({ ...baseParams, hanya_terisi: '1' }).toString()}`

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900">Data Non Akademik</h1>
      <p className="text-gray-500 text-sm mb-6">Kelola data non-akademik mahasiswa</p>

      <div className="flex justify-between items-center mb-3">
        <FilterBar />
        <Link
          href="/admin/data-non-akademik/tambah"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Tambah Data
        </Link>
      </div>

      <div className="mb-4 text-sm">
        {filterTerisi ? (
          <Link href={toggleHref} className="text-blue-600 hover:underline">
            ✓ Hanya yang sudah punya data — klik untuk tampilkan semua
          </Link>
        ) : (
          <Link href={toggleHref} className="text-blue-600 hover:underline">
            Tampilkan hanya yang sudah punya data non-akademik
          </Link>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-blue-50 text-left">
            <tr>
              <th className="p-3">NIM</th>
              <th className="p-3">Nama</th>
              <th className="p-3">Prodi</th>
              <th className="p-3">Organisasi</th>
              <th className="p-3">Publikasi</th>
              <th className="p-3">Prestasi</th>
              <th className="p-3">Total SKKM</th>
              <th className="p-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {mahasiswaList?.map((m: any) => (
              <tr key={m.id} className="border-t border-gray-100">
                <td className="p-3">{m.nim}</td>
                <td className="p-3">{m.nama}</td>
                <td className="p-3">{m.prodi}</td>
                <td className="p-3">{m.data_non_akademik?.organisasi ?? '-'}</td>
                <td className="p-3">{m.data_non_akademik?.publikasi ?? '-'}</td>
                <td className="p-3">{m.data_non_akademik?.prestasi ?? '-'}</td>
                <td className="p-3 font-medium">{m.data_non_akademik?.total_skkm ?? '-'}</td>
                <td className="p-3">
                  <div className="flex gap-3">
                    <Link href={`/admin/data-non-akademik/tambah?id=${m.id}`} title="Edit">
                      <Pencil size={16} className="text-blue-500" />
                    </Link>
                    <DeleteButton id={m.id} action={deleteMahasiswa} />
                  </div>
                </td>
              </tr>
            ))}
            {mahasiswaList?.length === 0 && (
              <tr>
                <td colSpan={8} className="p-6 text-center text-gray-400">
                  Tidak ada data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
        <p>
          Menampilkan {count === 0 ? 0 : from + 1}-{Math.min(to + 1, count ?? 0)} dari {count} data
        </p>
        <div className="flex gap-1 flex-wrap">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`?${new URLSearchParams({
                ...baseParams,
                ...(filterTerisi && { hanya_terisi: '1' }),
                page: String(p),
              }).toString()}`}
              className={`px-3 py-1 rounded ${
                p === currentPage ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200'
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
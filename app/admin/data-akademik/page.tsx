import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import FilterBar from '@/components/FilterBar'
import DeleteButton from '@/components/DeleteButton'
import { deleteMahasiswa } from '@/lib/actions/akademik'
import { Eye, Pencil } from 'lucide-react'

const PAGE_SIZE = 10

export default async function DataAkademikPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; prodi?: string; angkatan?: string; page?: string }>
}) {
  const { q, prodi, angkatan, page } = await searchParams
  const currentPage = Number(page) || 1
  const from = (currentPage - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = await createClient()

  let query = supabase
    .from('mahasiswa')
    .select('id, nim, nama, prodi, angkatan, data_akademik(ipk, ips8, sks_ditempuh)', {
      count: 'exact',
    })

  if (q) query = query.or(`nim.ilike.%${q}%,nama.ilike.%${q}%`)
  if (prodi) query = query.eq('prodi', prodi)
  if (angkatan) query = query.eq('angkatan', Number(angkatan))

  const { data: mahasiswaList, count } = await query
    .order('nim', { ascending: true })
    .range(from, to)

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900">Data Akademik</h1>
      <p className="text-gray-500 text-sm mb-6">Kelola data akademik mahasiswa</p>

      <div className="flex justify-between items-center mb-4">
        <FilterBar />
        <Link
          href="/admin/data-akademik/tambah"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Tambah Data
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-blue-50 text-left">
            <tr>
              <th className="p-3">NIM</th>
              <th className="p-3">Nama</th>
              <th className="p-3">Prodi</th>
              <th className="p-3">IPK</th>
              <th className="p-3">IPS8</th>
              <th className="p-3">SKS</th>
              <th className="p-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {mahasiswaList?.map((m: any) => (
              <tr key={m.id} className="border-t border-gray-100">
                <td className="p-3">{m.nim}</td>
                <td className="p-3">{m.nama}</td>
                <td className="p-3">{m.prodi}</td>
               <td className="p-3 font-medium">{m.data_akademik?.ipk ?? '-'}</td>
<td className="p-3">{m.data_akademik?.ips8 ?? '-'}</td>
<td className="p-3">{m.data_akademik?.sks_ditempuh ?? '-'}</td>
                <td className="p-3">
                  <div className="flex gap-3">
                    <Link href={`/admin/data-akademik/tambah?id=${m.id}`} title="Edit">
                      <Pencil size={16} className="text-blue-500" />
                    </Link>
                    <DeleteButton id={m.id} action={deleteMahasiswa} />
                  </div>
                </td>
              </tr>
            ))}
            {mahasiswaList?.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-gray-400">
                  Tidak ada data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
        <p>
          Menampilkan {from + 1}-{Math.min(to + 1, count ?? 0)} dari {count} data
        </p>
        <div className="flex gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`?${new URLSearchParams({ ...(q && { q }), ...(prodi && { prodi }), ...(angkatan && { angkatan }), page: String(p) })}`}
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
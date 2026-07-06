import { getMahasiswaAkademikById } from '@/lib/actions/akademik'
import AkademikForm from '@/components/AkademikForm'

export default async function TambahDataAkademikPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>
}) {
  const { id } = await searchParams
  const existing = id ? await getMahasiswaAkademikById(id) : null

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">
        {existing ? 'Edit' : 'Tambah'} Data Akademik
      </h1>
      <p className="text-gray-500 text-sm mb-6">
        {existing ? 'Ubah data mahasiswa & akademik' : 'Tambahkan data mahasiswa baru beserta data akademiknya'}
      </p>
      <AkademikForm existing={existing} />
    </div>
  )
}
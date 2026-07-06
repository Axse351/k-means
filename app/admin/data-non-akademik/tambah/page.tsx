import { getMahasiswaNonAkademikById } from '@/lib/actions/non-akademik'
import NonAkademikForm from '@/components/NonAkademikForm'

export default async function TambahDataNonAkademikPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>
}) {
  const { id } = await searchParams
  const existing = id ? await getMahasiswaNonAkademikById(id) : null

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">
        {existing ? 'Edit' : 'Tambah'} Data Non Akademik
      </h1>
      <p className="text-gray-500 text-sm mb-6">
        {existing ? 'Ubah data mahasiswa & non-akademik' : 'Tambahkan data mahasiswa baru beserta data non-akademiknya'}
      </p>
      <NonAkademikForm existing={existing} />
    </div>
  )
}
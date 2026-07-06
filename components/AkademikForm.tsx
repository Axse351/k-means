'use client'

import { upsertMahasiswaAkademik } from '@/lib/actions/akademik'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

export default function AkademikForm({ existing }: { existing: any }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const akademik = existing?.data_akademik

  function handleSubmit(formData: FormData) {
    setError('')
    const mahasiswa = {
      nim: formData.get('nim') as string,
      nama: formData.get('nama') as string,
      jenis_kelamin: formData.get('jenis_kelamin') as 'L' | 'P',
      prodi: formData.get('prodi') as 'SI' | 'TI' | 'MI' | 'DKV',
      angkatan: Number(formData.get('angkatan')),
    }
    const toNum = (v: FormDataEntryValue | null) => (v ? Number(v) : null)
    const akademikData = {
      ipk: toNum(formData.get('ipk')),
      ips1: toNum(formData.get('ips1')),
      ips2: toNum(formData.get('ips2')),
      ips3: toNum(formData.get('ips3')),
      ips4: toNum(formData.get('ips4')),
      ips5: toNum(formData.get('ips5')),
      ips6: toNum(formData.get('ips6')),
      ips7: toNum(formData.get('ips7')),
      ips8: toNum(formData.get('ips8')),
      sks_ditempuh: toNum(formData.get('sks_ditempuh')),
    }

    startTransition(async () => {
      const result = await upsertMahasiswaAkademik(mahasiswa, akademikData)
      if (!result.success) setError(result.message)
      else router.push('/admin/data-akademik')
    })
  }

  const inputClass = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm'
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1'

  return (
    <form action={handleSubmit} className="bg-white p-6 rounded-xl border border-gray-200 space-y-4">
      {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>NIM</label>
          <input name="nim" defaultValue={existing?.nim} required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Nama</label>
          <input name="nama" defaultValue={existing?.nama} required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Jenis Kelamin</label>
          <select name="jenis_kelamin" defaultValue={existing?.jenis_kelamin} required className={inputClass}>
            <option value="">Pilih</option>
            <option value="L">L</option>
            <option value="P">P</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Prodi</label>
          <select name="prodi" defaultValue={existing?.prodi} required className={inputClass}>
            <option value="">Pilih</option>
            <option value="SI">SI</option>
            <option value="TI">TI</option>
            <option value="MI">MI</option>
            <option value="DKV">DKV</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Angkatan</label>
          <input name="angkatan" type="number" defaultValue={existing?.angkatan} required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>IPK</label>
          <input name="ipk" type="number" step="0.01" defaultValue={akademik?.ipk} className={inputClass} />
        </div>
      </div>

      <hr className="my-2" />
      <p className="text-sm font-medium text-gray-700">IPS per Semester</p>
      <div className="grid grid-cols-4 gap-3">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
          <div key={n}>
            <label className="block text-xs text-gray-500 mb-1">IPS{n}</label>
            <input
              name={`ips${n}`}
              type="number"
              step="0.01"
              defaultValue={akademik?.[`ips${n}`]}
              className={inputClass}
            />
          </div>
        ))}
      </div>

      <div>
        <label className={labelClass}>SKS Ditempuh</label>
        <input name="sks_ditempuh" type="number" defaultValue={akademik?.sks_ditempuh} className={inputClass} />
      </div>

      <div className="flex gap-2 pt-2">
        <button type="submit" disabled={isPending} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
          {isPending ? 'Menyimpan...' : 'Simpan'}
        </button>
        <a href="/admin/data-akademik" className="px-4 py-2 rounded-lg text-sm border border-gray-200">
          Batal
        </a>
      </div>
    </form>
  )
}
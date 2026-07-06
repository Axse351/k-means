'use client'

import { upsertMahasiswaNonAkademik } from '@/lib/actions/non-akademik'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

export default function NonAkademikForm({ existing }: { existing: any }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const nonAkademik = existing?.data_non_akademik

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
    const toStr = (v: FormDataEntryValue | null) => (v ? String(v) : null)

    const nonAkademikData = {
      ucic_values: toNum(formData.get('ucic_values')),
      kegiatan_ucic: toStr(formData.get('kegiatan_ucic')),
      organisasi: toNum(formData.get('organisasi')),
      jenis_organisasi: toStr(formData.get('jenis_organisasi')),
      publikasi: toNum(formData.get('publikasi')),
      jenis_publikasi: toStr(formData.get('jenis_publikasi')),
      prestasi: toNum(formData.get('prestasi')),
      jenis_prestasi: toStr(formData.get('jenis_prestasi')),
      tri_dharma: toNum(formData.get('tri_dharma')),
      jenis_tri_dharma: toStr(formData.get('jenis_tri_dharma')),
      total_skkm: toNum(formData.get('total_skkm')),
    }

    startTransition(async () => {
      const result = await upsertMahasiswaNonAkademik(mahasiswa, nonAkademikData)
      if (!result.success) setError(result.message)
      else router.push('/admin/data-non-akademik')
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
          <label className={labelClass}>UCIC Values</label>
          <input name="ucic_values" type="number" defaultValue={nonAkademik?.ucic_values} className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Kegiatan UCIC</label>
        <input name="kegiatan_ucic" defaultValue={nonAkademik?.kegiatan_ucic} className={inputClass} placeholder="Pisahkan dengan titik koma (;)" />
      </div>

      <hr className="my-2" />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Organisasi (poin)</label>
          <input name="organisasi" type="number" defaultValue={nonAkademik?.organisasi} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Jenis Organisasi</label>
          <input name="jenis_organisasi" defaultValue={nonAkademik?.jenis_organisasi} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Publikasi (poin)</label>
          <input name="publikasi" type="number" defaultValue={nonAkademik?.publikasi} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Jenis Publikasi</label>
          <input name="jenis_publikasi" defaultValue={nonAkademik?.jenis_publikasi} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Prestasi (poin)</label>
          <input name="prestasi" type="number" defaultValue={nonAkademik?.prestasi} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Jenis Prestasi</label>
          <input name="jenis_prestasi" defaultValue={nonAkademik?.jenis_prestasi} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Tri Dharma (poin)</label>
          <input name="tri_dharma" type="number" defaultValue={nonAkademik?.tri_dharma} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Jenis Tri Dharma</label>
          <input name="jenis_tri_dharma" defaultValue={nonAkademik?.jenis_tri_dharma} className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Total SKKM</label>
        <input name="total_skkm" type="number" defaultValue={nonAkademik?.total_skkm} className={inputClass} />
      </div>

      <div className="flex gap-2 pt-2">
        <button type="submit" disabled={isPending} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
          {isPending ? 'Menyimpan...' : 'Simpan'}
        </button>
        <a href="/admin/data-non-akademik" className="px-4 py-2 rounded-lg text-sm border border-gray-200">
          Batal
        </a>
      </div>
    </form>
  )
}
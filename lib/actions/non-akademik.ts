'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

type MahasiswaInput = {
  nim: string
  nama: string
  jenis_kelamin: 'L' | 'P'
  prodi: 'SI' | 'TI' | 'MI' | 'DKV'
  angkatan: number
}

type NonAkademikInput = {
  ucic_values: number | null
  kegiatan_ucic: string | null
  organisasi: number | null
  jenis_organisasi: string | null
  publikasi: number | null
  jenis_publikasi: string | null
  prestasi: number | null
  jenis_prestasi: string | null
  tri_dharma: number | null
  jenis_tri_dharma: string | null
  total_skkm: number | null
}

export async function upsertMahasiswaNonAkademik(
  mahasiswa: MahasiswaInput,
  nonAkademik: NonAkademikInput
) {
  const supabase = await createClient()

  const { data: mhs, error: mhsError } = await supabase
    .from('mahasiswa')
    .upsert(mahasiswa, { onConflict: 'nim' })
    .select('id')
    .single()

  if (mhsError || !mhs) {
    return { success: false, message: mhsError?.message ?? 'Gagal menyimpan data mahasiswa' }
  }

  const { error: nonAkademikError } = await supabase
    .from('data_non_akademik')
    .upsert({ mahasiswa_id: mhs.id, ...nonAkademik }, { onConflict: 'mahasiswa_id' })

  if (nonAkademikError) {
    return { success: false, message: nonAkademikError.message }
  }

  revalidatePath('/admin/data-non-akademik')
  return { success: true, message: 'Data berhasil disimpan' }
}

export async function getMahasiswaNonAkademikById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('mahasiswa')
    .select('*, data_non_akademik(*)')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}
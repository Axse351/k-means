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

type AkademikInput = {
  ipk: number | null
  ips1: number | null
  ips2: number | null
  ips3: number | null
  ips4: number | null
  ips5: number | null
  ips6: number | null
  ips7: number | null
  ips8: number | null
  sks_ditempuh: number | null
}

// Tambah / edit satu mahasiswa + data akademiknya sekaligus
export async function upsertMahasiswaAkademik(
  mahasiswa: MahasiswaInput,
  akademik: AkademikInput
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

  const { error: akademikError } = await supabase
    .from('data_akademik')
    .upsert({ mahasiswa_id: mhs.id, ...akademik }, { onConflict: 'mahasiswa_id' })

  if (akademikError) {
    return { success: false, message: akademikError.message }
  }

  revalidatePath('/admin/data-akademik')
  return { success: true, message: 'Data berhasil disimpan' }
}

export async function deleteMahasiswa(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('mahasiswa').delete().eq('id', id)

  if (error) return { success: false, message: error.message }

  revalidatePath('/admin/data-akademik')
  return { success: true, message: 'Data berhasil dihapus' }
}

// Ambil 1 data mahasiswa + akademik untuk form edit
export async function getMahasiswaAkademikById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('mahasiswa')
    .select('*, data_akademik(*)')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}
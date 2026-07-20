'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

type CsvRow = Record<string, string>

export async function importAkademikBulk(rows: CsvRow[]) {
  const supabase = await createClient()
  let success = 0
  const errors: string[] = []

  const toNum = (v: string) => (v && v.trim() !== '' ? Number(v) : null)

  for (const row of rows) {
    const nim = row['NIM']?.trim()
    if (!nim) continue

    const { data: mhs, error: mhsError } = await supabase
      .from('mahasiswa')
      .upsert(
        {
          nim,
          nama: row['Nama']?.trim(),
          jenis_kelamin: row['Jenis Kelamin']?.trim(),
          prodi: row['Prodi']?.trim(),
          angkatan: toNum(row['Angkatan']),
        },
        { onConflict: 'nim' }
      )
      .select('id')
      .single()

    if (mhsError || !mhs) {
      errors.push(`NIM ${nim}: ${mhsError?.message}`)
      continue
    }

   const { error: akademikError } = await supabase.from('data_akademik').upsert(
  {
    mahasiswa_id: mhs.id,
    ipk: toNum(row['IPK']),
    ips1: toNum(row['IPS1']),
    ips2: toNum(row['IPS2']),
    ips3: toNum(row['IPS3']),
    ips4: toNum(row['IPS4']),
    ips5: toNum(row['IPS5']),
    ips6: toNum(row['IPS6']),
    ips7: toNum(row['IPS7']),
    ips8: toNum(row['IPS8']),
    sks_ditempuh: toNum(row['SKS ditempuh']),
    ips_terakhir: toNum(row['IPS Terakhir']),
    rata_rata_kehadiran: toNum(row['Rata-rata Kehadiran']),
  },
  { onConflict: 'mahasiswa_id' }
)

    if (akademikError) errors.push(`NIM ${nim}: ${akademikError.message}`)
    else success++
  }

  revalidatePath('/admin/data-akademik')
  return { success, total: rows.length, errors }
}

export async function importNonAkademikBulk(rows: CsvRow[]) {
  const supabase = await createClient()
  let success = 0
  const errors: string[] = []
  const toNum = (v: string) => (v && v.trim() !== '' ? Number(v) : null)
  const toStr = (v: string) => (v && v.trim() !== '' && v.trim() !== '-' ? v.trim() : null)

  for (const row of rows) {
    const nim = row['NIM']?.trim()
    if (!nim) continue

    const { data: mhs, error: mhsError } = await supabase
      .from('mahasiswa')
      .upsert(
        {
          nim,
          nama: row['Nama']?.trim(),
          jenis_kelamin: row['Jenis Kelamin']?.trim(),
          prodi: row['Prodi']?.trim(),
          angkatan: toNum(row['Angkatan']),
        },
        { onConflict: 'nim' }
      )
      .select('id')
      .single()

    if (mhsError || !mhs) {
      errors.push(`NIM ${nim}: ${mhsError?.message}`)
      continue
    }

    const { error: nonAkademikError } = await supabase.from('data_non_akademik').upsert(
      {
        mahasiswa_id: mhs.id,
        ucic_values: toNum(row['UCIC Values']),
        kegiatan_ucic: toStr(row['Kegiatan UCIC']),
        organisasi: toNum(row['Organisasi']),
        jenis_organisasi: toStr(row['Jenis Organisasi']),
        publikasi: toNum(row['Publikasi']),
        jenis_publikasi: toStr(row['Jenis Publikasi']),
        prestasi: toNum(row['Prestasi']),
        jenis_prestasi: toStr(row['Jenis Prestasi']),
        tri_dharma: toNum(row['Tri Dharma']),
        jenis_tri_dharma: toStr(row['Jenis Tri Dharma']),
        total_skkm: toNum(row['Total SKKM']),
      },
      { onConflict: 'mahasiswa_id' }
    )

    if (nonAkademikError) errors.push(`NIM ${nim}: ${nonAkademikError.message}`)
    else success++
  }

  revalidatePath('/admin/data-non-akademik')
  return { success, total: rows.length, errors }
}
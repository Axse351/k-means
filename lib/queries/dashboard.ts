type Threshold = { kategori: string; batas_tinggi: number; batas_sedang: number }

export async function getDashboardStats(supabase: any) {
  const { count: totalMahasiswa } = await supabase
    .from('mahasiswa')
    .select('*', { count: 'exact', head: true })

  const { data: mahasiswaList } = await supabase.from('mahasiswa').select('prodi')

  const perProdi: Record<string, number> = { SI: 0, TI: 0, MI: 0, DKV: 0 }
  mahasiswaList?.forEach((m: any) => {
    if (perProdi[m.prodi] !== undefined) perProdi[m.prodi]++
  })

  const { data: akademikList } = await supabase.from('data_akademik').select('ipk')
  const totalAkademik = akademikList?.length ?? 0
  const rataIPK =
    totalAkademik > 0
      ? akademikList.reduce((sum: number, a: any) => sum + Number(a.ipk), 0) / totalAkademik
      : 0

  const { data: nonAkademikList } = await supabase.from('data_non_akademik').select('total_skkm')
  const totalNonAkademik = nonAkademikList?.length ?? 0

  const { data: thresholds } = await supabase
    .from('pengaturan_threshold')
    .select('kategori, batas_tinggi, batas_sedang')

  const thAkademik = thresholds?.find((t: Threshold) => t.kategori === 'akademik')
  const thNonAkademik = thresholds?.find((t: Threshold) => t.kategori === 'non_akademik')

  const performa = { Tinggi: 0, Sedang: 0, Rendah: 0 }
  akademikList?.forEach((a: any) => {
    const ipk = Number(a.ipk)
    if (thAkademik && ipk >= thAkademik.batas_tinggi) performa.Tinggi++
    else if (thAkademik && ipk >= thAkademik.batas_sedang) performa.Sedang++
    else performa.Rendah++
  })

  const aktivitas = { 'Sangat Aktif': 0, 'Cukup Aktif': 0, 'Kurang Aktif': 0 }
  nonAkademikList?.forEach((n: any) => {
    const skkm = Number(n.total_skkm)
    if (thNonAkademik && skkm >= thNonAkademik.batas_tinggi) aktivitas['Sangat Aktif']++
    else if (thNonAkademik && skkm >= thNonAkademik.batas_sedang) aktivitas['Cukup Aktif']++
    else aktivitas['Kurang Aktif']++
  })

  return { totalMahasiswa: totalMahasiswa ?? 0, totalAkademik, totalNonAkademik, rataIPK, perProdi, performa, aktivitas }
}
import { createClient } from '@/utils/supabase/server'
import { getDashboardStats } from '@/lib/queries/dashboard'
import StatCard from '@/components/StatCard'
import DashboardCharts from '@/components/DashboardCharts'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const stats = await getDashboardStats(supabase)

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard Analisis Performa Mahasiswa</h1>
      <p className="text-gray-500 text-sm mb-6">
        Sistem Analisis Performa Akademik dan Non-Akademik Mahasiswa FTI UCIC
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <StatCard label="Total Mahasiswa" value={stats.totalMahasiswa} />
        <StatCard label="Data Akademik" value={stats.totalAkademik} />
        <StatCard label="Data Non-Akademik" value={stats.totalNonAkademik} />
        <StatCard label="Rata-rata IPK" value={stats.rataIPK.toFixed(2)} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {Object.entries(stats.perProdi).map(([prodi, jumlah]) => (
          <StatCard
            key={prodi}
            label={prodi}
            value={jumlah}
            sub={`${stats.totalMahasiswa > 0 ? Math.round((jumlah / stats.totalMahasiswa) * 100) : 0}% dari total`}
          />
        ))}
      </div>

      <DashboardCharts performa={stats.performa} aktivitas={stats.aktivitas} perProdi={stats.perProdi} />
    </div>
  )
}
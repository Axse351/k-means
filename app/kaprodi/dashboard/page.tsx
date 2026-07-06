import { requireRole } from '@/lib/auth-guard'
import { logout } from '@/app/login/actions'

export default async function KaprodiDashboard() {
  const { profile } = await requireRole(['kaprodi'])

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard Kaprodi</h1>
        <form action={logout}>
          <button className="text-sm text-red-600">Logout</button>
        </form>
      </div>
      <p>Halo, {profile.nama} — Kaprodi {profile.prodi}</p>
      <p className="text-gray-500 text-sm mt-2">
        Di sini nanti: daftar mahasiswa prodi {profile.prodi} + catatan.
      </p>
    </div>
  )
}
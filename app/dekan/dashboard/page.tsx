import { requireRole } from '@/lib/auth-guard'
import { logout } from '@/app/login/actions'

export default async function DekanDashboard() {
  const { profile } = await requireRole(['dekan'])

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard Dekan</h1>
        <form action={logout}>
          <button className="text-sm text-red-600">Logout</button>
        </form>
      </div>
      <p>Halo, {profile.nama} (role: {profile.role})</p>
      <p className="text-gray-500 text-sm mt-2">
        Di sini nanti: rekap semua prodi (SI, TI, MI, DKV).
      </p>
    </div>
  )
}
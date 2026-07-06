import { requireRole } from '@/lib/auth-guard'
import Sidebar from '@/components/Sidebar'
import { kaprodiMenu } from '@/lib/menu-config'

export default async function KaprodiLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireRole(['kaprodi'])

  return (
    <div className="flex">
      <Sidebar menu={kaprodiMenu} nama={profile.nama} role={profile.role} prodi={profile.prodi} />
      <main className="flex-1 bg-gray-50 min-h-screen">{children}</main>
    </div>
  )
}
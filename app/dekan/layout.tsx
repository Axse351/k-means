import { requireRole } from '@/lib/auth-guard'
import Sidebar from '@/components/Sidebar'
import { dekanMenu } from '@/lib/menu-config'

export default async function DekanLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireRole(['dekan'])

  return (
    <div className="flex">
      <Sidebar menu={dekanMenu} nama={profile.nama} role={profile.role} />
      <main className="flex-1 bg-gray-50 min-h-screen">{children}</main>
    </div>
  )
}
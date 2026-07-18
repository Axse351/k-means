import { requireRole } from '@/lib/auth-guard'
import Sidebar from '@/components/Sidebar'
import { adminMenu } from '@/lib/menu-config'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireRole(['admin'])

  return (
    <div className="flex">
      <Sidebar menu={adminMenu} nama={profile.nama} role={profile.role} />
      <main className="flex-1 md:ml-64 bg-gray-50 min-h-screen pt-16 md:pt-0">
        {children}
      </main>
    </div>
  )
}
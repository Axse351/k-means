'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/login/actions'
import type { MenuSection } from '@/lib/menu-config'

export default function Sidebar({
  menu,
  nama,
  role,
  prodi,
}: {
  menu: MenuSection[]
  nama: string
  role: string
  prodi?: string | null
}) {
  const pathname = usePathname()

  return (
    <aside className="w-64 shrink-0 min-h-screen bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-100">
        <h1 className="text-lg font-bold text-gray-900">UCIC</h1>
        <p className="text-xs text-gray-400">Student Analysis</p>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        {menu.map((section, i) => (
          <div key={i} className="mb-4">
            {section.section && (
              <p className="px-6 text-xs font-semibold text-gray-400 uppercase mb-2">
                {section.section}
              </p>
            )}
            {section.items.map((item) => {
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-6 py-2 text-sm ${
                    active
                      ? 'bg-blue-50 text-blue-600 font-medium border-r-2 border-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <p className="text-sm font-medium text-gray-800 truncate">{nama}</p>
        <p className="text-xs text-gray-400 capitalize">
          {role}
          {prodi ? ` · ${prodi}` : ''}
        </p>
        <form action={logout} className="mt-2">
          <button className="text-xs text-red-500 hover:underline">Logout</button>
        </form>
      </div>
    </aside>
  )
}
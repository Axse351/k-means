'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown, Menu, X } from 'lucide-react'
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
  const [openSections, setOpenSections] = useState<Record<number, boolean>>({})
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const initial: Record<number, boolean> = {}
    menu.forEach((section, i) => {
      const hasActive = section.items.some((item) => pathname === item.href)
      if (hasActive || !section.section) initial[i] = true
    })
    setOpenSections(initial)
    setMobileOpen(false) // tutup sidebar mobile tiap ganti halaman
  }, [pathname, menu])

  const toggleSection = (i: number) => {
    setOpenSections((prev) => ({ ...prev, [i]: !prev[i] }))
  }

  return (
    <>
      {/* Tombol hamburger - hanya muncul di layar kecil */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 flex items-center justify-center w-10 h-10 rounded-lg bg-white border border-gray-200 shadow-sm text-gray-600"
        aria-label="Buka menu"
      >
        <Menu size={20} />
      </button>

      {/* Overlay gelap saat sidebar mobile terbuka */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="md:hidden fixed inset-0 bg-black/40 z-40"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 shrink-0 h-screen bg-white border-r border-gray-200 flex flex-col
          transition-transform duration-200 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        <div className="p-6 border-b border-gray-100 shrink-0 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">UCIC</h1>
            <p className="text-xs text-gray-400">Student Analysis</p>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-gray-400 hover:text-gray-600"
            aria-label="Tutup menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          {menu.map((section, i) => {
            const isOpen = openSections[i]

            return (
              <div key={i} className="mb-1 px-3">
                {section.section ? (
                  <>
                    <button
                      type="button"
                      onClick={() => toggleSection(i)}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide hover:text-gray-600 transition-colors"
                    >
                      <span>{section.section}</span>
                      <ChevronDown
                        size={14}
                        className={`transition-transform duration-200 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    <div
                      className={`grid transition-all duration-200 ease-in-out ${
                        isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="flex flex-col gap-0.5 pb-2">
                          {section.items.map((item) => {
                            const active = pathname === item.href
                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                className={`relative flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                                  active
                                    ? 'bg-blue-50 text-blue-600 font-medium'
                                    : 'text-gray-600 hover:bg-gray-50'
                                }`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                                    active ? 'bg-blue-600' : 'bg-gray-300'
                                  }`}
                                />
                                {item.label}
                              </Link>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col gap-0.5 mb-2">
                    {section.items.map((item) => {
                      const active = pathname === item.href
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                            active
                              ? 'bg-blue-50 text-blue-600 font-medium'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {item.label}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-100 shrink-0">
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
    </>
  )
}
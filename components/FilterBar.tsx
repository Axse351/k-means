'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useState } from 'react'

export default function FilterBar() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [q, setQ] = useState(searchParams.get('q') ?? '')

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    params.delete('page') // reset ke halaman 1 tiap ganti filter
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex gap-2">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && updateParam('q', q)}
        placeholder="Cari NIM atau Nama..."
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-64"
      />
      <select
        defaultValue={searchParams.get('prodi') ?? ''}
        onChange={(e) => updateParam('prodi', e.target.value)}
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
      >
        <option value="">Semua Prodi</option>
        <option value="SI">SI</option>
        <option value="TI">TI</option>
        <option value="MI">MI</option>
        <option value="DKV">DKV</option>
      </select>
      <select
        defaultValue={searchParams.get('angkatan') ?? ''}
        onChange={(e) => updateParam('angkatan', e.target.value)}
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
      >
        <option value="">Semua Angkatan</option>
        {[2020, 2021, 2022, 2023, 2024].map((a) => (
          <option key={a} value={a}>{a}</option>
        ))}
      </select>
    </div>
  )
}
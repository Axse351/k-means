'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function ResetPassword() {

  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleReset() {

    if (!password || password.length < 6) {
      alert("Password minimal 6 karakter")
      return
    }

    setLoading(true)

    const supabase = createClient()

    const { error } = await supabase.auth.updateUser({
      password
    })

    if (error) {
      alert(error.message)
      setLoading(false)
      return
    }

    // Bersihkan session recovery supaya tidak "nyangkut"
    await supabase.auth.signOut()

    alert("Password berhasil diubah, silakan login kembali")

    router.push("/login")
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center">

      <div className="w-96 bg-white shadow rounded p-6">

        <h1 className="text-2xl font-bold mb-5">
          Password Baru
        </h1>

        <input
          type="password"
          className="border p-2 w-full rounded mb-4"
          placeholder="Password Baru"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />

        <button
          onClick={handleReset}
          disabled={loading}
          className="bg-blue-600 text-white w-full p-2 rounded disabled:opacity-50"
        >
          {loading ? "Menyimpan..." : "Simpan Password"}
        </button>

      </div>

    </div>
  )
}
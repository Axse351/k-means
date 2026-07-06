'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createClient()

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    redirect(`/login?error=${encodeURIComponent('Email atau password salah')}`)
  }

  // Ambil role user yang baru login
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', authData.user.id)
    .single()

  if (!profile) {
    redirect('/login?error=Profil%20tidak%20ditemukan')
  }

  // Redirect sesuai role
  if (profile.role === 'admin') redirect('/admin/dashboard')
  if (profile.role === 'kaprodi') redirect('/kaprodi/dashboard')
  if (profile.role === 'dekan') redirect('/dekan/dashboard')

  redirect('/login')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
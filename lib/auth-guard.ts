import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

type Role = 'admin' | 'kaprodi' | 'dekan'

export async function requireRole(allowedRoles: Role[]) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, prodi, nama')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  if (!allowedRoles.includes(profile.role)) {
    // Kalau role gak sesuai, lempar balik ke dashboard yang benar
    redirect(`/${profile.role}/dashboard`)
  }

  return { user, profile }
}
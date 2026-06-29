import type { SupabaseClient } from '@supabase/supabase-js'

export function getAdminEmail(): string | null {
  return process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_MY_EMAIL || null
}

export async function getAdminSession(supabase: SupabaseClient) {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const adminEmail = getAdminEmail()

  if (!session || !adminEmail || session.user.email !== adminEmail) {
    return null
  }

  return session
}

export async function requireAdminSession(supabase: SupabaseClient) {
  const session = await getAdminSession(supabase)

  if (!session) {
    throw new Error('관리자 권한이 필요합니다.')
  }

  return session
}

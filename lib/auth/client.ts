import type { Session } from '@supabase/supabase-js'

export function isAdminSession(session: Session | null): boolean {
  const adminEmail = process.env.NEXT_PUBLIC_MY_EMAIL
  return Boolean(session && adminEmail && session.user.email === adminEmail)
}

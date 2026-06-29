import type { SupabaseClient, User } from '@supabase/supabase-js'

// 관리자 이메일 단일 소스. ADMIN_EMAIL(서버 전용)을 우선 쓰고,
// 없으면 클라이언트와 공유되는 NEXT_PUBLIC_MY_EMAIL로 폴백한다.
export function getAdminEmail(): string | null {
  return process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_MY_EMAIL || null
}

// 서버 인가 판정은 getUser()로 한다.
// getSession()은 쿠키 값을 그대로 신뢰하지만, getUser()는 Supabase Auth 서버에
// 토큰을 재검증하므로 위조된 세션 쿠키로 관리자 행세를 할 수 없다.
export async function getAdminUser(supabase: SupabaseClient): Promise<User | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const adminEmail = getAdminEmail()

  if (!user || !adminEmail || user.email !== adminEmail) {
    return null
  }

  return user
}

export async function requireAdminUser(supabase: SupabaseClient): Promise<User> {
  const user = await getAdminUser(supabase)

  if (!user) {
    throw new Error('관리자 권한이 필요합니다.')
  }

  return user
}

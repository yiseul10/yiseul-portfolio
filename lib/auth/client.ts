import type { Session } from '@supabase/supabase-js'

// 클라이언트 측 관리자 판별은 UI 표시용(편집 버튼 노출 등)일 뿐이다.
// 권위 있는 인가 판정은 서버의 getAdminUser(getUser 재검증 기반)가 담당한다.
// 서버/클라이언트 모두 NEXT_PUBLIC_MY_EMAIL 하나를 기준으로 맞춘다.
export function isAdminSession(session: Session | null): boolean {
  const adminEmail = process.env.NEXT_PUBLIC_MY_EMAIL
  return Boolean(session && adminEmail && session.user.email === adminEmail)
}

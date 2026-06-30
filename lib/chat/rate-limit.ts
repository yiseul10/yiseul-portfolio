import { createAdminSupabase } from '@lib/supabase-admin'

const DAILY_LIMIT = 20

function getTodayStart(): string {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return now.toISOString()
}

export type RateLimitResult = {
  allowed: boolean
  remaining: number
  // limit: 실제 한도 소진 / error: 카운트 조회 실패로 차단
  reason?: 'limit' | 'error'
}

export async function checkRateLimit(ip: string): Promise<RateLimitResult> {
  const supabase = createAdminSupabase()
  const todayStart = getTodayStart()

  const { count, error } = await supabase
    .from('chat_logs')
    .select('*', { count: 'exact', head: true })
    .eq('ip', ip)
    .gte('created_at', todayStart)

  if (error) {
    // DB 에러 시 차단한다(fail-closed). 공개 배포에서는 제한이 깨진 상태로 AI 호출을
    // 열어두지 않는다. 다만 호출 측이 '한도 소진'과 구분해 안내할 수 있도록 사유를 넘긴다.
    console.error('Rate limit check failed:', error)
    return { allowed: false, remaining: 0, reason: 'error' }
  }

  const used = count ?? 0
  const remaining = Math.max(0, DAILY_LIMIT - used)

  return {
    allowed: used < DAILY_LIMIT,
    remaining,
    reason: used < DAILY_LIMIT ? undefined : 'limit',
  }
}

export async function getRemainingCount(ip: string): Promise<number> {
  const supabase = createAdminSupabase()
  const todayStart = getTodayStart()

  const { count, error } = await supabase
    .from('chat_logs')
    .select('*', { count: 'exact', head: true })
    .eq('ip', ip)
    .gte('created_at', todayStart)

  if (error) {
    // 화면에 표시할 남은 횟수 힌트일 뿐이고, 실제 차단은 checkRateLimit(fail-closed)가 한다.
    // 조회 실패를 '0회 남음'으로 보여주면 한도 소진으로 오인되므로 낙관적으로 한도를 표시한다.
    return DAILY_LIMIT
  }

  return Math.max(0, DAILY_LIMIT - (count ?? 0))
}

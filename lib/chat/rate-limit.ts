import { supabase } from '@lib/superbase'

const DAILY_LIMIT = 20

function getTodayStart(): string {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return now.toISOString()
}

export async function checkRateLimit(ip: string): Promise<{
  allowed: boolean
  remaining: number
}> {
  const todayStart = getTodayStart()

  const { count, error } = await supabase
    .from('chat_logs')
    .select('*', { count: 'exact', head: true })
    .eq('ip', ip)
    .gte('created_at', todayStart)

  if (error) {
    // DB 에러 시 차단한다. 공개 배포에서는 로그/제한이 깨진 상태로 AI 호출을 열어두지 않는다.
    console.error('Rate limit check failed:', error)
    return { allowed: false, remaining: 0 }
  }

  const used = count ?? 0
  const remaining = Math.max(0, DAILY_LIMIT - used)

  return {
    allowed: used < DAILY_LIMIT,
    remaining,
  }
}

export async function getRemainingCount(ip: string): Promise<number> {
  const todayStart = getTodayStart()

  const { count, error } = await supabase
    .from('chat_logs')
    .select('*', { count: 'exact', head: true })
    .eq('ip', ip)
    .gte('created_at', todayStart)

  if (error) {
    return 0
  }

  return Math.max(0, DAILY_LIMIT - (count ?? 0))
}

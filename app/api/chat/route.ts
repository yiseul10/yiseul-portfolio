import { streamText, UIMessage, convertToModelMessages } from 'ai'
import { headers } from 'next/headers'
import { checkRateLimit, getRemainingCount } from '@lib/chat/rate-limit'
import { buildContext } from '@lib/chat/build-context'
import { retrieveBlogChunks } from '@lib/chat/retrieve'
import { getModel, DEFAULT_PROVIDER } from '@lib/chat/model-config'
import { MAX_INPUT_LENGTH } from '@lib/chat/constants'
import { createAdminSupabase } from '@lib/supabase-admin'

export const runtime = 'nodejs'

async function getClientInfo(): Promise<{ ip: string; userAgent: string }> {
  const headersList = await headers()
  const ip =
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headersList.get('x-real-ip') ||
    'unknown'
  const userAgent = headersList.get('user-agent') || 'unknown'
  return { ip, userAgent }
}

export async function POST(req: Request) {
  const adminSupabase = createAdminSupabase()

  // API 키 사전 검증
  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      { error: 'AI 서비스 설정에 문제가 있어요. 관리자에게 알려주세요.' },
      { status: 500 }
    )
  }

  const { ip, userAgent } = await getClientInfo()

  // Rate limit 체크
  const { allowed, reason } = await checkRateLimit(ip)
  if (!allowed) {
    if (reason === 'error') {
      // 한도 소진이 아니라 카운트 조회 실패(fail-closed). 일시적 문제임을 안내한다.
      return Response.json(
        { error: '지금은 일시적인 문제로 답변을 못 드리고 있어요. 잠시 후 다시 시도해 주세요.' },
        { status: 503 }
      )
    }
    return Response.json(
      { error: '오늘 사용 횟수를 모두 사용했어요. 내일 다시 물어봐주세요!' },
      {
        status: 429,
        headers: { 'X-RateLimit-Remaining': '0' },
      }
    )
  }

  const { messages }: { messages: UIMessage[] } = await req.json()

  // 마지막 유저 메시지 추출
  const lastUserMessage = messages
    .filter(m => m.role === 'user')
    .pop()
    ?.parts
    ?.filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map(p => p.text)
    .join('') ?? ''

  // 입력 길이 가드 (클라이언트 maxLength와 함께 이중 방어, 토큰/비용 폭주 방지)
  if (lastUserMessage.length > MAX_INPUT_LENGTH) {
    return Response.json(
      { error: `메시지가 너무 길어요. ${MAX_INPUT_LENGTH}자 이내로 입력해주세요.` },
      { status: 400 }
    )
  }

  // 고정 컨텍스트(프로필·이력서·wiki, 캐시) + 질문 기반 블로그 검색 결과 결합
  const [fixedContext, blogChunks] = await Promise.all([
    buildContext(),
    retrieveBlogChunks(lastUserMessage),
  ])
  const blogSection = blogChunks.length
    ? `\n\n관련 블로그 내용:\n${blogChunks.join('\n\n')}`
    : ''
  const systemPrompt = `${fixedContext}${blogSection}`

  // UIMessage → ModelMessage 변환
  const modelMessages = await convertToModelMessages(messages)

  // 스트리밍 호출
  const result = streamText({
    model: getModel(DEFAULT_PROVIDER),
    system: systemPrompt,
    messages: modelMessages,
    maxOutputTokens: 500,
    async onFinish({ text }) {
      // 대화 로그 저장 (비동기, 실패해도 응답에 영향 없음)
      try {
        await adminSupabase.from('chat_logs').insert({
          ip,
          user_agent: userAgent,
          user_message: lastUserMessage,
          assistant_message: text,
        })
      } catch (e) {
        console.error('Failed to save chat log:', e)
      }
    },
  })

  return result.toUIMessageStreamResponse()
}

// 남은 횟수 조회용 GET 엔드포인트
export async function GET() {
  const { ip } = await getClientInfo()
  const remaining = await getRemainingCount(ip)

  return Response.json({ remaining })
}

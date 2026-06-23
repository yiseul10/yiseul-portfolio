import { streamText, UIMessage, convertToModelMessages } from 'ai'
import { headers } from 'next/headers'
import { checkRateLimit, getRemainingCount } from '@lib/chat/rate-limit'
import { buildContext } from '@lib/chat/build-context'
import { getModel, DEFAULT_PROVIDER } from '@lib/chat/model-config'
import { MAX_INPUT_LENGTH } from '@lib/chat/constants'
import { supabase } from '@lib/superbase'

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
  // API 키 사전 검증
  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      { error: 'AI 서비스 설정에 문제가 있어요. 관리자에게 알려주세요.' },
      { status: 500 }
    )
  }

  const { ip, userAgent } = await getClientInfo()

  // Rate limit 체크
  const { allowed, remaining } = await checkRateLimit(ip)
  if (!allowed) {
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

  // 시스템 프롬프트 조립
  const systemPrompt = await buildContext()

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
        await supabase.from('chat_logs').insert({
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

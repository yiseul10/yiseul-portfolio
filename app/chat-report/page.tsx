import Link from 'next/link'
import { createServerSupabase } from '@lib/supabase-server'
import { buildWeeklyChatReport, type ChatLogForReport } from '@lib/chat/weekly-report'

export const dynamic = 'force-dynamic'

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function getWeekStart(value?: string): Date {
  const base = value ? new Date(`${value}T00:00:00.000Z`) : new Date()
  const day = base.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  const weekStart = new Date(base)
  weekStart.setUTCDate(base.getUTCDate() + diff)
  weekStart.setUTCHours(0, 0, 0, 0)
  return weekStart
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setUTCDate(date.getUTCDate() + days)
  return next
}

function ReportList({ items, emptyText }: { items: string[]; emptyText: string }) {
  if (!items.length) {
    return <p className="text-sm text-neutral-500">{emptyText}</p>
  }

  return (
    <ul className="space-y-2 text-sm text-neutral-700 dark:text-neutral-200">
      {items.map((item) => (
        <li key={item} className="leading-6">- {item}</li>
      ))}
    </ul>
  )
}

export default async function ChatReportPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>
}) {
  const params = await searchParams
  const supabase = await createServerSupabase()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return (
      <section className="mx-auto flex min-h-[420px] w-full max-w-2xl flex-col justify-center gap-4">
        <h1 className="font-serif text-4xl font-semibold text-neutral-800 dark:text-neutral-100">Chat Report</h1>
        <p className="text-sm leading-6 text-neutral-600 dark:text-neutral-300">
          챗봇 로그 리포트는 관리자 로그인 후 확인할 수 있습니다.
        </p>
        <Link href="/login" className="text-sm font-medium underline underline-offset-4">
          로그인하기
        </Link>
      </section>
    )
  }

  const weekStart = getWeekStart(params.week)
  const weekEnd = addDays(weekStart, 7)
  const prevWeek = addDays(weekStart, -7)
  const nextWeek = addDays(weekStart, 7)

  const { data } = await supabase
    .from('chat_logs')
    .select('created_at, ip, user_message, assistant_message')
    .gte('created_at', weekStart.toISOString())
    .lt('created_at', weekEnd.toISOString())
    .order('created_at', { ascending: false })

  const report = buildWeeklyChatReport((data || []) as ChatLogForReport[])

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <header className="flex flex-col gap-4 border-b border-neutral-200 pb-6 dark:border-neutral-800">
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-500">Weekly chatbot report</p>
          <h1 className="mt-2 font-serif text-5xl font-semibold text-neutral-800 dark:text-neutral-100">Chat Report</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-600 dark:text-neutral-300">
          <Link href={`/chat-report?week=${toDateInputValue(prevWeek)}`} className="underline underline-offset-4">
            이전 주
          </Link>
          <span>
            {toDateInputValue(weekStart)} - {toDateInputValue(addDays(weekEnd, -1))}
          </span>
          <Link href={`/chat-report?week=${toDateInputValue(nextWeek)}`} className="underline underline-offset-4">
            다음 주
          </Link>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-neutral-200 p-5 dark:border-neutral-800">
          <p className="text-sm text-neutral-500">질문 수</p>
          <p className="mt-2 text-3xl font-semibold">{report.totalQuestions}</p>
        </div>
        <div className="rounded-lg border border-neutral-200 p-5 dark:border-neutral-800">
          <p className="text-sm text-neutral-500">방문자 수(IP 기준)</p>
          <p className="mt-2 text-3xl font-semibold">{report.uniqueVisitors}</p>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">관심 주제</h2>
        {report.topicCounts.length ? (
          <ul className="space-y-2 text-sm text-neutral-700 dark:text-neutral-200">
            {report.topicCounts.map(({ topic, count }) => (
              <li key={topic} className="leading-6">- {topic}: {count}회</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-neutral-500">아직 집계할 질문이 없습니다.</p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">반복 질문</h2>
        <ReportList
          items={report.repeatedQuestions.map(({ question, count }) => `${question} (${count}회)`)}
          emptyText="반복 질문이 아직 없습니다."
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">답변 보강 후보</h2>
        <ReportList items={report.improvementCandidates} emptyText="이번 주 보강 후보가 아직 없습니다." />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">불확실 답변 질문</h2>
        <ReportList items={report.unresolvedQuestions} emptyText="불확실 답변으로 감지된 질문이 없습니다." />
      </section>
    </section>
  )
}

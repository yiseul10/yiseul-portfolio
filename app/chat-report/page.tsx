import Link from 'next/link'
import { createServerSupabase } from '@lib/supabase-server'
import {
  buildWeeklyChatReport,
  type ChatLogForReport,
  type ImprovementAction,
  type ImprovementActionGroup,
  type ImprovementActionType,
  type ImprovementPriority,
  type QuestionTrend,
  type WeeklyComparison,
} from '@lib/chat/weekly-report'
import { ExportMarkdownButton } from './ExportMarkdownButton'
import { SaveToObsidianButton } from './SaveToObsidianButton'
import { ReportTabs } from './ReportTabs'
import { SplitPane } from './SplitPane'
import { getAdminUser } from '@lib/auth/admin'

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

const TYPE_LABELS: Record<ImprovementActionType, string> = {
  wiki_new: 'Wiki 신규',
  wiki_update: 'Wiki 보완',
  blog_new: '블로그 후보',
  portfolio_copy_update: '포트폴리오 문구',
  faq_or_starter_prompt: 'FAQ / Starter Prompt',
}

const PRIORITY_LABELS: Record<ImprovementPriority, string> = {
  high: '높음',
  medium: '중간',
  low: '낮음',
}

// 홈 "Recent" 라벨 = solid dark pill
const TYPE_BADGE_CLASS =
  'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900'

const PRIORITY_STYLES: Record<ImprovementPriority, string> = {
  high: 'bg-[#efe4bb]/80 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
  medium: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
  low: 'bg-neutral-50 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-500',
}

function Badge({ text, className }: { text: string; className: string }) {
  return <span className={`inline-flex rounded-sm px-2.5 py-1 text-xs font-medium ${className}`}>{text}</span>
}

function ImprovementActionList({ items }: { items: ImprovementAction[] }) {
  if (!items.length) {
    return <p className="text-sm text-neutral-500">이번 주 실행 액션이 아직 없습니다.</p>
  }

  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <article key={`${item.type}:${item.title}`} className="rounded-xl border border-neutral-200/70 bg-white/40 p-4 dark:border-neutral-800 dark:bg-neutral-900/30">
          <div className="flex flex-wrap items-center gap-2">
            <Badge text={TYPE_LABELS[item.type]} className={TYPE_BADGE_CLASS} />
            <Badge text={PRIORITY_LABELS[item.priority]} className={PRIORITY_STYLES[item.priority]} />
          </div>
          <h3 className="mt-3 font-serif text-base font-semibold text-neutral-900 dark:text-neutral-100">{item.title}</h3>
          <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">{item.reason}</p>
          {item.sourceQuestions.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm text-neutral-500 dark:text-neutral-400">
              {item.sourceQuestions.slice(0, 2).map((question) => (
                <li key={question}>- {question}</li>
              ))}
            </ul>
          )}
        </article>
      ))}
    </div>
  )
}

function ImprovementActionGroups({ groups }: { groups: ImprovementActionGroup[] }) {
  if (!groups.length) {
    return null
  }

  return (
    <div className="grid gap-6">
      {groups.map((group) => (
        <section key={group.type} className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
              {TYPE_LABELS[group.type]}
            </h3>
            <span className="text-xs text-neutral-400">{group.items.length}개</span>
          </div>
          <ImprovementActionList items={group.items} />
        </section>
      ))}
    </div>
  )
}

function TrendList({
  items,
  emptyText,
  render,
}: {
  items: QuestionTrend[]
  emptyText: string
  render: (trend: QuestionTrend) => string
}) {
  if (!items.length) {
    return <p className="text-sm text-neutral-500">{emptyText}</p>
  }

  return (
    <ul className="space-y-2 text-sm text-neutral-700 dark:text-neutral-200">
      {items.map((trend) => (
        <li key={trend.question} className="leading-6">- {render(trend)}</li>
      ))}
    </ul>
  )
}

function WeeklyComparisonSection({ comparison }: { comparison: WeeklyComparison }) {
  if (!comparison.hasPreviousData) {
    return (
      <section className="rounded-xl border border-[rgba(243,244,246,0.6)] bg-[rgba(249,248,246,0.65)]/10 p-5 shadow-sm backdrop-blur-[2px] dark:border-[rgba(63,63,70,0.4)] dark:bg-[rgba(38,38,38,0.6)] dark:shadow-[0_1px_4px_0_rgba(0,0,0,0.2)]">
        <h2 className="font-serif text-xl font-semibold">지난주 대비</h2>
        <p className="mt-2 text-sm text-neutral-500">
          비교할 지난주 데이터가 없습니다. 질문이 한 주 더 쌓이면 재등장/해결 추적이 표시됩니다.
        </p>
      </section>
    )
  }

  const carryOverPercent =
    comparison.carryOverRate === null ? '-' : `${Math.round(comparison.carryOverRate * 100)}%`

  return (
    <section className="rounded-xl border border-[rgba(243,244,246,0.6)] bg-[rgba(249,248,246,0.65)]/10 p-5 shadow-sm backdrop-blur-[2px] dark:border-[rgba(63,63,70,0.4)] dark:bg-[rgba(38,38,38,0.6)] dark:shadow-[0_1px_4px_0_rgba(0,0,0,0.2)]">
      <h2 className="font-serif text-xl font-semibold">지난주 대비</h2>
      <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
        지난주에 들어온 질문이 이번 주에도 반복되는지(재등장 = 보강 미흡 신호), 사라졌는지 대조합니다.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-neutral-200/70 bg-white/40 p-4 dark:border-neutral-800 dark:bg-neutral-900/30">
          <p className="text-sm text-neutral-500">재등장(미해결)</p>
          <p className="mt-1 font-serif text-2xl font-semibold">{comparison.recurringQuestions.length}</p>
        </div>
        <div className="rounded-lg border border-neutral-200/70 bg-white/40 p-4 dark:border-neutral-800 dark:bg-neutral-900/30">
          <p className="text-sm text-neutral-500">사라진 질문</p>
          <p className="mt-1 font-serif text-2xl font-semibold">{comparison.resolvedQuestions.length}</p>
        </div>
        <div className="rounded-lg border border-neutral-200/70 bg-white/40 p-4 dark:border-neutral-800 dark:bg-neutral-900/30">
          <p className="text-sm text-neutral-500">지난주 대비 비재등장률</p>
          <p className="mt-1 font-serif text-2xl font-semibold">{carryOverPercent}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            재등장 질문 (우선 보강)
          </h3>
          <TrendList
            items={comparison.recurringQuestions}
            emptyText="재등장한 질문이 없습니다."
            render={(t) => `${t.question} (지난주 ${t.previousCount}회 → 이번주 ${t.currentCount}회)`}
          />
        </div>
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            이번 주 사라진 질문
          </h3>
          <TrendList
            items={comparison.resolvedQuestions}
            emptyText="사라진 질문이 없습니다."
            render={(t) => `${t.question} (지난주 ${t.previousCount}회)`}
          />
        </div>
      </div>
    </section>
  )
}

export default async function ChatReportPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>
}) {
  const params = await searchParams
  const supabase = await createServerSupabase()
  const adminUser = await getAdminUser(supabase)

  if (!adminUser) {
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

  const [{ data }, { data: prevData }] = await Promise.all([
    supabase
      .from('chat_logs')
      .select('created_at, ip, user_message, assistant_message')
      .gte('created_at', weekStart.toISOString())
      .lt('created_at', weekEnd.toISOString())
      .order('created_at', { ascending: false }),
    supabase
      .from('chat_logs')
      .select('created_at, ip, user_message, assistant_message')
      .gte('created_at', prevWeek.toISOString())
      .lt('created_at', weekStart.toISOString())
      .order('created_at', { ascending: false }),
  ])

  const report = buildWeeklyChatReport(
    (data || []) as ChatLogForReport[],
    (prevData || []) as ChatLogForReport[],
  )
  const exportFileName = `chat-report-actions-${toDateInputValue(weekStart)}.md`
  const wikiNoteFileName = `chat-report-weekly-note-${toDateInputValue(weekStart)}.md`

  const reportTab = (
    <div className="flex flex-col gap-8">
      <SplitPane
        storageKey="chat-report-split"
        left={
          <section className="rounded-xl border border-[rgba(243,244,246,0.6)] bg-[rgba(249,248,246,0.65)]/10 p-5 shadow-sm backdrop-blur-[2px] dark:border-[rgba(63,63,70,0.4)] dark:bg-[rgba(38,38,38,0.6)] dark:shadow-[0_1px_4px_0_rgba(0,0,0,0.2)]">
            <h2 className="font-serif text-xl font-semibold">이번 주 실행 액션</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
              반복 질문과 불확실 답변, 관심 주제를 실제 Wiki / 블로그 / 포트폴리오 보강 작업으로 연결한 목록입니다.
            </p>
            <div className="mt-4">
              <ImprovementActionGroups groups={report.actionGroups} />
            </div>
          </section>
        }
        right={
          <div className="flex flex-col gap-6">
            <WeeklyComparisonSection comparison={report.comparison} />

          <section className="space-y-3 rounded-xl border border-[rgba(243,244,246,0.6)] bg-[rgba(249,248,246,0.65)]/10 p-5 shadow-sm backdrop-blur-[2px] dark:border-[rgba(63,63,70,0.4)] dark:bg-[rgba(38,38,38,0.6)] dark:shadow-[0_1px_4px_0_rgba(0,0,0,0.2)]">
            <h2 className="font-serif text-xl font-semibold">관심 주제</h2>
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

          <section className="space-y-3 rounded-xl border border-[rgba(243,244,246,0.6)] bg-[rgba(249,248,246,0.65)]/10 p-5 shadow-sm backdrop-blur-[2px] dark:border-[rgba(63,63,70,0.4)] dark:bg-[rgba(38,38,38,0.6)] dark:shadow-[0_1px_4px_0_rgba(0,0,0,0.2)]">
            <h2 className="font-serif text-xl font-semibold">반복 질문</h2>
            <ReportList
              items={report.repeatedQuestions.map(({ question, count }) => `${question} (${count}회)`)}
              emptyText="반복 질문이 아직 없습니다."
            />
          </section>

            <section className="space-y-3 rounded-xl border border-[rgba(243,244,246,0.6)] bg-[rgba(249,248,246,0.65)]/10 p-5 shadow-sm backdrop-blur-[2px] dark:border-[rgba(63,63,70,0.4)] dark:bg-[rgba(38,38,38,0.6)] dark:shadow-[0_1px_4px_0_rgba(0,0,0,0.2)]">
              <h2 className="font-serif text-xl font-semibold">불확실 답변 질문</h2>
              <ReportList items={report.unresolvedQuestions} emptyText="불확실 답변으로 감지된 질문이 없습니다." />
            </section>
          </div>
        }
      />
    </div>
  )

  const exportTab = (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-xl border border-[rgba(243,244,246,0.6)] bg-[rgba(249,248,246,0.65)]/10 p-5 shadow-sm backdrop-blur-[2px] dark:border-[rgba(63,63,70,0.4)] dark:bg-[rgba(38,38,38,0.6)] dark:shadow-[0_1px_4px_0_rgba(0,0,0,0.2)]">
        <h2 className="font-serif text-xl font-semibold">주간 액션 로그 초안</h2>
        <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
          위키나 작업 노트로 바로 옮길 수 있도록 Markdown 형태로 정리한 초안입니다.
        </p>
        <div className="mt-4">
          <ExportMarkdownButton content={report.markdownActionLog} fileName={exportFileName} />
        </div>
        <div className="mt-4 overflow-x-auto rounded-lg bg-neutral-950 p-4 text-sm text-neutral-100">
          <pre className="whitespace-pre-wrap break-words">{report.markdownActionLog}</pre>
        </div>
      </section>

      <section className="rounded-xl border border-[rgba(243,244,246,0.6)] bg-[rgba(249,248,246,0.65)]/10 p-5 shadow-sm backdrop-blur-[2px] dark:border-[rgba(63,63,70,0.4)] dark:bg-[rgba(38,38,38,0.6)] dark:shadow-[0_1px_4px_0_rgba(0,0,0,0.2)]">
        <h2 className="font-serif text-xl font-semibold">위키 주간 노트 초안</h2>
        <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
          Obsidian 주간 노트에 바로 넣을 수 있도록 frontmatter와 섹션 구조를 포함한 Markdown 초안입니다.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <ExportMarkdownButton content={report.wikiWeeklyNote} fileName={wikiNoteFileName} />
          <SaveToObsidianButton content={report.wikiWeeklyNote} fileName={wikiNoteFileName} />
        </div>
        <div className="mt-4 overflow-x-auto rounded-lg bg-neutral-950 p-4 text-sm text-neutral-100">
          <pre className="whitespace-pre-wrap break-words">{report.wikiWeeklyNote}</pre>
        </div>
      </section>
    </div>
  )

  return (
    <section className="report-page mx-auto flex w-full flex-col gap-8">
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

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-[rgba(243,244,246,0.6)] bg-[rgba(249,248,246,0.65)]/10 p-5 shadow-sm backdrop-blur-[2px] dark:border-[rgba(63,63,70,0.4)] dark:bg-[rgba(38,38,38,0.6)] dark:shadow-[0_1px_4px_0_rgba(0,0,0,0.2)]">
          <p className="text-sm text-neutral-500">질문 수</p>
          <p className="mt-2 font-serif text-3xl font-semibold">{report.totalQuestions}</p>
        </div>
        <div className="rounded-xl border border-[rgba(243,244,246,0.6)] bg-[rgba(249,248,246,0.65)]/10 p-5 shadow-sm backdrop-blur-[2px] dark:border-[rgba(63,63,70,0.4)] dark:bg-[rgba(38,38,38,0.6)] dark:shadow-[0_1px_4px_0_rgba(0,0,0,0.2)]">
          <p className="text-sm text-neutral-500">방문자 수(IP 기준)</p>
          <p className="mt-2 font-serif text-3xl font-semibold">{report.uniqueVisitors}</p>
        </div>
        <div className="rounded-xl border border-[rgba(243,244,246,0.6)] bg-[rgba(249,248,246,0.65)]/10 p-5 shadow-sm backdrop-blur-[2px] dark:border-[rgba(63,63,70,0.4)] dark:bg-[rgba(38,38,38,0.6)] dark:shadow-[0_1px_4px_0_rgba(0,0,0,0.2)]">
          <p className="text-sm text-neutral-500">재등장(미해결) 질문</p>
          <p className="mt-2 font-serif text-3xl font-semibold">{report.comparison.recurringQuestions.length}</p>
        </div>
        <div className="rounded-xl border border-[#efe4bb] bg-[#efe4bb]/30 p-5 shadow-sm backdrop-blur-[2px] dark:border-neutral-700 dark:bg-neutral-800/60">
          <p className="text-sm text-neutral-600 dark:text-neutral-300">고우선순위 액션</p>
          <p className="mt-2 font-serif text-3xl font-semibold text-neutral-800 dark:text-neutral-100">
            {report.improvementActions.filter((action) => action.priority === 'high').length}
          </p>
        </div>
      </div>

      <ReportTabs
        tabs={[
          { id: 'report', label: '리포트', content: reportTab },
          { id: 'export', label: '내보내기 초안', content: exportTab },
        ]}
      />
    </section>
  )
}

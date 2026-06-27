export type ChatLogForReport = {
  created_at: string
  ip: string | null
  user_message: string | null
  assistant_message: string | null
}

export type ImprovementActionType =
  | 'wiki_new'
  | 'wiki_update'
  | 'blog_new'
  | 'portfolio_copy_update'
  | 'faq_or_starter_prompt'

export type ImprovementPriority = 'high' | 'medium' | 'low'

export type ImprovementAction = {
  type: ImprovementActionType
  title: string
  reason: string
  priority: ImprovementPriority
  sourceQuestions: string[]
}

export type ImprovementActionGroup = {
  type: ImprovementActionType
  items: ImprovementAction[]
}

export type TrendStatus = 'recurring' | 'resolved' | 'new'

export type QuestionTrend = {
  question: string
  currentCount: number
  previousCount: number
  status: TrendStatus
}

export type TopicTrend = {
  topic: string
  currentCount: number
  previousCount: number
  status: TrendStatus
}

export type WeeklyComparison = {
  hasPreviousData: boolean
  previousDistinctQuestions: number
  recurringQuestions: QuestionTrend[]
  resolvedQuestions: QuestionTrend[]
  newQuestions: QuestionTrend[]
  topicTrends: TopicTrend[]
  // 지난주 질문 중 이번 주에 다시 등장하지 않은 비율 (0~1). 지난주 데이터가 없으면 null.
  carryOverRate: number | null
}

export type WeeklyChatReport = {
  totalQuestions: number
  uniqueVisitors: number
  repeatedQuestions: { question: string; count: number }[]
  topicCounts: { topic: string; count: number }[]
  unresolvedQuestions: string[]
  improvementActions: ImprovementAction[]
  actionGroups: ImprovementActionGroup[]
  comparison: WeeklyComparison
  markdownActionLog: string
  wikiWeeklyNote: string
}

const TOPIC_RULES: { topic: string; patterns: RegExp[] }[] = [
  { topic: 'AI 자동화', patterns: [/ai/i, /자동화/, /n8n/i, /llm/i, /claude/i, /codex/i] },
  { topic: 'job-hunting-bot', patterns: [/job[-\s]?hunting/i, /구직/, /채용/, /jd/i, /공고/] },
  { topic: '챗봇/포트폴리오', patterns: [/챗봇/, /포트폴리오/, /블로그/, /위키/, /obsidian/i] },
  { topic: '경력/이력서', patterns: [/경력/, /이력서/, /회사/, /트립비토즈/, /프론트엔드/] },
  { topic: '프로젝트 성과', patterns: [/성과/, /임팩트/, /수치/, /자동화율/, /채택/, /매출/] },
  { topic: '협업/일하는 방식', patterns: [/협업/, /일하는 방식/, /커뮤니케이션/, /문제 정의/, /기획/] },
]

function normalizeQuestion(question: string): string {
  return question
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[?!.,~]+$/g, '')
    .trim()
}

function detectTopic(question: string): string {
  return TOPIC_RULES.find(({ patterns }) => patterns.some((pattern) => pattern.test(question)))?.topic || '기타'
}

function isUnresolvedAnswer(answer: string): boolean {
  return /잘 모르겠|없는 정보|불러올 수 없습니다|답변.*문제|관리자에게 알려주세요/.test(answer)
}

function toPriority(count: number): ImprovementPriority {
  if (count >= 4) return 'high'
  if (count >= 2) return 'medium'
  return 'low'
}

function truncate(text: string, max = 56): string {
  return text.length > max ? `${text.slice(0, max)}...` : text
}

function createTopicAction(topic: string, count: number): ImprovementAction {
  const priority = toPriority(count)

  switch (topic) {
    case '챗봇/포트폴리오':
      return {
        type: 'portfolio_copy_update',
        title: `포트폴리오 문구 보강: ${topic}`,
        reason: `이번 주 관심 주제로 ${count}회 등장`,
        priority,
        sourceQuestions: [],
      }
    case '프로젝트 성과':
    case '협업/일하는 방식':
    case 'AI 자동화':
      return {
        type: 'blog_new',
        title: `블로그 후보 작성: ${topic}`,
        reason: `질문이 반복되어 독립 콘텐츠 가치가 높음 (${count}회)`,
        priority,
        sourceQuestions: [],
      }
    default:
      return {
        type: 'wiki_new',
        title: `공개 Wiki 후보 추가: ${topic}`,
        reason: `관심 주제를 챗봇 컨텍스트로 보강할 필요가 있음 (${count}회)`,
        priority,
        sourceQuestions: [],
      }
  }
}

function sortActionsByPriority(items: ImprovementAction[]): ImprovementAction[] {
  const priorityOrder: Record<ImprovementPriority, number> = {
    high: 0,
    medium: 1,
    low: 2,
  }

  return [...items].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
}

function buildActionGroups(actions: ImprovementAction[]): ImprovementActionGroup[] {
  const order: ImprovementActionType[] = [
    'wiki_update',
    'wiki_new',
    'blog_new',
    'portfolio_copy_update',
    'faq_or_starter_prompt',
  ]

  return order
    .map((type) => ({
      type,
      items: sortActionsByPriority(actions.filter((action) => action.type === type)),
    }))
    .filter((group) => group.items.length > 0)
}

function buildMarkdownActionLog(actions: ImprovementAction[]): string {
  if (!actions.length) {
    return [
      '# Chat Report Action Log',
      '',
      '- 이번 주 실행 액션 없음',
    ].join('\n')
  }

  const groups = buildActionGroups(actions)

  const lines = [
    '# Chat Report Action Log',
    '',
    '## 이번 주 실행 후보',
  ]

  for (const group of groups) {
    lines.push('')
    lines.push(`### ${group.type}`)

    for (const item of group.items) {
      lines.push(`- [ ] ${item.title}`)
      lines.push(`  - priority: ${item.priority}`)
      lines.push(`  - reason: ${item.reason}`)
      if (item.sourceQuestions.length > 0) {
        lines.push(`  - source: ${item.sourceQuestions.join(' / ')}`)
      }
    }
  }

  return lines.join('\n')
}

function buildWikiWeeklyNote(report: {
  totalQuestions: number
  uniqueVisitors: number
  topicCounts: { topic: string; count: number }[]
  repeatedQuestions: { question: string; count: number }[]
  unresolvedQuestions: string[]
  improvementActions: ImprovementAction[]
  comparison: WeeklyComparison
}): string {
  const lines = [
    '---',
    'title: 챗봇 주간 리포트',
    'tags: [portpolio2, chatbot, weekly-report, content-loop]',
    'status: draft',
    'source: chat-report',
    '---',
    '',
    '# 챗봇 주간 리포트',
    '',
    '## 요약',
    `- 질문 수: ${report.totalQuestions}`,
    `- 방문자 수(IP 기준): ${report.uniqueVisitors}`,
    '',
    '## 관심 주제',
  ]

  if (report.topicCounts.length === 0) {
    lines.push('- 집계된 질문 없음')
  } else {
    for (const { topic, count } of report.topicCounts.slice(0, 5)) {
      lines.push(`- ${topic}: ${count}회`)
    }
  }

  lines.push('', '## 반복 질문')
  if (report.repeatedQuestions.length === 0) {
    lines.push('- 반복 질문 없음')
  } else {
    for (const { question, count } of report.repeatedQuestions.slice(0, 5)) {
      lines.push(`- ${question} (${count}회)`)
    }
  }

  lines.push('', '## 불확실 답변 질문')
  if (report.unresolvedQuestions.length === 0) {
    lines.push('- 불확실 답변으로 분류된 질문 없음')
  } else {
    for (const question of report.unresolvedQuestions.slice(0, 5)) {
      lines.push(`- ${question}`)
    }
  }

  lines.push('', '## 이번 주 실행 액션')
  if (report.improvementActions.length === 0) {
    lines.push('- 실행 액션 없음')
  } else {
    for (const action of report.improvementActions.slice(0, 8)) {
      lines.push(`- [ ] (${action.priority}) [${action.type}] ${action.title}`)
      lines.push(`  - reason: ${action.reason}`)
      if (action.sourceQuestions.length > 0) {
        lines.push(`  - source: ${action.sourceQuestions.join(' / ')}`)
      }
    }
  }

  lines.push(...buildComparisonSection(report.comparison))

  lines.push(
    '',
    '## 메모',
    '- 이번 주 상위 1~3개 액션만 처리',
    '- 재등장 질문은 지난주 보강이 충분하지 않았다는 신호',
    '- 다음 주 리포트에서 질문 감소 / 재등장 여부 확인'
  )

  return lines.join('\n')
}

function countNormalizedQuestions(logs: ChatLogForReport[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const log of logs) {
    const question = normalizeQuestion(log.user_message || '')
    if (!question) continue
    counts.set(question, (counts.get(question) || 0) + 1)
  }
  return counts
}

function countTopics(logs: ChatLogForReport[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const log of logs) {
    const question = normalizeQuestion(log.user_message || '')
    if (!question) continue
    const topic = detectTopic(question)
    counts.set(topic, (counts.get(topic) || 0) + 1)
  }
  return counts
}

export function buildWeeklyComparison(
  currentLogs: ChatLogForReport[],
  previousLogs: ChatLogForReport[],
): WeeklyComparison {
  const current = countNormalizedQuestions(currentLogs)
  const previous = countNormalizedQuestions(previousLogs)

  const recurringQuestions: QuestionTrend[] = []
  const newQuestions: QuestionTrend[] = []
  const resolvedQuestions: QuestionTrend[] = []

  for (const [question, currentCount] of Array.from(current)) {
    const previousCount = previous.get(question) || 0
    if (previousCount > 0) {
      recurringQuestions.push({ question, currentCount, previousCount, status: 'recurring' })
    } else {
      newQuestions.push({ question, currentCount, previousCount: 0, status: 'new' })
    }
  }

  for (const [question, previousCount] of Array.from(previous)) {
    if (!current.has(question)) {
      resolvedQuestions.push({ question, currentCount: 0, previousCount, status: 'resolved' })
    }
  }

  recurringQuestions.sort((a, b) => b.currentCount - a.currentCount)
  newQuestions.sort((a, b) => b.currentCount - a.currentCount)
  resolvedQuestions.sort((a, b) => b.previousCount - a.previousCount)

  const currentTopics = countTopics(currentLogs)
  const previousTopics = countTopics(previousLogs)
  const topicKeys = new Set([
    ...Array.from(currentTopics.keys()),
    ...Array.from(previousTopics.keys()),
  ])

  const topicTrends: TopicTrend[] = Array.from(topicKeys)
    .map((topic) => {
      const currentCount = currentTopics.get(topic) || 0
      const previousCount = previousTopics.get(topic) || 0
      const status: TrendStatus =
        previousCount === 0 ? 'new' : currentCount === 0 ? 'resolved' : 'recurring'
      return { topic, currentCount, previousCount, status }
    })
    .sort((a, b) => b.currentCount - a.currentCount || b.previousCount - a.previousCount)

  const previousDistinctQuestions = previous.size
  const carryOverRate =
    previousDistinctQuestions === 0 ? null : resolvedQuestions.length / previousDistinctQuestions

  return {
    hasPreviousData: previousDistinctQuestions > 0,
    previousDistinctQuestions,
    recurringQuestions: recurringQuestions.slice(0, 10),
    resolvedQuestions: resolvedQuestions.slice(0, 10),
    newQuestions: newQuestions.slice(0, 10),
    topicTrends,
    carryOverRate,
  }
}

function buildComparisonSection(comparison: WeeklyComparison): string[] {
  const lines = ['', '## 지난주 대비']

  if (!comparison.hasPreviousData) {
    lines.push('- 비교할 지난주 데이터가 없습니다 (첫 주 또는 질문 없음).')
    return lines
  }

  const ratePercent =
    comparison.carryOverRate === null ? '-' : `${Math.round(comparison.carryOverRate * 100)}%`
  lines.push(
    `- 지난주 질문 ${comparison.previousDistinctQuestions}종 중 ${comparison.resolvedQuestions.length}종이 이번 주 재등장하지 않음 (${ratePercent})`,
    `- 재등장(아직 미해결): ${comparison.recurringQuestions.length}종 / 신규: ${comparison.newQuestions.length}종`,
  )

  if (comparison.recurringQuestions.length > 0) {
    lines.push('', '### 재등장 질문 (우선 보강)')
    for (const trend of comparison.recurringQuestions.slice(0, 5)) {
      lines.push(`- [ ] ${trend.question} (지난주 ${trend.previousCount}회 → 이번주 ${trend.currentCount}회)`)
    }
  }

  if (comparison.resolvedQuestions.length > 0) {
    lines.push('', '### 이번 주 사라진 질문')
    for (const trend of comparison.resolvedQuestions.slice(0, 5)) {
      lines.push(`- ${trend.question} (지난주 ${trend.previousCount}회)`)
    }
  }

  return lines
}

export function buildWeeklyChatReport(
  logs: ChatLogForReport[],
  previousLogs: ChatLogForReport[] = [],
): WeeklyChatReport {
  const questions = logs
    .map((log) => {
      const question = normalizeQuestion(log.user_message || '')
      return {
        question,
        answer: log.assistant_message || '',
        ip: log.ip || 'unknown',
        topic: detectTopic(question),
      }
    })
    .filter(({ question }) => question.length > 0)

  const questionCounts = questions.reduce<Record<string, number>>((acc, { question }) => {
    acc[question] = (acc[question] || 0) + 1
    return acc
  }, {})

  const topicCounts = questions.reduce<Record<string, number>>((acc, { topic }) => {
    acc[topic] = (acc[topic] || 0) + 1
    return acc
  }, {})

  const unresolvedQuestions = questions
    .filter(({ answer }) => isUnresolvedAnswer(answer))
    .map(({ question }) => question)
    .filter((question, index, list) => list.indexOf(question) === index)
    .slice(0, 10)

  const sortedTopics = Object.entries(topicCounts)
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count)

  const repeatedQuestions = Object.entries(questionCounts)
    .filter(([, count]) => count > 1)
    .map(([question, count]) => ({ question, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  const improvementActions: ImprovementAction[] = []
  const seenActionKeys = new Set<string>()

  const pushAction = (action: ImprovementAction) => {
    const key = `${action.type}:${action.title}`
    if (seenActionKeys.has(key)) return
    seenActionKeys.add(key)
    improvementActions.push(action)
  }

  for (const { question, count } of repeatedQuestions) {
    const topic = detectTopic(question)
    const priority = toPriority(count)

    pushAction({
      type: 'faq_or_starter_prompt',
      title: `FAQ/Starter Prompt 보강: ${truncate(question)}`,
      reason: `같은 질문이 ${count}회 반복됨`,
      priority,
      sourceQuestions: [question],
    })

    if (topic === '챗봇/포트폴리오') {
      pushAction({
        type: 'portfolio_copy_update',
        title: `포트폴리오 문구 보강: ${truncate(question)}`,
        reason: `방문자가 포트폴리오 핵심 설명을 반복적으로 확인함 (${count}회)`,
        priority,
        sourceQuestions: [question],
      })
    }
  }

  for (const question of unresolvedQuestions) {
    pushAction({
      type: 'wiki_update',
      title: `공개 Wiki 보완: ${truncate(question)}`,
      reason: '불확실 답변이 감지되어 설명 보강이 필요함',
      priority: 'high',
      sourceQuestions: [question],
    })
  }

  for (const { topic, count } of sortedTopics.slice(0, 3)) {
    pushAction(createTopicAction(topic, count))
  }

  const finalActions = improvementActions.slice(0, 12)
  const comparison = buildWeeklyComparison(logs, previousLogs)
  const uniqueVisitors = new Set(questions.map(({ ip }) => ip)).size

  return {
    totalQuestions: questions.length,
    uniqueVisitors,
    repeatedQuestions,
    topicCounts: sortedTopics,
    unresolvedQuestions,
    improvementActions: finalActions,
    actionGroups: buildActionGroups(finalActions),
    comparison,
    markdownActionLog: buildMarkdownActionLog(finalActions),
    wikiWeeklyNote: buildWikiWeeklyNote({
      totalQuestions: questions.length,
      uniqueVisitors,
      topicCounts: sortedTopics,
      repeatedQuestions,
      unresolvedQuestions,
      improvementActions: finalActions,
      comparison,
    }),
  }
}

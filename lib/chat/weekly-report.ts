export type ChatLogForReport = {
  created_at: string
  ip: string | null
  user_message: string | null
  assistant_message: string | null
}

export type WeeklyChatReport = {
  totalQuestions: number
  uniqueVisitors: number
  repeatedQuestions: { question: string; count: number }[]
  topicCounts: { topic: string; count: number }[]
  unresolvedQuestions: string[]
  improvementCandidates: string[]
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
    .replace(/[?!.,~]+$/g, '')
    .trim()
}

function detectTopic(question: string): string {
  return TOPIC_RULES.find(({ patterns }) => patterns.some((pattern) => pattern.test(question)))?.topic || '기타'
}

function isUnresolvedAnswer(answer: string): boolean {
  return /잘 모르겠|없는 정보|불러올 수 없습니다|답변.*문제|관리자에게 알려주세요/.test(answer)
}

export function buildWeeklyChatReport(logs: ChatLogForReport[]): WeeklyChatReport {
  const questions = logs
    .map((log) => ({
      question: normalizeQuestion(log.user_message || ''),
      answer: log.assistant_message || '',
      ip: log.ip || 'unknown',
    }))
    .filter(({ question }) => question.length > 0)

  const questionCounts = questions.reduce<Record<string, number>>((acc, { question }) => {
    acc[question] = (acc[question] || 0) + 1
    return acc
  }, {})

  const topicCounts = questions.reduce<Record<string, number>>((acc, { question }) => {
    const topic = detectTopic(question)
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

  const improvementCandidates = [
    ...repeatedQuestions.map(({ question }) => `반복 질문 답변 보강: ${question}`),
    ...unresolvedQuestions.map((question) => `Wiki 또는 Work 문서 보강 필요: ${question}`),
    ...sortedTopics.slice(0, 3).map(({ topic, count }) => `관심 주제 "${topic}" 관련 공개 Wiki/블로그 후보 검토 (${count}회)`),
  ].slice(0, 12)

  return {
    totalQuestions: questions.length,
    uniqueVisitors: new Set(questions.map(({ ip }) => ip)).size,
    repeatedQuestions,
    topicCounts: sortedTopics,
    unresolvedQuestions,
    improvementCandidates,
  }
}

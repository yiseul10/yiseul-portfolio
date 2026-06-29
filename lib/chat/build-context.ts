import { existsSync, readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { supabase } from '@lib/superbase'

type WikiFrontmatter = {
  chatbot?: boolean
  public_safe?: boolean
  topic?: string
  status?: string
  priority?: string
  summary?: string
}

function loadProfileMarkdown(): string {
  try {
    const filePath = join(process.cwd(), 'app', 'data', 'profile.md')
    return readFileSync(filePath, 'utf-8')
  } catch {
    return '프로필 정보를 불러올 수 없습니다.'
  }
}

async function fetchResumeData(): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('resume_versions')
      .select('resume_data')
      .eq('is_active', true)
      .single()

    if (error || !data) return '이력서 정보를 불러올 수 없습니다.'

    const resume = data.resume_data
    const parts: string[] = []

    if (resume.profile) {
      parts.push(`이름: ${resume.profile.name || ''}`)
      parts.push(`직함: ${resume.profile.title || ''}`)
    }

    if (resume.summary) {
      parts.push(`\n자기소개:\n${resume.summary}`)
    }

    if (resume.keywords?.length) {
      parts.push(`\n키워드: ${resume.keywords.join(', ')}`)
    }

    if (resume.skills?.length) {
      parts.push('\n기술 스택:')
      resume.skills.forEach((group: { category: string; items: string }) => {
        parts.push(`- ${group.category}: ${group.items}`)
      })
    }

    if (resume.experience?.length) {
      parts.push('\n경력:')
      resume.experience.forEach((exp: { company: string; role: string; startDate: string; endDate: string; descriptions?: { text: string }[] }) => {
        parts.push(`- ${exp.company} | ${exp.role} (${exp.startDate} ~ ${exp.endDate})`)
        exp.descriptions?.forEach((desc) => {
          if (desc.text) parts.push(`  - ${desc.text}`)
        })
      })
    }

    return parts.join('\n')
  } catch {
    return '이력서 정보를 불러올 수 없습니다.'
  }
}

function stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, '') // 코드 블록 제거
    .replace(/`[^`]*`/g, '')         // 인라인 코드 제거
    .replace(/!\[.*?\]\(.*?\)/g, '') // 이미지 제거
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 링크 → 텍스트만
    .replace(/^#{1,6}\s+/gm, '')     // 헤딩 기호
    .replace(/[*_~]{1,3}([^*_~]+)[*_~]{1,3}/g, '$1') // bold/italic
    .replace(/^\s*[-*+]\s+/gm, '')   // 리스트 기호
    .replace(/^\s*\d+\.\s+/gm, '')   // 번호 리스트
    .replace(/\n{3,}/g, '\n\n')      // 과도한 빈줄 정리
    .trim()
}

function parseFrontmatter(raw: string): { meta: WikiFrontmatter; content: string } {
  if (!raw.startsWith('---')) return { meta: {}, content: raw }

  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!match) return { meta: {}, content: raw }

  const meta = match[1].split('\n').reduce<WikiFrontmatter>((acc, line) => {
    const [key, ...valueParts] = line.split(':')
    if (!key || !valueParts.length) return acc

    const value = valueParts.join(':').trim().replace(/^['"]|['"]$/g, '')
    const normalizedKey = key.trim() as keyof WikiFrontmatter

    if (value === 'true') {
      acc[normalizedKey] = true as never
    } else if (value === 'false') {
      acc[normalizedKey] = false as never
    } else {
      acc[normalizedKey] = value as never
    }

    return acc
  }, {})

  return { meta, content: match[2] }
}

function loadPublicSafeWikiNotes(): string {
  try {
    const wikiDir = join(process.cwd(), 'app', 'data', 'wiki')
    if (!existsSync(wikiDir)) return '공개 가능한 Wiki 문서가 없습니다.'

    const notes = readdirSync(wikiDir)
      .filter((fileName) => fileName.endsWith('.md'))
      .map((fileName) => {
        const raw = readFileSync(join(wikiDir, fileName), 'utf-8')
        const { meta, content } = parseFrontmatter(raw)
        return { fileName, meta, content }
      })
      .filter(({ meta }) => meta.chatbot === true && meta.public_safe === true)
      .sort((a, b) => {
        const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }
        return (priorityOrder[a.meta.priority || 'low'] ?? 2) - (priorityOrder[b.meta.priority || 'low'] ?? 2)
      })
      .slice(0, 8)
      .map(({ fileName, meta, content }) => {
        const title = content.match(/^#\s+(.+)$/m)?.[1] || fileName.replace(/\.md$/, '')
        if (!meta.summary) return null

        const summary = meta.summary
        const topic = meta.topic ? `주제: ${meta.topic}` : ''
        const status = meta.status ? `상태: ${meta.status}` : ''

        return `### ${title}\n${[topic, status].filter(Boolean).join('\n')}\n요약: ${summary}`
      })
      .filter((note): note is string => Boolean(note))

    if (!notes.length) return '공개 가능한 Wiki 문서가 없습니다.'

    return '공개 허용 Wiki 노트:\n' + notes.join('\n\n')
  } catch {
    return 'Wiki 정보를 불러올 수 없습니다.'
  }
}

// 시스템 프롬프트는 자주 바뀌지 않으므로(이력서/블로그 갱신은 드묾) 조립 결과를 캐싱한다.
// 멀티턴 대화에서 매 메시지마다 DB(resume_versions·블로그)를 재조회·재파싱하던 비용을 제거.
const CONTEXT_CACHE_TTL_MS = 5 * 60 * 1000 // 5분

let contextCache: { prompt: string; expiresAt: number } | null = null

/** 캐시 무효화. 이력서/블로그 변경 시 호출하면 다음 요청에서 즉시 재조립된다. */
export function invalidateContextCache(): void {
  contextCache = null
}

async function assembleContext(): Promise<string> {
  const [profile, resume, wiki] = await Promise.all([
    loadProfileMarkdown(),
    fetchResumeData(),
    loadPublicSafeWikiNotes(),
  ])

  return `너는 "이슬"이야. 프론트엔드 개발자이고, 이 포트폴리오 사이트의 주인이야.
방문자가 너에 대해 궁금한 걸 물어보면 1인칭으로 친근하게 답변해.

규칙:
- 반말이 아닌 존댓말 사용 (but 딱딱하지 않게)
- 모르는 건 솔직하게 "그건 아직 잘 모르겠어요"라고 말해
- 포트폴리오/이력서/블로그에 없는 정보를 지어내지 마
- 기술적인 질문에는 구체적으로 답변해
- 너무 길지 않게, 2-3문장 정도로 간결하게
- 한국어로 답변해

아래는 너에 대한 정보야:

---
${profile}
---
${resume}
---
${wiki}
---`
}

export async function buildContext(): Promise<string> {
  const now = Date.now()
  if (contextCache && contextCache.expiresAt > now) {
    return contextCache.prompt
  }

  const prompt = await assembleContext()
  contextCache = { prompt, expiresAt: now + CONTEXT_CACHE_TTL_MS }
  return prompt
}

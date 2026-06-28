import { supabase } from '@lib/superbase'
import { embedText } from './embeddings'

type MatchRow = { chunk_text: string; title: string; similarity: number }

/**
 * 질문과 의미가 가까운 블로그 chunk를 검색해 텍스트 배열로 반환한다.
 * 실패하거나 임계값 통과 결과가 없으면 빈 배열을 반환한다(채팅을 막지 않음).
 */
export async function retrieveBlogChunks(query: string, k = 4): Promise<string[]> {
  try {
    const trimmed = query?.trim()
    if (!trimmed) return []

    const embedding = await embedText(trimmed)

    const { data, error } = await supabase.rpc('match_post_chunks', {
      query_embedding: embedding,
      match_count: k,
      match_threshold: 0.3,
    })

    if (error || !data) return []

    return (data as MatchRow[]).map((row) => `### "${row.title}"\n${row.chunk_text}`)
  } catch {
    return []
  }
}

import { embedMany } from 'ai'
import { openai } from '@ai-sdk/openai'

const embeddingModel = openai.embedding('text-embedding-3-small')

/** 여러 텍스트를 한 번에 임베딩한다. 입력 순서와 동일한 순서의 벡터 배열을 반환. */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (!texts.length) return []
  const { embeddings } = await embedMany({ model: embeddingModel, values: texts })
  return embeddings
}

/** 단일 텍스트 임베딩. */
export async function embedText(text: string): Promise<number[]> {
  const [embedding] = await embedTexts([text])
  return embedding
}

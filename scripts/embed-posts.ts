import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { chunkMarkdown } from '../lib/chat/chunk'
import { embedTexts } from '../lib/chat/embeddings'

// .env.local 로드 (Node 버전과 무관하게 동작하도록 --env-file 대신 dotenv 사용)
config({ path: '.env.local' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL 와 SUPABASE_SERVICE_ROLE_KEY 가 필요합니다.')
  process.exit(1)
}
if (!process.env.OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY 가 필요합니다.')
  process.exit(1)
}

const supabase = createClient(url, serviceKey)

async function main() {
  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, title, mdx_content')
    .eq('published', true)

  if (error) {
    console.error('포스트 조회 실패:', error.message)
    process.exit(1)
  }

  let processed = 0
  let skipped = 0

  for (const post of posts ?? []) {
    try {
      const chunks = chunkMarkdown(post.mdx_content || '')
      if (!chunks.length) {
        skipped += 1
        continue
      }

      const embeddings = await embedTexts(chunks)

      await supabase.from('post_chunks').delete().eq('post_id', post.id)

      const rows = chunks.map((chunk_text, chunk_index) => ({
        post_id: post.id,
        chunk_index,
        chunk_text,
        embedding: embeddings[chunk_index],
      }))

      const { error: insertError } = await supabase.from('post_chunks').insert(rows)
      if (insertError) throw insertError

      processed += 1
    } catch (e) {
      console.error(`임베딩 실패 (post ${post.id}):`, e)
      skipped += 1
    }
  }

  console.log(`임베딩 완료: ${processed}개 글 처리, ${skipped}개 스킵.`)
}

main()

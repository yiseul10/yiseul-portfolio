import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PostItem } from '@/app/components/post-item'
import { PostPagination } from '@/app/components/post-pagination'
import { createServerSupabase } from '@lib/supabase-server'
import { getAdminUser } from '@lib/auth/admin'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 10

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; page?: string }>
}) {
  const params = await searchParams
  const supabase = await createServerSupabase()
  const adminUser = await getAdminUser(supabase)

  const filter = params.filter || null
  const page = Number(params.page || '1')

  let query = supabase
    .from('posts')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .eq('category', 'experience')

  if (!adminUser) {
    query = query.eq('published', true)
  } else if (filter === 'published') {
    query = query.eq('published', true)
  } else if (filter === 'draft') {
    query = query.eq('published', false)
  }

  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1
  query = query.range(from, to)

  const { data: posts, count } = await query
  const totalPages = Math.ceil((count || 0) / PAGE_SIZE)

  return (
    <div className="flex w-full flex-col">
      <div className="flex items-center justify-between h-[80px] w-full mb-8">
        <h1 className="font-semibold text-5xl text-neutral-800 font-serif">Work</h1>
        {adminUser && (
          <Button variant="secondary" size="icon">
            <Link href="/blog/add"><Plus className="w-6 h-6 stroke-3 text-neutral-700" /></Link>
          </Button>
        )}
      </div>
      <section>
        {(!posts || posts.length === 0) ? (
          <div className="text-sm text-neutral-500 py-4">글이 없습니다.</div>
        ) : (
          <div className="w-full flex flex-col gap-8">
            {posts.map((post) => (
              <PostItem key={post.slug} post={post} isAdmin={!!adminUser} />
            ))}
          </div>
        )}
        <PostPagination totalPages={totalPages} />
      </section>
    </div>
  )
}

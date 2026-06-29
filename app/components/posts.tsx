'use client'

import { useEffect, useState, useCallback } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@lib/superbase'
import { Button } from '@/components/ui/button'
import { Eye, EyeClosed, ChevronLeft, ChevronRight } from 'lucide-react'
import { PostItem } from '@/app/components/post-item'
import { isAdminSession } from '@lib/auth/client'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 10

interface BlogPostsProps {
  showFilter?: boolean
  showPagination?: boolean
  fixedCategory?: 'study' | 'experience'
  showCategoryFilter?: boolean
}

type FilterType = 'published' | 'draft'
type CategoryType = 'all' | 'study' | 'experience' | 'diary'

export function BlogPosts({
  showFilter = false,
  showPagination = false,
  fixedCategory,
  showCategoryFilter = false,
}: BlogPostsProps) {
  const [posts, setPosts] = useState<any[]>([])
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType | null>(null)
  const [category, setCategory] = useState<CategoryType>('all')
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)

  const fetchPosts = useCallback(async (currentSession: Session | null) => {
    setIsLoading(true)

    let query = supabase
      .from('posts')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (!isAdminSession(currentSession)) {
      query = query.eq('published', true)
    } else if (filter === 'published') {
      query = query.eq('published', true)
    } else if (filter === 'draft') {
      query = query.eq('published', false)
    }

    if (fixedCategory) {
      query = query.eq('category', fixedCategory)
    } else if (showCategoryFilter) {
      query = query.neq('category', 'experience')
      if (category !== 'all') {
        query = query.eq('category', category)
      }
    }

    if (showPagination) {
      const from = page * PAGE_SIZE
      const to = from + PAGE_SIZE - 1
      query = query.range(from, to)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Supabase error:', error.message)
      setPosts([])
      setTotalCount(0)
    } else {
      setPosts(data || [])
      setTotalCount(count || 0)
    }

    setIsLoading(false)
  }, [filter, page, fixedCategory, category, showCategoryFilter, showPagination])

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      await fetchPosts(session)
    }
    init()

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setPage(0)
      fetchPosts(session)
    })

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    fetchPosts(session)
  }, [filter, page, fixedCategory, category, fetchPosts])

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  if (isLoading) {
    return <div className="text-sm text-neutral-600 dark:text-neutral-400">로딩 중...</div>
  }

  if (!Array.isArray(posts) || posts.length === 0) {
    return <div className="text-sm text-neutral-500 py-4">글이 없습니다.</div>
  }

  return (
    <div>
      {/* 카테고리 + 공개/비공개 필터 */}
      {showFilter && (
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {showCategoryFilter && (['all', 'study', 'diary'] as const).map((cat) => (
            <button
              key={cat}
              className={`px-3 py-1 rounded-sm text-xs font-medium transition-colors ${
                category === cat
                  ? 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900'
                  : 'bg-[#efe4bb]/50 text-neutral-600 hover:bg-[#efe4bb] dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700'
              }`}
              onClick={() => { setCategory(cat); setPage(0) }}
            >
              {cat === 'all' ? 'All' : cat === 'study' ? 'Study' : 'Diary'}
            </button>
          ))}
          {isAdminSession(session) && (
            <>
              {showCategoryFilter && <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-700 mx-1" />}
              <button
                className={`px-3 py-1 rounded-sm text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  filter === 'published'
                    ? 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900'
                    : 'bg-[#efe4bb]/50 text-neutral-600 hover:bg-[#efe4bb] dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700'
                }`}
                onClick={() => { setFilter(filter === 'published' ? null : 'published'); setPage(0) }}
              >
                <Eye className="w-3.5 h-3.5" />
                공개
              </button>
              <button
                className={`px-3 py-1 rounded-sm text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  filter === 'draft'
                    ? 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900'
                    : 'bg-[#efe4bb]/50 text-neutral-600 hover:bg-[#efe4bb] dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700'
                }`}
                onClick={() => { setFilter(filter === 'draft' ? null : 'draft'); setPage(0) }}
              >
                <EyeClosed className="w-3.5 h-3.5" />
                비공개
              </button>
            </>
          )}
        </div>
      )}

      {/* 포스트 목록 */}
      <div className="w-full flex flex-col gap-8">
        {posts.map((post) => (
          <PostItem key={post.slug} post={post} isAdmin={isAdminSession(session)} />
        ))}
      </div>

      {/* 페이징 */}
      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-neutral-600 dark:text-neutral-400 tabular-nums">
            {page + 1} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

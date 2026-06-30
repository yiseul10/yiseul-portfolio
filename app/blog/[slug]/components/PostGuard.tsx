// app/blog/[slug]/components/PostGuard.tsx
'use client'
import { useEffect, useState } from 'react'
import { supabase } from "@lib/superbase"
import type { Session } from '@supabase/supabase-js'
import { AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { isAdminSession } from '@lib/auth/client'

interface PostGuardProps {
    published: boolean
    children: React.ReactNode
}

export function PostGuard({ published, children }: PostGuardProps) {
    const [session, setSession] = useState<Session | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setIsLoading(false)

            // 비공개 포스트인데 로그인 안 되어있으면 404로 리다이렉트
            if (!published && !isAdminSession(session)) {
                router.push('/404')
            }
        })

        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)

            // 로그아웃하면 비공개 포스트는 404로
            if (!published && !isAdminSession(session)) {
                router.push('/404')
            }
        })

        return () => {
            authListener?.subscription.unsubscribe()
        }
    }, [published, router])

    // 로딩 중
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                    로딩 중...
                </div>
            </div>
        )
    }

    // 비공개인데 권한 없으면 아무것도 렌더링 안 함 (리다이렉트 처리됨)
    if (!published && !isAdminSession(session)) {
        return null
    }

    return (
        <>
            {/* 임시저장 배지 */}
            {!published && isAdminSession(session) && (
                <div className="mb-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                    <span className="text-xs text-yellow-800 dark:text-yellow-200 font-medium">
            임시저장 포스트
          </span>
                </div>
            )}
            {children}
        </>
    )
}

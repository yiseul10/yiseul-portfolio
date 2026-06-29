'use client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { supabase } from "@lib/superbase"
import type { Session } from '@supabase/supabase-js'
import type { LucideIcon } from 'lucide-react'
import { isAdminSession } from '@lib/auth/client'

interface AuthButtonProps {
    icon: LucideIcon
    label: string
    variant?: 'default' | 'outline' | 'destructive' | 'secondary' | 'ghost' | 'link'
    onClick: () => void
    size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function AuthButton({
                               icon: Icon,
                               label,
                               variant = 'outline',
                               onClick,
                               size = 'sm'
                           }: AuthButtonProps) {
    const [session, setSession] = useState<Session | null>(null)

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
        })

        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
        })

        return () => {
            authListener?.subscription.unsubscribe()
        }
    }, [])

    if (!isAdminSession(session)) return null

    return (
        <Button
            variant={variant}
            size={size}
            className="flex items-center gap-2 cursor-pointer"
            onClick={onClick}
        >
            <Icon className="h-4 w-4" />
            {label}
        </Button>
    )
}

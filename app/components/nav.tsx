'use client'
import Link from 'next/link'
import {Button} from "@/components/ui/button";
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import type { ComponentType } from 'react'

import type { Session } from '@supabase/supabase-js'
import {supabase} from "@lib/superbase";
import { HomeIcon } from '@/app/components/icons/home'

const navItems: Record<string, { name: string; icon?: ComponentType<{ className?: string }>; authOnly: boolean }> = {
  '/': {
    name: 'Home',
    icon: HomeIcon,
    authOnly: false,
  },
  '/work': {
    name: 'Work',
    authOnly: false,
  },
  '/blog': {
    name: 'Blog',
    authOnly: false,
  },
  '/resume': {
    name: 'Resume',
    authOnly: false,
  },
  '/chat-report': {
    name: 'Report',
    authOnly: true,
  },
}

export function Navbar() {
  const pathname = usePathname()
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

  return (
    <aside className="-ml-[8px] mb-16 tracking-tight print:hidden">
      <div className="lg:sticky lg:top-20">
        <nav
          className="flex flex-row justify-between relative px-0 pb-0 fade md:overflow-auto scroll-pr-6 md:relative"
          id="nav"
        >
          <div className="flex flex-row space-x-0 pr-10">
            {Object.entries(navItems).map(([path, { name, icon: Icon, authOnly }]) => {
              if (authOnly && !session) return null
              const isActive = path === '/' ? pathname === '/' : pathname.startsWith(path)
              return (
                <Link
                  key={path}
                  href={path}
                  className={`transition-all border rounded-sm flex items-center gap-1 relative  px-2 m-1.5 ${
                    isActive
                      ? 'border-transparent cursor-default'
                      : 'border-transparent hover:bg-neutral-300/40 hover:border-neutral-300'
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  <span className="text-xs font-semibold tracking-wider text-neutral-800 dark:text-neutral-200">{name.toLocaleUpperCase()}</span>
                </Link>
              )
            })}
          </div>
          <div className="hidden md:flex justify-end">
            {session ? (
              <Button variant="link" onClick={() => supabase.auth.signOut()}>
                <span className="text-xs">Logout</span>
              </Button>
            ) : (
              <Button variant="link">
                <Link href="/login">
                  <div className="text-xs">Login</div>
                </Link>
              </Button>
            )}
          </div>
        </nav>
      </div>
    </aside>
  )
}

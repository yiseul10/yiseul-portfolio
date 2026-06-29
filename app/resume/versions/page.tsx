import { redirect } from 'next/navigation'
import { createServerSupabase } from '@lib/supabase-server'
import { VersionList } from './components/VersionList'
import { Button } from '@/components/ui/button'
import { Plus, MoveLeft } from 'lucide-react'
import Link from 'next/link'
import { getAdminSession } from '@lib/auth/admin'

export const dynamic = 'force-dynamic'

export default async function VersionsPage() {
  const supabase = await createServerSupabase()
  const session = await getAdminSession(supabase)

  if (!session) redirect('/login')

  const { data: versions } = await supabase
    .from('resume_versions')
    .select('id, name, memo, is_active, created_at, updated_at')
    .order('updated_at', { ascending: false })

  return (
    <section className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/resume">
            <Button variant="ghost" size="sm">
              <MoveLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Resume Versions</h1>
        </div>
        <Link href="/resume/edit?new=1">
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-1" /> 새 버전
          </Button>
        </Link>
      </div>
      <VersionList versions={versions || []} />
    </section>
  )
}

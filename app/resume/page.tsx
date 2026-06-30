import { ResumeTemplate } from './components/ResumeTemplate'
import { CoverLetterTemplate } from './components/CoverLetterTemplate'
import { ResumeActions } from './components/ResumeActions'
import { defaultResumeData } from '@lib/types/resume'
import { createServerSupabase } from '@lib/supabase-server'
import { getAdminUser } from '@lib/auth/admin'
import { getPublicResumeData } from '@lib/resume/public'

export const dynamic = 'force-dynamic'

export default async function ResumePage() {
  const supabase = await createServerSupabase()
  const adminUser = await getAdminUser(supabase)

  const version = adminUser
    ? await supabase
        .from('resume_versions')
        .select('*')
        .eq('is_active', true)
        .single()
        .then(({ data }) => data)
    : null

  const raw = adminUser
    ? version?.resume_data || {}
    : await getPublicResumeData(supabase)
  const coverLetter = adminUser ? version?.cover_letter || null : null

  const resumeData = {
    ...defaultResumeData,
    ...raw,
    profile: { ...defaultResumeData.profile, ...(raw.profile || {}) },
  }

  return (
    <section className="resume-page">
      {/* 액션 버튼: 항상 렌더, AuthButton이 클라이언트에서 인증 체크 */}
      <div className="print:hidden flex justify-end mb-6 gap-2">
        <ResumeActions
          versionId={adminUser ? version?.id : undefined}
          versionName={adminUser ? version?.name : undefined}
          profileName={resumeData.profile.name}
        />
      </div>

      <ResumeTemplate data={resumeData} authenticated={!!adminUser} />

      {/* 커버레터: 서버 세션 기준으로 렌더 (민감 데이터이므로 서버 체크 유지) */}
      {adminUser && coverLetter && (
        <div id="cover-letter-section" className="print:break-before-page mt-12 print:mt-0">
          <div className="print:hidden border-t border-neutral-200 dark:border-neutral-700 pt-8 mt-8">
            <h2 className="text-lg font-semibold mb-4">Cover Letter</h2>
          </div>
          <CoverLetterTemplate data={coverLetter} profile={resumeData.profile} />
        </div>
      )}
    </section>
  )
}

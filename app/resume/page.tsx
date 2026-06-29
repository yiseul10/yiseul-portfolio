import { ResumeTemplate } from './components/ResumeTemplate'
import { CoverLetterTemplate } from './components/CoverLetterTemplate'
import { ResumeActions } from './components/ResumeActions'
import { defaultResumeData } from '@lib/types/resume'
import { createServerSupabase } from '@lib/supabase-server'
import { getAdminSession } from '@lib/auth/admin'

export const dynamic = 'force-dynamic'

export default async function ResumePage() {
  const supabase = await createServerSupabase()
  const session = await getAdminSession(supabase)

  // resume_versions에서 활성 버전 로드
  const { data: version } = await supabase
    .from('resume_versions')
    .select('*')
    .eq('is_active', true)
    .single()

  const raw = version?.resume_data || {}
  const coverLetter = version?.cover_letter || null

  // 비인증 사용자: 민감정보 제거
  if (!session) {
    if (raw.profile) {
      delete raw.profile.phone
      delete raw.profile.photo
    }
    delete raw.education
    delete raw.customSections
  }

  const resumeData = {
    ...defaultResumeData,
    ...raw,
    profile: { ...defaultResumeData.profile, ...(raw.profile || {}) },
  }

  return (
    <section className="resume-page">
      {/* 액션 버튼: 항상 렌더, AuthButton이 클라이언트에서 인증 체크 */}
      <div className="print:hidden flex justify-end mb-6 gap-2">
        <ResumeActions versionId={version?.id} versionName={version?.name} profileName={resumeData.profile.name} />
      </div>

      <ResumeTemplate data={resumeData} authenticated={!!session} />

      {/* 커버레터: 서버 세션 기준으로 렌더 (민감 데이터이므로 서버 체크 유지) */}
      {session && coverLetter && (
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

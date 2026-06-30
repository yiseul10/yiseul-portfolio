import type { SupabaseClient } from '@supabase/supabase-js'
import type { ResumeData } from '@lib/types/resume'
import { createAdminSupabase } from '@lib/supabase-admin'

function sanitizePublicResume(raw: Record<string, unknown>): Partial<ResumeData> {
  const profile = raw.profile && typeof raw.profile === 'object' && !Array.isArray(raw.profile)
    ? raw.profile as Record<string, unknown>
    : {}

  return {
    ...raw,
    profile: {
      name: typeof profile.name === 'string' ? profile.name : '',
      title: typeof profile.title === 'string' ? profile.title : '',
      email: typeof profile.email === 'string' ? profile.email : '',
      linkedin: typeof profile.linkedin === 'string' ? profile.linkedin : '',
      website: typeof profile.website === 'string' ? profile.website : '',
      phone: '',
      photo: '',
    },
    education: [],
    customSections: [],
  } as Partial<ResumeData>
}

export async function getPublicResumeData(supabase: SupabaseClient): Promise<Partial<ResumeData>> {
  const { data, error } = await supabase.rpc('get_public_resume_data')

  if (!error) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return {}
    }

    return data as Partial<ResumeData>
  }

  // 마이그레이션 적용 전에는 RPC가 없을 수 있다. 이 경우에만 기존 공개 active row를
  // 읽어 앱 레벨에서 안전 필드만 남기는 폴백을 사용한다.
  if (error.code === '42883' || error.message.includes('get_public_resume_data')) {
    const { data: version, error: versionError } = await supabase
      .from('resume_versions')
      .select('resume_data')
      .eq('is_active', true)
      .single()

    if (versionError) {
      throw versionError
    }

    const raw = version?.resume_data
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return {}
    }

    return sanitizePublicResume(raw as Record<string, unknown>)
  }

  throw error
}

export async function getPublicResumeDataFromAdmin(): Promise<Partial<ResumeData>> {
  const supabase = createAdminSupabase()
  const { data: version, error } = await supabase
    .from('resume_versions')
    .select('resume_data')
    .eq('is_active', true)
    .single()

  if (error) {
    throw error
  }

  const raw = version?.resume_data
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {}
  }

  return sanitizePublicResume(raw as Record<string, unknown>)
}

'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabase } from '@lib/supabase-server'
import type { ResumeData } from '@lib/types/resume'
import type { CoverLetterData } from '@lib/types/cover-letter'
import { requireAdminUser } from '@lib/auth/admin'

export async function revalidateResume() {
  revalidatePath('/resume')
  revalidatePath('/resume/versions')
}

// 활성 버전 가져오기
export async function getActiveVersion() {
  const supabase = await createServerSupabase()
  await requireAdminUser(supabase)
  const { data, error } = await supabase
    .from('resume_versions')
    .select('*')
    .eq('is_active', true)
    .single()
  return { data, error }
}

// 모든 버전 목록
export async function getAllVersions() {
  const supabase = await createServerSupabase()
  await requireAdminUser(supabase)
  const { data, error } = await supabase
    .from('resume_versions')
    .select('id, name, memo, is_active, created_at, updated_at')
    .order('updated_at', { ascending: false })
  return { data: data || [], error }
}

// 특정 버전 가져오기
export async function getVersion(id: string) {
  const supabase = await createServerSupabase()
  await requireAdminUser(supabase)
  const { data, error } = await supabase
    .from('resume_versions')
    .select('*')
    .eq('id', id)
    .single()
  return { data, error }
}

// 새 버전 생성
export async function createVersion(payload: {
  name: string
  memo?: string
  resume_data: ResumeData
  cover_letter?: CoverLetterData | null
}) {
  const supabase = await createServerSupabase()
  await requireAdminUser(supabase)
  const { data, error } = await supabase
    .from('resume_versions')
    .insert({
      name: payload.name,
      memo: payload.memo || '',
      resume_data: payload.resume_data,
      cover_letter: payload.cover_letter || null,
      is_active: false,
    })
    .select()
    .single()

  await revalidateResume()
  return { data, error }
}

// 버전 업데이트 (레쥬메 + 커버레터 데이터)
export async function updateVersion(id: string, payload: {
  name?: string
  memo?: string
  resume_data?: ResumeData
  cover_letter?: CoverLetterData | null
}) {
  const supabase = await createServerSupabase()
  await requireAdminUser(supabase)
  const { error } = await supabase
    .from('resume_versions')
    .update(payload)
    .eq('id', id)

  await revalidateResume()
  return { error }
}

// 활성 버전 전환 (RPC로 트랜잭션 보장)
export async function setActiveVersion(id: string) {
  const supabase = await createServerSupabase()
  await requireAdminUser(supabase)

  const { error } = await supabase.rpc('set_active_version', { version_id: id })

  await revalidateResume()
  return { error }
}

// 버전 삭제
export async function deleteVersion(id: string) {
  const supabase = await createServerSupabase()
  await requireAdminUser(supabase)

  // 활성 버전은 삭제 불가
  const { data } = await supabase
    .from('resume_versions')
    .select('is_active')
    .eq('id', id)
    .single()

  if (data?.is_active) {
    return { error: { message: '활성 버전은 삭제할 수 없습니다.' } }
  }

  const { error } = await supabase
    .from('resume_versions')
    .delete()
    .eq('id', id)

  await revalidateResume()
  return { error }
}

// 버전 복제
export async function duplicateVersion(id: string, newName: string) {
  const supabase = await createServerSupabase()
  await requireAdminUser(supabase)
  const { data: source } = await supabase
    .from('resume_versions')
    .select('name, resume_data, cover_letter')
    .eq('id', id)
    .single()

  if (!source) return { error: { message: '원본 버전을 찾을 수 없습니다.' } }

  return createVersion({
    name: newName,
    memo: `원본에서 복제됨`,
    resume_data: source.resume_data,
    cover_letter: source.cover_letter,
  })
}

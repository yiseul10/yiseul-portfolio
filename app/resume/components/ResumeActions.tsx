'use client'

import { useEffect, useRef, useState } from 'react'
import { Download, Pencil, Layers } from 'lucide-react'
import { AuthButton } from '@/app/blog/[slug]/components/AuthButton'
import { useRouter } from 'next/navigation'

interface ResumeActionsProps {
  versionId?: string
  versionName?: string
  profileName?: string
}

type PrintScope = 'all' | 'resume' | 'career'

const PRINT_OPTIONS: { scope: PrintScope; label: string; suffix: string }[] = [
  { scope: 'all', label: '전체 (이력서 + 경력기술서)', suffix: '이력서_경력기술서' },
  { scope: 'resume', label: '이력서만', suffix: '이력서' },
  { scope: 'career', label: '경력기술서(커버레터)만', suffix: '경력기술서' },
]

const sanitizePrintTitle = (value: string) =>
  value.replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, '').trim()

export function ResumeActions({ versionId, versionName, profileName }: ResumeActionsProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // 메뉴 바깥 클릭 시 닫기
  useEffect(() => {
    if (!open) return
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  const handlePrint = (scope: PrintScope, suffix: string) => {
    setOpen(false)

    const resumeContent = document.querySelector('.resume-content') as HTMLElement | null
    const coverSection = document.getElementById('cover-letter-section')
    const name = sanitizePrintTitle(profileName || '김이슬') || '김이슬'
    const originalTitle = document.title

    let restored = false
    const restorePrintState = () => {
      if (restored) return
      restored = true
      document.title = originalTitle
      if (resumeContent) {
        resumeContent.style.display = ''
        resumeContent.style.pageBreakAfter = ''
      }
      if (coverSection) {
        coverSection.style.display = ''
        coverSection.style.breakBefore = ''
        coverSection.style.pageBreakBefore = ''
      }
      window.removeEventListener('afterprint', restorePrintState)
      window.removeEventListener('focus', restorePrintState)
    }

    document.title = `${name}_${suffix}`

    // 범위별로 인쇄 대상 외 문서를 숨김 (인라인 스타일 → 인쇄에 즉시 반영)
    if (scope === 'resume' && coverSection) {
      // 이력서만: 커버레터 숨김 + 본문 뒤 강제 page-break 해제(빈 페이지 방지)
      coverSection.style.display = 'none'
      if (resumeContent) resumeContent.style.pageBreakAfter = 'auto'
    } else if (scope === 'career' && resumeContent) {
      // 경력기술서만: 이력서 본문 숨김 + 커버레터 앞 page-break 해제(빈 첫 페이지 방지)
      resumeContent.style.display = 'none'
      if (coverSection) {
        coverSection.style.breakBefore = 'auto'
        coverSection.style.pageBreakBefore = 'auto'
      }
    }

    window.addEventListener('afterprint', restorePrintState)
    window.addEventListener('focus', restorePrintState)

    try {
      window.print()
    } catch (error) {
      restorePrintState()
      throw error
    }
  }

  return (
    <>
      <AuthButton
        icon={Layers}
        label="버전 관리"
        variant="outline"
        size="sm"
        onClick={() => router.push('/resume/versions')}
      />
      <AuthButton
        icon={Pencil}
        label="수정"
        variant="outline"
        size="sm"
        onClick={() => router.push(versionId ? `/resume/edit?v=${versionId}` : '/resume/edit')}
      />
      <div ref={menuRef} className="relative inline-block">
        <AuthButton
          icon={Download}
          label="PDF 다운로드"
          variant="outline"
          size="sm"
          onClick={() => setOpen((prev) => !prev)}
        />
        {open && (
          <div className="absolute right-0 z-20 mt-2 w-60 rounded-md border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
            {PRINT_OPTIONS.map((opt) => (
              <button
                key={opt.scope}
                type="button"
                className="flex w-full items-center px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
                onClick={() => handlePrint(opt.scope, opt.suffix)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

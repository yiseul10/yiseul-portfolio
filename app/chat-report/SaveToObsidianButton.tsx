'use client'

import { useState } from 'react'

interface SaveToObsidianButtonProps {
  content: string
  fileName: string
}

export function SaveToObsidianButton({ content, fileName }: SaveToObsidianButtonProps) {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSave = async () => {
    setStatus('saving')
    setMessage('')

    try {
      const response = await fetch('/api/chat-report/save-note', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, fileName }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || '저장에 실패했습니다.')
      }

      setStatus('saved')
      setMessage(data?.path || '')
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : '저장에 실패했습니다.')
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleSave}
        disabled={status === 'saving'}
        className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900"
      >
        {status === 'saving' ? 'Obsidian 저장 중...' : 'Obsidian에 저장'}
      </button>
      {status === 'saved' && (
        <p className="text-xs text-emerald-600 break-all dark:text-emerald-400">
          저장 완료: {message}
        </p>
      )}
      {status === 'error' && (
        <p className="text-xs text-red-600 break-all dark:text-red-400">
          저장 실패: {message}
        </p>
      )}
    </div>
  )
}

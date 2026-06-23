'use client'

import { type FormEvent, useRef, useEffect } from 'react'
import { MAX_INPUT_LENGTH } from '@lib/chat/constants'

interface ChatInputProps {
  input: string
  isLoading: boolean
  isOpen: boolean
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onSubmit: (e: FormEvent<HTMLFormElement>) => void
  onStop: () => void
}

export function ChatInput({ input, isLoading, isOpen, onInputChange, onSubmit, onStop }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 자동 높이 조절
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px'
    }
  }, [input])

  // 패널이 열릴 때 입력창에 포커스 (a11y)
  useEffect(() => {
    if (isOpen) {
      textareaRef.current?.focus()
    }
  }, [isOpen])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (input.trim() && !isLoading) {
        onSubmit(e as unknown as FormEvent<HTMLFormElement>)
      }
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="px-3.5 py-3 border-t border-gray-100 dark:border-zinc-800 flex flex-col gap-1"
    >
      <div className="flex gap-2 items-end">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={onInputChange}
          onKeyDown={handleKeyDown}
          placeholder="메시지를 입력하세요..."
          disabled={isLoading}
          rows={1}
          maxLength={MAX_INPUT_LENGTH}
          aria-label="메시지 입력"
          className="flex-1 px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm outline-none resize-none disabled:opacity-50 placeholder:text-zinc-400 text-zinc-900 dark:text-zinc-100"
        />
        {isLoading ? (
          <button
            type="button"
            onClick={onStop}
            aria-label="응답 중단"
            className="w-9 h-9 bg-zinc-900 dark:bg-zinc-100 rounded-xl flex items-center justify-center text-white dark:text-zinc-900 flex-shrink-0 hover:opacity-80 transition-opacity"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="2" width="10" height="10" rx="2" />
            </svg>
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            aria-label="메시지 보내기"
            className="w-9 h-9 bg-zinc-900 dark:bg-zinc-100 rounded-xl flex items-center justify-center text-white dark:text-zinc-900 text-sm flex-shrink-0 disabled:opacity-30 hover:opacity-80 transition-opacity"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 12V4M8 4L4 8M8 4L12 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
      </div>
      {input.length > 0 && (
        <div className="text-[10px] text-zinc-400 text-right pr-11">
          {input.length}/{MAX_INPUT_LENGTH}
        </div>
      )}
    </form>
  )
}

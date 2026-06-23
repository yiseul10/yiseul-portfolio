'use client'

import { useState, useEffect, useCallback } from 'react'
import { useChat } from '@ai-sdk/react'
import Image from 'next/image'
import { ChatMessages } from './ChatMessages'
import { ChatInput } from './ChatInput'
import {Bot} from "lucide-react";
import { toast } from 'sonner'

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [remaining, setRemaining] = useState<number | null>(null)
  const [rateLimitError, setRateLimitError] = useState(false)
  const [inputValue, setInputValue] = useState('')

  const {
    messages,
    status,
    sendMessage,
    setMessages,
    stop,
    error,
  } = useChat({
    onError(error) {
      console.error('Chat error:', error)
      if (error.message.includes('429') || error.message.includes('제한')) {
        setRateLimitError(true)
        setRemaining(0)
      } else {
        toast.error('답변을 생성하는 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.')
      }
    },
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  // 남은 횟수 초기 조회
  const fetchRemaining = useCallback(async () => {
    try {
      const res = await fetch('/api/chat')
      const data = await res.json()
      setRemaining(data.remaining)
      setRateLimitError(data.remaining <= 0)
    } catch {
      // 무시
    }
  }, [])

  useEffect(() => {
    if (isOpen && remaining === null) {
      fetchRemaining()
    }
  }, [isOpen, remaining, fetchRemaining])

  // 메시지 전송 후 남은 횟수 업데이트
  useEffect(() => {
    if (status === 'ready' && messages.length > 0) {
      fetchRemaining()
    }
  }, [status, messages.length, fetchRemaining])

  // Esc 키로 패널 닫기 (a11y)
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isLoading) return

    const text = inputValue
    setInputValue('')
    await sendMessage({ text })
  }

  const handleSuggestionClick = async (text: string) => {
    if (isLoading) return
    await sendMessage({ text })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value)
  }

  const toggleOpen = () => {
    setIsOpen((prev) => !prev)
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  return (
    <>
      {/* 채팅 패널 */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="이슬 챗봇"
        aria-hidden={!isOpen}
        className={`fixed bottom-24 right-4 left-4 sm:left-auto sm:right-8 sm:w-[380px] h-[520px] max-h-[calc(100vh-7rem)] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-zinc-800 z-50 transition-all duration-300 origin-bottom-right ${
          isOpen
            ? 'scale-100 opacity-100 pointer-events-auto'
            : 'scale-95 opacity-0 pointer-events-none'
        }`}
      >
        {/* 스크롤 영역 (헤더 + 메시지) — 헤더가 sticky로 떠서 대화가 뒤로 비침 */}
        <div className="flex-1 overflow-y-auto">
          {/* 헤더 (글래스모피즘) */}
          <div className="sticky top-0 z-10 px-4 py-3.5 bg-white/5 dark:bg-black/60 backdrop-blur-xs text-neutral-800 flex items-center border-b border-white/10 rounded-t-2xl">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center">
                <Bot className="text-neutral-800 font-serif font-black text-xl"/>
              </div>
              <div>
                <div className="font-semibold text-sm">이슬이에게 물어보세요</div>
                <div className="text-[10px] text-zinc-400 mt-0.5">
                  프로젝트와 업무 방식에 대해 물어보세요
                </div>
              </div>
            </div>
          </div>

          {/* 메시지 영역 */}
          <ChatMessages
            messages={messages}
            isLoading={isLoading}
            onSelectSuggestion={handleSuggestionClick}
          />
        </div>

        {/* Rate limit 에러 메시지 */}
        {rateLimitError ? (
          <div className="px-3.5 py-3 border-t border-gray-100 dark:border-zinc-800 text-center text-sm text-zinc-500">
            오늘은 여기까지! 내일 다시 물어봐주세요 😊
          </div>
        ) : (
          <ChatInput
            input={inputValue}
            isLoading={isLoading}
            isOpen={isOpen}
            onInputChange={handleInputChange}
            onSubmit={handleSubmit}
            onStop={stop}
          />
        )}

        {/* 남은 횟수 */}
        {remaining !== null && (
          <div className="text-center pb-2 text-[10px] text-zinc-400">
            오늘 남은 횟수: {remaining}/20
          </div>
        )}
      </div>

      {/* FAB 버튼 */}
      <button
        onClick={toggleOpen}
        className="cursor-pointer fixed bottom-8 right-8 w-14 h-14 bg-neutral-800 shadow-xl shadow-amber-200/50  dark:bg-zinc-100 rounded-full flex items-center justify-center hover:scale-105 transition-all duration-200 z-50 print:hidden"
        aria-label="챗봇 열기/닫기"
      >
        {isOpen ? (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-white dark:text-zinc-900">
            <path d="M5 5L15 15M5 15L15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center">
            <Bot className="text-white font-serif font-black text-xl"/>
          </div>
        )}
      </button>
    </>
  )
}

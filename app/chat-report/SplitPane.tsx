'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

const MIN = 25
const MAX = 75
const STEP = 3

export function SplitPane({
  left,
  right,
  storageKey,
}: {
  left: ReactNode
  right: ReactNode
  storageKey?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const percentRef = useRef(50)
  const [leftPercent, setLeftPercent] = useState(50)
  const [isDesktop, setIsDesktop] = useState(false)
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const update = () => setIsDesktop(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (!storageKey) return
    const saved = Number(localStorage.getItem(storageKey))
    if (saved >= MIN && saved <= MAX) {
      percentRef.current = saved
      setLeftPercent(saved)
    }
  }, [storageKey])

  const commit = (next: number) => {
    const clamped = Math.min(MAX, Math.max(MIN, next))
    percentRef.current = clamped
    setLeftPercent(clamped)
    if (storageKey) localStorage.setItem(storageKey, String(Math.round(clamped)))
  }

  useEffect(() => {
    if (!dragging) return

    const onMove = (event: PointerEvent) => {
      const el = containerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const pct = ((event.clientX - rect.left) / rect.width) * 100
      const clamped = Math.min(MAX, Math.max(MIN, pct))
      percentRef.current = clamped
      setLeftPercent(clamped)
    }
    const onUp = () => {
      setDragging(false)
      if (storageKey) localStorage.setItem(storageKey, String(Math.round(percentRef.current)))
    }

    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [dragging, storageKey])

  if (!isDesktop) {
    return (
      <div className="flex flex-col gap-6">
        {left}
        {right}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="grid items-start"
      style={{ gridTemplateColumns: `${leftPercent}fr 12px ${100 - leftPercent}fr` }}
    >
      <div className="min-w-0 pr-1">{left}</div>

      <div
        role="separator"
        aria-orientation="vertical"
        aria-valuenow={Math.round(leftPercent)}
        aria-valuemin={MIN}
        aria-valuemax={MAX}
        aria-label="좌우 너비 조절"
        tabIndex={0}
        title="드래그하여 너비 조절 (더블클릭: 5:5)"
        onPointerDown={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDoubleClick={() => commit(50)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') {
            event.preventDefault()
            commit(percentRef.current - STEP)
          } else if (event.key === 'ArrowRight') {
            event.preventDefault()
            commit(percentRef.current + STEP)
          }
        }}
        className="group flex cursor-col-resize touch-none select-none items-center justify-center self-stretch rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
      >
        <span
          className={`h-12 w-1 rounded-full transition-colors ${
            dragging
              ? 'bg-neutral-500 dark:bg-neutral-300'
              : 'bg-neutral-300 group-hover:bg-neutral-400 dark:bg-neutral-700 dark:group-hover:bg-neutral-500'
          }`}
        />
      </div>

      <div className="min-w-0 pl-1">{right}</div>
    </div>
  )
}

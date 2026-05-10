'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'

type MermaidDiagramProps = {
  chart: string
}

function getDiagramTheme() {
  const isDarkClass = document.documentElement.classList.contains('dark')
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

  return isDarkClass || prefersDark ? 'dark' : 'default'
}

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const renderCountRef = useRef(0)
  const baseId = useMemo(() => `mermaid-${Math.random().toString(36).slice(2)}`, [])
  const [svg, setSvg] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const renderDiagram = async () => {
      const source = chart.trim()

      if (!source) {
        setSvg('')
        setError('')
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError('')

      try {
        const { default: mermaid } = await import('mermaid')
        const renderId = `${baseId}-${renderCountRef.current++}`

        mermaid.initialize({
          startOnLoad: false,
          theme: getDiagramTheme(),
          securityLevel: 'strict',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        })

        const { svg: renderedSvg, bindFunctions } = await mermaid.render(renderId, source)

        if (cancelled) return

        setSvg(renderedSvg)
        window.requestAnimationFrame(() => {
          if (containerRef.current) {
            bindFunctions?.(containerRef.current)
          }
        })
      } catch (renderError) {
        if (cancelled) return

        const message = renderError instanceof Error
          ? renderError.message
          : '다이어그램을 렌더링하지 못했습니다.'

        setSvg('')
        setError(message)
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    renderDiagram()

    const observer = new MutationObserver(renderDiagram)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
    mediaQuery.addEventListener('change', renderDiagram)

    return () => {
      cancelled = true
      observer.disconnect()
      mediaQuery.removeEventListener('change', renderDiagram)
    }
  }, [baseId, chart])

  return (
    <div className="mermaid-diagram">
      {isLoading && (
        <div className="mermaid-diagram-placeholder">다이어그램을 렌더링하는 중...</div>
      )}

      {!isLoading && error && (
        <div className="mermaid-diagram-error">
          <p>{error}</p>
          <pre>
            <code>{chart}</code>
          </pre>
        </div>
      )}

      {!isLoading && !error && (
        <div
          ref={containerRef}
          className="mermaid-diagram-svg"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      )}
    </div>
  )
}

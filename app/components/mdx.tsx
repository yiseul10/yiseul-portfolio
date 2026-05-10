import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { highlight } from 'sugar-high'
import React from 'react'
import { MermaidDiagram } from 'app/components/mermaid-diagram'

/** 빈 줄 보존: 코드펜스 안은 건드리지 않고 &nbsp;·연속 빈 줄만 시각적 간격으로 변환 */
function preserveSpacing(source: string): string {
  // 코드블록을 placeholder로 마스킹 (정규식이 mermaid 등 코드 내부를 깨뜨리는 것 방지)
  const blocks: string[] = []
  let result = source.replace(/```[\s\S]*?```/g, (m) => {
    blocks.push(m)
    return `\x00CB${blocks.length - 1}\x00`
  })

  // 에디터에서 보존한 &nbsp; 줄 → 시각적 빈 줄로 변환
  result = result.replace(/\n\n&nbsp;\n\n/g, '\n\n<div class="spacer" style="height:1.5em"></div>\n\n')
  // 연속 빈 줄(3개 이상 개행)도 처리
  result = result.replace(/\n{3,}/g, (match) => {
    const extraBreaks = match.length - 2
    const spacers = Array(extraBreaks).fill('<div class="spacer" style="height:1.5em"></div>').join('\n')
    return '\n\n' + spacers + '\n\n'
  })

  // 코드블록 복원
  return result.replace(/\x00CB(\d+)\x00/g, (_, i) => blocks[+i])
}

function Table({ data }) {
  let headers = data.headers.map((header, index) => (
    <th key={index}>{header}</th>
  ))
  let rows = data.rows.map((row, index) => (
    <tr key={index}>
      {row.map((cell, cellIndex) => (
        <td key={cellIndex}>{cell}</td>
      ))}
    </tr>
  ))

  return (
    <table>
      <thead>
        <tr>{headers}</tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  )
}

function slugify(str) {
  return str
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/&/g, '-and-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
}

function createHeading(level) {
  const Heading = ({ children }) => {
    let slug = slugify(String(children))
    return React.createElement(
      `h${level}`,
      { id: slug },
      [
        React.createElement('a', {
          href: `#${slug}`,
          key: `link-${slug}`,
          className: 'anchor',
        }),
      ],
      children
    )
  }
  Heading.displayName = `Heading${level}`
  return Heading
}

function getTextContent(node: React.ReactNode): string {
  return React.Children.toArray(node).map((child) => {
    if (typeof child === 'string' || typeof child === 'number') return String(child)
    if (React.isValidElement(child)) return getTextContent((child as React.ReactElement<any>).props.children)
    return ''
  }).join('')
}

const components = {
  h1: createHeading(1),
  h2: createHeading(2),
  h3: createHeading(3),
  h4: createHeading(4),
  h5: createHeading(5),
  h6: createHeading(6),
  img: ({ alt, src, ...props }) => (
    <img
      alt={alt || ''}
      src={typeof src === 'string' ? src : ''}
      className="rounded-lg"
      loading="lazy"
      decoding="async"
      {...props}
    />
  ),
  a: ({ href, children, ...props }) => {
    if (!href) return <a {...props}>{children}</a>
    if (href.startsWith('/')) return <Link href={href} {...props}>{children}</Link>
    if (href.startsWith('#')) return <a href={href} {...props}>{children}</a>
    return <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>
  },
  pre: ({ children, ...props }) => {
    const codeChild = React.Children.toArray(children).find(
      (child) => React.isValidElement(child) && (child as React.ReactElement<any>).props?.className?.startsWith('language-')
    )
    const lang = React.isValidElement(codeChild)
      ? ((codeChild as React.ReactElement<any>).props.className as string)?.replace('language-', '') || ''
      : ''
    const codeContent = React.isValidElement(codeChild)
      ? ((codeChild as React.ReactElement<any>).props['data-raw-code'] || getTextContent((codeChild as React.ReactElement<any>).props.children))
      : getTextContent(children)

    if (lang === 'mermaid') {
      return <MermaidDiagram chart={String(codeContent).replace(/\n$/, '')} />
    }

    return (
      <div className="code-block-wrapper">
        {lang && <div className="code-block-lang">{lang}</div>}
        <pre {...props}>{children}</pre>
      </div>
    )
  },
  code: ({ children, className, ...props }) => {
    const content = getTextContent(children)
    const language = className?.replace('language-', '')

    if (language === 'mermaid') {
      return (
        <code className={className} {...props} data-raw-code={content}>
          {content}
        </code>
      )
    }

    // className이 있거나 (language 지정), 줄바꿈이 포함되면 코드 블록
    const isCodeBlock = !!className || content.includes('\n')
    if (!isCodeBlock) {
      return <code className="inline-code" {...props}>{children}</code>
    }
    const codeHTML = highlight(content.replace(/\n$/, ''))
    return <code className={className} dangerouslySetInnerHTML={{ __html: codeHTML }} {...props} />
  },
}

export function CustomMDX({ source, components: extraComponents }: { source: string, components?: Record<string, any> }) {
  const processed = preserveSpacing(source || '')
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{ ...components, ...(extraComponents || {}) } as any}
    >
      {processed}
    </ReactMarkdown>
  )
}

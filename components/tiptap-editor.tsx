'use client'

import React, { useEffect, useCallback, useState, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import Highlight from '@tiptap/extension-highlight'
import Color from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { Markdown } from 'tiptap-markdown'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Bold, Italic, Strikethrough, Underline as UnderlineIcon, Code,
  List, ListOrdered, ListChecks,
  Quote, CodeSquare, Minus,
  TableIcon, Link as LinkIcon, Unlink, ImageIcon,
  Undo, Redo,
  Trash2,
  AlignLeft, AlignCenter, AlignRight,
  Highlighter, Palette, RemoveFormatting,
  ChevronDown, Type,
  Plus, X,
  Upload, Workflow, Loader2,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────
interface TiptapEditorProps {
  value: string
  onChange: (markdown: string) => void
  uploadImage?: (file: File) => Promise<string>
}

// ─── Constants ───────────────────────────────────────────
const HIGHLIGHT_COLORS = [
  { label: '없음',  color: '' },
  { label: '노랑',  color: '#fef08a' },
  { label: '초록',  color: '#bbf7d0' },
  { label: '파랑',  color: '#bfdbfe' },
  { label: '분홍',  color: '#fecdd3' },
  { label: '보라',  color: '#e9d5ff' },
  { label: '주황',  color: '#fed7aa' },
]

const TEXT_COLORS = [
  { label: '기본', color: '' },
  { label: '검정', color: '#111111' },
  { label: '빨강', color: '#ef4444' },
  { label: '주황', color: '#f97316' },
  { label: '초록', color: '#22c55e' },
  { label: '파랑', color: '#3b82f6' },
  { label: '보라', color: '#a855f7' },
  { label: '회색', color: '#6b7280' },
]

const TEXT_SIZES = [
  { label: '본문',   value: 'paragraph', level: 0 },
  { label: '제목 1', value: 'heading',   level: 1 },
  { label: '제목 2', value: 'heading',   level: 2 },
  { label: '제목 3', value: 'heading',   level: 3 },
  { label: '제목 4', value: 'heading',   level: 4 },
]

// ─── Shared Components ──────────────────────────────────
function ToolbarButton({
  onClick, active = false, disabled = false, tooltip, children,
}: {
  onClick: () => void; active?: boolean; disabled?: boolean; tooltip: string; children: React.ReactNode
}) {
  return (
    <Button type="button" variant={active ? 'default' : 'ghost'} size="icon-sm"
      onClick={onClick} disabled={disabled} title={tooltip}
    >
      {children}
    </Button>
  )
}

function TableToolbarButton({
  onClick, tooltip, variant = 'default', children,
}: {
  onClick: () => void; tooltip: string; variant?: 'default' | 'danger'; children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={tooltip}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors
        ${variant === 'danger'
          ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950'
          : 'text-foreground hover:bg-accent'
        }`}
    >
      {children}
    </button>
  )
}

function Dropdown({
  trigger, children, align = 'left',
}: {
  trigger: React.ReactNode; children: React.ReactNode; align?: 'left' | 'right'
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <div className={`absolute top-full mt-1 bg-background border rounded-lg shadow-lg z-30 ${align === 'right' ? 'right-0' : 'left-0'}`}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  )
}

// ─── Text Size Selector ──────────────────────────────────
function TextSizeSelector({ editor }: { editor: any }) {
  const getCurrentLabel = () => {
    for (let i = 1; i <= 4; i++) {
      if (editor.isActive('heading', { level: i })) return `제목 ${i}`
    }
    return '본문'
  }

  return (
    <Dropdown
      trigger={
        <Button type="button" variant="ghost" size="sm" className="gap-1 min-w-[72px] justify-between text-xs">
          <Type className="h-3.5 w-3.5" />
          {getCurrentLabel()}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      }
    >
      <div className="py-1 min-w-[120px]">
        {TEXT_SIZES.map((item) => {
          const isActive = item.level === 0
            ? !editor.isActive('heading')
            : editor.isActive('heading', { level: item.level })
          return (
            <button
              key={item.label} type="button"
              className={`w-full text-left px-3 py-1.5 text-sm hover:bg-accent transition-colors ${isActive ? 'bg-accent font-semibold' : ''}`}
              onClick={() => {
                if (item.level === 0) {
                  editor.chain().focus().setParagraph().run()
                } else {
                  editor.chain().focus().toggleHeading({ level: item.level as 1|2|3|4 }).run()
                }
              }}
            >
              {item.label}
            </button>
          )
        })}
      </div>
    </Dropdown>
  )
}

// ─── Color Picker ────────────────────────────────────────
function ColorPicker({
  colors, onSelect, activeColor, icon: Icon, tooltip,
}: {
  colors: { label: string; color: string }[]; onSelect: (color: string) => void;
  activeColor?: string; icon: any; tooltip: string
}) {
  return (
    <Dropdown
      trigger={
        <Button type="button" variant={activeColor ? 'default' : 'ghost'} size="icon-sm" title={tooltip}>
          <div className="relative">
            <Icon className="h-4 w-4" />
            {activeColor && (
              <div className="absolute -bottom-0.5 left-0.5 right-0.5 h-1 rounded-full" style={{ backgroundColor: activeColor }} />
            )}
          </div>
        </Button>
      }
    >
      <div className="py-1.5 px-1 min-w-[140px]">
        <div className="text-[10px] text-muted-foreground mb-1 px-2">{tooltip}</div>
        {colors.map((c) => {
          const isActive = c.color ? activeColor === c.color : !activeColor
          return (
            <button key={c.color || 'none'} type="button"
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-accent transition-colors text-sm ${isActive ? 'bg-accent font-semibold' : ''}`}
              onClick={() => onSelect(c.color)}
            >
              <span
                className="w-4 h-4 rounded-sm border border-border shrink-0 flex items-center justify-center"
                style={{ backgroundColor: c.color || 'transparent' }}
              >
                {!c.color && <span className="text-[9px] text-muted-foreground leading-none">✕</span>}
              </span>
              <span>{c.label}</span>
            </button>
          )
        })}
      </div>
    </Dropdown>
  )
}

// ─── Table Menu (sub-toolbar) ────────────────────────────
function TableMenu({ editor }: { editor: any }) {
  if (!editor || !editor.isActive('table')) return null

  return (
    <div className="flex flex-wrap items-center gap-1 border-t px-2 py-1.5 bg-muted/50">
      <span className="text-[11px] text-muted-foreground font-semibold mr-1">테이블 편집</span>

      <Separator orientation="vertical" className="mx-0.5 h-5" />

      <TableToolbarButton onClick={() => editor.chain().focus().addRowBefore().run()} tooltip="현재 행 위에 새 행 추가">
        <Plus className="h-3 w-3" /> 위에 행 추가
      </TableToolbarButton>
      <TableToolbarButton onClick={() => editor.chain().focus().addRowAfter().run()} tooltip="현재 행 아래에 새 행 추가">
        <Plus className="h-3 w-3" /> 아래에 행 추가
      </TableToolbarButton>
      <TableToolbarButton onClick={() => editor.chain().focus().deleteRow().run()} tooltip="현재 커서가 있는 행 삭제" variant="danger">
        <X className="h-3 w-3" /> 행 삭제
      </TableToolbarButton>

      <Separator orientation="vertical" className="mx-0.5 h-5" />

      <TableToolbarButton onClick={() => editor.chain().focus().addColumnBefore().run()} tooltip="현재 열 왼쪽에 새 열 추가">
        <Plus className="h-3 w-3" /> 왼쪽에 열 추가
      </TableToolbarButton>
      <TableToolbarButton onClick={() => editor.chain().focus().addColumnAfter().run()} tooltip="현재 열 오른쪽에 새 열 추가">
        <Plus className="h-3 w-3" /> 오른쪽에 열 추가
      </TableToolbarButton>
      <TableToolbarButton onClick={() => editor.chain().focus().deleteColumn().run()} tooltip="현재 커서가 있는 열 삭제" variant="danger">
        <X className="h-3 w-3" /> 열 삭제
      </TableToolbarButton>

      <Separator orientation="vertical" className="mx-0.5 h-5" />

      <TableToolbarButton onClick={() => editor.chain().focus().toggleHeaderRow().run()} tooltip="첫 번째 행을 헤더로 전환/해제">
        <TableIcon className="h-3 w-3" /> 헤더 토글
      </TableToolbarButton>
      <TableToolbarButton onClick={() => editor.chain().focus().mergeCells().run()} tooltip="선택한 셀들을 하나로 병합">
        셀 병합
      </TableToolbarButton>
      <TableToolbarButton onClick={() => editor.chain().focus().splitCell().run()} tooltip="병합된 셀을 다시 분할">
        셀 분할
      </TableToolbarButton>

      <Separator orientation="vertical" className="mx-0.5 h-5" />

      <TableToolbarButton onClick={() => editor.chain().focus().deleteTable().run()} tooltip="테이블 전체 삭제" variant="danger">
        <Trash2 className="h-3 w-3" /> 테이블 삭제
      </TableToolbarButton>
    </div>
  )
}

// ─── Main Toolbar ────────────────────────────────────────
function Toolbar({
  editor,
  uploadImage,
}: {
  editor: any
  uploadImage?: (file: File) => Promise<string>
}) {
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  const addLink = useCallback(() => {
    if (!editor) return
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL을 입력하세요', previousUrl || '')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  const insertImage = useCallback((src: string, alt = '') => {
    if (!editor) return
    editor.chain().focus().setImage({ src, alt }).run()
  }, [editor])

  const addImageByUrl = useCallback(() => {
    if (!editor) return
    const url = window.prompt('이미지 URL을 입력하세요')
    if (!url) return

    const alt = window.prompt('이미지 설명을 입력하세요 (선택)', '') || ''
    insertImage(url.trim(), alt.trim())
  }, [editor, insertImage])

  const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget
    const file = input.files?.[0]
    input.value = ''

    if (!file || !uploadImage) return

    try {
      setIsUploadingImage(true)
      const imageUrl = await uploadImage(file)
      const fallbackAlt = file.name.replace(/\.[^.]+$/, '')
      insertImage(imageUrl, fallbackAlt)
    } catch (error) {
      const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
      window.alert(`이미지 업로드 실패: ${message}`)
    } finally {
      setIsUploadingImage(false)
    }
  }, [insertImage, uploadImage])

  const insertMermaidDiagram = useCallback(() => {
    if (!editor) return

    editor.chain().focus().insertContent([
      {
        type: 'codeBlock',
        attrs: { language: 'mermaid' },
        content: [
          {
            type: 'text',
            text: 'flowchart TD\n    A[Idea] --> B[Draft]\n    B --> C{Review}\n    C -->|Ship| D[Publish]\n    C -->|Revise| B',
          },
        ],
      },
      { type: 'paragraph' },
    ]).run()
  }, [editor])

  if (!editor) return null

  return (
    <div className="bg-background border-b shrink-0">
      <div className="flex flex-wrap items-center gap-0.5 p-1.5">

        {/* ── 실행취소 ── */}
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} tooltip="실행취소 (Ctrl+Z)">
          <Undo className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} tooltip="다시실행 (Ctrl+Y)">
          <Redo className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1.5 h-6" />

        {/* ── 텍스트 크기 ── */}
        <TextSizeSelector editor={editor} />

        <Separator orientation="vertical" className="mx-1.5 h-6" />

        {/* ── 서식 ── */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} tooltip="굵게 (Ctrl+B)">
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} tooltip="기울임 (Ctrl+I)">
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} tooltip="밑줄 (Ctrl+U)">
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} tooltip="취소선">
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} tooltip="인라인 코드">
          <Code className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1.5 h-6" />

        {/* ── 색상 ── */}
        <ColorPicker
          colors={TEXT_COLORS}
          onSelect={(color) => {
            if (!color) editor.chain().focus().unsetColor().run()
            else editor.chain().focus().setColor(color).run()
          }}
          activeColor={editor.getAttributes('textStyle').color || undefined}
          icon={Palette} tooltip="글자색"
        />
        <ColorPicker
          colors={HIGHLIGHT_COLORS}
          onSelect={(color) => {
            if (!color) editor.chain().focus().unsetHighlight().run()
            else editor.chain().focus().toggleHighlight({ color }).run()
          }}
          activeColor={editor.isActive('highlight') ? editor.getAttributes('highlight').color : undefined}
          icon={Highlighter} tooltip="배경색 (하이라이트)"
        />
        <ToolbarButton onClick={() => editor.chain().focus().unsetAllMarks().run()} tooltip="서식 제거">
          <RemoveFormatting className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1.5 h-6" />

        {/* ── 정렬 ── */}
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} tooltip="왼쪽 정렬">
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} tooltip="가운데 정렬">
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} tooltip="오른쪽 정렬">
          <AlignRight className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1.5 h-6" />

        {/* ── 목록 ── */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} tooltip="글머리 목록">
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} tooltip="번호 목록">
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive('taskList')} tooltip="체크리스트">
          <ListChecks className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1.5 h-6" />

        {/* ── 블록 ── */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} tooltip="인용 블록">
          <Quote className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} tooltip="코드 블록">
          <CodeSquare className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} tooltip="구분선">
          <Minus className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1.5 h-6" />

        {/* ── 삽입 ── */}
        <ToolbarButton onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} tooltip="테이블 삽입 (3x3)">
          <TableIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={addLink} active={editor.isActive('link')} tooltip="링크 삽입/수정">
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>
        {editor.isActive('link') && (
          <ToolbarButton onClick={() => editor.chain().focus().unsetLink().run()} tooltip="링크 해제">
            <Unlink className="h-4 w-4" />
          </ToolbarButton>
        )}
        <Dropdown
          align="right"
          trigger={
            <Button type="button" variant="ghost" size="icon-sm" title="이미지 삽입" disabled={isUploadingImage}>
              {isUploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
            </Button>
          }
        >
          <div className="py-1 min-w-[168px]">
            <button
              type="button"
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent transition-colors"
              onClick={addImageByUrl}
            >
              <LinkIcon className="h-3.5 w-3.5" />
              URL로 삽입
            </button>
            {uploadImage && (
              <button
                type="button"
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent transition-colors disabled:opacity-60"
                onClick={() => imageInputRef.current?.click()}
                disabled={isUploadingImage}
              >
                <Upload className="h-3.5 w-3.5" />
                업로드해서 삽입
              </button>
            )}
          </div>
        </Dropdown>
        <ToolbarButton onClick={insertMermaidDiagram} tooltip="Mermaid 다이어그램 삽입">
          <Workflow className="h-4 w-4" />
        </ToolbarButton>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
      </div>

      {/* ── 테이블 커서 시 서브 툴바 자동 표시 ── */}
      <TableMenu editor={editor} />
    </div>
  )
}

// ─── Editor ──────────────────────────────────────────────
export const TiptapEditor = React.forwardRef<HTMLDivElement, TiptapEditorProps>(
  ({ value, onChange, uploadImage }, ref) => {
    const editor = useEditor({
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3, 4] },
        }),
        Table.configure({ resizable: false }),
        TableRow,
        TableHeader,
        TableCell,
        Link.configure({ openOnClick: false, autolink: true }),
        Image,
        Placeholder.configure({ placeholder: '내용을 작성하세요...' }),
        Highlight.configure({ multicolor: true }),
        Color,
        TextStyle,
        Underline,
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
        TaskList,
        TaskItem.configure({ nested: true }),
        Markdown.configure({
          html: true,
          transformPastedText: true,
          transformCopiedText: true,
        }),
      ],
      content: value,
      onUpdate: ({ editor }) => {
        // ProseMirror 문서 트리를 순회하여 빈 paragraph를 &nbsp;로 보존
        const doc = editor.state.doc
        const fragments: string[] = []
        doc.forEach((node) => {
          if (node.type.name === 'paragraph' && node.textContent.trim() === '') {
            fragments.push('&nbsp;')
          }
        })

        let md = (editor.storage as any).markdown.getMarkdown()

        // 빈 paragraph가 있었다면 마크다운에서도 보존
        // 단, 코드블록 내부의 \n\n\n까지 치환되지 않도록 펜스를 placeholder로 보호
        if (fragments.length > 0) {
          const blocks: string[] = []
          let masked = md.replace(/```[\s\S]*?```/g, (m: string) => {
            blocks.push(m)
            return `\x00CB${blocks.length - 1}\x00`
          })
          masked = masked.replace(/\n\n\n/g, '\n\n&nbsp;\n\n')
          md = masked.replace(/\x00CB(\d+)\x00/g, (_: string, i: string) => blocks[+i])
        }

        onChange(md)
      },
      editorProps: {
        handleKeyDown: (view, event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            const { state, dispatch } = view
            const { $from } = state.selection

            // 인용 블록 안인지 확인
            for (let d = $from.depth; d > 0; d--) {
              if ($from.node(d).type.name === 'blockquote') {
                const isEmpty = $from.parent.content.size === 0
                if (isEmpty) {
                  // 빈 줄: 기본 동작(빠져나가기) 허용
                  return false
                }
                // 내용 있는 줄: hard break 삽입 (줄바꿈)
                const { tr } = state
                const hardBreak = state.schema.nodes.hardBreak
                if (hardBreak) {
                  dispatch(tr.replaceSelectionWith(hardBreak.create()).scrollIntoView())
                  return true
                }
                break
              }
            }
          }
          return false
        },
      },
    })

    useEffect(() => {
      if (editor && value && !editor.isFocused) {
        const currentMd = (editor.storage as any).markdown.getMarkdown()
        if (value !== currentMd) {
          editor.commands.setContent(value)
        }
      }
    }, [value, editor])

    return (
      <div ref={ref} className="border rounded-lg flex flex-col max-h-[70vh]">
        <Toolbar editor={editor} uploadImage={uploadImage} />
        <div className="overflow-auto flex-1">
          <div className="prose max-w-none dark:prose-invert">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
    )
  }
)

TiptapEditor.displayName = 'TiptapEditor'

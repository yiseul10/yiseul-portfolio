'use client'

import { Suspense, useEffect, useState, useRef, useMemo } from 'react'
import { useForm, FormProvider, useFieldArray, useFormContext } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  AlertTriangle,
  Loader2,
  MoveLeft,
  Check,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  ImagePlus,
  X,
  GripVertical,
} from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@lib/superbase'
import { toast } from 'sonner'
import { updateVersion, createVersion } from '@/app/resume/actions'
import { z } from 'zod'
import {
  resumeSchema,
  defaultResumeData,
  type ResumeData,
} from '@lib/types/resume'
import { coverLetterSchema, defaultCoverLetterData } from '@lib/types/cover-letter'
import { CoverLetterSection } from './components/CoverLetterSection'
import type { Session } from '@supabase/supabase-js'
import { isAdminSession } from '@lib/auth/client'

// 편집 폼 스키마: 레쥬메 + 커버레터 + 버전 메타
const editFormSchema = resumeSchema.extend({
  cover_letter: coverLetterSchema.nullable().default(null),
  _versionName: z.string().default(''),
  _versionMemo: z.string().default(''),
})
type EditFormData = z.infer<typeof editFormSchema>

// ─── Descriptions List ──────────────────────────────────
// 3단계 × 불렛 on/off = 6 상태
const LEVEL_CONFIG = [
  { symbol: '',  indent: 0,  label: '1단계',       bullet: false, next: 1 },
  { symbol: '•', indent: 0,  label: '1단계 (•)',   bullet: true,  next: 2 },
  { symbol: '',  indent: 20, label: '2단계',       bullet: false, next: 3 },
  { symbol: '◦', indent: 20, label: '2단계 (◦)',   bullet: true,  next: 4 },
  { symbol: '',  indent: 40, label: '3단계',       bullet: false, next: 5 },
  { symbol: '‣', indent: 40, label: '3단계 (‣)',   bullet: true,  next: 0 },
]

// ─── Sortable Description Item ──────────────────────────
function SortableDescriptionItem({
  id,
  index,
  desc,
  onUpdateText,
  onCycleLevel,
  onToggleBold,
  onToggleItalic,
  onRemove,
  onInsertBelow,
}: {
  id: string
  index: number
  desc: any
  onUpdateText: (i: number, value: string) => void
  onCycleLevel: (i: number) => void
  onToggleBold: (i: number) => void
  onToggleItalic: (i: number) => void
  onRemove: (i: number) => void
  onInsertBelow: (i: number) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const level = desc.level ?? 0
  const config = LEVEL_CONFIG[level] || LEVEL_CONFIG[0]
  const depthLabel = Math.floor(level / 2) + 1

  return (
    <div ref={setNodeRef} style={{ ...style, paddingLeft: config.indent }} className="flex items-start gap-1.5">
      <button
        type="button"
        className="mt-2.5 text-neutral-300 hover:text-neutral-500 cursor-grab active:cursor-grabbing shrink-0 touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <button
        type="button"
        className="w-5 text-center text-neutral-400 text-sm shrink-0 hover:text-neutral-700 cursor-pointer mt-2.5"
        title={`클릭하여 변경 (현재: ${config.label})`}
        onClick={() => onCycleLevel(index)}
      >
        {config.symbol || `${depthLabel}`}
      </button>
      <Textarea
        className={`flex-1 min-h-[36px] resize-none ${desc.bold ? 'font-bold' : ''} ${desc.italic ? 'italic' : ''}`}
        rows={2}
        placeholder="업무 내용을 입력하세요"
        value={desc.text || ''}
        onChange={(e) => onUpdateText(index, e.target.value)}
      />
      <div className="flex flex-col gap-0.5 mt-1">
        <button
          type="button"
          className={`h-6 w-6 flex items-center justify-center text-xs font-bold rounded cursor-pointer transition-colors ${desc.bold ? 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900' : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
          title="굵게"
          onClick={() => onToggleBold(index)}
        >
          B
        </button>
        <button
          type="button"
          className={`h-6 w-6 flex items-center justify-center text-xs italic rounded cursor-pointer transition-colors ${desc.italic ? 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900' : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
          title="기울임"
          onClick={() => onToggleItalic(index)}
        >
          I
        </button>
      </div>
      <div className="flex flex-col gap-0.5 mt-1">
        <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0" title="아래에 항목 추가" onClick={() => onInsertBelow(index)}>
          <Plus className="h-3 w-3 text-neutral-400" />
        </Button>
        <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => onRemove(index)}>
          <Trash2 className="h-3 w-3 text-red-500" />
        </Button>
      </div>
    </div>
  )
}

function DescriptionsList({ expIndex }: { expIndex: number }) {
  const { setValue, watch } = useFormContext<ResumeData>()
  const descriptions = watch(`experience.${expIndex}.descriptions`) || []

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  // 각 항목에 stable ID 부여
  const itemIds = useMemo(
    () => descriptions.map((_: any, i: number) => `desc-${expIndex}-${i}`),
    [descriptions.length, expIndex]
  )

  const addItem = () => {
    setValue(`experience.${expIndex}.descriptions`, [
      ...descriptions,
      { text: '', level: 1, bold: false, italic: false },
    ])
  }

  const insertBelow = (i: number) => {
    const updated = [...descriptions]
    updated.splice(i + 1, 0, { text: '', level: descriptions[i]?.level ?? 1, bold: false, italic: false })
    setValue(`experience.${expIndex}.descriptions`, updated)
  }

  const removeItem = (i: number) => {
    setValue(
      `experience.${expIndex}.descriptions`,
      descriptions.filter((_: any, idx: number) => idx !== i)
    )
  }

  const updateText = (i: number, value: string) => {
    const updated = [...descriptions]
    updated[i] = { ...updated[i], text: value }
    setValue(`experience.${expIndex}.descriptions`, updated)
  }

  const cycleLevel = (i: number) => {
    const updated = [...descriptions]
    const current = updated[i].level ?? 1
    const config = LEVEL_CONFIG[current] || LEVEL_CONFIG[1]
    updated[i] = { ...updated[i], level: config.next }
    setValue(`experience.${expIndex}.descriptions`, updated)
  }

  const toggleBold = (i: number) => {
    const updated = [...descriptions]
    updated[i] = { ...updated[i], bold: !updated[i].bold }
    setValue(`experience.${expIndex}.descriptions`, updated)
  }

  const toggleItalic = (i: number) => {
    const updated = [...descriptions]
    updated[i] = { ...updated[i], italic: !updated[i].italic }
    setValue(`experience.${expIndex}.descriptions`, updated)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = itemIds.indexOf(active.id as string)
    const newIndex = itemIds.indexOf(over.id as string)
    if (oldIndex === -1 || newIndex === -1) return

    const updated = [...descriptions]
    const [moved] = updated.splice(oldIndex, 1)
    updated.splice(newIndex, 0, moved)
    setValue(`experience.${expIndex}.descriptions`, updated)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">업무 내용</span>
        <Button type="button" variant="ghost" size="sm" onClick={addItem}>
          <Plus className="h-3 w-3 mr-1" /> 항목 추가
        </Button>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          {descriptions.map((desc: any, i: number) => (
            <SortableDescriptionItem
              key={itemIds[i]}
              id={itemIds[i]}
              index={i}
              desc={desc}
              onUpdateText={updateText}
              onCycleLevel={cycleLevel}
              onToggleBold={toggleBold}
              onToggleItalic={toggleItalic}
              onRemove={removeItem}
              onInsertBelow={insertBelow}
            />
          ))}
        </SortableContext>
      </DndContext>
      {descriptions.length === 0 && (
        <p className="text-xs text-neutral-400">항목 추가 버튼을 눌러 업무 내용을 추가하세요</p>
      )}
    </div>
  )
}

// ─── Reusable: Array item controls ──────────────────────
function ItemControls({
  index,
  total,
  onMove,
  onRemove,
}: {
  index: number
  total: number
  onMove: (from: number, to: number) => void
  onRemove: (i: number) => void
}) {
  return (
    <div className="flex gap-1">
      <Button type="button" variant="ghost" size="sm" disabled={index === 0} onClick={() => onMove(index, index - 1)}>
        <ChevronUp className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="sm" disabled={index === total - 1} onClick={() => onMove(index, index + 1)}>
        <ChevronDown className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(index)}>
        <Trash2 className="h-4 w-4 text-red-500" />
      </Button>
    </div>
  )
}

// ─── Experience Section ─────────────────────────────────
function ExperienceSection() {
  const { control } = useFormContext<ResumeData>()
  const { fields, append, remove, move } = useFieldArray({ control, name: 'experience' })

  return (
    <section className="space-y-4 pt-2">
      <div className="flex items-center justify-between">
        <SectionTitleInput name="sectionTitles.experience" />
        <Button type="button" variant="outline" size="sm" onClick={() => append({ company: '', role: '', subtitle: '', startDate: '', endDate: '현재', descriptions: [] })}>
          <Plus className="h-4 w-4 mr-1" /> 추가
        </Button>
      </div>
      {fields.map((field, index) => (
        <div key={field.id} className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-500">#{index + 1}</span>
            <ItemControls index={index} total={fields.length} onMove={move} onRemove={remove} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField control={control} name={`experience.${index}.company`} render={({ field }) => (
              <FormItem><FormLabel>회사명</FormLabel><FormControl><Input placeholder="회사명" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={control} name={`experience.${index}.role`} render={({ field }) => (
              <FormItem><FormLabel>직책</FormLabel><FormControl><Input placeholder="Frontend Developer" {...field} /></FormControl></FormItem>
            )} />
            <FormField control={control} name={`experience.${index}.startDate`} render={({ field }) => (
              <FormItem><FormLabel>시작일</FormLabel><FormControl><Input placeholder="2023.01" {...field} /></FormControl></FormItem>
            )} />
            <FormField control={control} name={`experience.${index}.endDate`} render={({ field }) => (
              <FormItem><FormLabel>종료일</FormLabel><FormControl><Input placeholder="현재" {...field} /></FormControl></FormItem>
            )} />
          </div>
          <FormField control={control} name={`experience.${index}.subtitle`} render={({ field }) => (
            <FormItem><FormLabel>한줄 설명</FormLabel><FormControl><Input placeholder="역할에 대한 간단한 설명 (선택)" {...field} /></FormControl></FormItem>
          )} />
          <DescriptionsList expIndex={index} />
        </div>
      ))}
    </section>
  )
}

// ─── Skills Section ─────────────────────────────────────
function SkillsSection() {
  const { control } = useFormContext<ResumeData>()
  const { fields, append, remove, move } = useFieldArray({ control, name: 'skills' })

  return (
    <section className="space-y-4 pt-2">
      <div className="flex items-center justify-between">
        <SectionTitleInput name="sectionTitles.skills" />
        <Button type="button" variant="outline" size="sm" onClick={() => append({ category: '', items: '' })}>
          <Plus className="h-4 w-4 mr-1" /> 추가
        </Button>
      </div>
      {fields.map((field, index) => (
        <div key={field.id} className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-500">#{index + 1}</span>
            <ItemControls index={index} total={fields.length} onMove={move} onRemove={remove} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField control={control} name={`skills.${index}.category`} render={({ field }) => (
              <FormItem><FormLabel>카테고리 (선택)</FormLabel><FormControl><Input placeholder="Frontend" {...field} /></FormControl></FormItem>
            )} />
            <FormField control={control} name={`skills.${index}.items`} render={({ field }) => (
              <FormItem><FormLabel>스킬 (쉼표로 구분)</FormLabel><FormControl><Input placeholder="React, Next.js, TypeScript" {...field} /></FormControl></FormItem>
            )} />
          </div>
        </div>
      ))}
    </section>
  )
}

// ─── Education Section ──────────────────────────────────
function EducationSection() {
  const { control } = useFormContext<ResumeData>()
  const { fields, append, remove, move } = useFieldArray({ control, name: 'education' })

  return (
    <section className="space-y-4 pt-2">
      <div className="flex items-center justify-between">
        <SectionTitleInput name="sectionTitles.education" />
        <Button type="button" variant="outline" size="sm" onClick={() => append({ school: '', major: '', startDate: '', endDate: '' })}>
          <Plus className="h-4 w-4 mr-1" /> 추가
        </Button>
      </div>
      {fields.map((field, index) => (
        <div key={field.id} className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-500">#{index + 1}</span>
            <ItemControls index={index} total={fields.length} onMove={move} onRemove={remove} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField control={control} name={`education.${index}.school`} render={({ field }) => (
              <FormItem><FormLabel>학교명</FormLabel><FormControl><Input placeholder="학교명" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={control} name={`education.${index}.major`} render={({ field }) => (
              <FormItem><FormLabel>전공</FormLabel><FormControl><Input placeholder="전공" {...field} /></FormControl></FormItem>
            )} />
            <FormField control={control} name={`education.${index}.startDate`} render={({ field }) => (
              <FormItem><FormLabel>시작일</FormLabel><FormControl><Input placeholder="2017.03" {...field} /></FormControl></FormItem>
            )} />
            <FormField control={control} name={`education.${index}.endDate`} render={({ field }) => (
              <FormItem><FormLabel>종료일</FormLabel><FormControl><Input placeholder="2021.02" {...field} /></FormControl></FormItem>
            )} />
          </div>
        </div>
      ))}
    </section>
  )
}

// ─── Certifications Section ─────────────────────────────
function CertificationsSection() {
  const { control } = useFormContext<ResumeData>()
  const { fields, append, remove, move } = useFieldArray({ control, name: 'certifications' })

  return (
    <section className="space-y-4 pt-2">
      <div className="flex items-center justify-between">
        <SectionTitleInput name="sectionTitles.certifications" />
        <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '', startDate: '', endDate: '' })}>
          <Plus className="h-4 w-4 mr-1" /> 추가
        </Button>
      </div>
      {fields.map((field, index) => (
        <div key={field.id} className="flex items-center gap-2">
          <FormField control={control} name={`certifications.${index}.name`} render={({ field }) => (
            <FormItem className="flex-1"><FormControl><Input placeholder="자격증, 수상, 활동 등" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={control} name={`certifications.${index}.startDate`} render={({ field }) => (
            <FormItem className="w-28"><FormControl><Input placeholder="취득일" {...field} /></FormControl></FormItem>
          )} />
          <FormField control={control} name={`certifications.${index}.endDate`} render={({ field }) => (
            <FormItem className="w-28"><FormControl><Input placeholder="만료일" {...field} /></FormControl></FormItem>
          )} />
          <div className="flex gap-1 shrink-0">
            <ItemControls index={index} total={fields.length} onMove={move} onRemove={remove} />
          </div>
        </div>
      ))}
    </section>
  )
}

// ─── Custom Sections ────────────────────────────────────
function CustomSectionsEditor() {
  const { control, setValue, watch } = useFormContext<ResumeData>()
  const { fields, append, remove, move } = useFieldArray({ control, name: 'customSections' })

  return (
    <section className="space-y-4 pt-2">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">추가 섹션</h3>
        <Button type="button" variant="outline" size="sm" onClick={() => append({ title: '', layout: 'simple', items: [] })}>
          <Plus className="h-4 w-4 mr-1" /> 섹션 추가
        </Button>
      </div>
      {fields.map((field, sectionIndex) => {
        const layout = watch(`customSections.${sectionIndex}.layout`) || 'simple'
        return (
          <div key={field.id} className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <FormField control={control} name={`customSections.${sectionIndex}.title`} render={({ field }) => (
                <FormItem className="flex-1"><FormControl><Input placeholder="섹션 제목 (예: PROJECTS)" className="font-semibold" {...field} /></FormControl></FormItem>
              )} />
              <ItemControls index={sectionIndex} total={fields.length} onMove={move} onRemove={remove} />
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                className={`text-xs px-2.5 py-1 rounded-full border cursor-pointer transition-colors ${layout === 'simple' ? 'bg-neutral-800 text-white border-neutral-800 dark:bg-neutral-200 dark:text-neutral-900 dark:border-neutral-200' : 'border-neutral-300 dark:border-neutral-600 text-neutral-500 hover:border-neutral-400'}`}
                onClick={() => setValue(`customSections.${sectionIndex}.layout`, 'simple')}
              >
                한줄 + 날짜
              </button>
              <button
                type="button"
                className={`text-xs px-2.5 py-1 rounded-full border cursor-pointer transition-colors ${layout === 'detailed' ? 'bg-neutral-800 text-white border-neutral-800 dark:bg-neutral-200 dark:text-neutral-900 dark:border-neutral-200' : 'border-neutral-300 dark:border-neutral-600 text-neutral-500 hover:border-neutral-400'}`}
                onClick={() => setValue(`customSections.${sectionIndex}.layout`, 'detailed')}
              >
                타이틀 + 서브타이틀
              </button>
            </div>
            <CustomSectionItems sectionIndex={sectionIndex} layout={layout} />
          </div>
        )
      })}
    </section>
  )
}

function CustomSectionItems({ sectionIndex, layout }: { sectionIndex: number; layout: string }) {
  const { setValue, watch } = useFormContext<ResumeData>()
  const items = watch(`customSections.${sectionIndex}.items`) || []

  const addItem = () => {
    setValue(`customSections.${sectionIndex}.items`, [...items, { text: '', subtitle: '', startDate: '', endDate: '' }])
  }
  const removeItem = (i: number) => {
    setValue(`customSections.${sectionIndex}.items`, items.filter((_: any, idx: number) => idx !== i))
  }
  const updateField = (i: number, field: string, value: string) => {
    const updated = [...items]
    updated[i] = { ...updated[i], [field]: value }
    setValue(`customSections.${sectionIndex}.items`, updated)
  }

  return (
    <div className="space-y-2">
      {items.map((item: any, i: number) => (
        <div key={i} className="space-y-1.5">
          {layout === 'simple' ? (
            <div className="flex items-center gap-2">
              <Input className="flex-1" placeholder="내용" value={item.text || ''} onChange={(e) => updateField(i, 'text', e.target.value)} />
              <Input className="w-28" placeholder="시작일" value={item.startDate || ''} onChange={(e) => updateField(i, 'startDate', e.target.value)} />
              <Input className="w-28" placeholder="종료일" value={item.endDate || ''} onChange={(e) => updateField(i, 'endDate', e.target.value)} />
              <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(i)}>
                <Trash2 className="h-3 w-3 text-red-500" />
              </Button>
            </div>
          ) : (
            <div className="border border-neutral-100 dark:border-neutral-800 rounded-md p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Input className="flex-1" placeholder="타이틀" value={item.text || ''} onChange={(e) => updateField(i, 'text', e.target.value)} />
                <Input className="w-28" placeholder="시작일" value={item.startDate || ''} onChange={(e) => updateField(i, 'startDate', e.target.value)} />
                <Input className="w-28" placeholder="종료일" value={item.endDate || ''} onChange={(e) => updateField(i, 'endDate', e.target.value)} />
                <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(i)}>
                  <Trash2 className="h-3 w-3 text-red-500" />
                </Button>
              </div>
              <Input placeholder="서브타이틀 (선택)" value={item.subtitle || ''} onChange={(e) => updateField(i, 'subtitle', e.target.value)} />
            </div>
          )}
        </div>
      ))}
      <Button type="button" variant="ghost" size="sm" onClick={addItem}>
        <Plus className="h-3 w-3 mr-1" /> 항목 추가
      </Button>
    </div>
  )
}

// ─── Section Title Input ────────────────────────────────
function SectionTitleInput({ name }: { name: string }) {
  const { control } = useFormContext<ResumeData>()
  return (
    <FormField
      control={control}
      name={name as any}
      render={({ field }) => (
        <Input
          className="text-base font-semibold border-none p-0 h-auto focus-visible:ring-0 w-full"
          {...field}
        />
      )}
    />
  )
}

// ─── Keywords Input ─────────────────────────────────────
function KeywordsInput() {
  const { setValue, watch } = useFormContext<ResumeData>()
  const keywords = watch('keywords') || []
  const [input, setInput] = useState('')

  const addKeyword = () => {
    const trimmed = input.trim()
    if (trimmed && !keywords.includes(trimmed)) {
      setValue('keywords', [...keywords, trimmed])
      setInput('')
    }
  }

  const removeKeyword = (i: number) => {
    setValue('keywords', keywords.filter((_: string, idx: number) => idx !== i))
  }

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium">키워드 (해시태그)</span>
      <div className="flex flex-wrap gap-2">
        {keywords.map((kw: string, i: number) => (
          <span key={i} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800">
            #{kw}
            <button type="button" onClick={() => removeKeyword(i)} className="hover:text-red-500 cursor-pointer">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="키워드 입력 후 추가"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addKeyword() } }}
        />
        <Button type="button" variant="outline" size="sm" onClick={addKeyword}>추가</Button>
      </div>
    </div>
  )
}

// ─── Photo Upload ───────────────────────────────────────
function PhotoUpload() {
  const { setValue, watch } = useFormContext<ResumeData>()
  const photo = watch('profile.photo') || ''
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // 2MB 제한
    if (file.size > 2 * 1024 * 1024) {
      toast.error('이미지는 2MB 이하만 가능합니다.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setValue('profile.photo', reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const removePhoto = () => {
    setValue('profile.photo', '')
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium">증명사진</span>
      {photo ? (
        <div className="relative inline-block">
          <img src={photo} alt="Profile" className="w-28 h-36 object-cover border border-neutral-200 dark:border-neutral-700 rounded" />
          <button
            type="button"
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 cursor-pointer"
            onClick={removePhoto}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="w-28 h-36 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded flex flex-col items-center justify-center text-neutral-400 hover:border-neutral-400 cursor-pointer"
          onClick={() => fileRef.current?.click()}
        >
          <ImagePlus className="h-6 w-6 mb-1" />
          <span className="text-xs">사진 추가</span>
        </button>
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <p className="text-xs text-neutral-400">2MB 이하 JPG/PNG 권장</p>
    </div>
  )
}

// ─── Main Edit Page ─────────────────────────────────────
export default function ResumeEditPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <ResumeEditContent />
    </Suspense>
  )
}

// 구버전 cover_letter 포맷(named fields) → 새 sections 배열로 마이그레이션
function migrateCoverLetter(raw: any) {
  if (!raw) return null
  // 이미 새 포맷이면 그대로
  if (Array.isArray(raw.sections)) {
    return { sections: raw.sections.map((s: any) => ({ title: s.title || '', content: s.content || '' })) }
  }
  // 구버전: named fields → sections 배열로 변환
  const titles = raw.sectionTitles || {}
  const sections = [
    { title: titles.greeting || '인사말', content: raw.greeting || '' },
    { title: titles.motivation || '지원동기', content: raw.motivation || '' },
    { title: titles.experience || '관련 경험', content: raw.experience || '' },
    { title: titles.strengths || '강점', content: raw.strengths || '' },
    { title: titles.closing || '마무리', content: raw.closing || '' },
    ...(raw.customSections || []).map((s: any) => ({ title: s.title || '', content: s.content || '' })),
  ]
  return { sections }
}

function ResumeEditContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [resumeId, setResumeId] = useState<string | null>(null)

  const form = useForm<EditFormData>({
    resolver: zodResolver(editFormSchema) as any,
    defaultValues: {
      ...defaultResumeData,
      cover_letter: null,
      _versionName: '',
      _versionMemo: '',
    },
  })

  useEffect(() => {
    checkAuthAndLoad()
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (!isAdminSession(session)) router.push('/login')
    })
    return () => { authListener?.subscription.unsubscribe() }
  }, [])

  const checkAuthAndLoad = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!isAdminSession(session)) { setSession(null); setIsLoading(false); router.push('/login'); return }
      setSession(session)

      // resume_versions에서 로드 (쿼리 파라미터 v=<id>, new=1, 또는 활성 버전)
      // new=1: 활성 버전 데이터를 prefill하되 resumeId는 null로 유지 → 저장 시 createVersion
      const versionId = searchParams.get('v')
      const isNew = searchParams.get('new') === '1'
      let versionQuery = supabase.from('resume_versions').select('*')
      if (versionId) {
        versionQuery = versionQuery.eq('id', versionId)
      } else {
        versionQuery = versionQuery.eq('is_active', true)
      }
      const { data: version, error } = await versionQuery.single()

      if (error) console.error('Version fetch error:', error)

      if (version) {
        if (!isNew) setResumeId(version.id)
        const raw = version.resume_data || {}
        const migratedExperience = (raw.experience || []).map((exp: any) => ({
          ...exp,
          subtitle: exp.subtitle || '',
          descriptions: (exp.descriptions || []).map((d: any) =>
            typeof d === 'string'
              ? { text: d, level: 1, bold: false, italic: false }
              : { ...d, bold: d.bold ?? false, italic: d.italic ?? false }
          ),
        }))
        // certifications 마이그레이션 (날짜 필드 추가)
        const migratedCerts = (raw.certifications || []).map((c: any) => ({
          name: c.name || '',
          startDate: c.startDate || '',
          endDate: c.endDate || '',
        }))
        const merged: EditFormData = {
          ...defaultResumeData,
          ...raw,
          profile: { ...defaultResumeData.profile, ...(raw.profile || {}) },
          sectionTitles: { ...defaultResumeData.sectionTitles, ...(raw.sectionTitles || {}) },
          experience: migratedExperience,
          certifications: migratedCerts,
          keywords: raw.keywords || [],
          customSections: (raw.customSections || []).map((s: any) => ({
            ...s,
            layout: s.layout || 'simple',
            items: (s.items || []).map((item: any) => ({
              ...item,
              subtitle: item.subtitle || '',
            })),
          })),
          cover_letter: migrateCoverLetter(version.cover_letter),
          _versionName: isNew ? '' : (version.name || ''),
          _versionMemo: isNew ? '' : (version.memo || ''),
        }
        form.reset(merged)
      }
      setIsLoading(false)
    } catch (error) {
      console.error('Error:', error)
      setIsLoading(false)
    }
  }

  const onSubmit = async (values: EditFormData) => {
    setIsSaving(true)
    const { cover_letter, _versionName, _versionMemo, ...resumeData } = values

    const cleanedResumeData = {
      ...resumeData,
      experience: resumeData.experience.map((exp) => ({
        ...exp,
        descriptions: exp.descriptions.filter(
          (d: any) => (typeof d === 'string' ? d.trim() !== '' : d.text?.trim() !== '')
        ),
      })),
    }

    const payload = {
      name: _versionName || '이름 없는 버전',
      memo: _versionMemo,
      resume_data: cleanedResumeData,
      cover_letter: cover_letter,
    }

    let result
    if (resumeId) {
      result = await updateVersion(resumeId, payload)
    } else {
      result = await createVersion(payload)
      if (result.data) setResumeId(result.data.id)
    }

    if (result.error) {
      toast.error('저장 실패: ' + result.error.message)
    } else {
      setIsSaved(true)
      toast.success('저장되었습니다.')
      setTimeout(() => {
        setIsSaved(false)
        router.push('/resume')
        router.refresh()
      }, 2000)
    }
    setIsSaving(false)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!isAdminSession(session)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-neutral-500">
        <AlertTriangle className="h-8 w-8 mb-3 text-neutral-400" />
        <p className="text-lg font-medium">접근 권한 없음</p>
        <p className="text-sm mt-1">이 페이지에 접근할 권한이 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="editor-page w-full mx-auto">
      <Card className="p-6">
        <CardHeader><CardTitle>이력서 편집</CardTitle></CardHeader>
        <CardContent>
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-8 divide-y divide-neutral-200 dark:divide-neutral-700 text-left">

              {/* === 버전 정보 === */}
              <section className="space-y-3">
                <h3 className="text-base font-semibold">버전 정보</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField control={form.control} name="_versionName" render={({ field }) => (
                    <FormItem><FormLabel>버전 이름</FormLabel><FormControl><Input placeholder="예: 토스 지원용" {...field} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="_versionMemo" render={({ field }) => (
                    <FormItem><FormLabel>메모</FormLabel><FormControl><Input placeholder="간단한 메모 (선택)" {...field} /></FormControl></FormItem>
                  )} />
                </div>
              </section>

              {/* === Profile === */}
              <section className="space-y-3">
                <h3 className="text-base font-semibold">Profile</h3>
                <div className="flex flex-col-reverse sm:flex-row gap-6">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField control={form.control} name="profile.name" render={({ field }) => (
                      <FormItem><FormLabel>이름</FormLabel><FormControl><Input placeholder="이름" {...field} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="profile.title" render={({ field }) => (
                      <FormItem><FormLabel>직함</FormLabel><FormControl><Input placeholder="Frontend Developer" {...field} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="profile.email" render={({ field }) => (
                      <FormItem><FormLabel>이메일</FormLabel><FormControl><Input placeholder="email@example.com" {...field} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="profile.phone" render={({ field }) => (
                      <FormItem><FormLabel>연락처</FormLabel><FormControl><Input placeholder="010-0000-0000" {...field} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="profile.linkedin" render={({ field }) => (
                      <FormItem><FormLabel>LinkedIn</FormLabel><FormControl><Input placeholder="https://linkedin.com/in/..." {...field} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="profile.website" render={({ field }) => (
                      <FormItem><FormLabel>Portfolio</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl></FormItem>
                    )} />
                  </div>
                  <PhotoUpload />
                </div>
              </section>

              {/* === Summary + Keywords === */}
              <section className="space-y-3 pt-2">
                <SectionTitleInput name="sectionTitles.summary" />
                <FormField control={form.control} name="summaryHeadline" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-neutral-500">헤드라인 (대형 타이틀)</FormLabel>
                    <FormControl><Input placeholder="더 나은 삶을 위한 고민" {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="summary" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-neutral-500">본문</FormLabel>
                    <FormControl><Textarea placeholder="자기소개를 작성하세요" rows={4} {...field} /></FormControl>
                  </FormItem>
                )} />
                <KeywordsInput />
              </section>

              {/* === Array Sections === */}
              <ExperienceSection />
              <SkillsSection />
              <EducationSection />
              <CertificationsSection />
              <CustomSectionsEditor />

              {/* === Cover Letter === */}
              <CoverLetterSection />

              {/* === Actions === */}
              <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-neutral-200 dark:border-neutral-700 -mx-6 px-6 py-4 flex items-center justify-between mt-4">
                <Button type="button" className="cursor-pointer" variant="secondary" onClick={() => router.back()}>
                  <MoveLeft className="h-4 w-4" /> Back
                </Button>
                <Button type="submit" className={`cursor-pointer ${isSaved ? 'bg-green-600 hover:bg-green-600 text-white' : ''}`} disabled={isSaving || isSaved}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {isSaving ? '저장 중...' : isSaved ? '저장됨' : '저장'}
                </Button>
              </div>
            </form>
          </FormProvider>
        </CardContent>
      </Card>
    </div>
  )
}

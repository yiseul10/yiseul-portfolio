import { z } from 'zod'

export const coverLetterSectionSchema = z.object({
  title: z.string().default(''),
  content: z.string().default(''),
  hidden: z.boolean().default(false), // true면 /resume·PDF에서 제외 (편집기에는 표시)
})

export const coverLetterSchema = z.object({
  sections: z.array(coverLetterSectionSchema).default([
    { title: '인사말', content: '' },
    { title: '지원동기', content: '' },
    { title: '관련 경험', content: '' },
    { title: '강점', content: '' },
    { title: '마무리', content: '' },
  ]),
})

export type CoverLetterSection = z.infer<typeof coverLetterSectionSchema>
export type CoverLetterData = z.infer<typeof coverLetterSchema>

export const defaultCoverLetterData: CoverLetterData = {
  sections: [
    { title: '인사말', content: '', hidden: false },
    { title: '지원동기', content: '', hidden: false },
    { title: '관련 경험', content: '', hidden: false },
    { title: '강점', content: '', hidden: false },
    { title: '마무리', content: '', hidden: false },
  ],
}

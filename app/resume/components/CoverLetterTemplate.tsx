import type { CoverLetterData } from '@lib/types/cover-letter'
import type { Profile } from '@lib/types/resume'

interface CoverLetterTemplateProps {
  data: CoverLetterData
  profile?: Profile
}

const SECTION_LABEL = 'text-xs tracking-widest uppercase font-semibold text-neutral-400 border-b border-neutral-200 pb-1 mb-3'

export function CoverLetterTemplate({ data, profile }: CoverLetterTemplateProps) {
  if (!data) return null

  const sections = Array.isArray(data.sections) ? data.sections.filter(s => s.content && !s.hidden) : []
  if (sections.length === 0) return null

  const last = sections.length - 1

  return (
    <div className="cover-letter-content">
      {sections.map((section, i) => (
        <section
          key={i}
          className={
            i === 0 ? 'mb-9'
            : i === last ? 'mb-6 mt-9'
            : 'mb-6'
          }
        >
          {section.title && (
            <h2 className={SECTION_LABEL}>
              {section.title}
            </h2>
          )}
          <div
            className="cl-content text-base leading-relaxed text-neutral-700"
            dangerouslySetInnerHTML={{ __html: section.content }}
          />
        </section>
      ))}
    </div>
  )
}

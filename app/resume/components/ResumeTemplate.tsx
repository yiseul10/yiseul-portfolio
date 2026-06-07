import { Mail, Phone, Linkedin, Globe, FileText } from 'lucide-react'

export function ResumeTemplate({ data, authenticated = false }: { data: any; authenticated?: boolean }) {
  const profile = data?.profile || {}
  const summary = data?.summary || ''
  const summaryHeadline = data?.summaryHeadline || ''
  const keywords: string[] = Array.isArray(data?.keywords) ? data.keywords : []
  const experience = Array.isArray(data?.experience) ? data.experience : []
  const skills = Array.isArray(data?.skills) ? data.skills : []
  const education = Array.isArray(data?.education) ? data.education : []
  const certifications = Array.isArray(data?.certifications) ? data.certifications : []
  const customSections = Array.isArray(data?.customSections) ? data.customSections : []

  const titles = {
    summary: 'SUMMARY',
    experience: 'EXPERIENCE',
    skills: 'SKILLS',
    education: 'EDUCATION',
    certifications: 'CERTIFICATIONS & OTHER',
    ...(data?.sectionTitles || {}),
  }

  const hasProfile = profile.name || profile.title
  const hasContent = hasProfile || summary || summaryHeadline || experience.length > 0 || skills.length > 0 || education.length > 0 || certifications.length > 0 || customSections.length > 0

  if (!hasContent) {
    return (
      <div className="resume-content flex flex-col items-center justify-center py-20 text-neutral-400">
        <FileText className="w-12 h-12 mb-4 text-neutral-300 dark:text-neutral-600" />
        <p className="text-lg font-medium">이력서가 아직 작성되지 않았습니다.</p>
        <p className="text-sm mt-2">상단의 수정 버튼을 눌러 이력서를 작성해 보세요.</p>
      </div>
    )
  }

  return (
    <div className="resume-content">
      {/* 헤더 */}
      {hasProfile && (
        <header className="mb-6 print:mb-6 border-b-2 border-neutral-700 pb-1">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              {profile.name && (
                <h1 className="text-3xl font-bold tracking-tight print:text-2xl">
                  {profile.name}
                </h1>
              )}
              {profile.title && (
                <p className="text-lg font-semibold text-neutral-500  mt-0.5 print:text-base">
                  {profile.title}
                </p>
              )}
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm font-medium text-neutral-800 ">
                {profile.email && (
                  <span className="inline-flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" />
                    <span className="hidden print:inline">{profile.email}</span>
                    <a href={`mailto:${profile.email}`} className="print:hidden underline hover:text-neutral-800 dark:hover:text-neutral-200">
                      이메일
                    </a>
                  </span>
                )}
                {authenticated && profile.phone && (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" /> {profile.phone.replace(/[^0-9]/g, '').replace(/(\d{3})(\d{4})(\d{4})/, '$1\u00B7$2\u00B7$3')}
                  </span>
                )}
                {profile.linkedin && (
                  <span className="inline-flex items-center gap-1">
                    <Linkedin className="w-3.5 h-3.5" />
                    <a href={profile.linkedin} className=" hover:text-neutral-800 dark:hover:text-neutral-200">
                      LinkedIn
                    </a>
                  </span>
                )}
                {profile.website && (
                  <span className="inline-flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5" />
                    <a href={profile.website} className="underline hover:text-neutral-800 dark:hover:text-neutral-200">
                      포트폴리오
                    </a>
                  </span>
                )}
              </div>
            </div>
            {/* 증명사진 - 로그인 시에만 */}
            {authenticated && profile.photo && (
              <div className="shrink-0 ml-6">
                <img
                  src={profile.photo}
                  alt="Profile"
                  className="w-28 h-28 object-cover rounded-lg  print:w-24 print:h-24"
                />
              </div>
            )}
          </div>
        </header>
      )}

      {/* 소개 */}
      {(summaryHeadline || summary) && (
        <section className="mb-8 print:mb-6">
          {summaryHeadline && (
            <h2 className="text-2xl font-bold tracking-tight mb-2 print:text-xl">
              {summaryHeadline}
            </h2>
          )}
          <span className="text-base leading-relaxed text-neutral-700 whitespace-pre-line">
            {summary}
          </span>
          {/* 해시태그 키워드 */}
          {keywords.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {keywords.map((kw: string, i: number) => (
                <span
                  key={i}
                  className="text-xs px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-700 print:border print:border-neutral-300 print:bg-transparent"
                >
                  #{kw}
                </span>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 기술 스택 */}
      {skills.length > 0 && (
          <section className="mb-8 print:mb-8">
            <div className="w-full gap-5 text-sm">
              {skills.map((group: any, i: number) => (
                  <div key={i}>
                    {group.category && (
                        <h3 className="font-medium text-neutral-800  mb-2">
                          {group.category}
                        </h3>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      {(typeof group.items === 'string' ? group.items.split(',') : []).map((item: string, j: number) => (
                          <span
                              key={j}
                              className="text-xs px-2 py-0.5 rounded bg-neutral-300  text-neutral-900"
                          >
                      {item.trim()}
                    </span>
                      ))}
                    </div>
                  </div>
              ))}
            </div>
          </section>
      )}

      {/* 경력 */}
      {experience.length > 0 && (
        <section className="mb-8 print:mb-10">
          <h2 className="text-xs tracking-widest uppercase font-semibold text-neutral-400 border-b border-neutral-200 dark:border-neutral-700 pb-1 mb-3 print:mb-2">
            {titles.experience}
          </h2>
          <div className="">
            {experience.map((exp: any, i: number) => (
              <div key={i} className="experience-item">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-black">{exp.company}</h3>
                  <span className="text-xs text-neutral-500 shrink-0 ml-4">
                    {exp.startDate} - {exp.endDate}
                  </span>
                </div>
                {exp.role && (
                  <p className="text-sm text-neutral-500">{exp.role}</p>
                )}
                {exp.subtitle && (
                  <p className="text-sm text-neutral-500 font-semibold italic mt-2 mb-3">{exp.subtitle}</p>
                )}
                {!exp.subtitle && exp.role && <div className="mb-2" />}
                {Array.isArray(exp.descriptions) && exp.descriptions.length > 0 && (
                  <ul className="text-sm text-neutral-700 mt-4">
                    {exp.descriptions.map((desc: any, j: number) => {
                      const item = typeof desc === 'string'
                        ? { text: desc, level: 1, bold: false, italic: false }
                        : desc
                      if (!item.text) return null
                      const level = item.level ?? 0

                      // 3단계 × 불렛 on/off
                      const depth = Math.floor(level / 2)
                      const hasBullet = level % 2 === 1

                      const indentClass = depth === 0 ? '' : depth === 1 ? 'ml-5' : 'ml-10'
                      const bulletClass = depth === 0 ? 'list-disc' : depth === 1 ? 'list-[circle]' : 'list-["‣"]'
                      const textStyle = `${item.bold ? 'font-bold' : ''} ${item.italic ? 'italic' : ''}`.trim()

                      // 깊이별 간격: depth-0은 그룹 타이틀로 위에 넉넉한 간격, 하위는 촘촘하게
                      const spacingClass = j === 0
                        ? ''
                        : depth === 0
                          ? 'mt-3'
                          : depth === 1
                            ? 'mt-1'
                            : 'mt-0.5'

                      if (!hasBullet) {
                        return (
                          <li key={j} className={`list-none ${indentClass} ${spacingClass} ${depth === 0 ? 'font-medium' : ''} ${textStyle}`}>
                            {item.text}
                          </li>
                        )
                      }
                      return (
                        <li key={j} className={`${bulletClass} ${depth === 0 ? 'ml-5' : depth === 1 ? 'ml-10' : 'ml-14'} ${spacingClass} ${textStyle}`}>
                          {item.text}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}



      {/* 학력 - 로그인 시에만 */}
      {authenticated && education.length > 0 && (
        <section className="mb-8 print:mb-4">
          <h2 className="text-xs tracking-widest uppercase font-semibold text-neutral-400 border-b border-neutral-200 dark:border-neutral-700 pb-1 mb-3 print:mb-2">
            {titles.education}
          </h2>
          <div className="space-y-3">
            {education.map((edu: any, i: number) => (
              <div key={i}>
                <div className="flex justify-between items-baseline">
                  <h3 className="font-medium text-sm">{edu.school}</h3>
                  {(edu.startDate || edu.endDate) && (
                    <span className="text-xs text-neutral-500 shrink-0 ml-4">
                      {edu.startDate} - {edu.endDate}
                    </span>
                  )}
                </div>
                {edu.major && (
                  <p className="text-sm text-neutral-500 ">{edu.major}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 자격증 / 기타 - 로그인 시에만 */}
      {authenticated && certifications.length > 0 && (
        <section className="mb-8 print:mb-4">
          <h2 className="text-xs tracking-widest uppercase font-semibold text-neutral-400 border-b border-neutral-200 dark:border-neutral-700 pb-1 mb-3 print:mb-2">
            {titles.certifications}
          </h2>
          <div className="space-y-3">
            {certifications.map((cert: any, i: number) => (
              <div key={i}>
                <div className="flex justify-between items-baseline">
                  <h3 className="font-medium text-sm ">{cert.name}</h3>
                  {(cert.startDate || cert.endDate) && (
                    <span className="text-xs text-neutral-500 shrink-0 ml-4 print:text-sm">
                      {cert.startDate}{cert.startDate && cert.endDate && ' - '}{cert.endDate}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 커스텀 섹션들 - 로그인 시에만 */}
      {authenticated && customSections.map((section: any, i: number) => {
        const items = Array.isArray(section.items) ? section.items : []
        const layout = section.layout || 'simple'
        if (!section.title && items.length === 0) return null
        return (
          <section key={i} className="mb-8">
            <h2 className="text-xs tracking-widest uppercase font-semibold text-neutral-400 border-b border-neutral-200 dark:border-neutral-700 pb-1 mb-3 print:mb-2">
              {section.title || '(제목 없음)'}
            </h2>
            <div className="space-y-3">
              {items.map((item: any, j: number) =>
                layout === 'detailed' ? (
                  <div key={j}>
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-medium text-sm">{item.text}</h3>
                      {(item.startDate || item.endDate) && (
                        <span className="text-xs text-neutral-500 shrink-0 ml-4 ">
                          {item.startDate}{item.startDate && item.endDate && ' - '}{item.endDate}
                        </span>
                      )}
                    </div>
                    {item.subtitle && (
                      <p className="text-sm text-neutral-500 ">{item.subtitle}</p>
                    )}
                  </div>
                ) : (
                  <div key={j} className="flex justify-between items-baseline text-sm text-neutral-700 dark:text-neutral-300">
                    <span>{item.text}</span>
                    {(item.startDate || item.endDate) && (
                      <span className="text-xs text-neutral-500 shrink-0 ml-4">
                        {item.startDate}{item.startDate && item.endDate && ' - '}{item.endDate}
                      </span>
                    )}
                  </div>
                )
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}

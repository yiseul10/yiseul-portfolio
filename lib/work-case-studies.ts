export type WorkCaseStudy = {
  displayTitle: string
  description: string
  tags: string[]
  summary: {
    problem: string
    role: string
    solution: string
    impact: string
  }
}

export const workCaseStudies: Record<string, WorkCaseStudy> = {
  onboarding_bo: {
    displayTitle: '',
    description:
      '세일즈팀의 100% 수기 입점 흐름을 셀프 등록 + 계약 심사 구조로 재설계하고, 자동화율 67%와 퍼널 측정 환경을 만든 프로젝트',
    tags: ['Workflow Automation', 'Internal Tooling', 'BO', 'Funnel Tracking'],
    summary: {
      problem:
        '호텔 입점 등록이 세일즈팀 수작업에 의존해 입점 수 증가가 곧 운영 인력 증가로 이어졌습니다.',
      role:
        'BO로 문제 정의, 프로세스 재설계, API 협의, 프론트엔드 구현, 로그 설계를 주도했습니다.',
      solution:
        '22단계 위자드, 9종 상태 머신, 심사 UI, 프로비저닝 오케스트레이션, ClickHouse/Superset 퍼널 대시보드를 구축했습니다.',
      impact:
        '세일즈 수기 단계 15개 중 10개를 시스템 안으로 흡수했고, 자동화율 67%와 병목 측정 기반을 확보했습니다.',
    },
  },
  ai_insights: {
    displayTitle: '',
    description:
      'AI 인사이트, 데이터 시각화, PDF 출력 파이프라인을 묶어 세일즈와 호텔 운영자가 실제 사용하는 의사결정 도구로 만든 사례',
    tags: ['AI-enabled Tool', 'Data Visualization', 'PDF Pipeline', 'Sales Ops'],
    summary: {
      problem:
        '세일즈팀과 호텔 운영자가 미팅과 월간 전략 수립에 쓸 신뢰도 높은 리포트 도구가 필요했습니다.',
      role:
        '데이터 기획 가안만 있는 상황에서 화면 구성, 리포트 UX, AI 인사이트 표현, PDF 출력 품질을 프론트엔드 중심으로 설계했습니다.',
      solution:
        'ApexCharts, Framer Motion, Lottie, html2canvas, jsPDF를 조합해 화면과 출력물이 같은 클라이언트 사이드 PDF 파이프라인을 구축했습니다.',
      impact:
        '베타 6주 후 판매 호텔의 18%가 자발적으로 채택했고, 직계약 영업 현장의 핵심 의사결정 도구로 정착했습니다.',
    },
  },
  job_hunting_bot: {
    displayTitle: 'job-hunting-bot',
    description:
      'n8n, Claude API, Notion, Slack으로 구직 공고 수집부터 LLM 평가, 우선순위 정렬, 운영 리포트까지 연결한 개인 자동화 시스템',
    tags: ['AI Automation', 'n8n', 'Claude API', 'Notion', 'Slack'],
    summary: {
      problem:
        '매일 채용 공고를 확인하고 JD를 읽어 적합도를 판단하는 과정이 반복적이고, 좋은 후보를 놓치거나 우선순위가 흐려지는 문제가 있었습니다.',
      role:
        '문제 정의, 공고 수집 파이프라인, Claude 평가 프롬프트, Action 정규화, Notion DB 스키마, Slack 운영 알림 구조를 직접 설계했습니다.',
      solution:
        '원티드 공고를 수집한 뒤 Claude로 JD를 구조화하고, Hard Filter와 Priority Score를 코드로 계산해 Notion과 Slack으로 연결했습니다.',
      impact:
        '매일 17:00 실행되는 자동화로 구직 후보를 정리하고, Daily Summary와 A/B Prompt Evaluation을 추가해 LLM 판단 품질을 관측하는 구조로 확장했습니다.',
    },
  },
}

export function getWorkCaseStudy(slug?: string | null) {
  if (!slug) return null
  return workCaseStudies[slug] || null
}

export function applyWorkCaseStudyPresentation(post: any) {
  const caseStudy = getWorkCaseStudy(post?.slug)
  if (!caseStudy) return post

  return {
    ...post,
    title: caseStudy.displayTitle,
    description: caseStudy.description,
    tags: caseStudy.tags,
  }
}

---
chatbot: true
public_safe: true
topic: portfolio-chatbot
status: log
priority: medium
summary: 2026년 6월 25일 포트폴리오 챗봇에 Obsidian 공개 Wiki 동기화 구조와 방문자 질문 기반 주간 리포트 루프를 추가했습니다. 공개 허용 문서만 챗봇 컨텍스트에 포함하고, chat_logs를 바탕으로 반복 질문과 보강 후보를 확인할 수 있게 했습니다.
---

# 2026-06-25 포트폴리오 챗봇 업데이트

## 오늘 추가한 구조

포트폴리오 챗봇을 단순 Q&A 위젯이 아니라, 방문자 질문을 바탕으로 포트폴리오를 개선하는 피드백 루프로 확장했습니다.

```text
Obsidian 공개 Wiki
→ sync:wiki
→ app/data/wiki
→ 챗봇 컨텍스트
→ 방문자 질문 로그
→ 주간 리포트
→ Wiki/Work/블로그 보강
```

## Obsidian 공개 Wiki 동기화

Obsidian vault 안에 `Portfolio Public Wiki` 폴더를 만들고, 공개해도 되는 문서만 이 폴더에서 관리하도록 했습니다.

레포에는 `sync:wiki` 스크립트를 추가했습니다.

```bash
OBSIDIAN_PUBLIC_WIKI_DIR="/Users/yiseulkim/Documents/Obsidian Vault/Portfolio Public Wiki" npm run sync:wiki
```

동기화 스크립트는 아래 두 frontmatter 값이 모두 있는 문서만 `app/data/wiki`로 복사합니다.

```md
chatbot: true
public_safe: true
```

챗봇 컨텍스트 조립 단계에서도 같은 조건을 다시 확인합니다. 즉, Obsidian 공개 폴더 안에 있더라도 명시적으로 공개 허용되지 않은 문서는 챗봇에 들어가지 않습니다.

## 챗봇 컨텍스트 확장

기존 챗봇은 프로필, 활성 이력서, 블로그 요약을 바탕으로 답변했습니다. 오늘 변경으로 공개 허용 Wiki 문서도 함께 컨텍스트에 포함됩니다.

문서에 `summary`가 있으면 챗봇은 summary를 우선 참고합니다. summary가 없으면 본문에서 마크다운 문법을 제거한 뒤 앞부분만 사용합니다.

## 주간 리포트

방문자 질문 로그를 주 단위로 확인하는 `/chat-report` 페이지를 추가했습니다. 관리자 로그인 후 확인할 수 있습니다.

리포트에서 보는 항목:

- 총 질문 수
- IP 기준 방문자 수
- 관심 주제
- 반복 질문
- 답변 보강 후보
- 불확실 답변 질문

초기 버전은 규칙 기반으로 동작합니다. 이후 LLM 클러스터링, Slack/이메일 발송, 블로그 후보 분리로 확장할 수 있습니다.

## 오늘 만든 공개 Wiki 샘플

- job-hunting-bot
- AI 스마트 보고서
- 포트폴리오 챗봇 개선 루프

## 다음 개선 후보

> 2026-06-26 업데이트: 아래 후보 중 액션 분리와 TODO 저장이 구현되었습니다. 상세 내용은 [[2026-06-26-content-loop-action-export]] 참고.

- 실제 방문자 질문이 쌓인 뒤 `/chat-report`에서 반복 질문 확인 (운영 단계 진행 중)
- ✅ 반복 질문을 Wiki 보강 후보와 블로그 후보로 분리 → 주제 기반 액션 라우팅으로 구현 (06-26)
- ✅ 관리자 화면에서 리포트 결과를 바로 TODO로 저장하는 액션 추가 → Markdown 액션 로그 + Obsidian 저장으로 구현 (06-26)
- Obsidian 공개 Wiki 문서 템플릿 정리 (이월)

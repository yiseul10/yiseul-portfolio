---
chatbot: false
public_safe: false
topic: portfolio-chatbot
status: guide
priority: low
---

# Wiki 문서 제공 기준

이 폴더는 Obsidian 원본 vault 전체가 아니라, 포트폴리오 챗봇에 제공해도 되는 문서만 복사해두는 공개 가능 지식 레이어입니다.

권장 운영 방식은 Obsidian vault 안에 공개용 폴더를 따로 만들고, 그 폴더만 이 위치로 동기화하는 것입니다.

```text
Obsidian Vault/Portfolio Public Wiki
→ app/data/wiki
```

동기화 명령:

```bash
OBSIDIAN_PUBLIC_WIKI_DIR="/Users/me/Obsidian/Portfolio Public Wiki" npm run sync:wiki
```

동기화 스크립트도 `chatbot: true`, `public_safe: true`, `summary`가 모두 있는 문서만 복사합니다.

챗봇 컨텍스트에 포함되려면 frontmatter에 아래 두 값이 모두 명시되어야 합니다.

```md
chatbot: true
public_safe: true
summary: 방문자에게 설명해도 되는 핵심 요약
```

셋 중 하나라도 없거나 `false`이면 챗봇은 문서를 읽지 않습니다.

권장 frontmatter:

```md
---
chatbot: true
public_safe: true
topic: job-hunting-bot
status: draft
priority: high
summary: 방문자에게 설명해도 되는 핵심 요약
---
```

챗봇이 실제로 읽는 것은 본문이 아니라 `summary`입니다. `summary`가 없는 문서는 `chatbot: true`와 `public_safe: true`가 있더라도 챗봇 컨텍스트에서 제외됩니다.

따라서 `summary`는 방문자에게 그대로 보여줄 수 있는 사실 기반 한두 문장으로 작성합니다. priority 순으로 상위 8개 문서만 컨텍스트에 들어갑니다.

## 문서 타입

이 폴더에는 두 종류의 문서만 둡니다.

1. **프로젝트 케이스 스터디** — 방문자에게 보여줄 프로젝트 설명. `chatbot: true`로 챗봇 컨텍스트에 포함합니다.
2. **개발 로그·일지** — 작업 기록. 챗봇 응답에는 노이즈이므로 이 공개 폴더에 두지 않습니다. 프로젝트 이력은 메인 위키(`wiki/projects/portpolio2`)에서 관리합니다.

## 프로젝트 문서 본문 템플릿

프로젝트 케이스 스터디는 아래 섹션 구조로 통일합니다.

```md
# {프로젝트명}

## 핵심 문제
무엇을 왜 풀었나.

## 역할
내가 책임지고 만든 범위.

## 만든 구조
핵심 구성요소를 불릿으로.

## 임팩트
결과. 수치가 있으면 수치, 없으면 운영/베타 단계를 사실대로.

## 보여주고 싶은 포인트 (선택)
기술적으로 강조할 지점.
```

`status`는 `draft` / `active` / `live` 중 하나를 사용합니다.

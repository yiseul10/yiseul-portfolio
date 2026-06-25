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

동기화 스크립트도 `chatbot: true`와 `public_safe: true`가 모두 있는 문서만 복사합니다.

챗봇 컨텍스트에 포함되려면 frontmatter에 아래 두 값이 모두 명시되어야 합니다.

```md
chatbot: true
public_safe: true
```

둘 중 하나라도 없거나 `false`이면 챗봇은 문서를 읽지 않습니다.

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

`summary`가 있으면 챗봇에는 summary를 우선 제공합니다. 없으면 본문에서 마크다운 문법을 제거한 뒤 앞부분만 요약 재료로 사용합니다.

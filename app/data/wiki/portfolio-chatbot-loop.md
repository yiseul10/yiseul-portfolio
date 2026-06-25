---
chatbot: true
public_safe: true
topic: portfolio-chatbot
status: draft
priority: medium
summary: 포트폴리오 챗봇은 이력서, 블로그, 공개 허용 Wiki 문서를 바탕으로 방문자 질문에 답하고, 질문 로그를 주간 리포트로 모아 포트폴리오 개선 후보를 찾는 구조입니다.
---

# 포트폴리오 챗봇 개선 루프

## 방향

포트폴리오 챗봇은 단순 Q&A 위젯이 아니라 방문자가 실제로 궁금해하는 지점을 발견하는 피드백 루프가 될 수 있습니다.

## 정보 흐름

```text
Obsidian 공개 Wiki
→ 챗봇 컨텍스트
→ 방문자 질문 로그
→ 주간 리포트
→ Wiki 보강 또는 블로그 글 발행
→ 챗봇 답변 품질 개선
```

## 운영 원칙

Obsidian 원본 vault 전체를 직접 노출하지 않습니다. `chatbot: true`와 `public_safe: true`가 모두 명시된 문서만 sync하고, 챗봇 컨텍스트 조립 단계에서도 같은 조건을 다시 확인합니다.

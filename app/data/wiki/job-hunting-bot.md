---
chatbot: true
public_safe: true
topic: job-hunting-bot
status: draft
priority: high
summary: job-hunting-bot은 채용 공고 확인, JD 구조화, 적합도 판단, Notion 기록, Slack 알림을 연결한 개인 구직 자동화 시스템입니다. 단순 수집이 아니라 Hard Filter, Priority Score, Daily Summary, A/B Prompt Evaluation으로 LLM 판단 품질을 관측하는 구조까지 포함합니다.
---

# job-hunting-bot

## 핵심 문제

매일 채용 공고를 확인하고 JD를 읽어 적합도를 판단하는 과정이 반복적이었습니다. 좋은 후보를 놓치거나, 여러 공고 사이의 우선순위가 흐려지는 문제도 있었습니다.

## 만든 구조

- 원티드 공고 수집
- Claude API 기반 JD 구조화
- Hard Filter와 Priority Score 계산
- Notion DB 저장
- Slack 알림
- Daily Summary
- A/B Prompt Evaluation

## 보여주고 싶은 포인트

AI를 단순히 답변 생성에 쓰는 것이 아니라, 반복 업무의 판단 기준과 운영 리포트 안에 배치했습니다. 특히 LLM 결과를 그대로 믿지 않고 관측 가능한 구조로 확장했다는 점이 중요합니다.

---
chatbot: true
public_safe: true
topic: job-hunting-bot
status: active
priority: high
summary: 채용 공고 수집, JD 구조화, 적합도 판단, Notion 기록, Slack 알림을 연결한 개인 구직 자동화 시스템. 단순 수집이 아니라 Hard Filter, Priority Score, Daily Summary, A/B Prompt Evaluation으로 LLM 판단 품질을 관측하는 구조까지 직접 설계했습니다.
---

# job-hunting-bot

## 핵심 문제

매일 채용 공고를 확인하고 JD를 읽어 적합도를 판단하는 과정이 반복적이었습니다. 좋은 후보를 놓치거나, 여러 공고 사이의 우선순위가 흐려지는 문제도 있었습니다.

## 역할

문제 정의부터 수집, LLM 판단 로직, 운영 리포트, 알림까지 혼자 설계하고 구현했습니다.

## 만든 구조

- 채용 공고 수집
- Claude API 기반 JD 구조화
- Hard Filter와 Priority Score 계산
- Notion DB 저장
- Slack 알림
- Daily Summary
- A/B Prompt Evaluation

## 임팩트

매일 공고 확인과 적합도 판단을 자동으로 돌리는 개인 운영 도구로 자리 잡았습니다. 판단 기준과 결과가 리포트로 남아, 놓치는 후보와 우선순위 흐려짐 문제를 줄였습니다.

## 보여주고 싶은 포인트

AI를 단순히 답변 생성에 쓰는 것이 아니라, 반복 업무의 판단 기준과 운영 리포트 안에 배치했습니다. 특히 LLM 결과를 그대로 믿지 않고 관측 가능한 구조로 확장했다는 점이 중요합니다.

# Yiseul Portfolio

Next.js 기반 포트폴리오입니다. 블로그, work case study, 이력서 버전 관리, 포트폴리오 챗봇, 챗봇 질문 리포트를 포함합니다.

## 개발

```bash
npm install
npm run dev
```

## 환경변수

```bash
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_MY_EMAIL=
OPENAI_API_KEY=
AI_PROVIDER=openai
SUPABASE_SERVICE_ROLE_KEY=
OBSIDIAN_PUBLIC_WIKI_DIR=
OBSIDIAN_CHAT_REPORT_DIR=
```

## Wiki 동기화

```bash
OBSIDIAN_PUBLIC_WIKI_DIR="/path/to/Portfolio Public Wiki" npm run sync:wiki
```

공개 가능한 문서만 별도 폴더에 두고 동기화합니다. 원본 Obsidian vault 전체를 이 저장소로 복사하지 않습니다.

## 임베딩 갱신

```bash
npm run embed:posts
```

게시된 블로그 글을 chunk로 나누고 OpenAI embedding을 생성해 Supabase `post_chunks`에 저장합니다.

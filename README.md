# Yiseul Portfolio

Next.js 기반 포트폴리오입니다. 블로그, work case study, 이력서 버전 관리, 포트폴리오 챗봇, 챗봇 질문 리포트를 포함합니다.

## 운영 기준

- 공개 방문자는 `published = true`인 글과 민감정보가 제거된 이력서만 볼 수 있습니다.
- 관리자 기능은 서버에서 `ADMIN_EMAIL` 또는 `NEXT_PUBLIC_MY_EMAIL`과 로그인 세션 이메일이 일치할 때만 허용합니다.
- 챗봇 Wiki 컨텍스트는 `app/data/wiki` 안의 `chatbot: true`, `public_safe: true`, `summary`가 모두 있는 문서만 사용합니다.
- 챗봇 로그는 질문 개선 리포트 용도로 저장되므로, 배포 환경에서는 개인정보 처리와 보관 기간을 별도로 관리해야 합니다.

## 환경변수

```bash
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_MY_EMAIL=
ADMIN_EMAIL=
OPENAI_API_KEY=
AI_PROVIDER=openai
SUPABASE_SERVICE_ROLE_KEY=
OBSIDIAN_PUBLIC_WIKI_DIR=
OBSIDIAN_CHAT_REPORT_DIR=
```

`SUPABASE_SERVICE_ROLE_KEY`는 로컬 임베딩 스크립트에서만 사용하고, 브라우저 또는 클라이언트 번들에 노출하지 않습니다.

## 개발

```bash
npm install
npm run dev
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

# Yiseul Portfolio

Next.js 기반 포트폴리오입니다. 블로그, work case study, 이력서 버전 관리, 포트폴리오 챗봇, 챗봇 질문 리포트를 포함합니다.

## 운영 기준

- 공개 방문자는 `published = true`인 글과 민감정보가 제거된 이력서만 볼 수 있습니다.
- 관리자 판별은 서버에서 `getAdminUser`가 담당합니다. `getSession()`(쿠키 신뢰)이 아니라 `getUser()`로 Supabase Auth에 토큰을 재검증한 뒤, 그 이메일이 `ADMIN_EMAIL`(없으면 `NEXT_PUBLIC_MY_EMAIL`)과 일치할 때만 허용합니다. 클라이언트의 `isAdminSession`은 버튼 노출 등 표시용일 뿐이며 권위 판정이 아닙니다.
- 챗봇 Wiki 컨텍스트는 `app/data/wiki` 안의 `chatbot: true`, `public_safe: true`, `summary`가 모두 있는 문서만 사용합니다.
- 챗봇 로그는 질문 개선 리포트 용도로 저장되므로, 배포 환경에서는 개인정보 처리와 보관 기간을 별도로 관리해야 합니다.
- 챗봇 rate-limit 카운트 조회가 실패하면 차단(fail-closed)하되, 사용자에게는 한도 소진(429)이 아니라 일시적 오류(503)로 안내합니다.

## 공개 배포 보안 (데이터 레이어)

앱 레이어 관리자 체크만으로는 부족합니다. 로그인 이메일 제한이 프론트엔드 가드뿐이라
외부인이 자기 이메일로 OTP 세션을 얻으면 "인증된 사용자"가 되고, 그 세션으로 anon key를
써서 Supabase REST를 직접 호출하면 Next 앱을 우회할 수 있습니다.

1. **(1순위) Supabase Auth 신규 가입 비활성화** — Dashboard → Authentication → Sign In / Providers →
   Email에서 "Allow new users to sign up"을 끄거나 초대 전용으로 둡니다. 그러면 관리자 외에는
   세션 자체를 만들 수 없습니다.
2. **(방어선) 이메일 기반 RLS** — `supabase/migrations/20260630000000_admin_email_rls.sql`을 적용합니다.
   - `posts`: 초안 anon 노출 제거, 쓰기는 관리자 이메일만.
   - `resume_versions`: 아무 인증 사용자나 전 버전 접근하던 정책을 관리자 전용으로 축소.
   - 적용 후 비로그인 공개 페이지와 관리자 편집을 함께 점검하세요.

### 남은 후속 작업 (코드 변경 필요)

- `resume_versions`의 active 행은 공개 이력서 페이지가 anon으로 읽어야 해서 SELECT를 열어두는데,
  JSONB 안에 전화·사진·커버레터가 있어 직접 조회 시 노출됩니다. 안전 필드만 추리는 뷰로 분리 필요.
- `chat_logs`는 rate-limit이 anon key로 카운트하느라 anon SELECT가 열려 있어 질문/IP가 노출됩니다.
  카운트를 서버 전용(service_role) 조회로 옮긴 뒤 anon SELECT 정책을 제거해야 합니다.

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

-- 공개 배포 하드닝: 관리자 이메일 기반 RLS
--
-- 배경: 로그인 이메일 제한이 프론트엔드 가드(app/login)뿐이라, 외부인이 자기
--       이메일로 OTP 세션을 얻으면 "인증된 사용자" 권한을 갖는다. 앱 레이어의
--       getAdminUser 체크는 Next 경유 요청만 막고, anon key + 자기 JWT로 Supabase
--       REST를 직접 호출하는 경로는 막지 못한다. 데이터 레이어에서 관리자만
--       쓰기/민감 읽기를 하도록 정책을 좁힌다.
--
-- 1순위 통제는 Supabase Auth에서 신규 가입 비활성화(README "공개 배포 보안" 참고).
-- 이 마이그레이션은 그 위에 얹는 방어선이다.
--
-- 적용 전 검토 필수. 적용: `supabase db push` 또는 SQL Editor에서 실행.
-- 적용 후 공개(비로그인) 블로그/이력서 페이지와 관리자 편집을 함께 확인할 것.

-- 관리자 판별 단일 소스. 관리자 이메일이 바뀌면 이 함수만 고친다.
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select auth.jwt() ->> 'email' = 'yiseul10@gmail.com'
$$;

-- ── posts ──────────────────────────────────────────────────────────────
-- 초안(미발행)이 anon 포함 누구에게나 읽히던 정책 제거.
drop policy if exists "Anyone can read posts" on public.posts;

-- 공개 읽기: 발행글만 ("Allow public read access to published posts" 유지).
-- 관리자: 초안 포함 전체 읽기.
drop policy if exists "Admin can read all posts" on public.posts;
create policy "Admin can read all posts" on public.posts
  for select using (public.is_admin());

-- 쓰기는 관리자만. 기존 정책은 auth.uid() = user_id 라서 외부인이 자기 user_id로
-- 글을 insert(published=true면 공개 노출)할 수 있었다.
drop policy if exists "Only I can insert posts" on public.posts;
drop policy if exists "Only I can update my posts" on public.posts;
drop policy if exists "Only I can delete my posts" on public.posts;
create policy "Admin can insert posts" on public.posts
  for insert with check (public.is_admin());
create policy "Admin can update posts" on public.posts
  for update using (public.is_admin()) with check (public.is_admin());
create policy "Admin can delete posts" on public.posts
  for delete using (public.is_admin());

-- ── resume_versions ────────────────────────────────────────────────────
-- "Authenticated full access"는 아무 인증 사용자나 전 버전을 읽고/쓰게 했다.
-- 관리자 전용으로 좁힌다.
drop policy if exists "Authenticated full access" on public.resume_versions;
create policy "Admin full access" on public.resume_versions
  for all using (public.is_admin()) with check (public.is_admin());

-- 주의(미해결): "Public can read active version"(is_active = true)은 공개 이력서
-- 페이지(app/resume/page.tsx)가 anon 으로 active 버전을 읽기 때문에 유지한다.
-- 그러나 active 행의 resume_data/cover_letter JSONB에 전화·사진·학력·커버레터가
-- 들어 있어, anon이 REST로 직접 조회하면 그대로 노출된다(앱은 JS에서 가린 뒤
-- 렌더하지만 RLS는 행 전체를 내준다).
-- 후속 작업 제안: 안전 필드만 노출하는 뷰(public_resume)를 만들어 anon에 SELECT를
-- 주고, base 테이블은 관리자 전용으로 닫는다. 그 뒤 이 정책을 제거한다.

-- ── chat_logs (이 마이그레이션에서는 건드리지 않음) ──────────────────────
-- 현재 "Allow anon count by ip"(qual = true)로 anon이 전체 로그(질문/IP)를 읽을 수
-- 있다. rate-limit(lib/chat/rate-limit.ts)이 anon key로 카운트하기 때문이다.
-- 정책만 제거하면 rate-limit이 깨지므로, 카운트를 서버 전용(service_role) 조회로
-- 옮긴 뒤 anon SELECT 정책을 제거하는 후속 작업이 필요하다.

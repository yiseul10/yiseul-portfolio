-- 공개 이력서/챗로그 노출면 마무리 하드닝
--
-- 목표:
-- 1) resume_versions base table의 anon 직접 조회를 제거한다.
-- 2) 공개 페이지/챗봇이 필요한 이력서 정보만 별도 함수로 노출한다.
-- 3) chat_logs 카운트 조회를 서버 전용(service_role)으로 옮긴 뒤 anon SELECT를 제거한다.

-- ── resume_versions: 공개용 안전 함수 ─────────────────────────────────────
create or replace function public.get_public_resume_data()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select jsonb_build_object(
        'profile', jsonb_build_object(
          'name', coalesce(rv.resume_data->'profile'->>'name', ''),
          'title', coalesce(rv.resume_data->'profile'->>'title', ''),
          'email', coalesce(rv.resume_data->'profile'->>'email', ''),
          'linkedin', coalesce(rv.resume_data->'profile'->>'linkedin', ''),
          'website', coalesce(rv.resume_data->'profile'->>'website', '')
        ),
        'summary', coalesce(rv.resume_data->>'summary', ''),
        'summaryHeadline', coalesce(rv.resume_data->>'summaryHeadline', ''),
        'keywords', coalesce(rv.resume_data->'keywords', '[]'::jsonb),
        'experience', coalesce(rv.resume_data->'experience', '[]'::jsonb),
        'skills', coalesce(rv.resume_data->'skills', '[]'::jsonb),
        'education', '[]'::jsonb,
        'certifications', coalesce(rv.resume_data->'certifications', '[]'::jsonb),
        'sectionTitles', jsonb_build_object(
          'summary', coalesce(rv.resume_data->'sectionTitles'->>'summary', 'SUMMARY'),
          'experience', coalesce(rv.resume_data->'sectionTitles'->>'experience', 'EXPERIENCE'),
          'skills', coalesce(rv.resume_data->'sectionTitles'->>'skills', 'SKILLS'),
          'education', coalesce(rv.resume_data->'sectionTitles'->>'education', 'EDUCATION'),
          'certifications', coalesce(rv.resume_data->'sectionTitles'->>'certifications', 'CERTIFICATIONS & OTHER')
        ),
        'customSections', '[]'::jsonb
      )
      from public.resume_versions rv
      where rv.is_active = true
      limit 1
    ),
    '{}'::jsonb
  )
$$;

revoke all on function public.get_public_resume_data() from public;
grant execute on function public.get_public_resume_data() to anon, authenticated;

drop policy if exists "Public can read active version" on public.resume_versions;

-- ── chat_logs: anon 직접 조회 제거, 관리자만 읽기 ─────────────────────────
alter table public.chat_logs enable row level security;

do $$
declare
  policy_name text;
begin
  for policy_name in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'chat_logs'
  loop
    execute format('drop policy if exists %I on public.chat_logs', policy_name);
  end loop;
end
$$;

create policy "Admin full access to chat logs" on public.chat_logs
  for all using (public.is_admin()) with check (public.is_admin());

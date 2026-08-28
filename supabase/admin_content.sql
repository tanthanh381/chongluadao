-- Existing-project migration: secure draft/publish content management.

alter table public.test_attempts
  drop constraint if exists test_attempts_scenario_id_check;
alter table public.test_attempts
  add constraint test_attempts_scenario_id_check check (scenario_id between 1 and 100);

create table if not exists public.site_content (
  slug text primary key,
  content jsonb not null,
  published boolean not null default false,
  updated_by uuid not null references auth.users(id),
  updated_at timestamptz not null default now(),
  constraint site_content_slug_format check (slug ~ '^[a-z0-9-]{1,64}$'),
  constraint site_content_object check (jsonb_typeof(content) = 'object'),
  constraint site_content_size check (pg_column_size(content) <= 1048576)
);

alter table public.site_content enable row level security;
create index if not exists site_content_updated_by_idx on public.site_content (updated_by);
revoke all on public.site_content from anon, authenticated;
grant select on public.site_content to anon, authenticated;
grant insert, update, delete on public.site_content to authenticated;

create or replace function private.user_is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1 from private.app_admins where user_id = (select auth.uid())
  );
$$;

revoke all on function private.user_is_app_admin() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.user_is_app_admin() to authenticated;

drop policy if exists site_content_public_read on public.site_content;
drop policy if exists site_content_admin_read on public.site_content;
drop policy if exists site_content_authenticated_read on public.site_content;
drop policy if exists site_content_admin_insert on public.site_content;
drop policy if exists site_content_admin_update on public.site_content;
drop policy if exists site_content_admin_delete on public.site_content;

create policy site_content_public_read on public.site_content
  for select to anon
  using (published);

create policy site_content_authenticated_read on public.site_content
  for select to authenticated
  using (published or (select private.user_is_app_admin()));

create policy site_content_admin_insert on public.site_content
  for insert to authenticated
  with check ((select private.user_is_app_admin()) and updated_by = (select auth.uid()));

create policy site_content_admin_update on public.site_content
  for update to authenticated
  using ((select private.user_is_app_admin()))
  with check ((select private.user_is_app_admin()) and updated_by = (select auth.uid()));

create policy site_content_admin_delete on public.site_content
  for delete to authenticated
  using ((select private.user_is_app_admin()));

notify pgrst, 'reload schema';

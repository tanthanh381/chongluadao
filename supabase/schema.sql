-- Khiên Số: durable identity, progress and CISO reporting.
-- The public schema is exposed through the Data API, so every table has RLS.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  display_name text not null,
  created_at timestamptz not null default now(),
  constraint profiles_username_format check (username ~ '^[a-z0-9._-]{3,24}$'),
  constraint profiles_display_name_length check (char_length(display_name) between 2 and 32)
);

create table public.user_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance integer not null default 300000000 check (balance between 0 and 300000000),
  awareness smallint not null default 100 check (awareness between 0 and 100),
  updated_at timestamptz not null default now()
);

create table public.test_attempts (
  user_id uuid not null references auth.users(id) on delete cascade,
  scenario_id smallint not null check (scenario_id between 1 and 100),
  choice_index smallint not null check (choice_index between 0 and 2),
  correct boolean not null,
  balance_after integer not null check (balance_after between 0 and 300000000),
  awareness_after smallint not null check (awareness_after between 0 and 100),
  attempted_at timestamptz not null default now(),
  primary key (user_id, scenario_id)
);

create index test_attempts_scenario_risk_idx
  on public.test_attempts (scenario_id, correct);

create table private.app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  granted_at timestamptz not null default now()
);

create table private.app_editors (
  user_id uuid primary key references auth.users(id) on delete cascade,
  granted_at timestamptz not null default now()
);

create table public.site_content (
  slug text primary key,
  content jsonb not null,
  published boolean not null default false,
  updated_by uuid not null references auth.users(id),
  updated_at timestamptz not null default now(),
  constraint site_content_slug_format check (slug ~ '^[a-z0-9-]{1,64}$'),
  constraint site_content_object check (jsonb_typeof(content) = 'object'),
  constraint site_content_size check (pg_column_size(content) <= 1048576)
);

create index site_content_updated_by_idx on public.site_content (updated_by);

alter table public.profiles enable row level security;
alter table public.user_progress enable row level security;
alter table public.test_attempts enable row level security;
alter table private.app_admins enable row level security;
alter table private.app_editors enable row level security;
alter table public.site_content enable row level security;

create policy app_admins_no_direct_access on private.app_admins
  for all to authenticated
  using (false)
  with check (false);

create policy app_editors_no_direct_access on private.app_editors
  for all to authenticated
  using (false)
  with check (false);

grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;
grant select, insert, update on public.user_progress to authenticated;
grant select, insert, update, delete on public.test_attempts to authenticated;
grant select on public.site_content to anon, authenticated;
grant insert, update, delete on public.site_content to authenticated;

create or replace function private.user_is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from auth.sessions session_row
      where session_row.user_id = (select auth.uid())
        and session_row.id::text = (select auth.jwt() ->> 'session_id')
    )
    and exists (
      select 1 from private.app_admins where user_id = (select auth.uid())
    );
$$;

revoke all on function private.user_is_app_admin() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.user_is_app_admin() to authenticated;

create or replace function private.user_can_edit_content()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from auth.sessions session_row
      where session_row.user_id = (select auth.uid())
        and session_row.id::text = (select auth.jwt() ->> 'session_id')
    )
    and (
      exists (select 1 from private.app_admins where user_id = (select auth.uid()))
      or exists (select 1 from private.app_editors where user_id = (select auth.uid()))
    );
$$;

revoke all on function private.user_can_edit_content() from public, anon;
grant execute on function private.user_can_edit_content() to authenticated;

create policy site_content_public_read on public.site_content
  for select to anon
  using (published);

create policy site_content_authenticated_read on public.site_content
  for select to authenticated
  using (published or (select private.user_can_edit_content()));

create policy site_content_admin_insert on public.site_content
  for insert to authenticated
  with check (
    (select private.user_can_edit_content())
    and updated_by = (select auth.uid())
    and (not published or (select private.user_is_app_admin()))
  );

create policy site_content_admin_update on public.site_content
  for update to authenticated
  using (
    (select private.user_can_edit_content())
    and (not published or (select private.user_is_app_admin()))
  )
  with check (
    (select private.user_can_edit_content())
    and updated_by = (select auth.uid())
    and (not published or (select private.user_is_app_admin()))
  );

create policy site_content_admin_delete on public.site_content
  for delete to authenticated
  using ((select private.user_is_app_admin()));

create policy profiles_select_own on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

create policy profiles_update_own on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy progress_select_own on public.user_progress
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy progress_insert_own on public.user_progress
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy progress_update_own on public.user_progress
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy attempts_select_own on public.test_attempts
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy attempts_insert_own on public.test_attempts
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy attempts_update_own on public.test_attempts
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy attempts_delete_own on public.test_attempts
  for delete to authenticated
  using ((select auth.uid()) = user_id);

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_username text := lower(trim(coalesce(new.raw_user_meta_data ->> 'username', '')));
  requested_display_name text := trim(coalesce(new.raw_user_meta_data ->> 'display_name', ''));
begin
  if requested_username !~ '^[a-z0-9._-]{3,24}$' then
    raise exception 'invalid username';
  end if;
  if char_length(requested_display_name) not between 2 and 32 then
    raise exception 'invalid display name';
  end if;

  insert into public.profiles (id, username, display_name)
  values (new.id, requested_username, requested_display_name);
  insert into public.user_progress (user_id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

create or replace function public.get_ciso_dashboard()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  payload jsonb;
begin
  if not (select private.user_is_app_admin()) then
    raise exception 'CISO access required' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'users', coalesce((
      select jsonb_agg(to_jsonb(user_rows) order by user_rows.risk_rank, user_rows.display_name)
      from (
        select
          p.username,
          p.display_name,
          p.created_at,
          count(a.scenario_id)::integer as completed,
          count(a.scenario_id) filter (where a.correct)::integer as correct,
          case when count(a.scenario_id) = 0 then 0
            else round(100.0 * count(a.scenario_id) filter (where a.correct) / count(a.scenario_id))::integer
          end as accuracy,
          coalesce(up.awareness, 100)::integer as awareness,
          coalesce(up.balance, 300000000)::integer as balance,
          greatest(0, 300000000 - coalesce(up.balance, 300000000))::integer as loss,
          case
            when count(a.scenario_id) = 0 then 'Trung bình'
            when (100.0 * count(a.scenario_id) filter (where a.correct) / count(a.scenario_id)) < 60 or coalesce(up.awareness, 100) < 70 then 'Cao'
            when (100.0 * count(a.scenario_id) filter (where a.correct) / count(a.scenario_id)) < 80 or coalesce(up.awareness, 100) < 85 then 'Trung bình'
            else 'Thấp'
          end as risk,
          case
            when count(a.scenario_id) > 0 and ((100.0 * count(a.scenario_id) filter (where a.correct) / count(a.scenario_id)) < 60 or coalesce(up.awareness, 100) < 70) then 0
            when count(a.scenario_id) = 0 or (100.0 * count(a.scenario_id) filter (where a.correct) / nullif(count(a.scenario_id), 0)) < 80 or coalesce(up.awareness, 100) < 85 then 1
            else 2
          end as risk_rank
        from public.profiles p
        left join public.user_progress up on up.user_id = p.id
        left join public.test_attempts a on a.user_id = p.id
        group by p.id, p.username, p.display_name, p.created_at, up.awareness, up.balance
      ) user_rows
    ), '[]'::jsonb),
    'scenarios', coalesce((
      select jsonb_agg(to_jsonb(scenario_rows) order by scenario_rows.scenario_id)
      from (
        select
          s.scenario_id,
          count(a.scenario_id)::integer as attempts,
          count(a.scenario_id) filter (where not a.correct)::integer as wrong,
          case when count(a.scenario_id) = 0 then 0
            else round(100.0 * count(a.scenario_id) filter (where not a.correct) / count(a.scenario_id))::integer
          end as rate
        from (
          select (item ->> 'id')::smallint as scenario_id
          from public.site_content content_row
          cross join lateral jsonb_array_elements(content_row.content -> 'scenarios') item
          where content_row.slug = 'main' and content_row.published
          union all
          select generate_series(1, 10)::smallint
          where not exists (
            select 1 from public.site_content where slug = 'main' and published
          )
        ) as s
        left join public.test_attempts a on a.scenario_id = s.scenario_id
        group by s.scenario_id
      ) scenario_rows
    ), '[]'::jsonb)
  ) into payload;

  return payload;
end;
$$;

revoke all on function public.get_ciso_dashboard() from public, anon;
grant execute on function public.get_ciso_dashboard() to authenticated;

create or replace function public.get_content_management_access()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  management_role text;
  managed_users jsonb := '[]'::jsonb;
begin
  if (select private.user_is_app_admin()) then
    management_role := 'admin';
  elsif (select private.user_can_edit_content()) then
    management_role := 'editor';
  else
    raise exception 'Content management access required' using errcode = '42501';
  end if;

  if management_role = 'admin' then
    select coalesce(jsonb_agg(to_jsonb(user_rows) order by user_rows.role_rank, user_rows.display_name), '[]'::jsonb)
    into managed_users
    from (
      select
        user_row.id,
        user_row.email,
        profile_row.username,
        profile_row.display_name,
        user_row.created_at,
        case
          when admin_row.user_id is not null then 'admin'
          when editor_row.user_id is not null then 'editor'
          else 'member'
        end as role,
        case
          when admin_row.user_id is not null then 0
          when editor_row.user_id is not null then 1
          else 2
        end as role_rank
      from auth.users user_row
      join public.profiles profile_row on profile_row.id = user_row.id
      left join private.app_admins admin_row on admin_row.user_id = user_row.id
      left join private.app_editors editor_row on editor_row.user_id = user_row.id
    ) user_rows;
  end if;

  return jsonb_build_object('role', management_role, 'users', managed_users);
end;
$$;

revoke all on function public.get_content_management_access() from public, anon;
grant execute on function public.get_content_management_access() to authenticated;

create or replace function public.set_content_manager_role(target_user_id uuid, target_role text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_role text := lower(trim(coalesce(target_role, '')));
  target_email text;
begin
  if not (select private.user_is_app_admin()) then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;
  if normalized_role not in ('admin', 'editor', 'member') then
    raise exception 'Invalid content role' using errcode = '22023';
  end if;
  if target_user_id = (select auth.uid()) and normalized_role <> 'admin' then
    raise exception 'Administrators cannot change their own role' using errcode = '42501';
  end if;

  select email into target_email from auth.users where id = target_user_id;
  if target_email is null then
    raise exception 'User not found' using errcode = 'P0002';
  end if;

  delete from private.app_editors where user_id = target_user_id;
  delete from private.app_admins where user_id = target_user_id;
  if normalized_role = 'admin' then
    insert into private.app_admins (user_id) values (target_user_id);
  elsif normalized_role = 'editor' then
    insert into private.app_editors (user_id) values (target_user_id);
  end if;

  return jsonb_build_object('userId', target_user_id, 'email', target_email, 'role', normalized_role);
end;
$$;

revoke all on function public.set_content_manager_role(uuid, text) from public, anon;
grant execute on function public.set_content_manager_role(uuid, text) to authenticated;

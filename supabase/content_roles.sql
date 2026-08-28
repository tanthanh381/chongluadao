-- Existing-project migration: Admin and Editor content roles.

create table if not exists private.app_editors (
  user_id uuid primary key references auth.users(id) on delete cascade,
  granted_at timestamptz not null default now()
);

alter table private.app_editors enable row level security;
drop policy if exists app_editors_no_direct_access on private.app_editors;
create policy app_editors_no_direct_access on private.app_editors
  for all to authenticated using (false) with check (false);

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
grant usage on schema private to authenticated;
grant execute on function private.user_can_edit_content() to authenticated;

drop policy if exists site_content_authenticated_read on public.site_content;
drop policy if exists site_content_admin_insert on public.site_content;
drop policy if exists site_content_admin_update on public.site_content;
drop policy if exists site_content_admin_delete on public.site_content;

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

notify pgrst, 'reload schema';

-- Run this once on an existing Supabase project to restore the simple username
-- rule. Password complexity is validated by the registration form.

alter table public.profiles
  drop constraint if exists profiles_username_format;

alter table public.profiles
  add constraint profiles_username_format check (username ~ '^[a-z0-9._-]{3,24}$');

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

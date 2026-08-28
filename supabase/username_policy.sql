-- Run this once on an existing Supabase project to synchronize the username
-- rules used by the registration form and the database trigger.

alter table public.profiles
  drop constraint if exists profiles_username_format;

alter table public.profiles
  add constraint profiles_username_format check (
    char_length(username) between 8 and 24
    and username ~ '^[A-Za-z0-9!@#$%^&*._-]+$'
    and username ~ '[A-Z]'
    and username ~ '[a-z]'
    and username ~ '[0-9]'
    and username ~ '[!@#$%^&*._-]'
  );

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_username text := trim(coalesce(new.raw_user_meta_data ->> 'username', ''));
  requested_display_name text := trim(coalesce(new.raw_user_meta_data ->> 'display_name', ''));
begin
  if char_length(requested_username) not between 8 and 24
    or requested_username !~ '^[A-Za-z0-9!@#$%^&*._-]+$'
    or requested_username !~ '[A-Z]'
    or requested_username !~ '[a-z]'
    or requested_username !~ '[0-9]'
    or requested_username !~ '[!@#$%^&*._-]'
  then
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

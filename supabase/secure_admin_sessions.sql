-- Require a live Supabase Auth session for every privileged operation.
-- This prevents a revoked access token from retaining Admin access until JWT expiry.

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
grant execute on function private.user_is_app_admin() to authenticated;

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

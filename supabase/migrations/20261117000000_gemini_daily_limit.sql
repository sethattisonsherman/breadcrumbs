create table if not exists public.gemini_daily_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  usage_day date not null,
  request_count integer not null default 0 check (request_count >= 0),
  primary key (user_id, usage_day)
);

alter table public.gemini_daily_usage enable row level security;
revoke all on table public.gemini_daily_usage from public, anon, authenticated;
grant all on table public.gemini_daily_usage to service_role;

create or replace function public.consume_gemini_daily_limit(
  p_user_id uuid,
  p_daily_limit integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  allowed boolean := false;
begin
  if p_user_id is null or p_daily_limit < 1 then
    return false;
  end if;

  insert into public.gemini_daily_usage (user_id, usage_day, request_count)
  values (p_user_id, (now() at time zone 'utc')::date, 1)
  on conflict (user_id, usage_day)
  do update
    set request_count = public.gemini_daily_usage.request_count + 1
    where public.gemini_daily_usage.request_count < p_daily_limit
  returning true into allowed;

  return coalesce(allowed, false);
end;
$$;

revoke all on function public.consume_gemini_daily_limit(uuid, integer)
  from public, anon, authenticated;
grant execute on function public.consume_gemini_daily_limit(uuid, integer)
  to service_role;

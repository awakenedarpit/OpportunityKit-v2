-- Durable Telegram import queue. The webhook only enqueues work; a cron worker processes it.
create table if not exists public.telegram_import_jobs (
  id bigserial primary key,
  update_id bigint not null unique,
  chat_id text not null,
  url text not null,
  status text not null default 'pending' check (status in ('pending','processing','completed','failed')),
  attempts integer not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  locked_at timestamptz,
  next_attempt_at timestamptz not null default now()
);
create index if not exists telegram_import_jobs_claim_idx
  on public.telegram_import_jobs(status, next_attempt_at, created_at);
alter table public.telegram_import_jobs enable row level security;

create or replace function public.claim_telegram_import_jobs(p_limit integer default 1)
returns setof public.telegram_import_jobs
language sql
security definer
set search_path = public
as $$
  with candidates as (
    select id
    from public.telegram_import_jobs
    where (
      (status = 'pending' and next_attempt_at <= now())
      or (status = 'processing' and locked_at < now() - interval '10 minutes')
    )
    order by created_at
    for update skip locked
    limit greatest(1, least(p_limit, 5))
  )
  update public.telegram_import_jobs j
  set status = 'processing',
      attempts = j.attempts + 1,
      locked_at = now(),
      updated_at = now()
  from candidates c
  where j.id = c.id
  returning j.*;
$$;
revoke all on function public.claim_telegram_import_jobs(integer) from public, anon, authenticated;
grant execute on function public.claim_telegram_import_jobs(integer) to service_role;

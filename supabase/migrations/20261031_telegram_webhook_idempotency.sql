-- Prevent Telegram webhook retries from processing the same update more than once.
create table if not exists public.telegram_processed_updates (
  update_id bigint primary key,
  processed_at timestamptz not null default now()
);

alter table public.telegram_processed_updates enable row level security;
-- No client-facing policies: only the server-side Supabase service role should access this table.

-- Keep the idempotency table bounded; old Telegram update IDs are no longer expected to be retried.
create index if not exists telegram_processed_updates_processed_at_idx
  on public.telegram_processed_updates(processed_at);

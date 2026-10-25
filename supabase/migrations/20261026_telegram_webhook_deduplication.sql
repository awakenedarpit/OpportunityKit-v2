-- Prevent Telegram webhook retries from processing the same update more than once.
-- The service-role client is used by the server route; no client-side access is needed.
create table if not exists public.telegram_webhook_updates (
  update_id bigint primary key,
  received_at timestamptz not null default now()
);

alter table public.telegram_webhook_updates enable row level security;

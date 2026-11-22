-- Allow one Telegram update to enqueue multiple links while remaining retry-safe.
-- The previous unique(update_id) constraint made the first insert prevent all
-- additional links in the same message from being queued.
alter table public.telegram_import_jobs
drop constraint if exists telegram_import_jobs_update_id_key;

create unique index if not exists telegram_import_jobs_update_url_idx
  on public.telegram_import_jobs(update_id, url);

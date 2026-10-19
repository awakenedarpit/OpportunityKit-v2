-- OpportunityKit persistent user data
-- Run this file in Supabase SQL Editor. Safe to re-run.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  education text not null default '',
  skills text not null default '',
  interests text not null default '',
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
drop policy if exists "Users manage own profile" on public.profiles;
create policy "Users manage own profile" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);

create table if not exists public.saved_opportunities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  opportunity_id text not null,
  opportunity jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, opportunity_id)
);
alter table public.saved_opportunities enable row level security;
drop policy if exists "Users manage own saved opportunities" on public.saved_opportunities;
create policy "Users manage own saved opportunities" on public.saved_opportunities for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  opportunity_id text not null,
  opportunity jsonb not null,
  status text not null default 'Saved' check (status in ('Saved','Applied','Assessment','Interview','Offer','Rejected','Withdrawn')),
  applied_at date,
  deadline date,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, opportunity_id)
);
alter table public.applications enable row level security;
drop policy if exists "Users manage own applications" on public.applications;
create policy "Users manage own applications" on public.applications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists saved_opportunities_user_created_idx on public.saved_opportunities(user_id, created_at desc);
create index if not exists applications_user_status_idx on public.applications(user_id, status);

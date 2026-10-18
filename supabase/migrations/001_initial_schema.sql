-- OpportunityKit v2 initial schema. Apply in Supabase SQL Editor.
create extension if not exists pgcrypto;
create table if not exists public.opportunities (
  id text primary key,
  title text not null,
  organization text not null default 'Organization not specified',
  category text not null default 'Opportunity',
  type text not null default 'Opportunity',
  location text not null default 'Not specified',
  mode text not null default 'Not specified',
  deadline date,
  url text not null unique,
  description text not null default '',
  eligibility jsonb not null default '[]'::jsonb,
  skills jsonb not null default '[]'::jsonb,
  tags jsonb not null default '[]'::jsonb,
  source text not null default 'Imported',
  stipend text,
  featured boolean not null default false,
  submitted_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists opportunities_deadline_idx on public.opportunities(deadline);
create index if not exists opportunities_category_idx on public.opportunities(category);
create index if not exists opportunities_created_at_idx on public.opportunities(created_at desc);
alter table public.opportunities enable row level security;
-- Public read access for published opportunity listings; only trusted server-side service role writes.
drop policy if exists "Public can read opportunities" on public.opportunities;
create policy "Public can read opportunities" on public.opportunities for select using (true);
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  education text,
  skills jsonb not null default '[]'::jsonb,
  interests text,
  resume_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create table if not exists public.saved_opportunities (
  user_id uuid not null references auth.users(id) on delete cascade,
  opportunity_id text not null references public.opportunities(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id, opportunity_id)
);
alter table public.saved_opportunities enable row level security;
drop policy if exists "Users manage own saved opportunities" on public.saved_opportunities;
create policy "Users manage own saved opportunities" on public.saved_opportunities for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  opportunity_id text not null references public.opportunities(id) on delete cascade,
  status text not null default 'Saved' check (status in ('Saved','Applied','Interview','Offer','Rejected','Withdrawn')),
  notes text,
  applied_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, opportunity_id)
);
alter table public.applications enable row level security;
drop policy if exists "Users manage own applications" on public.applications;
create policy "Users manage own applications" on public.applications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create table if not exists public.ai_fit_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  opportunity_id text not null references public.opportunities(id) on delete cascade,
  score integer check (score between 0 and 100),
  matched_skills jsonb not null default '[]'::jsonb,
  skill_gaps jsonb not null default '[]'::jsonb,
  explanation text not null default '',
  next_steps jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.ai_fit_reports enable row level security;
drop policy if exists "Users manage own fit reports" on public.ai_fit_reports;
create policy "Users manage own fit reports" on public.ai_fit_reports for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

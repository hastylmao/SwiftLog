create extension if not exists pgcrypto;

alter table public.user_settings
  add column if not exists gemini_api_key text,
  add column if not exists supplement_plan jsonb not null default '[]'::jsonb;

create table if not exists public.supplement_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  supplement_name text not null,
  dosage text not null default 'Taken',
  taken_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_supplement_logs_user_taken_at
  on public.supplement_logs(user_id, taken_at desc);

alter table public.supplement_logs enable row level security;
drop policy if exists "Users can read own supplement logs" on public.supplement_logs;
create policy "Users can read own supplement logs"
  on public.supplement_logs for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own supplement logs" on public.supplement_logs;
create policy "Users can insert own supplement logs"
  on public.supplement_logs for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own supplement logs" on public.supplement_logs;
create policy "Users can update own supplement logs"
  on public.supplement_logs for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own supplement logs" on public.supplement_logs;
create policy "Users can delete own supplement logs"
  on public.supplement_logs for delete
  to authenticated
  using (auth.uid() = user_id);

create table if not exists public.step_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  steps integer not null check (steps >= 0),
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_step_logs_user_logged_at
  on public.step_logs(user_id, logged_at desc);

alter table public.step_logs enable row level security;
drop policy if exists "Users can read own step logs" on public.step_logs;
create policy "Users can read own step logs"
  on public.step_logs for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own step logs" on public.step_logs;
create policy "Users can insert own step logs"
  on public.step_logs for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own step logs" on public.step_logs;
create policy "Users can update own step logs"
  on public.step_logs for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own step logs" on public.step_logs;
create policy "Users can delete own step logs"
  on public.step_logs for delete
  to authenticated
  using (auth.uid() = user_id);

create table if not exists public.cardio_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  cardio_type text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  calories_burned integer not null default 0 check (calories_burned >= 0),
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_cardio_logs_user_logged_at
  on public.cardio_logs(user_id, logged_at desc);

alter table public.cardio_logs enable row level security;
drop policy if exists "Users can read own cardio logs" on public.cardio_logs;
create policy "Users can read own cardio logs"
  on public.cardio_logs for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own cardio logs" on public.cardio_logs;
create policy "Users can insert own cardio logs"
  on public.cardio_logs for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own cardio logs" on public.cardio_logs;
create policy "Users can update own cardio logs"
  on public.cardio_logs for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own cardio logs" on public.cardio_logs;
create policy "Users can delete own cardio logs"
  on public.cardio_logs for delete
  to authenticated
  using (auth.uid() = user_id);

create table if not exists public.sleep_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  sleep_at timestamptz not null,
  wake_at timestamptz not null,
  quality_score integer,
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint sleep_logs_quality_score_check check (quality_score is null or (quality_score >= 0 and quality_score <= 100)),
  constraint sleep_logs_wake_after_sleep check (wake_at >= sleep_at)
);

create index if not exists idx_sleep_logs_user_logged_at
  on public.sleep_logs(user_id, logged_at desc);

alter table public.sleep_logs enable row level security;
drop policy if exists "Users can read own sleep logs" on public.sleep_logs;
create policy "Users can read own sleep logs"
  on public.sleep_logs for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own sleep logs" on public.sleep_logs;
create policy "Users can insert own sleep logs"
  on public.sleep_logs for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own sleep logs" on public.sleep_logs;
create policy "Users can update own sleep logs"
  on public.sleep_logs for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own sleep logs" on public.sleep_logs;
create policy "Users can delete own sleep logs"
  on public.sleep_logs for delete
  to authenticated
  using (auth.uid() = user_id);

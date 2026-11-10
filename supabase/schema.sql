-- ====================================================================
-- СХЕМА БАЗЫ ДАННЫХ ДЛЯ TASK SCHEDULER (SUPABASE)
-- Выполните этот скрипт в панели управления Supabase -> SQL Editor -> Run
-- ====================================================================

-- 1. Таблица профилей пользователей
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  display_name text,
  created_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- 2. Таблица категорий
create table if not exists public.categories (
  id text primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  color text not null,
  is_default boolean default false not null,
  order_index integer default 0 not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.categories enable row level security;

create policy "Users manage own categories"
  on public.categories for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 3. Таблица целей
create table if not exists public.goals (
  id text primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  description text,
  category_id text,
  period text not null,
  period_start text not null,
  priority text not null,
  deadline text,
  subgoals jsonb default '[]'::jsonb not null,
  goal_type text default 'general' not null,
  daily_history jsonb default '{}'::jsonb not null,
  completed_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.goals enable row level security;

create policy "Users manage own goals"
  on public.goals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 4. Таблица расписания
create table if not exists public.schedule (
  id text primary key,
  user_id uuid references auth.users on delete cascade not null,
  date text not null,
  repeat_daily boolean default false not null,
  start_time text not null,
  end_time text not null,
  title text not null,
  time_note text,
  color text not null,
  daily_progress jsonb default '{}'::jsonb not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.schedule enable row level security;

create policy "Users manage own schedule"
  on public.schedule for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


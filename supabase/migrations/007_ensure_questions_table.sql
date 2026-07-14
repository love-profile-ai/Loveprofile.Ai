-- Repair: ensure questions table + missing columns exist (safe to re-run)
-- Run in Supabase → SQL Editor if npm run db:setup cannot connect.

-- Questions table (migration 003 core)
create table if not exists public.questions (
  id text primary key,
  path text not null check (path in ('do_i_love_someone', 'does_someone_love_me')),
  category text not null default 'general',
  question_text text not null,
  type text not null check (type in ('single_select', 'slider', 'multi_select')),
  options jsonb not null default '[]'::jsonb,
  psychological_dimension text not null,
  weight numeric not null default 1,
  priority integer not null default 50,
  follow_up_rules jsonb not null default '{}'::jsonb,
  scoring jsonb not null default '{}'::jsonb,
  confidence_value numeric not null default 0.12,
  parent_question_id text references public.questions(id) on delete set null,
  is_clarification boolean not null default false,
  is_starter boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_questions_path_active on public.questions(path, is_active);
create index if not exists idx_questions_dimension on public.questions(psychological_dimension);
create index if not exists idx_questions_parent on public.questions(parent_question_id);

alter table public.questions enable row level security;

drop policy if exists "Anyone reads active questions" on public.questions;
create policy "Anyone reads active questions" on public.questions
  for select using (is_active = true or public.is_admin());

drop policy if exists "Admins manage questions" on public.questions;
create policy "Admins manage questions" on public.questions
  for all using (public.is_admin()) with check (public.is_admin());

-- Expanded profile columns (migrations 004–006)
alter table public.assessment_profiles
  add column if not exists friendship_score numeric not null default 0,
  add column if not exists commitment_score numeric not null default 0,
  add column if not exists reciprocity_score numeric not null default 0,
  add column if not exists assessment_summary jsonb not null default '{}'::jsonb;

-- Notify PostgREST to reload schema cache
notify pgrst, 'reload schema';

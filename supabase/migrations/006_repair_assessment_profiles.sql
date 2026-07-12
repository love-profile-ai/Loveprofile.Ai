-- Repair missing assessment_profiles columns (safe idempotent)
alter table public.assessment_profiles
  add column if not exists friendship_score numeric not null default 0,
  add column if not exists commitment_score numeric not null default 0,
  add column if not exists reciprocity_score numeric not null default 0,
  add column if not exists assessment_summary jsonb not null default '{}'::jsonb;

-- Ensure questions FK parent references remain valid
alter table public.assessment_answers
  drop constraint if exists assessment_answers_question_id_fkey;

alter table public.assessment_answers
  add constraint assessment_answers_question_id_fkey
  foreign key (question_id) references public.questions(id) on delete restrict;

-- Re-assert RLS policies if missing (idempotent via drop/create)
drop policy if exists "Anyone reads active questions" on public.questions;
create policy "Anyone reads active questions" on public.questions
  for select using (is_active = true or public.is_admin());

drop policy if exists "Admins manage questions" on public.questions;
create policy "Admins manage questions" on public.questions
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Users manage own assessment sessions" on public.assessment_sessions;
create policy "Users manage own assessment sessions" on public.assessment_sessions
  for all using (auth.uid() = user_id);

drop policy if exists "Users manage own assessment answers" on public.assessment_answers;
create policy "Users manage own assessment answers" on public.assessment_answers
  for all using (
    exists (
      select 1 from public.assessment_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

drop policy if exists "Users manage own assessment profiles" on public.assessment_profiles;
create policy "Users manage own assessment profiles" on public.assessment_profiles
  for all using (
    exists (
      select 1 from public.assessment_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

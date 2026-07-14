-- Foundation questions (fdls_*, fdslm_*) live in application code, not the questions table.
-- Migration 006 added a FK that blocks saving foundation answers. Drop it.

alter table public.assessment_answers
  drop constraint if exists assessment_answers_question_id_fkey;

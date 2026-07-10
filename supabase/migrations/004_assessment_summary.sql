-- Compact assessment summary (token-optimized report input)
alter table public.assessment_profiles
  add column if not exists assessment_summary jsonb not null default '{}'::jsonb;

-- Store summary on reports for token-optimized follow-up chat
alter table public.reports
  add column if not exists assessment_summary jsonb;

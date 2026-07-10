-- Loveprofile.Ai — Adaptive Question Engine
-- Tables: questions, assessment_sessions, assessment_answers, assessment_profiles

-- ─── Question bank (adaptive engine) ─────────────────────────────────────────

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

-- ─── Assessment sessions ─────────────────────────────────────────────────────

create table if not exists public.assessment_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  path text not null check (path in ('do_i_love_someone', 'does_someone_love_me')),
  status text not null default 'in_progress'
    check (status in ('in_progress', 'completed', 'abandoned')),
  question_count integer not null default 0,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_assessment_sessions_user on public.assessment_sessions(user_id, created_at desc);

-- ─── Answers ─────────────────────────────────────────────────────────────────

create table if not exists public.assessment_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.assessment_sessions(id) on delete cascade,
  question_id text not null references public.questions(id) on delete restrict,
  value jsonb not null,
  score_deltas jsonb not null default '{}'::jsonb,
  is_uncertain boolean not null default false,
  created_at timestamptz default now() not null
);

create index if not exists idx_assessment_answers_session on public.assessment_answers(session_id, created_at);
create unique index if not exists idx_assessment_answers_unique on public.assessment_answers(session_id, question_id);

-- ─── Derived session profiles (cached scores) ────────────────────────────────

create table if not exists public.assessment_profiles (
  session_id uuid primary key references public.assessment_sessions(id) on delete cascade,
  love_score numeric not null default 0,
  crush_score numeric not null default 0,
  trust_score numeric not null default 0,
  attachment_score numeric not null default 0,
  future_score numeric not null default 0,
  communication_score numeric not null default 0,
  jealousy_score numeric not null default 0,
  physical_attraction_score numeric not null default 0,
  emotional_attraction_score numeric not null default 0,
  confidence_score numeric not null default 0,
  dimension_certainty jsonb not null default '{}'::jsonb,
  asked_question_ids text[] not null default '{}',
  updated_at timestamptz default now() not null
);

-- ─── RLS ─────────────────────────────────────────────────────────────────────

alter table public.questions enable row level security;
alter table public.assessment_sessions enable row level security;
alter table public.assessment_answers enable row level security;
alter table public.assessment_profiles enable row level security;

create policy "Anyone reads active questions" on public.questions
  for select using (is_active = true or public.is_admin());

create policy "Admins manage questions" on public.questions
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Users manage own assessment sessions" on public.assessment_sessions
  for all using (auth.uid() = user_id);

create policy "Users manage own assessment answers" on public.assessment_answers
  for all using (
    exists (
      select 1 from public.assessment_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

create policy "Users manage own assessment profiles" on public.assessment_profiles
  for all using (
    exists (
      select 1 from public.assessment_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

drop trigger if exists set_questions_updated_at on public.questions;
create trigger set_questions_updated_at
  before update on public.questions
  for each row execute function public.set_updated_at();

drop trigger if exists set_assessment_sessions_updated_at on public.assessment_sessions;
create trigger set_assessment_sessions_updated_at
  before update on public.assessment_sessions
  for each row execute function public.set_updated_at();

drop trigger if exists set_assessment_profiles_updated_at on public.assessment_profiles;
create trigger set_assessment_profiles_updated_at
  before update on public.assessment_profiles
  for each row execute function public.set_updated_at();

-- ─── Seed: Do I Love Someone? ──────────────────────────────────────────────

insert into public.questions (id, path, category, question_text, type, options, psychological_dimension, weight, priority, is_starter, scoring, confidence_value, follow_up_rules) values
('dls_role', 'do_i_love_someone', 'foundation', 'Who is this person in your life?', 'single_select',
 '[{"label":"Friend","value":"friend"},{"label":"Best friend","value":"best_friend"},{"label":"Classmate","value":"classmate"},{"label":"Coworker","value":"coworker"},{"label":"Someone I recently met","value":"recently_met"},{"label":"Ex","value":"ex"}]'::jsonb,
 'attachment', 1, 100, true,
 '{"single_select":{"friend":{"attachment":8},"best_friend":{"attachment":14,"trust":6},"recently_met":{"crush":10},"ex":{"attachment":6,"love":-5}}}'::jsonb,
 0.08, '{}'),

('dls_think_often', 'do_i_love_someone', 'emotional', 'How often do you think about them?', 'slider', '{"min":1,"max":10}'::jsonb,
 'love', 1.2, 90, true,
 '{"slider":{"scale":{"love":2.5,"crush":1.5,"attachment":1},"confidence":0.14}}'::jsonb,
 0.14, '{}'),

('dls_excited', 'do_i_love_someone', 'emotional', 'How excited are you to see or talk to them?', 'slider', '{"min":1,"max":10}'::jsonb,
 'crush', 1.1, 85, false,
 '{"slider":{"scale":{"crush":2.8,"love":1.2,"physical_attraction":1.5},"confidence":0.13}}'::jsonb,
 0.13, '{}'),

('dls_miss', 'do_i_love_someone', 'emotional', 'Do you miss them when they are not around?', 'single_select',
 '[{"label":"Never","value":"never"},{"label":"Sometimes","value":"sometimes"},{"label":"Often","value":"often"},{"label":"Almost always","value":"almost_always"},{"label":"Not sure","value":"not_sure"}]'::jsonb,
 'attachment', 1, 80, false,
 '{"single_select":{"never":{"attachment":-8},"sometimes":{"attachment":8,"love":4},"often":{"attachment":16,"love":10},"almost_always":{"attachment":22,"love":14},"not_sure":{"attachment":2}}}'::jsonb,
 0.12, '{}'),

('dls_happiness', 'do_i_love_someone', 'emotional', 'How important is their happiness to you?', 'slider', '{"min":1,"max":10}'::jsonb,
 'love', 1.3, 75, false,
 '{"slider":{"scale":{"love":3,"attachment":1.5,"emotional_attraction":1.2},"confidence":0.14}}'::jsonb,
 0.14, '{}'),

('dls_trust', 'do_i_love_someone', 'trust', 'How much do you trust them with your feelings?', 'slider', '{"min":1,"max":10}'::jsonb,
 'trust', 1.4, 88, false,
 '{"slider":{"scale":{"trust":3.2,"love":1,"attachment":1},"confidence":0.15}}'::jsonb,
 0.15, '{"only_if":[{"type":"dimension_uncertain","dimension":"trust","below":0.55}]}'),

('dls_jealousy', 'do_i_love_someone', 'jealousy', 'How do you feel when they spend time with others?', 'single_select',
 '[{"label":"Unbothered","value":"unbothered"},{"label":"A little uneasy","value":"uneasy"},{"label":"Quite jealous","value":"jealous"},{"label":"Very jealous","value":"very_jealous"},{"label":"Not sure","value":"not_sure"}]'::jsonb,
 'jealousy', 1, 70, false,
 '{"single_select":{"unbothered":{"jealousy":-10,"love":-4},"uneasy":{"jealousy":12,"love":8,"attachment":6},"jealous":{"jealousy":22,"love":14,"attachment":10},"very_jealous":{"jealousy":30,"love":18},"not_sure":{"jealousy":5}}}'::jsonb,
 0.11, '{"skip_if":[{"type":"dimension_below","dimension":"crush","threshold":20}]}'),

('dls_future', 'do_i_love_someone', 'future', 'Can you imagine a future with them?', 'single_select',
 '[{"label":"No","value":"no"},{"label":"Maybe","value":"maybe"},{"label":"Yes, clearly","value":"yes"},{"label":"Not sure","value":"not_sure"}]'::jsonb,
 'future', 1.2, 82, false,
 '{"single_select":{"no":{"future":-15,"love":-8},"maybe":{"future":12,"love":8},"yes":{"future":28,"love":18,"attachment":10},"not_sure":{"future":5}}}'::jsonb,
 0.13, '{"skip_if":[{"type":"dimension_below","dimension":"love","threshold":25},{"type":"answer_equals","question_id":"dls_excited","value":"not_sure"}]}'),

('dls_communication', 'do_i_love_someone', 'communication', 'How easy is it to be honest with them?', 'slider', '{"min":1,"max":10}'::jsonb,
 'communication', 1.1, 78, false,
 '{"slider":{"scale":{"communication":2.8,"trust":1.5,"emotional_attraction":1},"confidence":0.13}}'::jsonb,
 0.13, '{}'),

('dls_physical', 'do_i_love_someone', 'attraction', 'How physically attracted are you to them?', 'slider', '{"min":1,"max":10}'::jsonb,
 'physical_attraction', 1, 72, false,
 '{"slider":{"scale":{"physical_attraction":3,"crush":2},"confidence":0.12}}'::jsonb,
 0.12, '{}'),

('dls_emotional', 'do_i_love_someone', 'attraction', 'How emotionally connected do you feel?', 'slider', '{"min":1,"max":10}'::jsonb,
 'emotional_attraction', 1.2, 86, false,
 '{"slider":{"scale":{"emotional_attraction":3,"love":2,"attachment":1.5},"confidence":0.14}}'::jsonb,
 0.14, '{"only_if":[{"type":"dimension_gap","high":"physical_attraction","low":"emotional_attraction","gap":25}]}'),

('dls_clarify_miss', 'do_i_love_someone', 'clarification', 'When you say you are unsure about missing them — is that because the feeling is mild, or because you have not noticed yet?', 'single_select',
 '[{"label":"The feeling is mild or inconsistent","value":"mild"},{"label":"I have not noticed yet","value":"not_noticed"},{"label":"I am confused about what I feel","value":"confused"}]'::jsonb,
 'attachment', 0.8, 95, false,
 '{"single_select":{"mild":{"attachment":6},"not_noticed":{"attachment":2},"confused":{"attachment":4,"love":3}}}'::jsonb,
 0.1, '{}')
on conflict (id) do nothing;

update public.questions set parent_question_id = 'dls_miss', is_clarification = true where id = 'dls_clarify_miss';

-- ─── Seed: Does Someone Love Me? ─────────────────────────────────────────────

insert into public.questions (id, path, category, question_text, type, options, psychological_dimension, weight, priority, is_starter, scoring, confidence_value, follow_up_rules) values
('dsl_role', 'does_someone_love_me', 'foundation', 'Who is this person in your life?', 'single_select',
 '[{"label":"Friend","value":"friend"},{"label":"Best friend","value":"best_friend"},{"label":"Classmate","value":"classmate"},{"label":"Coworker","value":"coworker"},{"label":"Someone I recently met","value":"recently_met"},{"label":"Ex","value":"ex"}]'::jsonb,
 'attachment', 1, 100, true,
 '{"single_select":{"friend":{"attachment":8},"best_friend":{"attachment":12},"recently_met":{"crush":8}}}'::jsonb,
 0.08, '{}'),

('dsl_engagement', 'does_someone_love_me', 'communication', 'How engaged are they when talking with you?', 'slider', '{"min":1,"max":10}'::jsonb,
 'communication', 1.3, 92, true,
 '{"slider":{"scale":{"communication":3,"love":1.5,"crush":1},"confidence":0.15}}'::jsonb,
 0.15, '{}'),

('dsl_initiator', 'does_someone_love_me', 'communication', 'Who usually starts conversations?', 'single_select',
 '[{"label":"Mostly me","value":"mostly_me"},{"label":"Mostly them","value":"mostly_them"},{"label":"Both equally","value":"both"},{"label":"Not sure","value":"not_sure"}]'::jsonb,
 'communication', 1, 80, false,
 '{"single_select":{"mostly_me":{"communication":-8,"love":-6},"mostly_them":{"communication":14,"love":10,"crush":8},"both":{"communication":18,"love":8},"not_sure":{"communication":3}}}'::jsonb,
 0.11, '{}'),

('dsl_remembers', 'does_someone_love_me', 'emotional', 'Do they remember small details about you?', 'single_select',
 '[{"label":"Never","value":"never"},{"label":"Sometimes","value":"sometimes"},{"label":"Often","value":"often"},{"label":"Almost always","value":"almost_always"}]'::jsonb,
 'love', 1.1, 85, false,
 '{"single_select":{"never":{"love":-12,"trust":-8},"sometimes":{"love":8,"trust":6},"often":{"love":16,"attachment":10},"almost_always":{"love":24,"trust":12,"attachment":14}}}'::jsonb,
 0.13, '{}'),

('dsl_support', 'does_someone_love_me', 'trust', 'When you are upset, how do they respond?', 'single_select',
 '[{"label":"Ignore it","value":"ignore"},{"label":"Basic support","value":"basic"},{"label":"Comfort me","value":"comfort"},{"label":"Go out of their way","value":"extra"},{"label":"Not sure","value":"not_sure"}]'::jsonb,
 'trust', 1.2, 88, false,
 '{"single_select":{"ignore":{"trust":-18,"love":-14},"basic":{"trust":8,"love":6},"comfort":{"trust":18,"love":14,"attachment":10},"extra":{"trust":28,"love":22,"attachment":16},"not_sure":{"trust":4}}}'::jsonb,
 0.14, '{}'),

('dsl_time', 'does_someone_love_me', 'attachment', 'Do they make time for you even when busy?', 'slider', '{"min":1,"max":10}'::jsonb,
 'attachment', 1.2, 84, false,
 '{"slider":{"scale":{"attachment":2.8,"love":2,"crush":1.2},"confidence":0.14}}'::jsonb,
 0.14, '{}'),

('dsl_jealousy_signs', 'does_someone_love_me', 'jealousy', 'Do they show signs of jealousy or protectiveness around you?', 'single_select',
 '[{"label":"Never","value":"never"},{"label":"Sometimes","value":"sometimes"},{"label":"Often","value":"often"},{"label":"Not sure","value":"not_sure"}]'::jsonb,
 'jealousy', 1, 72, false,
 '{"single_select":{"never":{"jealousy":-8,"love":-4},"sometimes":{"jealousy":14,"love":10},"often":{"jealousy":22,"love":16},"not_sure":{"jealousy":4}}}'::jsonb,
 0.11, '{}'),

('dsl_future_signals', 'does_someone_love_me', 'future', 'Do they talk about future plans that include you?', 'single_select',
 '[{"label":"No","value":"no"},{"label":"Sometimes vaguely","value":"vague"},{"label":"Yes, clearly","value":"yes"},{"label":"Not sure","value":"not_sure"}]'::jsonb,
 'future', 1.2, 82, false,
 '{"single_select":{"no":{"future":-14,"love":-8},"vague":{"future":10,"love":6},"yes":{"future":26,"love":18,"attachment":12},"not_sure":{"future":4}}}'::jsonb,
 0.13, '{"skip_if":[{"type":"dimension_below","dimension":"love","threshold":20}]}'),

('dsl_physical_closeness', 'does_someone_love_me', 'attraction', 'How much physical closeness or affection do they show?', 'slider', '{"min":1,"max":10}'::jsonb,
 'physical_attraction', 1, 76, false,
 '{"slider":{"scale":{"physical_attraction":3,"crush":2,"love":1},"confidence":0.12}}'::jsonb,
 0.12, '{}'),

('dsl_emotional_openness', 'does_someone_love_me', 'attraction', 'How emotionally open are they with you?', 'slider', '{"min":1,"max":10}'::jsonb,
 'emotional_attraction', 1.2, 86, false,
 '{"slider":{"scale":{"emotional_attraction":3,"trust":1.5,"love":2},"confidence":0.14}}'::jsonb,
 0.14, '{"only_if":[{"type":"dimension_gap","high":"physical_attraction","low":"emotional_attraction","gap":25}]}'),

('dsl_clarify_support', 'does_someone_love_me', 'clarification', 'When you are unsure about their support — is it inconsistent, or have you not tested it yet?', 'single_select',
 '[{"label":"Inconsistent","value":"inconsistent"},{"label":"Have not tested it","value":"untested"},{"label":"Hard to read their intentions","value":"hard_to_read"}]'::jsonb,
 'trust', 0.8, 95, false,
 '{"single_select":{"inconsistent":{"trust":4},"untested":{"trust":2},"hard_to_read":{"trust":3,"communication":-4}}}'::jsonb,
 0.1, '{}')
on conflict (id) do nothing;

update public.questions set parent_question_id = 'dsl_support', is_clarification = true where id = 'dsl_clarify_support';

-- Link adaptive reports to assessment sessions (reports.session_id references legacy analysis_sessions)
alter table public.reports
  add column if not exists assessment_session_id uuid references public.assessment_sessions(id) on delete set null;

create index if not exists idx_reports_assessment_session on public.reports(assessment_session_id);

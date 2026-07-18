-- Loveprofile.Ai — run this ONCE in Supabase → SQL Editor → New query → Run

-- ===== 001_initial_schema.sql =====
-- AI Relationship Analyst — initial schema

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.analysis_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  path text not null check (path in ('i_like_someone', 'someone_likes_me')),
  current_question_id text,
  answers jsonb not null default '[]'::jsonb,
  status text not null default 'in_progress'
    check (status in ('in_progress', 'completed', 'abandoned')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_sessions_user on analysis_sessions(user_id);
create index if not exists idx_sessions_status on analysis_sessions(user_id, status);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid references analysis_sessions(id) on delete set null,
  title text not null default 'Relationship Analysis',
  path text not null,
  answers jsonb not null,
  analysis jsonb not null,
  share_token text unique default encode(gen_random_bytes(16), 'hex'),
  is_public boolean default false,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_reports_user on reports(user_id, created_at desc);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now() not null
);

create index if not exists idx_chat_report on chat_messages(report_id, created_at);

alter table profiles enable row level security;
alter table analysis_sessions enable row level security;
alter table reports enable row level security;
alter table chat_messages enable row level security;

create policy "Users manage own profile" on profiles
  for all using (auth.uid() = id);

create policy "Users manage own sessions" on analysis_sessions
  for all using (auth.uid() = user_id);

create policy "Users manage own reports" on reports
  for all using (auth.uid() = user_id);

create policy "Users manage own chat" on chat_messages
  for all using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_profiles_updated_at on profiles;
create trigger set_profiles_updated_at
  before update on profiles
  for each row execute function public.set_updated_at();

drop trigger if exists set_sessions_updated_at on analysis_sessions;
create trigger set_sessions_updated_at
  before update on analysis_sessions
  for each row execute function public.set_updated_at();

drop trigger if exists set_reports_updated_at on reports;
create trigger set_reports_updated_at
  before update on reports
  for each row execute function public.set_updated_at();


-- ===== 002_admin_control_center.sql =====
-- Signal Admin Control Center — safe additive migration
-- Preserves existing users/reports and adds approval/RBAC/admin management.

alter table public.profiles
  add column if not exists email text,
  add column if not exists full_name text,
  add column if not exists provider text,
  add column if not exists role text not null default 'user'
    check (role in ('user', 'admin', 'moderator')),
  add column if not exists approval_status text not null default 'approved'
    check (approval_status in ('approved', 'pending', 'rejected', 'blocked', 'suspended', 'inactive')),
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by uuid references auth.users(id) on delete set null,
  add column if not exists rejected_at timestamptz,
  add column if not exists blocked_at timestamptz,
  add column if not exists admin_notes text,
  add column if not exists last_login_at timestamptz,
  add column if not exists last_ip inet,
  add column if not exists country text,
  add column if not exists browser text,
  add column if not exists device text,
  add column if not exists is_guest boolean not null default false;

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_approval on public.profiles(approval_status);
create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_profiles_created_at on public.profiles(created_at desc);

-- Existing users should continue to work after migration.
update public.profiles
set approval_status = 'approved'
where approval_status is null or approval_status = 'pending';

create or replace function public.is_admin(user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = user_id
      and role = 'admin'
      and approval_status = 'approved'
  );
$$;

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  target_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null default 'system',
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  ip inet,
  user_agent text,
  created_at timestamptz default now() not null
);

create index if not exists idx_audit_actor on public.admin_audit_logs(actor_id, created_at desc);
create index if not exists idx_audit_target on public.admin_audit_logs(target_user_id, created_at desc);

create table if not exists public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  title text not null,
  message text,
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz default now() not null
);

create table if not exists public.website_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz default now() not null
);

insert into public.website_settings (key, value)
values
  ('general', jsonb_build_object(
    'websiteName', 'Signal',
    'seoTitle', 'Signal — AI Relationship Analyst',
    'seoDescription', 'Understand your relationship through AI-powered psychological analysis.',
    'supportEmail', 'support@signal.app',
    'announcementEnabled', false,
    'announcementText', ''
  )),
  ('maintenance', jsonb_build_object(
    'enabled', false,
    'reason', 'We are polishing Signal for a better experience.',
    'estimatedReturn', '',
    'contactEmail', 'support@signal.app'
  )),
  ('music', jsonb_build_object(
    'enabled', false,
    'volume', 35,
    'autoplay', false,
    'loop', true,
    'shuffle', false,
    'fadeIn', true,
    'fadeOut', true,
    'selectedPages', ARRAY['/'::text]
  )),
  ('theme', jsonb_build_object(
    'primary', '#D94F70',
    'accent', '#D4AF37',
    'darkBackground', '#1D1217'
  ))
on conflict (key) do nothing;

create table if not exists public.question_bank (
  id uuid primary key default gen_random_uuid(),
  path text not null default 'i_like_someone',
  question_key text,
  text text not null,
  description text,
  placeholder text,
  type text not null default 'single_choice'
    check (type in ('single_choice','multiple_choice','slider','rating','emoji','text','textarea','dropdown','image_choice','date','yes_no')),
  options jsonb not null default '[]'::jsonb,
  weight numeric default 1,
  score numeric default 0,
  category text,
  required boolean not null default true,
  enabled boolean not null default true,
  visibility jsonb not null default '{}'::jsonb,
  conditions jsonb not null default '{}'::jsonb,
  validation jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_question_bank_path_order on public.question_bank(path, sort_order);
create index if not exists idx_question_bank_enabled on public.question_bank(enabled);

create table if not exists public.content_blocks (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  title text not null,
  type text not null default 'generic',
  content jsonb not null default '{}'::jsonb,
  enabled boolean not null default true,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz default now() not null,
  created_at timestamptz default now() not null
);

create table if not exists public.music_tracks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text,
  url text not null,
  storage_path text,
  enabled boolean not null default true,
  is_default boolean not null default false,
  volume integer default 35 check (volume between 0 and 100),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  event text not null,
  page text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now() not null
);

create index if not exists idx_analytics_event_time on public.analytics_events(event, created_at desc);
create index if not exists idx_analytics_user_time on public.analytics_events(user_id, created_at desc);

create or replace function public.handle_new_user()
returns trigger as $$
declare
  is_guest_user boolean := coalesce((new.raw_user_meta_data->>'guest')::boolean, false);
  provider_name text := coalesce(new.raw_app_meta_data->>'provider', 'email');
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    display_name,
    avatar_url,
    provider,
    is_guest,
    approval_status
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url',
    provider_name,
    is_guest_user,
    case when is_guest_user then 'approved' else 'pending' end
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    display_name = coalesce(public.profiles.display_name, excluded.display_name),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
    provider = coalesce(public.profiles.provider, excluded.provider),
    is_guest = public.profiles.is_guest or excluded.is_guest;

  insert into public.admin_notifications (type, title, message, metadata)
  values (
    'user_registration',
    'New user awaiting approval',
    coalesce(new.email, 'A new user') || ' registered and needs review.',
    jsonb_build_object('user_id', new.id, 'email', new.email, 'provider', provider_name)
  );

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists set_question_bank_updated_at on public.question_bank;
create trigger set_question_bank_updated_at
  before update on public.question_bank
  for each row execute function public.set_updated_at();

drop trigger if exists set_music_tracks_updated_at on public.music_tracks;
create trigger set_music_tracks_updated_at
  before update on public.music_tracks
  for each row execute function public.set_updated_at();

alter table public.admin_audit_logs enable row level security;
alter table public.admin_notifications enable row level security;
alter table public.website_settings enable row level security;
alter table public.question_bank enable row level security;
alter table public.content_blocks enable row level security;
alter table public.music_tracks enable row level security;
alter table public.analytics_events enable row level security;

create policy "Admins manage audit logs" on public.admin_audit_logs
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Admins manage notifications" on public.admin_notifications
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Public reads settings" on public.website_settings
  for select using (true);

create policy "Admins manage settings" on public.website_settings
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Public reads enabled questions" on public.question_bank
  for select using (enabled = true or public.is_admin());

create policy "Admins manage questions" on public.question_bank
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Public reads enabled content" on public.content_blocks
  for select using (enabled = true or public.is_admin());

create policy "Admins manage content" on public.content_blocks
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Public reads enabled music" on public.music_tracks
  for select using (enabled = true or public.is_admin());

create policy "Admins manage music" on public.music_tracks
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Users insert own analytics" on public.analytics_events
  for insert with check (auth.uid() = user_id or user_id is null);

create policy "Admins read analytics" on public.analytics_events
  for select using (public.is_admin());


-- ===== 003_adaptive_question_engine.sql =====
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


-- ===== 004_assessment_summary.sql =====
-- Compact assessment summary (token-optimized report input)
alter table public.assessment_profiles
  add column if not exists assessment_summary jsonb not null default '{}'::jsonb;

-- Store summary on reports for token-optimized follow-up chat
alter table public.reports
  add column if not exists assessment_summary jsonb;


-- ===== 005_expanded_adaptive_question_bank.sql =====
-- Loveprofile.Ai — Expanded adaptive question bank
-- Adds missing dimensions and 3 sibling questions per dimension, per path.

alter table public.assessment_profiles
  add column if not exists friendship_score numeric not null default 0,
  add column if not exists commitment_score numeric not null default 0,
  add column if not exists reciprocity_score numeric not null default 0;

-- Each concept becomes one question for each assessment path.
-- The three priority tiers give the selector meaningful sibling choices.
with concepts (
  suffix,
  category,
  dimension,
  secondary_dimension,
  priority,
  weight,
  confidence_value,
  rule_tier,
  self_text,
  other_text
) as (
  values
  -- Love
  ('love_acceptance', 'love', 'love', 'emotional_attraction', 84, 1.25, 0.13, 1,
   'How deeply do you accept this person as they are, including their flaws?',
   'How consistently do they seem to accept you as you are, including your flaws?'),
  ('love_care', 'love', 'love', 'attachment', 76, 1.15, 0.12, 2,
   'How strongly do you care about their wellbeing even when you gain nothing from it?',
   'How strongly do they care about your wellbeing when they gain nothing from it?'),
  ('love_stability', 'love', 'love', 'commitment', 68, 1.10, 0.11, 3,
   'How steady do your feelings remain after conflict, distance, or disappointment?',
   'How steady do their feelings seem after conflict, distance, or disappointment?'),

  -- Crush
  ('crush_anticipation', 'crush', 'crush', 'physical_attraction', 84, 1.10, 0.12, 1,
   'How much anticipation or nervous excitement do you feel before seeing them?',
   'How much anticipation or nervous excitement do they show before seeing you?'),
  ('crush_idealization', 'crush', 'crush', 'love', 76, 1.00, 0.11, 2,
   'How often do you catch yourself idealizing them or replaying small moments?',
   'How often do they seem to idealize you or replay small moments you shared?'),
  ('crush_novelty', 'crush', 'crush', 'friendship', 68, 0.95, 0.10, 3,
   'How much of your attraction depends on novelty, mystery, or uncertainty?',
   'How much of their interest seems driven by novelty, mystery, or uncertainty?'),

  -- Friendship
  ('friendship_enjoyment', 'friendship', 'friendship', 'communication', 84, 1.15, 0.12, 1,
   'How much do you enjoy ordinary, non-romantic time with them?',
   'How much do they enjoy ordinary, non-romantic time with you?'),
  ('friendship_authenticity', 'friendship', 'friendship', 'trust', 76, 1.15, 0.12, 2,
   'How fully can you be yourself around them without trying to impress them?',
   'How fully do they seem able to be themselves around you?'),
  ('friendship_respect', 'friendship', 'friendship', 'reciprocity', 68, 1.05, 0.11, 3,
   'How much do you respect their opinions, boundaries, and individuality?',
   'How much do they respect your opinions, boundaries, and individuality?'),

  -- Trust
  ('trust_reliability', 'trust', 'trust', 'commitment', 84, 1.30, 0.14, 1,
   'How confident are you that they will do what they say they will do?',
   'How consistently do their actions match what they promise you?'),
  ('trust_vulnerability', 'trust', 'trust', 'emotional_attraction', 76, 1.25, 0.13, 2,
   'How safe do you feel sharing something vulnerable or embarrassing with them?',
   'How safe do they make it for you to share something vulnerable or embarrassing?'),
  ('trust_conflict', 'trust', 'trust', 'communication', 68, 1.20, 0.12, 3,
   'How much do you trust them to handle conflict without manipulation or punishment?',
   'How well do they handle conflict without manipulation, withdrawal, or punishment?'),

  -- Attachment
  ('attachment_comfort', 'attachment', 'attachment', 'emotional_attraction', 84, 1.20, 0.13, 1,
   'How much emotional comfort do you seek from them when life feels difficult?',
   'How often do they seek emotional comfort from you when life feels difficult?'),
  ('attachment_separation', 'attachment', 'attachment', 'jealousy', 76, 1.10, 0.12, 2,
   'How emotionally unsettled do you become when contact suddenly decreases?',
   'How emotionally unsettled do they seem when contact with you decreases?'),
  ('attachment_security', 'attachment', 'attachment', 'trust', 68, 1.20, 0.12, 3,
   'How secure does your bond feel without constant reassurance?',
   'How secure do they seem in your bond without needing constant reassurance?'),

  -- Commitment
  ('commitment_effort', 'commitment', 'commitment', 'reciprocity', 84, 1.30, 0.14, 1,
   'How willing are you to make sustained effort when this relationship becomes inconvenient?',
   'How willing are they to make sustained effort when the relationship becomes inconvenient?'),
  ('commitment_choice', 'commitment', 'commitment', 'love', 76, 1.25, 0.13, 2,
   'How strongly would you choose this relationship after the initial excitement fades?',
   'How strongly do their actions suggest they would choose this relationship after excitement fades?'),
  ('commitment_repair', 'commitment', 'commitment', 'communication', 68, 1.20, 0.12, 3,
   'How willing are you to repair the connection after a serious misunderstanding?',
   'How willing are they to repair the connection after a serious misunderstanding?'),

  -- Communication
  ('communication_listening', 'communication', 'communication', 'reciprocity', 84, 1.20, 0.13, 1,
   'How well do you listen to understand them rather than simply waiting to respond?',
   'How well do they listen to understand you rather than simply waiting to respond?'),
  ('communication_needs', 'communication', 'communication', 'trust', 76, 1.20, 0.12, 2,
   'How directly can you express your needs without hints, tests, or withdrawal?',
   'How directly do they express their needs without hints, tests, or withdrawal?'),
  ('communication_repair', 'communication', 'communication', 'commitment', 68, 1.15, 0.12, 3,
   'How effectively do you both return to a difficult topic and reach understanding?',
   'How effectively do they return to difficult topics and work toward understanding?'),

  -- Future orientation
  ('future_inclusion', 'future', 'future', 'commitment', 84, 1.25, 0.13, 1,
   'How naturally do you include them when imagining your life one or two years ahead?',
   'How naturally do they include you when talking about life one or two years ahead?'),
  ('future_compatibility', 'future', 'future', 'love', 76, 1.20, 0.12, 2,
   'How compatible do your values, goals, and preferred lifestyles appear?',
   'How seriously do they explore whether your values, goals, and lifestyles fit?'),
  ('future_sacrifice', 'future', 'future', 'commitment', 68, 1.15, 0.11, 3,
   'How willing would you be to adjust meaningful plans to build a shared future?',
   'How willing do they seem to adjust meaningful plans to build a shared future?'),

  -- Physical attraction
  ('physical_presence', 'attraction', 'physical_attraction', 'crush', 84, 1.05, 0.12, 1,
   'How strongly are you drawn to their physical presence when you are together?',
   'How strongly do their body language and attention suggest physical attraction to you?'),
  ('physical_affection', 'attraction', 'physical_attraction', 'emotional_attraction', 76, 1.00, 0.11, 2,
   'How much do you desire comfortable, affectionate physical closeness with them?',
   'How often do they seek comfortable, affectionate physical closeness with you?'),
  ('physical_without_novelty', 'attraction', 'physical_attraction', 'love', 68, 0.95, 0.10, 3,
   'How strong would the physical attraction remain without flirting or novelty?',
   'How consistent is their physical interest outside flirtatious or exciting moments?'),

  -- Emotional attraction
  ('emotional_curiosity', 'attraction', 'emotional_attraction', 'friendship', 84, 1.25, 0.13, 1,
   'How curious are you about their inner world, fears, hopes, and contradictions?',
   'How curious are they about your inner world, fears, hopes, and contradictions?'),
  ('emotional_seen', 'attraction', 'emotional_attraction', 'trust', 76, 1.25, 0.13, 2,
   'How deeply do you feel seen and understood by them?',
   'How much effort do they make to see and understand you beneath the surface?'),
  ('emotional_depth', 'attraction', 'emotional_attraction', 'love', 68, 1.20, 0.12, 3,
   'How meaningful are your conversations when romance or flirting is removed?',
   'How meaningful are their conversations with you when romance or flirting is removed?'),

  -- Jealousy
  ('jealousy_trigger', 'jealousy', 'jealousy', 'attachment', 84, 1.00, 0.11, 1,
   'How strongly are you affected when someone else receives their attention?',
   'How strongly do they react when someone else receives your attention?'),
  ('jealousy_regulation', 'jealousy', 'jealousy', 'trust', 76, 1.05, 0.11, 2,
   'How well can you manage jealousy without controlling or testing them?',
   'How well do they manage jealousy without controlling or testing you?'),
  ('jealousy_source', 'jealousy', 'jealousy', 'trust', 68, 1.00, 0.10, 3,
   'How much of your jealousy comes from unclear behavior rather than insecurity alone?',
   'How much of their jealousy appears driven by unclear signals rather than insecurity alone?'),

  -- Reciprocity
  ('reciprocity_initiative', 'reciprocity', 'reciprocity', 'communication', 84, 1.25, 0.13, 1,
   'How balanced is the effort to initiate contact, plans, and affection?',
   'How balanced is their effort to initiate contact, plans, and affection with yours?'),
  ('reciprocity_support', 'reciprocity', 'reciprocity', 'trust', 76, 1.25, 0.13, 2,
   'How equally do you both provide emotional support and practical care?',
   'How equally do they return the emotional support and practical care you give?'),
  ('reciprocity_priority', 'reciprocity', 'reciprocity', 'commitment', 68, 1.20, 0.12, 3,
   'How balanced is the willingness to make time and compromises for one another?',
   'How consistently do they match your willingness to make time and compromises?')
),
paths (path, prefix) as (
  values
    ('do_i_love_someone', 'dls'),
    ('does_someone_love_me', 'dsl')
),
expanded as (
  select
    prefix || '_x_' || suffix as id,
    path,
    category,
    case when path = 'do_i_love_someone' then self_text else other_text end as question_text,
    'slider' as type,
    '{"min":1,"max":10}'::jsonb as options,
    dimension as psychological_dimension,
    weight,
    priority,
    case rule_tier
      when 1 then jsonb_build_object(
        'only_if', jsonb_build_array(jsonb_build_object(
          'type', 'dimension_uncertain', 'dimension', dimension, 'below', 0.82
        ))
      )
      when 2 then jsonb_build_object(
        'only_if', jsonb_build_array(jsonb_build_object(
          'type', 'dimension_uncertain', 'dimension', dimension, 'below', 0.68
        ))
      )
      else jsonb_build_object(
        'only_if', jsonb_build_array(jsonb_build_object(
          'type', 'dimension_uncertain', 'dimension', dimension, 'below', 0.78
        )),
        'skip_if', jsonb_build_array(jsonb_build_object(
          'type', 'dimension_above', 'dimension', dimension, 'threshold', 88
        ))
      )
    end as follow_up_rules,
    jsonb_build_object(
      'slider', jsonb_build_object(
        'scale',
        jsonb_build_object(dimension, 2.6) ||
          case
            when secondary_dimension is null then '{}'::jsonb
            else jsonb_build_object(secondary_dimension, 0.9)
          end,
        'confidence', confidence_value
      )
    ) as scoring,
    confidence_value
  from concepts
  cross join paths
)
insert into public.questions (
  id,
  path,
  category,
  question_text,
  type,
  options,
  psychological_dimension,
  weight,
  priority,
  follow_up_rules,
  scoring,
  confidence_value
)
select
  id,
  path,
  category,
  question_text,
  type,
  options,
  psychological_dimension,
  weight,
  priority,
  follow_up_rules,
  scoring,
  confidence_value
from expanded
on conflict (id) do update set
  category = excluded.category,
  question_text = excluded.question_text,
  options = excluded.options,
  psychological_dimension = excluded.psychological_dimension,
  weight = excluded.weight,
  priority = excluded.priority,
  follow_up_rules = excluded.follow_up_rules,
  scoring = excluded.scoring,
  confidence_value = excluded.confidence_value,
  is_active = true;

-- Conflict-only tie breakers. These remain ineligible until the score gap exists.
with tie_breakers (
  suffix,
  category,
  target_dimension,
  high_dimension,
  low_dimension,
  gap,
  priority,
  self_text,
  other_text,
  scoring
) as (
  values
  ('spark_vs_depth', 'tie_breaker', 'emotional_attraction', 'physical_attraction', 'emotional_attraction', 22, 97,
   'If the physical spark faded, how much emotional connection would remain?',
   'When physical chemistry is set aside, how much emotional depth do they still show?',
   '{"slider":{"scale":{"emotional_attraction":3.2,"love":1.1},"confidence":0.16}}'::jsonb),
  ('bond_vs_commitment', 'tie_breaker', 'commitment', 'attachment', 'commitment', 22, 96,
   'Does feeling attached make you want to build something stable, or mainly avoid losing them?',
   'Does their attachment lead to stable choices, or mainly fear of losing contact?',
   '{"slider":{"scale":{"commitment":3.0,"attachment":0.8},"confidence":0.16}}'::jsonb),
  ('love_vs_trust', 'tie_breaker', 'trust', 'love', 'trust', 22, 95,
   'Can your strong feelings coexist with genuine trust in their character and intentions?',
   'Do their strong feelings come with behavior that makes them genuinely trustworthy?',
   '{"slider":{"scale":{"trust":3.2,"love":0.7},"confidence":0.16}}'::jsonb),
  ('talk_vs_reciprocity', 'tie_breaker', 'reciprocity', 'communication', 'reciprocity', 20, 94,
   'Do good conversations translate into equal effort outside those conversations?',
   'Does their warm communication translate into effort that matches yours?',
   '{"slider":{"scale":{"reciprocity":3.1,"communication":0.7},"confidence":0.15}}'::jsonb),
  ('jealousy_vs_trust', 'tie_breaker', 'trust', 'jealousy', 'trust', 20, 93,
   'When jealousy appears, how much can you still choose trust over checking or controlling?',
   'When they become jealous, how much do they still choose trust over checking or controlling?',
   '{"slider":{"scale":{"trust":2.8,"jealousy":-1.2},"confidence":0.15}}'::jsonb),
  ('crush_vs_future', 'tie_breaker', 'future', 'crush', 'future', 22, 92,
   'Beyond excitement, how realistically would your lives fit together long term?',
   'Beyond excitement, how realistically do they behave as if your lives could fit long term?',
   '{"slider":{"scale":{"future":3.0,"commitment":1.0},"confidence":0.15}}'::jsonb)
),
paths (path, prefix) as (
  values
    ('do_i_love_someone', 'dls'),
    ('does_someone_love_me', 'dsl')
)
insert into public.questions (
  id,
  path,
  category,
  question_text,
  type,
  options,
  psychological_dimension,
  weight,
  priority,
  follow_up_rules,
  scoring,
  confidence_value
)
select
  prefix || '_tb_' || suffix,
  path,
  category,
  case when path = 'do_i_love_someone' then self_text else other_text end,
  'slider',
  '{"min":1,"max":10}'::jsonb,
  target_dimension,
  1.35,
  priority,
  jsonb_build_object(
    'only_if', jsonb_build_array(
      jsonb_build_object(
        'type', 'dimension_gap',
        'high', high_dimension,
        'low', low_dimension,
        'gap', gap
      )
    )
  ),
  scoring,
  0.16
from tie_breakers
cross join paths
on conflict (id) do update set
  question_text = excluded.question_text,
  priority = excluded.priority,
  follow_up_rules = excluded.follow_up_rules,
  scoring = excluded.scoring,
  confidence_value = excluded.confidence_value,
  is_active = true;

-- Validation: each path should now have at least four choices per dimension
-- when combined with the original migration 003 seeds.
select
  path,
  psychological_dimension,
  count(*) as active_question_count
from public.questions
where is_active = true
group by path, psychological_dimension
order by path, psychological_dimension;


-- ===== 006_repair_assessment_profiles.sql =====
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


-- Backfill profiles for auth users created before migrations
insert into public.profiles (
  id, email, full_name, display_name, avatar_url, provider, is_guest, approval_status, role
)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name'),
  coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name'),
  u.raw_user_meta_data->>'avatar_url',
  coalesce(u.raw_app_meta_data->>'provider', 'email'),
  coalesce((u.raw_user_meta_data->>'guest')::boolean, false),
  case when coalesce((u.raw_user_meta_data->>'guest')::boolean, false) then 'approved' else 'pending' end,
  'user'
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- After running this file:
-- 1. Sign in at http://localhost:3000/login with Google or email (NOT guest)
-- 2. Promote your real account:
-- UPDATE public.profiles SET role='admin', approval_status='approved', approved_at=now() WHERE email='your@email.com';

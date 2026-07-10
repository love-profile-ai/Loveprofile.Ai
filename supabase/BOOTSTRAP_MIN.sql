-- ═══════════════════════════════════════════════════════════════════════════
-- RUN THIS ENTIRE FILE FIRST — do NOT run the UPDATE below until this succeeds
-- Supabase → SQL Editor → New query → paste ALL of this → Run
-- ═══════════════════════════════════════════════════════════════════════════

-- ===== 001_initial_schema.sql =====
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

-- ===== 002_admin_control_center.sql (core) =====
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

create or replace function public.is_admin(user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = user_id and role = 'admin' and approval_status = 'approved'
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

insert into public.website_settings (key, value) values
  ('general', '{"websiteName":"Loveprofile.Ai","supportEmail":"support@loveprofile.ai"}'::jsonb),
  ('maintenance', '{"enabled":false}'::jsonb),
  ('music', '{"enabled":false}'::jsonb),
  ('theme', '{"primary":"#D94F70","accent":"#D4AF37"}'::jsonb)
on conflict (key) do nothing;

create or replace function public.handle_new_user()
returns trigger as $$
declare
  is_guest_user boolean := coalesce((new.raw_user_meta_data->>'guest')::boolean, false);
  provider_name text := coalesce(new.raw_app_meta_data->>'provider', 'email');
begin
  insert into public.profiles (
    id, email, full_name, display_name, avatar_url, provider, is_guest, approval_status
  ) values (
    new.id, new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url',
    provider_name, is_guest_user,
    case when is_guest_user then 'approved' else 'pending' end
  )
  on conflict (id) do update set
    email = excluded.email,
    is_guest = public.profiles.is_guest or excluded.is_guest;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.admin_audit_logs enable row level security;
alter table public.admin_notifications enable row level security;
alter table public.website_settings enable row level security;

create policy "Admins manage audit logs" on public.admin_audit_logs
  for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage notifications" on public.admin_notifications
  for all using (public.is_admin()) with check (public.is_admin());
create policy "Public reads settings" on public.website_settings for select using (true);
create policy "Admins manage settings" on public.website_settings
  for all using (public.is_admin()) with check (public.is_admin());

-- Backfill existing auth users (including your current guest session)
insert into public.profiles (
  id, email, provider, is_guest, approval_status, role
)
select
  u.id,
  u.email,
  coalesce(u.raw_app_meta_data->>'provider', 'email'),
  coalesce((u.raw_user_meta_data->>'guest')::boolean, false),
  case when coalesce((u.raw_user_meta_data->>'guest')::boolean, false) then 'approved' else 'pending' end,
  'user'
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- Verify tables exist (you should see at least 1 row)
select 'profiles table OK' as status, count(*) as profile_count from public.profiles;

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 2 (separate query, AFTER step 1 succeeds):
-- Sign in at http://localhost:3000/login with Google or email (NOT guest)
-- Then run ONLY this (replace your real email):
--
-- UPDATE public.profiles
-- SET role = 'admin', approval_status = 'approved', approved_at = now()
-- WHERE email = 'your-google-or-email@example.com';
-- ═══════════════════════════════════════════════════════════════════════════

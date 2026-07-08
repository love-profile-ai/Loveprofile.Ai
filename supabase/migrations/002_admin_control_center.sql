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

# Database Schema

## Supabase PostgreSQL

### `profiles`

Extends Supabase `auth.users`.

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);
```

### `analysis_sessions`

In-progress questionnaire state (autosave).

```sql
create table public.analysis_sessions (
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

create index idx_sessions_user on analysis_sessions(user_id);
create index idx_sessions_status on analysis_sessions(user_id, status);
```

**`answers` JSON shape:**

```json
[
  {
    "questionId": "q1_duration",
    "questionText": "How long have you known them?",
    "type": "text",
    "value": "Six months"
  },
  {
    "questionId": "q2_frequency",
    "questionText": "How often do they text you?",
    "type": "multiple_choice",
    "value": "Every day"
  }
]
```

### `reports`

Completed AI analysis results.

```sql
create table public.reports (
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

create index idx_reports_user on reports(user_id, created_at desc);
create index idx_reports_share on reports(share_token) where is_public = true;
```

**`analysis` JSON shape** (matches AI output schema):

```json
{
  "summary": "...",
  "relationship_stage": "...",
  "interest_level": "...",
  "communication_analysis": "...",
  "emotional_signals": "...",
  "attachment_style": "...",
  "mixed_signals": ["..."],
  "green_flags": ["..."],
  "red_flags": ["..."],
  "behavior_patterns": "...",
  "probability_estimate": "...",
  "future_outlook": "...",
  "possible_misunderstandings": ["..."],
  "advice": ["..."],
  "confidence": "Medium"
}
```

### `chat_messages`

Follow-up conversation after report.

```sql
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now() not null
);

create index idx_chat_report on chat_messages(report_id, created_at);
```

---

## Row Level Security

```sql
alter table profiles enable row level security;
alter table analysis_sessions enable row level security;
alter table reports enable row level security;
alter table chat_messages enable row level security;

-- Profiles: users read/update own profile
create policy "Users manage own profile"
  on profiles for all using (auth.uid() = id);

-- Sessions: users manage own sessions
create policy "Users manage own sessions"
  on analysis_sessions for all using (auth.uid() = user_id);

-- Reports: users manage own reports; public read via share token (handled in API)
create policy "Users manage own reports"
  on reports for all using (auth.uid() = user_id);

-- Chat: users manage own messages on own reports
create policy "Users manage own chat"
  on chat_messages for all using (auth.uid() = user_id);
```

---

## Triggers

```sql
-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_profiles_updated_at
  before update on profiles
  for each row execute function public.set_updated_at();

create trigger set_sessions_updated_at
  before update on analysis_sessions
  for each row execute function public.set_updated_at();

create trigger set_reports_updated_at
  before update on reports
  for each row execute function public.set_updated_at();
```

# Loveprofile.Ai

AI-powered relationship reflection and analysis SaaS. Guided questionnaire, personalized AI reports, follow-up coaching chat, guest mode, and an admin control center.

## Prerequisites

- Node.js 20+
- `.env.local` already configured with Supabase and OpenRouter credentials

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Database migrations

Run both SQL files in your Supabase project → **SQL Editor** (in order):

### 1. Initial schema

```
supabase/migrations/001_initial_schema.sql
```

Creates `profiles`, `analysis_sessions`, `reports`, `chat_messages`, and row-level security policies.

### 2. Admin control center

```
supabase/migrations/002_admin_control_center.sql
```

Adds user approval workflow, admin roles, audit logs, website settings, and admin RLS policies.

### 3. Adaptive question engine

```
supabase/migrations/003_adaptive_question_engine.sql
```

Creates `questions`, `assessment_sessions`, `assessment_answers`, `assessment_profiles`, and seeds the adaptive question bank.

### 4. Assessment summary column

```
supabase/migrations/004_assessment_summary.sql
```

Adds `assessment_summary` jsonb for token-optimized AI report input.

In **Authentication → Providers**, enable:

- **Anonymous Sign-Ins** (required for guest mode)
- **Google** and **Email** (optional, for full sign-in)

## First admin user

New Google/email sign-ups are created with `approval_status = pending` and see a **Pending Approval** screen until an admin approves them. Guest accounts are auto-approved.

### Automated setup (recommended)

1. In Supabase **Dashboard → Project Settings → Database**, copy your **database password**.
2. Add to `.env.local`:

```
SUPABASE_DB_PASSWORD=your-database-password
```

3. Run (applies migrations 001–004, backfills profiles, promotes your account):

```bash
npm run db:setup
```

4. Open **http://localhost:3000/admin**

### Manual setup (SQL Editor)

If you prefer not to add the DB password locally:

1. Run migration files `001` through `004` in Supabase **SQL Editor** (in order).
2. Promote your account:

```sql
UPDATE public.profiles
SET role = 'admin',
    approval_status = 'approved',
    approved_at = now()
WHERE email = 'your-email@example.com';
```

3. Open **http://localhost:3000/admin**

## GitHub

**Repository:** [love-profile-ai/Loveprofile.Ai](https://github.com/love-profile-ai/Loveprofile.Ai)

```bash
git remote set-url origin https://github.com/love-profile-ai/Loveprofile.Ai.git
```

### Fix "Permission denied to mouleshwaran2008-cmd"

Git is signed in as the wrong GitHub account. Use **one** of these:

**Option A — Sign in as `love-profile-ai` (recommended)**

```powershell
# Double-click or run:
scripts\github-login.bat

# Then push:
git push -u origin main
```

Sign in as **love-profile-ai** when the browser opens.

**Option B — Add your other account as collaborator**

1. Log into GitHub as **love-profile-ai**
2. Open **Loveprofile.Ai → Settings → Collaborators**
3. Add **mouleshwaran2008-cmd** with **Write** access
4. Run `git push -u origin main` again

**Option C — Push with a personal access token**

1. Create a token at [github.com/settings/tokens](https://github.com/settings/tokens) (classic, `repo` scope) while logged in as **love-profile-ai**
2. Run:

```powershell
$env:GITHUB_TOKEN = "ghp_your_token_here"
.\scripts\github-push.ps1
```

## Deploy (Vercel)

1. Connect [love-profile-ai/Loveprofile.Ai](https://github.com/love-profile-ai/Loveprofile.Ai) to Vercel.
2. **Add all environment variables** before deploying (Project → Settings → Environment Variables):

| Variable | Required |
|----------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes |
| `OPENROUTER_API_KEY` | Yes |
| `OPENROUTER_SITE_URL` | Yes — set to your Vercel URL after first deploy |
| `OPENROUTER_APP_NAME` | Yes — `Loveprofile.Ai` |

3. Redeploy after adding env vars.
4. Run Supabase migrations (`supabase/BOOTSTRAP_MIN.sql` or 001–004) if not done yet.

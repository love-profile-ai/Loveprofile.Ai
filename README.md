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

### 5. Guest approval requirement

```
supabase/migrations/009_guest_requires_approval.sql
```

Requires admin approval for guest sessions (same as registered users).

In **Authentication → Providers**, enable:

- **Google** (required for Google sign-in)
- **Email** (required for magic-link sign-in)

### Google OAuth setup (fixes `Error 401: invalid_client`)

This error means Supabase does not have a valid Google OAuth client configured.

1. Open [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → **Create credentials** → **OAuth client ID** → **Web application**.
2. Add this **Authorized redirect URI** (replace `<project-ref>` with your Supabase project ref):

```
https://<project-ref>.supabase.co/auth/v1/callback
```

3. In Supabase → **Authentication → Providers → Google**:
   - Enable Google
   - Paste **Client ID** and **Client Secret** from Google Cloud
   - Save

4. In Supabase → **Authentication → URL Configuration**, add:
   - **Site URL:** your production site (e.g. `https://loveprofile-ai-loveprofile-team.vercel.app`)
   - **Redirect URLs:**
     - `https://loveprofile-ai-loveprofile-team.vercel.app/auth/callback`
     - `http://localhost:3000/auth/callback`

5. Verify from the deployed app:

```
GET /api/auth/provider-status
```

Or configure automatically if you have a Supabase access token:

```bash
# Add to .env.local:
# SUPABASE_ACCESS_TOKEN=...
# GOOGLE_CLIENT_ID=...
# GOOGLE_CLIENT_SECRET=...

npm run auth:configure-google
```

## First admin user

New Google/email sign-ups and guest sessions are created with `approval_status = pending` and see a **Pending Approval** screen until an admin approves them in `/admin`.

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

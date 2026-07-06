# AI Relationship Analyst (Signal)

Understand your relationship through AI-powered psychological analysis.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in your keys:

- `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL (e.g. `https://xxxxx.supabase.co`)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — publishable/anon key
- `SUPABASE_SERVICE_ROLE_KEY` — secret key (server only)
- `OPENROUTER_API_KEY` — API key from [OpenRouter](https://openrouter.ai/keys) (server only; model: `google/gemini-2.5-flash-lite`)

### 3. Supabase database

Run the SQL migration in your Supabase SQL editor:

```
supabase/migrations/001_initial_schema.sql
```

Enable **Anonymous Sign-Ins** in Supabase Dashboard → Authentication → Providers.

Optionally enable **Google** and **Email** providers for full auth.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Features

- Dynamic questionnaire with branching logic
- AI analysis via OpenAI (no hardcoded scores)
- Personalized report with 10+ sections
- Follow-up AI coaching chat
- Supabase auth (anonymous, Google, email)
- Report history dashboard
- Dark mode

## Deploy

Deploy to Vercel and add the same environment variables.

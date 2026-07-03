# AI Relationship Analyst — Architecture

## Overview

A production-ready SaaS that collects relationship context through a dynamic questionnaire, sends the full conversation to an LLM (no scoring), and returns a personalized psychological analysis report. Users can follow up with an interactive AI coaching session.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · shadcn/ui · Framer Motion · Supabase · OpenAI · Vercel · PostHog

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client (Next.js)                        │
│  Landing · Questionnaire · Report · Dashboard · Follow-up Chat  │
└────────────┬───────────────────────────────┬────────────────────┘
             │                               │
             ▼                               ▼
┌────────────────────────┐    ┌─────────────────────────────────┐
│   Next.js API Routes   │    │         Supabase                  │
│  /api/analyze          │    │  Auth (Google, Email, Anonymous)  │
│  /api/chat             │    │  PostgreSQL (reports, sessions)   │
│  /api/reports          │    │  Row Level Security               │
└────────────┬───────────┘    └─────────────────────────────────┘
             │
             ▼
┌────────────────────────┐
│   OpenAI API           │
│   gpt-4.1 / gpt-5.x    │
│   JSON mode            │
└────────────────────────┘
```

---

## Folder Structure

```
ai-relationship-analyst/
├── docs/
│   ├── ARCHITECTURE.md          # This file
│   ├── DATABASE.md              # Schema & RLS policies
│   ├── API.md                   # Endpoint contracts
│   └── WIREFRAMES.md            # UI wireframes (ASCII)
├── public/
│   ├── og-image.png
│   └── robots.txt
├── src/
│   ├── app/
│   │   ├── (marketing)/
│   │   │   ├── page.tsx                 # Landing page
│   │   │   └── layout.tsx
│   │   ├── (app)/
│   │   │   ├── analyze/
│   │   │   │   ├── page.tsx             # Path selection
│   │   │   │   └── [sessionId]/
│   │   │   │       └── page.tsx         # Questionnaire
│   │   │   ├── report/
│   │   │   │   └── [reportId]/
│   │   │   │       └── page.tsx         # Report dashboard
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx             # Analysis history
│   │   │   └── layout.tsx               # App shell + auth gate
│   │   ├── api/
│   │   │   ├── analyze/
│   │   │   │   └── route.ts             # POST — generate report
│   │   │   ├── chat/
│   │   │   │   └── route.ts             # POST — follow-up Q&A
│   │   │   └── reports/
│   │   │       ├── route.ts             # GET/POST list & create
│   │   │       └── [id]/
│   │   │           └── route.ts         # GET/PATCH/DELETE
│   │   ├── auth/
│   │   │   └── callback/
│   │   │       └── route.ts             # Supabase OAuth callback
│   │   ├── layout.tsx                   # Root layout, fonts, theme
│   │   ├── globals.css
│   │   ├── sitemap.ts
│   │   └── not-found.tsx
│   ├── components/
│   │   ├── ui/                          # shadcn/ui primitives
│   │   ├── marketing/
│   │   │   ├── hero.tsx
│   │   │   ├── features.tsx
│   │   │   ├── testimonials.tsx
│   │   │   ├── faq.tsx
│   │   │   └── footer.tsx
│   │   ├── questionnaire/
│   │   │   ├── question-engine.tsx      # Core engine
│   │   │   ├── question-card.tsx
│   │   │   ├── progress-bar.tsx
│   │   │   └── inputs/
│   │   │       ├── multiple-choice.tsx
│   │   │       ├── text-input.tsx
│   │   │       ├── scale-input.tsx
│   │   │       ├── yes-no.tsx
│   │   │       └── emoji-scale.tsx
│   │   ├── report/
│   │   │   ├── report-dashboard.tsx
│   │   │   ├── section-card.tsx
│   │   │   ├── confidence-meter.tsx
│   │   │   ├── flags-list.tsx
│   │   │   └── follow-up-chat.tsx
│   │   ├── dashboard/
│   │   │   ├── report-list.tsx
│   │   │   └── report-card.tsx
│   │   └── shared/
│   │       ├── theme-toggle.tsx
│   │       ├── loading-skeleton.tsx
│   │       ├── error-boundary.tsx
│   │       └── page-transition.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                # Browser client
│   │   │   ├── server.ts                # Server client
│   │   │   └── middleware.ts            # Session refresh
│   │   ├── ai/
│   │   │   ├── openai.ts                # OpenAI client
│   │   │   ├── prompts.ts               # System & user prompts
│   │   │   ├── analyze.ts               # Build prompt from answers
│   │   │   └── schemas.ts               # Zod schemas for AI JSON
│   │   ├── questionnaire/
│   │   │   ├── engine.ts                # Branching logic
│   │   │   ├── types.ts
│   │   │   └── paths/
│   │   │       ├── i-like-someone.json
│   │   │       └── someone-likes-me.json
│   │   ├── rate-limit.ts
│   │   ├── sanitize.ts
│   │   └── utils.ts
│   ├── hooks/
│   │   ├── use-questionnaire.ts
│   │   ├── use-autosave.ts
│   │   └── use-report.ts
│   ├── types/
│   │   ├── report.ts
│   │   ├── questionnaire.ts
│   │   └── database.ts                  # Generated from Supabase
│   └── middleware.ts                    # Auth + security headers
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── .env.example
├── next.config.ts
├── tailwind.config.ts
├── components.json
├── package.json
└── tsconfig.json
```

---

## Data Flow

### Analysis Flow

1. User selects path: **"I like someone"** or **"I think someone likes me"**
2. Question engine loads JSON question set for that path
3. Questions shown one at a time with branching (e.g., if answer = X, skip to question Y)
4. Answers autosaved to `analysis_sessions` (Supabase) every change
5. On completion, client POSTs all answers to `/api/analyze`
6. Server validates, sanitizes, builds structured prompt (no scores)
7. OpenAI returns JSON report
8. Report saved to `reports` table, user redirected to `/report/[id]`
9. Follow-up chat uses report + original answers as context

### Auth Flow

- **Anonymous:** Supabase anonymous sign-in on first visit; can upgrade to email/Google later
- **Authenticated:** Google OAuth or magic link email
- Anonymous sessions linked to permanent account on sign-up (Supabase `linkIdentity`)

---

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| No scoring | LLM reasons over raw answers | Core product differentiator |
| JSON question sets | File-based, not DB | Easy to edit, version in git |
| Server-side AI calls | API routes only | Never expose API keys |
| Zod validation | AI output + user input | Type-safe, catch malformed JSON |
| Streaming | Report generation + chat | Better UX for long responses |
| Anonymous first | Supabase anon auth | Zero friction to start |

---

## Security

- API keys server-side only (`OPENAI_API_KEY`)
- Rate limiting: 5 analyses/hour per user, 20 chat messages/hour
- Input sanitization + prompt injection guards
- Supabase RLS: users only see their own reports
- CSP + security headers via `next.config.ts` and middleware
- No PII in logs

---

## Deployment

- **Vercel:** Next.js app, env vars for Supabase + OpenAI
- **Supabase:** Hosted Postgres + Auth
- **PostHog:** Client-side analytics (optional env var)

---

## Implementation Phases

| Phase | Scope |
|-------|-------|
| 1 | Scaffold, landing page, design system |
| 2 | Questionnaire engine + JSON paths |
| 3 | AI prompt engine + `/api/analyze` |
| 4 | Report page + follow-up chat |
| 5 | Supabase auth + dashboard |
| 6 | UX polish (streaming, skeletons, a11y) |
| 7 | Production hardening (SEO, caching, security) |

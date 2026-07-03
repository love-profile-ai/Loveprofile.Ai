# Component Tree

```
App
├── RootLayout
│   ├── ThemeProvider (dark/light)
│   ├── PostHogProvider
│   └── Toaster
│
├── (marketing)/layout
│   └── LandingPage
│       ├── Navbar
│       │   ├── Logo
│       │   ├── NavLinks
│       │   ├── ThemeToggle
│       │   └── AuthButton
│       ├── Hero
│       │   ├── Headline
│       │   ├── Subheading
│       │   └── CTAButton → /analyze
│       ├── Features (4 cards)
│       ├── Testimonials (3 cards)
│       ├── FAQ (accordion)
│       └── Footer
│
├── (app)/layout
│   ├── AppHeader
│   └── AuthGuard
│
├── /analyze
│   └── PathSelection
│       ├── OptionCard "I like someone"
│       └── OptionCard "I think someone likes me"
│
├── /analyze/[sessionId]
│   └── QuestionEngine
│       ├── ProgressBar
│       ├── PageTransition (Framer Motion)
│       └── QuestionCard
│           ├── QuestionText
│           └── Input (dynamic by type)
│               ├── MultipleChoice
│               ├── TextInput
│               ├── ScaleInput (1-10)
│               ├── YesNo
│               └── EmojiScale
│
├── /report/[reportId]
│   └── ReportDashboard
│       ├── ReportHeader (title, date, actions)
│       ├── ConfidenceMeter
│       ├── SectionCard × N
│       │   ├── RelationshipSummary
│       │   ├── InterestLevel
│       │   ├── CommunicationAnalysis
│       │   ├── EmotionalSignals
│       │   ├── AttachmentStyle
│       │   ├── MixedSignals
│       │   ├── FlagsList (green/red)
│       │   ├── BehaviorPatterns
│       │   ├── FutureOutlook
│       │   ├── Advice
│       │   └── Conclusion
│       ├── ActionBar
│       │   ├── DownloadPDF
│       │   ├── ShareLink
│       │   └── NewAnalysis
│       └── FollowUpChat
│           ├── MessageList
│           ├── TypingIndicator
│           └── ChatInput
│
└── /dashboard
    └── DashboardPage
        ├── PageHeader
        └── ReportList
            └── ReportCard × N
                ├── Title (editable)
                ├── Date, path, confidence
                └── Actions (view, rename, delete)
```

---

## Shared Components

| Component | Purpose |
|-----------|---------|
| `PageTransition` | Framer Motion page enter/exit |
| `LoadingSkeleton` | Shimmer placeholders |
| `ErrorBoundary` | Graceful error UI |
| `ThemeToggle` | Dark/light mode switch |
| `ConfidenceMeter` | Visual confidence indicator |
| `SectionCard` | Animated report section wrapper |
| `FlagsList` | Green/red flag bullet lists |

---

## State Management

| Concern | Approach |
|---------|----------|
| Questionnaire progress | `useQuestionnaire` hook + Supabase autosave |
| Auth session | Supabase client + middleware |
| Report data | Server components + SWR for client refresh |
| Chat messages | Local state + optimistic updates |
| Theme | `next-themes` |

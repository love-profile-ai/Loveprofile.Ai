# API Structure

All routes are Next.js App Router API routes under `src/app/api/`.

---

## POST `/api/analyze`

Generate a relationship analysis from questionnaire answers.

### Request

```json
{
  "sessionId": "uuid",
  "path": "i_like_someone" | "someone_likes_me",
  "answers": [
    {
      "questionId": "string",
      "questionText": "string",
      "type": "text | multiple_choice | scale | yes_no | emoji_scale",
      "value": "string | number | boolean"
    }
  ]
}
```

### Response `200`

```json
{
  "reportId": "uuid",
  "analysis": { /* full report JSON */ }
}
```

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | `INVALID_INPUT` | Validation failed |
| 401 | `UNAUTHORIZED` | No auth session |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `AI_ERROR` | OpenAI failure |
| 504 | `TIMEOUT` | Analysis took > 60s |

### Server Logic

1. Authenticate via Supabase session
2. Rate limit check (5/hour per user)
3. Validate input with Zod
4. Sanitize all text answers
5. Build prompt from answers (no scoring)
6. Call OpenAI with JSON mode + system prompt
7. Validate AI response with Zod schema
8. Save to `reports`, mark session completed
9. Return report

---

## POST `/api/chat`

Follow-up questions about a completed report.

### Request

```json
{
  "reportId": "uuid",
  "message": "Why do you think they may be interested in me?"
}
```

### Response `200` (streaming)

Server-Sent Events stream of text chunks.

Final event includes saved message ID.

### Context sent to AI

- Original questionnaire answers
- Full analysis JSON
- Previous chat messages (last 20)

---

## GET `/api/reports`

List user's reports.

### Query params

- `limit` (default 20)
- `offset` (default 0)

### Response

```json
{
  "reports": [
    {
      "id": "uuid",
      "title": "Relationship Analysis",
      "path": "i_like_someone",
      "confidence": "Medium",
      "created_at": "2026-06-26T..."
    }
  ],
  "total": 5
}
```

---

## GET `/api/reports/[id]`

Get full report with answers and analysis.

---

## PATCH `/api/reports/[id]`

Update report metadata.

```json
{
  "title": "Analysis with Sarah",
  "is_public": false
}
```

---

## DELETE `/api/reports/[id]`

Delete report and associated chat messages.

---

## GET `/api/reports/share/[token]`

Public read-only report (when `is_public = true`).

No auth required.

---

## Rate Limiting

In-memory store for MVP (upgrade to Upstash Redis for production multi-instance):

| Endpoint | Limit |
|----------|-------|
| `/api/analyze` | 5 req/hour/user |
| `/api/chat` | 20 req/hour/user |
| `/api/reports` | 60 req/hour/user |

---

## AI Prompt Engine

### System Prompt

```
You are an expert relationship psychologist, communication analyst, and behavioral scientist.

Your job is NOT to tell users whether someone definitely loves them.

Instead:
- Analyze every answer holistically
- Look for emotional reciprocity, consistency, communication quality,
  affection, attachment style, romantic signals, friendship signals,
  boundaries, respect, conflict patterns, emotional maturity, trust,
  reciprocity, and behavioral consistency
- Never guarantee someone's feelings
- Express uncertainty where appropriate

Output ONLY valid JSON matching the provided schema.
```

### User Prompt Template

Built dynamically from answers:

```
Relationship context path: {path_label}

The user answered the following questions about their relationship situation.
Analyze holistically — do NOT assign numeric scores.

{formatted_qa_pairs}

Provide your analysis as JSON.
```

No scores. No thresholds. Pure reasoning.

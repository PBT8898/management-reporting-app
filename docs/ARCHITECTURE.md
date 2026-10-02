# Architecture

## Stack
- **Frontend:** Next.js 15 (App Router), React Server Components, Tailwind.
- **Backend:** Supabase (Postgres + RLS).
- **AI:** OpenAI API (variance explanation drafting).
- **Hosting:** Vercel.

## What to Build Now vs Later
- **Now:** Property CRUD, period selection, income statement + balance sheet line entry, variance calculation, AI-drafted commentary, dashboard + drill-down.
- **Later:** Report file parsing automation, board-pack PDF export, budget versioning, multi-year trend charts, login + per-user RLS.

## Key User Action Flow
1. Finance user opens app → selects property + period.
2. Uploads report file (stored) or goes straight to line entry.
3. Enters income statement lines (account name, actual, budget, prior_month, prior_ytd).
4. App computes variance amounts + % and flags material items (threshold configurable, default ±10% and >$5k).
5. User clicks "Draft explanations" → AI generates draft commentary per flagged line (source=ai, confidence, review_status=draft).
6. User reviews, edits, sets review_status=approved.
7. Dashboard shows approved commentary + KPIs (revenue, margin, yield) per property.

## Responsive Nav Shell
Multi-page app → persistent left sidebar on desktop (Properties, Dashboard, Reports, Commentary), collapses to hamburger on mobile. Current section highlighted.

## Layer Plan
1. **Data layer:** `lib/data/` — all Supabase reads/writes (properties, periods, lines, variances, explanations).
2. **App logic:** `lib/actions/` — server actions for creating lines, computing variances, approving commentary.
3. **Smart features:** `lib/ai/` — variance explanation drafting via OpenAI, confidence scoring.
4. **UI:** `app/` — route segments per feature module.

## Why the Core Runs Without AI
Variance calculation, dashboard, line entry, and review workflow are pure Postgres + app logic. If the AI endpoint is down, the user writes commentary manually — every button still works.

## Repo Structure
```
app/
  properties/
  dashboard/
  reports/
  commentary/
  layout.tsx
lib/
  data/        # Supabase queries
  actions/     # Server actions
  ai/          # OpenAI drafting
  utils/       # variance calc, formatting
__tests__/
```

## Module Map
| Module | Responsibility | Owns | Build Order |
|---|---|---|---|
| **Properties** | Property CRUD + listing | `properties` table | 1 |
| **Periods & Uploads** | Period selection + report file storage | `reporting_periods`, `report_uploads` | 1 |
| **Financial Lines** | Income statement + balance sheet entry, variance calc | `income_statement_lines`, `balance_sheet_lines` | 2 |
| **Variance Engine** | Compute materiality flags | derived from lines | 2 |
| **Commentary** | AI-draft + review + approve explanations | `variance_explanations` | 3 |
| **Dashboard** | KPI overview across properties | reads from all tables | 4 |

# Metric — Property management reporting

A working, shared v1 finance workspace built with Next.js 15, React, and Supabase. The homepage is the app; no login is required for the documented demo workflow.

## Reporting workflow

1. Create or select a property and a reporting period.
2. Upload its PDF, Excel, or CSV source report (maximum 4 MB).
3. Enter financial lines, or paste income rows from a spreadsheet. Expense amounts are positive costs; balance-sheet amounts may be signed.
4. Review variances against budget, prior month, and prior-year YTD. Both materiality thresholds must be exceeded. A nonzero movement from a zero base displays N/A for percentage and is material when the amount threshold is exceeded.
5. Draft explanations with OpenAI or write them manually. Edit and approve each explanation.
6. Open the portfolio dashboard to see revenue, operating margin, YTD revenue yield, ranked movements, and approved commentary.

Source files are stored privately in the Supabase `management-reports` bucket. Download links are short-lived. Uploads are stored for manual entry; automatic file parsing is outside v1.

Prior-year YTD is compared with **current YTD actual**, not the monthly actual. Yield is **YTD revenue / purchase price**, without annualisation. Margin is **(monthly revenue − monthly operating expenses) / monthly revenue**. Missing comparison denominators are shown explicitly.

## Local development

Use Node.js 24 and pnpm 11.19.0.

```sh
pnpm install
vercel link --project management-reporting-app
vercel env pull .env.local
pnpm dev
```

Use the provisioned environment, not a newly invented Supabase project. Required variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY` for real AI drafts (server only)
- Optional `OPENAI_MODEL`, default `gpt-4o-mini`

Without the OpenAI key, financial entry, calculations, manual commentary, approval, and dashboards continue working. Drafting displays an actionable error and never substitutes fabricated AI output. The AI integration uses the [Responses API with structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs). It receives figures and optional verified context, and is instructed not to invent causes.

## Database and migrations

`supabase/migrations/0001_init.sql` is the original provisioned schema and seed data. Do not recreate existing tables or modify that migration.

Apply missing migrations in order using Supabase administration access:

- `0002_reporting_workflow.sql`: threshold settings, audit logs, recalculation triggers, review constraints, closed-period guards, private report bucket and demo storage policies.
- `0003_commentary_review.sql`: atomic commentary save/approval with stale-data checks and protection from AI overwrite; upload period guard.
- `0004_review_numeric_precision.sql`: browser numeric precision compatibility for recurring percentages while preserving stale-review rejection.

Line changes recompute all three variance records in the same database transaction. Changed figures or account descriptions invalidate approval. Threshold changes reclassify materiality. Deletions require confirmation and a reason in the UI; database functions log them. Audit records cannot be changed through the anonymous API.

The v1 policies allow shared demo reads and writes, as required by `AGENTS.md`. The later lockdown sprint must introduce authentication and ownership policies before using confidential customer data.

## Checks

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Tests cover financial edge cases, spreadsheet paste validation, and the actual SQL migrations running in disposable PostgreSQL through PGlite, including audit, review locking, stale approval rejection, closed periods, and cascading deletion.

## Deployment

The existing Vercel project must be connected to `PBT8898/management-reporting-app`, with production branch `main`. Deploy through Git only. Do not use `vercel deploy`.

```sh
git config user.email "336313775+PBT8898@users.noreply.github.com"
git config user.name "PBT8898"
git add -A
git commit -m "Describe the sprint"
git push origin main
```

Vercel needs a GitHub Login Connection on the project owner's existing Vercel account and permission to the repository. Set environment variables for Production, Preview, and Development. Secrets, credentials, and `.env.local` are gitignored.

To run the real end-to-end acceptance test against a running app:

```sh
ACCEPTANCE_URL=https://management-reporting-app.vercel.app pnpm test:acceptance
```

It creates a disposable property, uploads and downloads a CSV report, pastes three income lines, adds a balance-sheet line, requires real AI drafts, edits two explanations, approves all three, checks the persisted dashboard figures, and deletes only its disposable records and file. The existing March 2025 period must be open. It deliberately fails if AI is unavailable; the test never mocks Supabase or OpenAI.

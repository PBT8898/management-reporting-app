# Security

## Secret Handling
- OpenAI API key stored as Vercel environment variable — never in frontend code.
- Supabase service role key server-side only; anon key in client.
- No secrets committed to repo.

## Permission Model
- **v1 (demo-first):** Permissive RLS — all tables readable/writable without login. Seed data visible to anonymous visitors.
- **Lock-down sprint:** Replace permissive policies with `auth.uid() = user_id` for all tables. Each user sees only their own properties, periods, lines, and commentary.
- Agent (AI) inherits the calling user's permissions — never bypasses RLS.

## Approved-Tools Rule
- Only named tools callable: `draft_variance_explanation`, `suggest_account_category`, `compute_variances`.
- No raw SQL execution, no arbitrary API calls, no file-system access from AI module.

## Audit Principle
- Every state change to `variance_explanations.review_status` is logged.
- Every AI draft records source, confidence, and timestamp.
- Deletions require explicit confirmation and are logged with actor + reason.
- Audit log table: `audit_logs` (action_name, actor_id, target_table, target_id, risk_level, timestamp, details_json).

## Data Integrity
- `income_statement_lines.actual` defaults to 0, NOT NULL — prevents ghost lines.
- Unique constraint on `reporting_periods(period_year, period_month)`.
- `variance_explanations.review_status` constrained to enum values.

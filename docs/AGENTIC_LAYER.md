# Agentic Layer

## Draftable Actions (low risk — auto)
- **Draft variance explanation:** AI generates commentary text for a flagged material variance. Risk: **low**. Auto-executed on user click. Stores `explanation_source='ai'`, `confidence`, `review_status='draft'`.
- **Suggest category:** AI categorizes a pasted account name (revenue/opex/capex/asset/liability). Risk: **low**. Suggestion only; user confirms.

## Executable-After-Approval Actions (medium risk)
- **Approve explanation:** Sets `review_status='approved'`, locks the explanation from further AI edits. Risk: **medium**. One-click approval by finance user.
- **Create task to investigate variance:** Generates a task for the property management team for unexplained material variances. Risk: **medium**. Requires user confirmation.

## Human-Only Actions (high/critical risk)
- **Delete a reporting period's data:** Risk: **critical**. Human-only, no automation.
- **Publish commentary to board view:** Risk: **high**. Human approval required — never auto-published.
- **Delete a property:** Risk: **critical**. Human-only.

## Named Tools
- `draft_variance_explanation(line_id, context)` → returns text + confidence.
- `suggest_account_category(account_name)` → returns category string.
- `compute_variances(property_id, period_id)` → returns flagged lines (pure logic, not AI).

No raw `run_any` / `send_any` — only these named tools are callable.

## Audit Log Fields
Every agentic action logged with: `action_name`, `actor_user_id`, `target_table`, `target_id`, `risk_level`, `timestamp`, `details_json`.

## v1 vs Later
- **v1:** Draft variance explanations (low), approve (medium). No auto-publish.
- **Later:** Create investigation tasks (medium), auto-parse uploads (medium), board-publish workflow (high).

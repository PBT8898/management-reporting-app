# Management Reporting App — PRD

## Problem
Finance teams spend days each month manually analysing monthly management reports: income statement line items (especially the main revenue source), balance sheet movements, and material variances vs budget / prior month / prior YTD. Senior management, the board, and shareholders need clear, timely profitability and variance commentary per property — not raw spreadsheets.

## Target User
- **Primary:** Finance team (uploads reports, drafts/reviews commentary)
- **Secondary:** Property management dept, leasing dept, senior management, board, shareholders (consume reports)

## Core Objects
- **Property** — a real-estate asset with a name, type, location, acquisition date.
- **Reporting Period** — a month+year combo (e.g. 2025-03).
- **Monthly Report Upload** — a raw uploaded report file for one period.
- **Income Statement Line** — one line item (revenue or expense) per property per period, with actual, budget, prior_month, prior_ytd values.
- **Balance Sheet Line** — one balance sheet item per property per period with actual and prior values.
- **Variance Explanation** — a commentary block on a material variance, either human-written or AI-drafted, with source, confidence, and review_status.

## MVP (v1) Checklist
- [ ] Upload a monthly management report (file) for a given property + period.
- [ ] Manually enter / edit income statement line items per property per period.
- [ ] Manually enter / edit balance sheet line items per property per period.
- [ ] Auto-calculate variance (vs budget, prior month, prior YTD) and flag material movements.
- [ ] AI-drafts variance explanations for flagged material variances (draft, review, approve).
- [ ] Dashboard: monthly performance overview across all properties (revenue, margin, yield, top variances).
- [ ] Per-property drill-down: income statement, balance sheet, variance commentary.
- [ ] All screens viewable without login (demo-first with seed data).

## Non-goals (v1)
- Multi-year budget modelling / forecasting engine.
- Automated PDF/Excel parsing (manual entry + AI-assist in v1).
- Board-pack PDF generation.
- Multi-tenant org switching.
- Tax-position modelling.

## Success Criteria
A finance user uploads a monthly report for Property A, period 2025-03. They enter (or paste) the income statement lines. The app computes variances vs budget, prior month, and prior YTD, flags the top 3 material movements, and AI-drafts explanations. The user edits two, approves all three. Senior management opens the dashboard, sees Property A's revenue, margin, yield, and the approved commentary — all without needing the raw spreadsheet.

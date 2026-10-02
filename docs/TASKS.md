# Tasks & Sprints

## Sprint 1 — Database + Property CRUD + Periods
**Goal:** Schema live, properties and reporting periods manageable.
- [ ] Run migration SQL — create all 6 tables + seed data.
- [ ] `lib/data/properties.ts` — CRUD queries for properties.
- [ ] `lib/data/periods.ts` — create/list reporting periods.
- [ ] Properties page — list, add, edit, delete (5 states handled).
- [ ] Period selector component.
- [ ] Sidebar nav shell (desktop sidebar, mobile hamburger).
**DoD:** User can create a property, create a reporting period, and see them in the sidebar — all without login.

## Sprint 2 — Financial Lines + Variance Engine (CORE ENGINE)
**Goal:** Enter income statement + balance sheet lines, compute variances, flag material movements.
- [ ] `lib/data/lines.ts` — CRUD for income_statement_lines + balance_sheet_lines.
- [ ] `lib/utils/variance.ts` — compute variance amount/pct, materiality flag.
- [ ] Income statement entry form (per property + period).
- [ ] Balance sheet entry form.
- [ ] Variance table view per property (actual vs budget vs prior_month vs prior_ytd).
- [ ] Material variances highlighted.
**DoD:** Finance user enters income lines for a property+period, sees computed variances with material flags. This is the v1 functional milestone — the core engine works end-to-end.

## Sprint 3 — AI Commentary + Dashboard
**Goal:** AI-drafted variance explanations, review workflow, cross-property dashboard.
- [ ] `lib/ai/draft.ts` — call OpenAI to draft explanation for a flagged variance.
- [ ] Commentary page — list flagged variances, draft/edit/approve explanations.
- [ ] `review_status` workflow (unreviewed → draft → approved).
- [ ] Dashboard — KPI cards (revenue, margin, yield) per property, top variances.
- [ ] Per-property drill-down view.
**DoD:** User clicks "Draft explanations" on material variances, AI returns text, user edits and approves. Dashboard shows all properties' KPIs + approved commentary. App is fully demoable.

## Sprint 4 — Lock It Down
**Goal:** Auth + per-user RLS.
- [ ] Supabase Auth (login/signup).
- [ ] Replace permissive RLS with `auth.uid() = user_id` policies on all tables.
- [ ] Redirect anonymous users to login for write actions; keep dashboard read-only preview.
- [ ] Audit log table + logging on review_status changes.
**DoD:** Logged-in user sees only their data. Anonymous visitor sees a read-only demo dashboard.

## Gantt
```
Sprint 1: DB + Properties + Periods      ████
Sprint 2: Financial Lines + Variance      ████████  ← v1 functional
Sprint 3: AI Commentary + Dashboard        ████████
Sprint 4: Lock It Down (Auth + RLS)        ████
```

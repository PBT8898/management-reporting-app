# Test Plan

## v1 Success Scenario (Manual)
1. Open app (no login) → see demo properties in sidebar.
2. Click "Properties" → create new property "Riverside Office Tower", type=office, location=Sydney, purchase_price=15000000.
3. Select period "Mar 2025" from period selector.
4. Navigate to income statement entry → add 3 lines: Rental Income (actual 450000, budget 420000, prior_month 445000), Property Operating Expenses (actual 80000, budget 75000, prior_month 78000), Utilities (actual 15000, budget 12000, prior_month 14000).
5. Save → see variance table with computed amounts and % — Rental Income flagged material (+$30k, +7.1% vs budget — wait, under 10% — adjust: budget 400000 → +$50k, +12.5% → material).
6. Click "Draft explanations" on flagged lines → AI returns draft text for each.
7. Edit one explanation, approve all → `review_status=approved`.
8. Open Dashboard → see Riverside Office Tower with revenue, margin %, yield %, and approved commentary.

## Empty State
1. Select a property + period with no income lines → show "No income statement data for this period. Add your first line item."
2. Dashboard with no properties → "No properties yet. Create your first property to get started."
3. No material variances → "All variances within threshold. No commentary needed."

## Error State
1. Enter non-numeric value in actual field → inline validation error, save blocked.
2. AI endpoint unavailable on "Draft explanations" → show "AI drafting unavailable. You can write the explanation manually."
3. Supabase connection error → "Unable to load data. Please check your connection."

## Loading State
1. Dashboard loads → skeleton cards with spinner.
2. Variance table computes → spinner row placeholders.

## Partial State
1. Property has income lines but no balance sheet lines → balance sheet tab shows empty state, income tab shows data.
2. Some variances have approved explanations, others draft → visual badge distinction (green=approved, amber=draft, grey=unreviewed).

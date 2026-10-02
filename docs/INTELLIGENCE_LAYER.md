# Intelligence Layer

## Messy Inputs
- Pasted spreadsheet rows (account names inconsistent, mixed case, blanks).
- Uploaded report files (PDF/Excel) — v1 stores file, manual entry; later auto-parse.
- Free-form commentary from finance user.

## Auto-Structure Schema (JSON)
```json
{
  "property_id": "uuid",
  "period_id": "uuid",
  "income_lines": [
    {"account_name": "Rental Income - Gross", "category": "revenue", "actual": 450000, "budget": 420000, "prior_month": 445000, "prior_ytd": 1300000, "ytd_actual": 1350000}
  ],
  "balance_sheet_lines": [
    {"account_name": "Investment Property", "category": "asset", "actual": 12000000, "prior_period": 12000000}
  ],
  "flagged_variances": [
    {"account_name": "Rental Income - Gross", "variance_type": "budget", "variance_amount": 30000, "variance_pct": 7.1, "is_material": true}
  ]
}
```

## Events to Track
- Report uploaded for a period.
- Income/balance sheet line created or edited.
- Variance flagged as material.
- AI explanation drafted.
- Explanation review_status changed (draft → approved, draft → rejected).

## Scoring Rules (v1, rule-based)
- **Materiality flag:** `|variance_amount| > 5000 AND |variance_pct| > 10%` → `is_material = true`.
- **Yield calc:** `ytd_actual_revenue / purchase_price * 100` → displayed as property yield %.
- **Margin calc:** `(revenue - opex) / revenue * 100` → property margin %.
- **AI confidence:** 0.0–1.0 returned with draft; default 0.7 for template-based, 0.85 for context-rich.

## What Gets Ranked
- Material variances ranked by absolute $ impact (top 5 per property per period).
- Properties ranked by revenue variance from budget on dashboard.

## v1 vs Later
- **v1:** Rule-based materiality + flagging, AI-drafts explanation text, manual review.
- **Later:** Auto-parse uploaded files into structured lines, comparative benchmarking across properties, automated trend commentary.

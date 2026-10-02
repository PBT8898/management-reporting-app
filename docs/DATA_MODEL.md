# Data Model

## properties
| Field | Type |
|---|---|
| id | uuid pk |
| name | text not null |
| property_type | text (office, retail, industrial, residential, mixed) |
| location | text |
| acquisition_date | date |
| purchase_price | numeric |
| user_id | uuid nullable |
| created_at | timestamptz default now() |

## reporting_periods
| Field | Type |
|---|---|
| id | uuid pk |
| period_year | int not null |
| period_month | int not null (1-12) |
| label | text (e.g. "Mar 2025") |
| status | text (open, closed) |
| user_id | uuid nullable |
| created_at | timestamptz default now() |

Unique: (period_year, period_month)

## report_uploads
| Field | Type |
|---|---|
| id | uuid pk |
| property_id | uuid → properties |
| period_id | uuid → reporting_periods |
| file_name | text |
| file_url | text |
| uploaded_by | text |
| user_id | uuid nullable |
| created_at | timestamptz default now() |

## income_statement_lines
| Field | Type |
|---|---|
| id | uuid pk |
| property_id | uuid → properties |
| period_id | uuid → reporting_periods |
| account_name | text not null |
| account_category | text (revenue, opex, capex, other) |
| actual | numeric not null default 0 |
| budget | numeric default 0 |
| prior_month | numeric default 0 |
| prior_ytd | numeric default 0 |
| ytd_actual | numeric default 0 |
| sort_order | int default 0 |
| user_id | uuid nullable |
| created_at | timestamptz default now() |

## balance_sheet_lines
| Field | Type |
|---|---|
| id | uuid pk |
| property_id | uuid → properties |
| period_id | uuid → reporting_periods |
| account_name | text not null |
| account_category | text (asset, liability, equity) |
| actual | numeric not null default 0 |
| prior_period | numeric default 0 |
| movement_pct | numeric default 0 |
| sort_order | int default 0 |
| user_id | uuid nullable |
| created_at | timestamptz default now() |

## variance_explanations
| Field | Type |
|---|---|
| id | uuid pk |
| income_line_id | uuid → income_statement_lines |
| property_id | uuid → properties |
| period_id | uuid → reporting_periods |
| variance_type | text (budget, prior_month, prior_ytd) |
| variance_amount | numeric |
| variance_pct | numeric |
| is_material | boolean default false |
| explanation | text |
| explanation_source | text (human, ai) |
| confidence | numeric |
| review_status | text default 'unreviewed' (unreviewed, draft, approved) |
| user_id | uuid nullable |
| created_at | timestamptz default now() |

## RLS Notes
- All tables: RLS enabled. v1 permissive read/write (demo-first, no login wall).
- Lock-down sprint: replace with `auth.uid() = user_id` policies.
- `variance_explanations.explanation_source`, `confidence`, `review_status` track AI-provenance per row.

## Relationships
```
properties 1──∞ report_uploads
properties 1──∞ income_statement_lines
properties 1──∞ balance_sheet_lines
reporting_periods 1──∞ income_statement_lines
reporting_periods 1──∞ balance_sheet_lines
income_statement_lines 1──∞ variance_explanations
```

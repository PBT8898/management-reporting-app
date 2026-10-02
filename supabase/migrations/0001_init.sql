create table if not exists properties (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  property_type text,
  location text,
  acquisition_date date,
  purchase_price numeric,
  user_id uuid,
  created_at timestamptz not null default now()
);

alter table properties enable row level security;
drop policy if exists "properties_v1_read" on properties;
create policy "properties_v1_read" on properties for select using (true);
drop policy if exists "properties_v1_write" on properties;
create policy "properties_v1_write" on properties for all using (true) with check (true);

create table if not exists reporting_periods (
  id uuid primary key default gen_random_uuid(),
  period_year int not null,
  period_month int not null check (period_month between 1 and 12),
  label text,
  status text default 'open',
  user_id uuid,
  created_at timestamptz not null default now(),
  unique (period_year, period_month)
);

alter table reporting_periods enable row level security;
drop policy if exists "reporting_periods_v1_read" on reporting_periods;
create policy "reporting_periods_v1_read" on reporting_periods for select using (true);
drop policy if exists "reporting_periods_v1_write" on reporting_periods;
create policy "reporting_periods_v1_write" on reporting_periods for all using (true) with check (true);

create table if not exists report_uploads (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties(id) on delete cascade,
  period_id uuid references reporting_periods(id) on delete cascade,
  file_name text,
  file_url text,
  uploaded_by text,
  user_id uuid,
  created_at timestamptz not null default now()
);

alter table report_uploads enable row level security;
drop policy if exists "report_uploads_v1_read" on report_uploads;
create policy "report_uploads_v1_read" on report_uploads for select using (true);
drop policy if exists "report_uploads_v1_write" on report_uploads;
create policy "report_uploads_v1_write" on report_uploads for all using (true) with check (true);

create table if not exists income_statement_lines (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties(id) on delete cascade,
  period_id uuid references reporting_periods(id) on delete cascade,
  account_name text not null,
  account_category text,
  actual numeric not null default 0,
  budget numeric default 0,
  prior_month numeric default 0,
  prior_ytd numeric default 0,
  ytd_actual numeric default 0,
  sort_order int default 0,
  user_id uuid,
  created_at timestamptz not null default now()
);

alter table income_statement_lines enable row level security;
drop policy if exists "income_statement_lines_v1_read" on income_statement_lines;
create policy "income_statement_lines_v1_read" on income_statement_lines for select using (true);
drop policy if exists "income_statement_lines_v1_write" on income_statement_lines;
create policy "income_statement_lines_v1_write" on income_statement_lines for all using (true) with check (true);

create table if not exists balance_sheet_lines (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties(id) on delete cascade,
  period_id uuid references reporting_periods(id) on delete cascade,
  account_name text not null,
  account_category text,
  actual numeric not null default 0,
  prior_period numeric default 0,
  movement_pct numeric default 0,
  sort_order int default 0,
  user_id uuid,
  created_at timestamptz not null default now()
);

alter table balance_sheet_lines enable row level security;
drop policy if exists "balance_sheet_lines_v1_read" on balance_sheet_lines;
create policy "balance_sheet_lines_v1_read" on balance_sheet_lines for select using (true);
drop policy if exists "balance_sheet_lines_v1_write" on balance_sheet_lines;
create policy "balance_sheet_lines_v1_write" on balance_sheet_lines for all using (true) with check (true);

create table if not exists variance_explanations (
  id uuid primary key default gen_random_uuid(),
  income_line_id uuid references income_statement_lines(id) on delete cascade,
  property_id uuid references properties(id) on delete cascade,
  period_id uuid references reporting_periods(id) on delete cascade,
  variance_type text,
  variance_amount numeric,
  variance_pct numeric,
  is_material boolean default false,
  explanation text,
  explanation_source text,
  confidence numeric,
  review_status text default 'unreviewed',
  user_id uuid,
  created_at timestamptz not null default now()
);

alter table variance_explanations enable row level security;
drop policy if exists "variance_explanations_v1_read" on variance_explanations;
create policy "variance_explanations_v1_read" on variance_explanations for select using (true);
drop policy if exists "variance_explanations_v1_write" on variance_explanations;
create policy "variance_explanations_v1_write" on variance_explanations for all using (true) with check (true);

insert into properties (id, name, property_type, location, acquisition_date, purchase_price) values
  ('a0000000-0000-4000-8000-000000000001', 'Riverside Office Tower', 'office', 'Sydney NSW', '2021-06-01', 15000000),
  ('a0000000-0000-4000-8000-000000000002', 'Harbour Retail Centre', 'retail', 'Melbourne VIC', '2019-03-15', 22000000),
  ('a0000000-0000-4000-8000-000000000003', 'Logistics Park West', 'industrial', 'Perth WA', '2022-11-01', 9500000),
  ('a0000000-0000-4000-8000-000000000004', 'Garden Apartments', 'residential', 'Brisbane QLD', '2020-09-01', 12000000)
on conflict do nothing;

insert into reporting_periods (id, period_year, period_month, label, status) values
  ('b0000000-0000-4000-8000-000000000001', 2025, 3, 'Mar 2025', 'open'),
  ('b0000000-0000-4000-8000-000000000002', 2025, 2, 'Feb 2025', 'closed'),
  ('b0000000-0000-4000-8000-000000000003', 2025, 1, 'Jan 2025', 'closed')
on conflict do nothing;

insert into income_statement_lines (id, property_id, period_id, account_name, account_category, actual, budget, prior_month, prior_ytd, ytd_actual, sort_order) values
  ('c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'Rental Income - Gross', 'revenue', 450000, 400000, 445000, 1300000, 1350000, 1),
  ('c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'Property Operating Expenses', 'opex', 80000, 75000, 78000, 230000, 240000, 2),
  ('c0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'Utilities', 'opex', 15000, 12000, 14000, 40000, 42000, 3),
  ('c0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001', 'Retail Rental Income', 'revenue', 680000, 650000, 660000, 1950000, 2020000, 1),
  ('c0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001', 'Centre Maintenance', 'opex', 95000, 88000, 92000, 270000, 282000, 2),
  ('c0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000001', 'Warehouse Lease Income', 'revenue', 210000, 200000, 205000, 600000, 615000, 1)
on conflict do nothing;

insert into balance_sheet_lines (id, property_id, period_id, account_name, account_category, actual, prior_period, movement_pct, sort_order) values
  ('d0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'Investment Property', 'asset', 12000000, 12000000, 0, 1),
  ('d0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'Accumulated Depreciation', 'asset', -1200000, -1150000, 4.3, 2),
  ('d0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'Bank Loan - Property', 'liability', 8500000, 8600000, -1.2, 3),
  ('d0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001', 'Investment Property', 'asset', 18500000, 18500000, 0, 1),
  ('d0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001', 'Mortgage Payable', 'liability', 14000000, 14200000, -1.4, 2)
on conflict do nothing;

insert into variance_explanations (id, income_line_id, property_id, period_id, variance_type, variance_amount, variance_pct, is_material, explanation, explanation_source, confidence, review_status) values
  ('e0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'budget', 50000, 12.5, true, 'Rental income exceeded budget by $50k due to a new 3-year lease signed with Tenant Corp commencing 1 Mar, adding $50k pa. Original budget did not account for this lease renewal.', 'human', null, 'approved'),
  ('e0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'budget', 5000, 6.7, false, 'Operating expenses slightly above budget due to unplanned HVAC servicing in March.', 'ai', 0.82, 'draft'),
  ('e0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001', 'budget', 30000, 4.6, true, 'Retail rental income ahead of budget following successful renegotiation of 2 anchor tenant leases at higher rates.', 'human', null, 'approved')
on conflict do nothing;
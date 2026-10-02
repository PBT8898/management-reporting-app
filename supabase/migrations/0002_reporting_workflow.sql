begin;
create table if not exists report_settings (
 id uuid primary key default gen_random_uuid(), property_id uuid not null references properties(id) on delete cascade,
 period_id uuid not null references reporting_periods(id) on delete cascade,
 amount_threshold numeric not null default 5000 check(amount_threshold >= 0), percent_threshold numeric not null default 10 check(percent_threshold >= 0),
 created_at timestamptz not null default now(), unique(property_id, period_id)
);
alter table report_settings enable row level security;
create policy report_settings_demo on report_settings for all using(true) with check(true);
create table if not exists audit_logs (
 id uuid primary key default gen_random_uuid(), action_name text not null, actor_id uuid, target_table text not null,
 target_id uuid, risk_level text not null, timestamp timestamptz not null default now(), details_json jsonb not null default '{}'
);
alter table audit_logs enable row level security;
create policy audit_logs_demo_read on audit_logs for select using(true);
-- Only database triggers/functions can append audit events; visitors cannot edit or erase them.
create unique index if not exists variance_explanations_line_type on variance_explanations(income_line_id,variance_type);
alter table variance_explanations add constraint review_status_valid check(review_status in ('unreviewed','draft','approved'));
alter table variance_explanations add constraint variance_type_valid check(variance_type in ('budget','prior_month','prior_ytd'));
alter table variance_explanations add constraint source_valid check(explanation_source is null or explanation_source in ('human','ai'));
alter table variance_explanations add constraint confidence_valid check(confidence is null or confidence between 0 and 1);
alter table reporting_periods add constraint period_status_valid check(status in ('open','closed'));
create or replace function log_reporting_change() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if tg_op='DELETE' then
  insert into audit_logs(action_name,actor_id,target_table,target_id,risk_level,details_json)
  values('delete_record',auth.uid(),tg_table_name,old.id,'critical',jsonb_build_object('reason',coalesce(current_setting('app.delete_reason',true),'Human deletion'), 'record',to_jsonb(old)));
  return old;
 end if;
 if tg_table_name='variance_explanations' then
  if tg_op='INSERT' then
   insert into audit_logs(action_name,actor_id,target_table,target_id,risk_level,details_json)
   values('explanation_created',auth.uid(),tg_table_name,new.id,'low',jsonb_build_object('review_status',new.review_status,'source',new.explanation_source,'confidence',new.confidence));
  elsif old.review_status is distinct from new.review_status or old.explanation is distinct from new.explanation or old.explanation_source is distinct from new.explanation_source or old.confidence is distinct from new.confidence then
   insert into audit_logs(action_name,actor_id,target_table,target_id,risk_level,details_json)
   values(case when new.review_status='approved' then 'approve_explanation' when new.explanation_source='ai' then 'draft_variance_explanation' else 'update_explanation' end,auth.uid(),tg_table_name,new.id,case when new.review_status='approved' then 'medium' else 'low' end,jsonb_build_object('previous_status',old.review_status,'review_status',new.review_status,'source',new.explanation_source,'confidence',new.confidence));
  end if;
 end if;
 return new;
end $$;
create trigger explanation_audit after insert or update or delete on variance_explanations for each row execute function log_reporting_change();
create trigger property_delete_audit after delete on properties for each row execute function log_reporting_change();
create trigger income_delete_audit after delete on income_statement_lines for each row execute function log_reporting_change();
create trigger balance_delete_audit after delete on balance_sheet_lines for each row execute function log_reporting_change();
create trigger upload_delete_audit after delete on report_uploads for each row execute function log_reporting_change();
create or replace function refresh_line_variances(line income_statement_lines) returns void language plpgsql set search_path=public as $$
declare kind text; base numeric; current_value numeric; amount numeric; percent numeric; threshold_amount numeric := 5000; threshold_percent numeric := 10;
begin
 select amount_threshold,percent_threshold into threshold_amount,threshold_percent from report_settings where property_id=line.property_id and period_id=line.period_id;
 threshold_amount:=coalesce(threshold_amount,5000); threshold_percent:=coalesce(threshold_percent,10);
 foreach kind in array array['budget','prior_month','prior_ytd'] loop
  base:=case kind when 'budget' then coalesce(line.budget,0) when 'prior_month' then coalesce(line.prior_month,0) else coalesce(line.prior_ytd,0) end;
  current_value:=case when kind='prior_ytd' then coalesce(line.ytd_actual,0) else line.actual end;
  amount:=current_value-base;
  percent:=case when base=0 then case when amount=0 then 0 else null end else amount/abs(base)*100 end;
  insert into variance_explanations(income_line_id,property_id,period_id,variance_type,variance_amount,variance_pct,is_material)
   values(line.id,line.property_id,line.period_id,kind,amount,percent,abs(amount)>threshold_amount and (percent is null or abs(percent)>threshold_percent))
   on conflict(income_line_id,variance_type) do update set
    property_id=excluded.property_id,period_id=excluded.period_id,variance_amount=excluded.variance_amount,variance_pct=excluded.variance_pct,is_material=excluded.is_material,
    review_status=case when variance_explanations.variance_amount is distinct from excluded.variance_amount or variance_explanations.variance_pct is distinct from excluded.variance_pct then case when coalesce(variance_explanations.explanation,'')='' then 'unreviewed' else 'draft' end else variance_explanations.review_status end;
 end loop;
end $$;
create or replace function sync_line_variances() returns trigger language plpgsql set search_path=public as $$
begin
 perform refresh_line_variances(new);
 if tg_op='UPDATE' and (old.account_name is distinct from new.account_name or old.account_category is distinct from new.account_category or old.property_id is distinct from new.property_id or old.period_id is distinct from new.period_id) then
  update variance_explanations set review_status=case when coalesce(explanation,'')='' then 'unreviewed' else 'draft' end where income_line_id=new.id;
 end if;
 return new;
end $$;
create trigger sync_income_variances after insert or update on income_statement_lines for each row execute function sync_line_variances();
create or replace function sync_thresholds() returns trigger language plpgsql set search_path=public as $$
declare line income_statement_lines;
begin
 for line in select * from income_statement_lines where property_id=new.property_id and period_id=new.period_id loop perform refresh_line_variances(line); end loop;
 return new;
end $$;
create trigger sync_materiality after insert or update on report_settings for each row execute function sync_thresholds();
create or replace function guard_closed_period() returns trigger language plpgsql set search_path=public as $$
declare target_period uuid;
begin
 target_period:=case when tg_op='DELETE' then old.period_id else new.period_id end;
 -- Cascade deletion of a property remains a deliberate human-only action.
 if exists(select 1 from properties where id=case when tg_op='DELETE' then old.property_id else new.property_id end)
 and exists(select 1 from reporting_periods where id=target_period and status='closed') then raise exception 'This reporting period is closed. Reopen it before changing data.'; end if;
 if tg_op='DELETE' then return old; else return new; end if;
end $$;
create trigger income_period_guard before insert or update or delete on income_statement_lines for each row execute function guard_closed_period();
create trigger balance_period_guard before insert or update or delete on balance_sheet_lines for each row execute function guard_closed_period();
create or replace function delete_reporting_record(table_name text, record_id uuid, reason text) returns void language plpgsql set search_path=public as $$
begin
 if length(trim(reason))=0 then raise exception 'Deletion reason required'; end if;
 if table_name not in ('properties','income_statement_lines','balance_sheet_lines','report_uploads') then raise exception 'Unsupported deletion'; end if;
 perform set_config('app.delete_reason',reason,true);
 execute format('delete from %I where id=$1',table_name) using record_id;
end $$;
-- Backfill derived variance rows without altering financial inputs or resetting unchanged approvals.
do $$ declare line income_statement_lines; begin for line in select * from income_statement_lines loop perform refresh_line_variances(line); end loop; end $$;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('management-reports','management-reports',false,10485760,array['application/pdf','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.ms-excel','text/csv'])
 on conflict(id) do nothing;
create policy reports_demo_read on storage.objects for select using(bucket_id='management-reports');
create policy reports_demo_insert on storage.objects for insert with check(bucket_id='management-reports');
create policy reports_demo_delete on storage.objects for delete using(bucket_id='management-reports');
commit;


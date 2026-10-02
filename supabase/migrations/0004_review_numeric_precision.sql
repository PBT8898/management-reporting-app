begin;
-- PostgREST numeric values pass through JavaScript numbers. Compare their
-- round-tripped representations, so recurring percentages remain reviewable.
create or replace function save_variance_explanation(
 explanation_id uuid, commentary text, new_status text, new_source text, ai_confidence numeric,
 expected_amount numeric, expected_percent numeric, expected_text text
) returns variance_explanations language plpgsql set search_path=public as $$
declare existing variance_explanations; result variance_explanations;
begin
 select * into existing from variance_explanations where id=explanation_id for update;
 if not found then raise exception 'Explanation no longer exists. Refresh the report.'; end if;
 if existing.variance_amount::double precision is distinct from expected_amount::double precision
 or existing.variance_pct::double precision is distinct from expected_percent::double precision
 or existing.explanation is distinct from expected_text then raise exception 'The figures or commentary changed. Refresh before reviewing.'; end if;
 if new_status not in ('draft','approved') or new_source not in ('human','ai') then raise exception 'Invalid review action'; end if;
 if length(trim(commentary))=0 or length(commentary)>10000 then raise exception 'Enter commentary before saving or approving.'; end if;
 if new_source='ai' and existing.review_status='approved' and new_status='draft' then raise exception 'Approved explanations are locked from AI edits.'; end if;
 if new_source='ai' and commentary is distinct from existing.explanation and new_status='approved' then raise exception 'Save the AI draft before human approval.'; end if;
 update variance_explanations set explanation=trim(commentary),review_status=new_status,explanation_source=new_source,
 confidence=case when new_source='ai' then ai_confidence else null end where id=explanation_id returning * into result;
 return result;
end $$;
commit;

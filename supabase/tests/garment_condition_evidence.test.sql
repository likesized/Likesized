begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(10);

select has_column('public','fit_reports','garment_condition','Fit Reports store observation-level garment condition');
select is((select column_default from information_schema.columns where table_schema='public' and table_name='fit_reports' and column_name='garment_condition'),'''normal''::garment_condition','garment condition defaults to normal');
select is((select array_agg(e.enumlabel order by e.enumsortorder)::text from pg_type t join pg_enum e on e.enumtypid=t.oid join pg_namespace n on n.oid=t.typnamespace where n.nspname='public' and t.typname='garment_condition'),'{'||'normal,shrunk,stretched_out,altered'||'}','condition enum contains only the four owner-approved states');
select ok(pg_get_functiondef('public.get_product_fit_summary(uuid)'::regprocedure) like '%garment_condition=''normal''%','product fit summary excludes materially changed garments');
select ok(pg_get_functiondef('private.resolve_product_evidence_core(uuid,uuid,integer)'::regprocedure) like '%garment_condition=''normal''%','recommendation evidence excludes materially changed garments');
select ok(pg_get_functiondef('private.resolve_product_evidence_core(uuid,uuid,integer)'::regprocedure) like '%visibility=''shared''%','recommendation evidence keeps Shared Closet boundary');
select ok(
  position('objective_variant_key' in lower(pg_get_functiondef('private.resolve_product_evidence_core(uuid,uuid,integer)'::regprocedure))) > 0,
  'recommendation evidence carries tracked variation identity for canonical deduplication'
);
select ok(has_function_privilege('authenticated','public.get_product_fit_summary(uuid)','EXECUTE'),'authenticated users can read safe normal-condition summary');
select ok(not has_function_privilege('anon','public.get_product_fit_summary(uuid)','EXECUTE'),'anonymous users cannot read product fit summary');
select ok(not has_function_privilege('anon','public.get_product_evidence_candidates(uuid,uuid,integer)','EXECUTE'),'anonymous users cannot read recommendation evidence');

select * from finish();
rollback;

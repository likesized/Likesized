begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(15);

select has_table('public','fit_report_purchase_context','Fit Reports have one acquisition-context table');
select has_column('public','fit_report_purchase_context','fit_report_id','acquisition context is keyed to the Fit Report');
select has_column('public','fit_report_purchase_context','retailer_text','retailer observation is stored');
select has_column('public','fit_report_purchase_context','price_paid','price observation is stored');
select has_column('public','fit_report_purchase_context','purchase_method','purchase method is stored');
select has_column('public','fit_report_purchase_context','purchase_month','purchase month is stored');
select has_column('public','fit_report_purchase_context','purchase_year','purchase year is stored');
select ok(
  exists(select 1 from pg_constraint where conrelid='public.fit_report_purchase_context'::regclass and contype='p' and pg_get_constraintdef(oid) like 'PRIMARY KEY (fit_report_id)%'),
  'one Fit Report can have at most one acquisition observation'
);
select ok((select relrowsecurity from pg_class where oid='public.fit_report_purchase_context'::regclass),'purchase context uses RLS');
select ok(not has_table_privilege('anon','public.fit_report_purchase_context','SELECT'),'anonymous users cannot read purchase context');
select ok(has_table_privilege('authenticated','public.fit_report_purchase_context','INSERT'),'authenticated owners can submit purchase context subject to RLS');
select is((select count(*)::integer from public.garment_types where category::text='sleepwear_lingerie' and intake_active),10,'exactly ten Sleepwear & Lingerie intake types are active');
select is((select count(*)::integer from public.garment_types where lower(label) like '%sleep shirt%'),0,'Sleep Shirt is intentionally absent');
select is((select count(*)::integer from public.garment_types where key='sweatpants' and category::text='bottoms' and intake_active),1,'Sweatpants remains under Bottoms');
select is((select count(*)::integer from public.garment_attribute_options where attribute_key='structure_support' and option_key in ('soft_stretchy','light_support','structured','boned')),4,'Costume lingerie structure and support has the four locked options');

select * from finish();
rollback;
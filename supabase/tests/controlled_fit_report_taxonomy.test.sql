begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions,auth;
select plan(15);

select has_table('public','color_families','Controlled Color families exist');
select has_column('public','product_variants','color_family_key','Variants retain a controlled Color family separately from exact manufacturer color wording');
select has_column('public','fit_reports','reported_condition','Fit Reports retain New, Used, or Altered condition');
select is((select count(*) from public.color_families),16::bigint,'Only the sixteen owner-approved broad Color families are active');
select ok(exists(select 1 from pg_enum e join pg_type t on t.oid=e.enumtypid where t.typname='garment_category' and e.enumlabel='swimwear'),'Swimwear is a broad Category');
select ok(exists(select 1 from pg_enum e join pg_type t on t.oid=e.enumtypid where t.typname='garment_category' and e.enumlabel='intimates'),'Intimates is a broad Category');
select is((select count(*) from public.garment_types where intake_active),56::bigint,'Only the approved specific physical garment Types are selectable in intake');
select ok((select not intake_active from public.garment_types where key='work_pants'),'Work pants is retired from intake in favor of Cargo pants');
select ok((select active and intake_active and category='bottoms' from public.garment_types where key='cargo_pants'),'Cargo pants derives Bottoms');
select ok((select active and intake_active and category='intimates' from public.garment_types where key='bra'),'Bra derives Intimates');
select ok((select active and not intake_active from public.garment_types where key='bras_intimate'),'Legacy bra matching key remains active internally but hidden from intake');
select is((select match_profile_key from public.garment_types where key='dress_shirt'),'work_shirt','Controlled intake does not rewrite an established calibrated Match profile');
select is((select category::text from public.garment_attribute_definitions where key='sleeve_length'),'tops','Per-Type questions do not weaken established broad attribute category guards');
select ok(exists(select 1 from public.garment_attribute_options where attribute_key='cut' and option_key='bootcut'),'Approved Jeans cut vocabulary is available for controlled evidence');
select isnt_empty('select 1 from pg_class where oid=''public.color_families''::regclass and relrowsecurity','Color families use RLS');

select * from finish();
rollback;

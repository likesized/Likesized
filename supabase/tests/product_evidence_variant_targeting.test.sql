begin;

create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions,auth;
select plan(12);

insert into auth.users(id,aud,role,email,created_at,updated_at)
values
  ('e0000000-0000-4000-8000-000000000001'::uuid,'authenticated','authenticated','variant-viewer@likesized.test',now(),now()),
  ('e0000000-0000-4000-8000-000000000002'::uuid,'authenticated','authenticated','variant-exact@likesized.test',now(),now()),
  ('e0000000-0000-4000-8000-000000000003'::uuid,'authenticated','authenticated','variant-product@likesized.test',now(),now()),
  ('e0000000-0000-4000-8000-000000000004'::uuid,'authenticated','authenticated','variant-fallback@likesized.test',now(),now());

-- Keep bodies identical so evidence-tier ordering, not body similarity, decides priority.
set local role authenticated;
set local request.jwt.claim.sub='e0000000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
select public.save_fit_profile('variant_viewer','imperial'::public.unit_system,'[{"measurement_type_key":"natural_waist","entered_value":32,"entered_unit":"in","source":"manual","method":"tape"},{"measurement_type_key":"full_hip_seat","entered_value":38,"entered_unit":"in","source":"manual","method":"tape"}]'::jsonb,'[]'::jsonb);
reset role;

set local role authenticated;
set local request.jwt.claim.sub='e0000000-0000-4000-8000-000000000002';
set local request.jwt.claim.role='authenticated';
select public.save_fit_profile('variant_exact','imperial'::public.unit_system,'[{"measurement_type_key":"natural_waist","entered_value":32,"entered_unit":"in","source":"manual","method":"tape"},{"measurement_type_key":"full_hip_seat","entered_value":38,"entered_unit":"in","source":"manual","method":"tape"}]'::jsonb,'[]'::jsonb);
reset role;

set local role authenticated;
set local request.jwt.claim.sub='e0000000-0000-4000-8000-000000000003';
set local request.jwt.claim.role='authenticated';
select public.save_fit_profile('variant_product','imperial'::public.unit_system,'[{"measurement_type_key":"natural_waist","entered_value":32,"entered_unit":"in","source":"manual","method":"tape"},{"measurement_type_key":"full_hip_seat","entered_value":38,"entered_unit":"in","source":"manual","method":"tape"}]'::jsonb,'[]'::jsonb);
reset role;

set local role authenticated;
set local request.jwt.claim.sub='e0000000-0000-4000-8000-000000000004';
set local request.jwt.claim.role='authenticated';
select public.save_fit_profile('variant_fallback','imperial'::public.unit_system,'[{"measurement_type_key":"natural_waist","entered_value":32,"entered_unit":"in","source":"manual","method":"tape"},{"measurement_type_key":"full_hip_seat","entered_value":38,"entered_unit":"in","source":"manual","method":"tape"}]'::jsonb,'[]'::jsonb);
reset role;

insert into public.brands(id,name,slug,normalized_name)
values('e1000000-0000-4000-8000-000000000001'::uuid,'Variant Test','variant-test','varianttest');

insert into public.products(id,brand_id,name,slug,category,normalized_name,garment_type_key,market_segment)
values
  ('e2000000-0000-4000-8000-000000000001'::uuid,'e1000000-0000-4000-8000-000000000001'::uuid,'Target Jeans','variant-test-target-jeans','bottoms','targetjeans','jeans','unisex'),
  ('e2000000-0000-4000-8000-000000000002'::uuid,'e1000000-0000-4000-8000-000000000001'::uuid,'Fallback Jeans','variant-test-fallback-jeans','bottoms','fallbackjeans','jeans','unisex');

insert into public.normalized_sizes(id,kind,normalized_key,display_label,alpha_size)
values('e3000000-0000-4000-8000-000000000001'::uuid,'alpha','phase4_variant_m','M','M');

insert into public.product_variants(id,product_id,size_label,color_label,normalized_size_id,market_segment,color_normalized)
values
  ('e4000000-0000-4000-8000-000000000001'::uuid,'e2000000-0000-4000-8000-000000000001'::uuid,'M','Blue','e3000000-0000-4000-8000-000000000001'::uuid,'unisex','blue'),
  ('e4000000-0000-4000-8000-000000000002'::uuid,'e2000000-0000-4000-8000-000000000001'::uuid,'M','Black','e3000000-0000-4000-8000-000000000001'::uuid,'unisex','black'),
  ('e4000000-0000-4000-8000-000000000003'::uuid,'e2000000-0000-4000-8000-000000000002'::uuid,'M','Blue','e3000000-0000-4000-8000-000000000001'::uuid,'unisex','blue');

-- One wearer intentionally has two legitimate tracked fit variations. Both remain
-- evidence even though Size/Color themselves never create tracked variations.
set local role authenticated;
set local request.jwt.claim.sub='e0000000-0000-4000-8000-000000000002';
set local request.jwt.claim.role='authenticated';
insert into public.closet_items(id,user_id,product_id,variant_id,size_label,normalized_size_id,visibility)
values
  ('e5000000-0000-4000-8000-000000000001'::uuid,'e0000000-0000-4000-8000-000000000002'::uuid,'e2000000-0000-4000-8000-000000000001'::uuid,'e4000000-0000-4000-8000-000000000001'::uuid,'M','e3000000-0000-4000-8000-000000000001'::uuid,'shared'),
  ('e5000000-0000-4000-8000-000000000002'::uuid,'e0000000-0000-4000-8000-000000000002'::uuid,'e2000000-0000-4000-8000-000000000001'::uuid,'e4000000-0000-4000-8000-000000000002'::uuid,'M','e3000000-0000-4000-8000-000000000001'::uuid,'shared');
insert into public.fit_reports(id,user_id,closet_item_id,product_id,variant_id,size_label,normalized_size_id,fit,would_buy_again,objective_variant_key,created_at)
values
  ('e6000000-0000-4000-8000-000000000001'::uuid,'e0000000-0000-4000-8000-000000000002'::uuid,'e5000000-0000-4000-8000-000000000001'::uuid,'e2000000-0000-4000-8000-000000000001'::uuid,'e4000000-0000-4000-8000-000000000001'::uuid,'M','e3000000-0000-4000-8000-000000000001'::uuid,'just_right',true,'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',now()-interval '2 days'),
  ('e6000000-0000-4000-8000-000000000002'::uuid,'e0000000-0000-4000-8000-000000000002'::uuid,'e5000000-0000-4000-8000-000000000002'::uuid,'e2000000-0000-4000-8000-000000000001'::uuid,'e4000000-0000-4000-8000-000000000002'::uuid,'M','e3000000-0000-4000-8000-000000000001'::uuid,'just_right',true,'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',now()-interval '1 day');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='e0000000-0000-4000-8000-000000000003';
set local request.jwt.claim.role='authenticated';
insert into public.closet_items(id,user_id,product_id,variant_id,size_label,normalized_size_id,visibility)
values('e5000000-0000-4000-8000-000000000003'::uuid,'e0000000-0000-4000-8000-000000000003'::uuid,'e2000000-0000-4000-8000-000000000001'::uuid,'e4000000-0000-4000-8000-000000000002'::uuid,'M','e3000000-0000-4000-8000-000000000001'::uuid,'shared');
insert into public.fit_reports(id,user_id,closet_item_id,product_id,variant_id,size_label,normalized_size_id,fit,would_buy_again,objective_variant_key)
values('e6000000-0000-4000-8000-000000000003'::uuid,'e0000000-0000-4000-8000-000000000003'::uuid,'e5000000-0000-4000-8000-000000000003'::uuid,'e2000000-0000-4000-8000-000000000001'::uuid,'e4000000-0000-4000-8000-000000000002'::uuid,'M','e3000000-0000-4000-8000-000000000001'::uuid,'just_right',true,'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='e0000000-0000-4000-8000-000000000004';
set local request.jwt.claim.role='authenticated';
insert into public.closet_items(id,user_id,product_id,variant_id,size_label,normalized_size_id,visibility)
values('e5000000-0000-4000-8000-000000000004'::uuid,'e0000000-0000-4000-8000-000000000004'::uuid,'e2000000-0000-4000-8000-000000000002'::uuid,'e4000000-0000-4000-8000-000000000003'::uuid,'M','e3000000-0000-4000-8000-000000000001'::uuid,'shared');
insert into public.fit_reports(id,user_id,closet_item_id,product_id,variant_id,size_label,normalized_size_id,fit,would_buy_again,objective_variant_key)
values('e6000000-0000-4000-8000-000000000004'::uuid,'e0000000-0000-4000-8000-000000000004'::uuid,'e5000000-0000-4000-8000-000000000004'::uuid,'e2000000-0000-4000-8000-000000000002'::uuid,'e4000000-0000-4000-8000-000000000003'::uuid,'M','e3000000-0000-4000-8000-000000000001'::uuid,'just_right',true,'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='e0000000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
create temporary table variant_target_results on commit drop as
select * from public.get_product_evidence_candidates('e2000000-0000-4000-8000-000000000001'::uuid,'e4000000-0000-4000-8000-000000000001'::uuid,50);

select is((select count(*) from variant_target_results),4::bigint,'every distinct valid tracked Fit Report situation is returned as evidence');
select is((select count(*) from variant_target_results where user_id='e0000000-0000-4000-8000-000000000002'::uuid),2::bigint,'one wearer may contribute multiple legitimate tracked-variation evidence rows');
select is((select evidence_variant_id from variant_target_results where fit_report_id='e6000000-0000-4000-8000-000000000001'::uuid),'e4000000-0000-4000-8000-000000000001'::uuid,'the matching observation retains its Exact Variant target');
select is((select evidence_level::text from variant_target_results where fit_report_id='e6000000-0000-4000-8000-000000000001'::uuid),'exact_variant','matching target variant is labeled Exact Variant');
select is((select evidence_rank from variant_target_results where fit_report_id='e6000000-0000-4000-8000-000000000001'::uuid),1,'Exact Variant receives evidence rank 1');
select is((select evidence_level::text from variant_target_results where user_id='e0000000-0000-4000-8000-000000000003'::uuid),'exact_product','other variant of the target product remains Exact Product');
select is((select evidence_rank from variant_target_results where user_id='e0000000-0000-4000-8000-000000000003'::uuid),2,'Exact Product remains rank 2');
select is((select evidence_level::text from variant_target_results where user_id='e0000000-0000-4000-8000-000000000004'::uuid),'brand_garment_type','broader same-brand garment evidence remains available as fallback');
select is((select evidence_level::text from variant_target_results order by evidence_rank,fit_report_id limit 1),'exact_variant','Exact Variant sorts before broader evidence tiers');

create temporary table foreign_variant_results on commit drop as
select * from public.get_product_evidence_candidates('e2000000-0000-4000-8000-000000000001'::uuid,'e4000000-0000-4000-8000-000000000003'::uuid,50);
select is((select count(*) from foreign_variant_results where evidence_level='exact_variant'::public.evidence_level),0::bigint,'foreign variant ID cannot receive Exact Variant rank for the target product');
select ok((select count(*)=2 and bool_and(evidence_level='exact_product'::public.evidence_level) from foreign_variant_results where user_id='e0000000-0000-4000-8000-000000000002'::uuid),'foreign variant target safely falls both valid tracked observations back to Exact Product evidence');

create temporary table product_target_results on commit drop as
select * from public.get_product_evidence_candidates('e2000000-0000-4000-8000-000000000001'::uuid,null,50);
select is((select count(*) from product_target_results where evidence_level='exact_variant'::public.evidence_level),0::bigint,'product-level target does not fabricate Exact Variant evidence');

reset role;
select * from finish();
rollback;

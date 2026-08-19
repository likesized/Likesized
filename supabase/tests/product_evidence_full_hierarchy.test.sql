begin;

create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions,auth;
select plan(18);

insert into auth.users(id,aud,role,email,created_at,updated_at)
values
  ('b0000000-0000-4000-8000-000000000001'::uuid,'authenticated','authenticated','hierarchy-viewer@likesized.test',now(),now()),
  ('b0000000-0000-4000-8000-000000000002'::uuid,'authenticated','authenticated','hierarchy-variant@likesized.test',now(),now()),
  ('b0000000-0000-4000-8000-000000000003'::uuid,'authenticated','authenticated','hierarchy-product@likesized.test',now(),now()),
  ('b0000000-0000-4000-8000-000000000004'::uuid,'authenticated','authenticated','hierarchy-family@likesized.test',now(),now()),
  ('b0000000-0000-4000-8000-000000000005'::uuid,'authenticated','authenticated','hierarchy-similar@likesized.test',now(),now()),
  ('b0000000-0000-4000-8000-000000000006'::uuid,'authenticated','authenticated','hierarchy-brand@likesized.test',now(),now()),
  ('b0000000-0000-4000-8000-000000000007'::uuid,'authenticated','authenticated','hierarchy-category@likesized.test',now(),now());

-- Identical relevant bodies isolate evidence-tier ordering from body-match differences.
set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='b0000000-0000-4000-8000-000000000001';
select public.save_fit_profile('hierarchy_viewer','imperial'::public.unit_system,'[{"measurement_type_key":"natural_waist","entered_value":32,"entered_unit":"in","source":"manual","method":"tape"},{"measurement_type_key":"full_hip_seat","entered_value":38,"entered_unit":"in","source":"manual","method":"tape"}]'::jsonb,'[]'::jsonb); reset role;
set local role authenticated; set local request.jwt.claim.role='authenticated'; set local request.jwt.claim.sub='b0000000-0000-4000-8000-000000000002';
select public.save_fit_profile('hierarchy_variant','imperial'::public.unit_system,'[{"measurement_type_key":"natural_waist","entered_value":32,"entered_unit":"in","source":"manual","method":"tape"},{"measurement_type_key":"full_hip_seat","entered_value":38,"entered_unit":"in","source":"manual","method":"tape"}]'::jsonb,'[]'::jsonb); reset role;
set local role authenticated; set local request.jwt.claim.role='authenticated'; set local request.jwt.claim.sub='b0000000-0000-4000-8000-000000000003';
select public.save_fit_profile('hierarchy_product','imperial'::public.unit_system,'[{"measurement_type_key":"natural_waist","entered_value":32,"entered_unit":"in","source":"manual","method":"tape"},{"measurement_type_key":"full_hip_seat","entered_value":38,"entered_unit":"in","source":"manual","method":"tape"}]'::jsonb,'[]'::jsonb); reset role;
set local role authenticated; set local request.jwt.claim.role='authenticated'; set local request.jwt.claim.sub='b0000000-0000-4000-8000-000000000004';
select public.save_fit_profile('hierarchy_family','imperial'::public.unit_system,'[{"measurement_type_key":"natural_waist","entered_value":32,"entered_unit":"in","source":"manual","method":"tape"},{"measurement_type_key":"full_hip_seat","entered_value":38,"entered_unit":"in","source":"manual","method":"tape"}]'::jsonb,'[]'::jsonb); reset role;
set local role authenticated; set local request.jwt.claim.role='authenticated'; set local request.jwt.claim.sub='b0000000-0000-4000-8000-000000000005';
select public.save_fit_profile('hierarchy_similar','imperial'::public.unit_system,'[{"measurement_type_key":"natural_waist","entered_value":32,"entered_unit":"in","source":"manual","method":"tape"},{"measurement_type_key":"full_hip_seat","entered_value":38,"entered_unit":"in","source":"manual","method":"tape"}]'::jsonb,'[]'::jsonb); reset role;
set local role authenticated; set local request.jwt.claim.role='authenticated'; set local request.jwt.claim.sub='b0000000-0000-4000-8000-000000000006';
select public.save_fit_profile('hierarchy_brand','imperial'::public.unit_system,'[{"measurement_type_key":"natural_waist","entered_value":32,"entered_unit":"in","source":"manual","method":"tape"},{"measurement_type_key":"full_hip_seat","entered_value":38,"entered_unit":"in","source":"manual","method":"tape"}]'::jsonb,'[]'::jsonb); reset role;
set local role authenticated; set local request.jwt.claim.role='authenticated'; set local request.jwt.claim.sub='b0000000-0000-4000-8000-000000000007';
select public.save_fit_profile('hierarchy_category','imperial'::public.unit_system,'[{"measurement_type_key":"natural_waist","entered_value":32,"entered_unit":"in","source":"manual","method":"tape"},{"measurement_type_key":"full_hip_seat","entered_value":38,"entered_unit":"in","source":"manual","method":"tape"}]'::jsonb,'[]'::jsonb); reset role;

insert into public.brands(id,name,slug,normalized_name)
values
  ('b1000000-0000-4000-8000-000000000001'::uuid,'Hierarchy Brand A','hierarchy-brand-a','hierarchybranda'),
  ('b1000000-0000-4000-8000-000000000002'::uuid,'Hierarchy Brand B','hierarchy-brand-b','hierarchybrandb'),
  ('b1000000-0000-4000-8000-000000000003'::uuid,'Hierarchy Brand C','hierarchy-brand-c','hierarchybrandc');
insert into public.product_families(id,brand_id,name,normalized_name,garment_type_key,market_segment)
values('b2000000-0000-4000-8000-000000000001'::uuid,'b1000000-0000-4000-8000-000000000001'::uuid,'Hierarchy Core Fit','hierarchycorefit','jeans','unisex');
insert into public.products(id,brand_id,name,slug,category,normalized_name,product_family_id,garment_type_key,market_segment)
values
  ('b3000000-0000-4000-8000-000000000001'::uuid,'b1000000-0000-4000-8000-000000000001'::uuid,'Hierarchy Target','hierarchy-target','bottoms','hierarchytarget','b2000000-0000-4000-8000-000000000001'::uuid,'jeans','unisex'),
  ('b3000000-0000-4000-8000-000000000002'::uuid,'b1000000-0000-4000-8000-000000000001'::uuid,'Hierarchy Family Sibling','hierarchy-family-sibling','bottoms','hierarchyfamilysibling','b2000000-0000-4000-8000-000000000001'::uuid,'jeans','unisex'),
  ('b3000000-0000-4000-8000-000000000003'::uuid,'b1000000-0000-4000-8000-000000000002'::uuid,'Hierarchy Similar','hierarchy-similar','bottoms','hierarchysimilar',null,'jeans','unisex'),
  ('b3000000-0000-4000-8000-000000000004'::uuid,'b1000000-0000-4000-8000-000000000001'::uuid,'Hierarchy Brand Only','hierarchy-brand-only','bottoms','hierarchybrandonly',null,'jeans','unisex'),
  ('b3000000-0000-4000-8000-000000000005'::uuid,'b1000000-0000-4000-8000-000000000003'::uuid,'Hierarchy Category Only','hierarchy-category-only','bottoms','hierarchycategoryonly',null,'chinos','unisex');
insert into public.product_attribute_values(product_id,attribute_key,option_key)
values
  ('b3000000-0000-4000-8000-000000000001'::uuid,'primary_material','denim'),
  ('b3000000-0000-4000-8000-000000000001'::uuid,'stretch_level','medium'),
  ('b3000000-0000-4000-8000-000000000003'::uuid,'primary_material','denim'),
  ('b3000000-0000-4000-8000-000000000003'::uuid,'stretch_level','medium'),
  ('b3000000-0000-4000-8000-000000000004'::uuid,'primary_material','cotton'),
  ('b3000000-0000-4000-8000-000000000004'::uuid,'stretch_level','none');
insert into public.normalized_sizes(id,kind,normalized_key,display_label,alpha_size)
values('b4000000-0000-4000-8000-000000000001'::uuid,'alpha','hierarchy_m','M','M');
insert into public.product_variants(id,product_id,size_label,color_label,color_normalized,normalized_size_id,market_segment)
values
  ('b5000000-0000-4000-8000-000000000001'::uuid,'b3000000-0000-4000-8000-000000000001'::uuid,'M','Blue','blue','b4000000-0000-4000-8000-000000000001'::uuid,'unisex'),
  ('b5000000-0000-4000-8000-000000000002'::uuid,'b3000000-0000-4000-8000-000000000001'::uuid,'M','Black','black','b4000000-0000-4000-8000-000000000001'::uuid,'unisex');

-- Exact Variant wearer: target variant plus a newer weaker category observation; only the strongest may survive.
set local role authenticated; set local request.jwt.claim.role='authenticated'; set local request.jwt.claim.sub='b0000000-0000-4000-8000-000000000002';
insert into public.closet_items(id,user_id,product_id,variant_id,size_label,normalized_size_id,visibility) values
 ('b6000000-0000-4000-8000-000000000001'::uuid,'b0000000-0000-4000-8000-000000000002'::uuid,'b3000000-0000-4000-8000-000000000001'::uuid,'b5000000-0000-4000-8000-000000000001'::uuid,'M','b4000000-0000-4000-8000-000000000001'::uuid,'shared'),
 ('b6000000-0000-4000-8000-000000000002'::uuid,'b0000000-0000-4000-8000-000000000002'::uuid,'b3000000-0000-4000-8000-000000000005'::uuid,null,'M',null,'shared');
insert into public.fit_reports(id,user_id,closet_item_id,product_id,variant_id,size_label,normalized_size_id,fit,would_buy_again,created_at) values
 ('b7000000-0000-4000-8000-000000000001'::uuid,'b0000000-0000-4000-8000-000000000002'::uuid,'b6000000-0000-4000-8000-000000000001'::uuid,'b3000000-0000-4000-8000-000000000001'::uuid,'b5000000-0000-4000-8000-000000000001'::uuid,'M','b4000000-0000-4000-8000-000000000001'::uuid,'just_right',true,now()-interval '2 days'),
 ('b7000000-0000-4000-8000-000000000002'::uuid,'b0000000-0000-4000-8000-000000000002'::uuid,'b6000000-0000-4000-8000-000000000002'::uuid,'b3000000-0000-4000-8000-000000000005'::uuid,null,'M',null,'just_right',true,now()-interval '1 day'); reset role;

-- Exact Product / different variant.
set local role authenticated; set local request.jwt.claim.role='authenticated'; set local request.jwt.claim.sub='b0000000-0000-4000-8000-000000000003';
insert into public.closet_items(id,user_id,product_id,variant_id,size_label,normalized_size_id,visibility) values('b6000000-0000-4000-8000-000000000003'::uuid,'b0000000-0000-4000-8000-000000000003'::uuid,'b3000000-0000-4000-8000-000000000001'::uuid,'b5000000-0000-4000-8000-000000000002'::uuid,'M','b4000000-0000-4000-8000-000000000001'::uuid,'shared');
insert into public.fit_reports(id,user_id,closet_item_id,product_id,variant_id,size_label,normalized_size_id,fit,would_buy_again) values('b7000000-0000-4000-8000-000000000003'::uuid,'b0000000-0000-4000-8000-000000000003'::uuid,'b6000000-0000-4000-8000-000000000003'::uuid,'b3000000-0000-4000-8000-000000000001'::uuid,'b5000000-0000-4000-8000-000000000002'::uuid,'M','b4000000-0000-4000-8000-000000000001'::uuid,'just_right',true); reset role;

-- Product Family.
set local role authenticated; set local request.jwt.claim.role='authenticated'; set local request.jwt.claim.sub='b0000000-0000-4000-8000-000000000004';
insert into public.closet_items(id,user_id,product_id,size_label,visibility) values('b6000000-0000-4000-8000-000000000004'::uuid,'b0000000-0000-4000-8000-000000000004'::uuid,'b3000000-0000-4000-8000-000000000002'::uuid,'M','shared');
insert into public.fit_reports(id,user_id,closet_item_id,product_id,size_label,fit,would_buy_again) values('b7000000-0000-4000-8000-000000000004'::uuid,'b0000000-0000-4000-8000-000000000004'::uuid,'b6000000-0000-4000-8000-000000000004'::uuid,'b3000000-0000-4000-8000-000000000002'::uuid,'M','just_right',true); reset role;

-- Similar Garments by controlled attribute overlap.
set local role authenticated; set local request.jwt.claim.role='authenticated'; set local request.jwt.claim.sub='b0000000-0000-4000-8000-000000000005';
insert into public.closet_items(id,user_id,product_id,size_label,visibility) values('b6000000-0000-4000-8000-000000000005'::uuid,'b0000000-0000-4000-8000-000000000005'::uuid,'b3000000-0000-4000-8000-000000000003'::uuid,'M','shared');
insert into public.fit_reports(id,user_id,closet_item_id,product_id,size_label,fit,would_buy_again) values('b7000000-0000-4000-8000-000000000005'::uuid,'b0000000-0000-4000-8000-000000000005'::uuid,'b6000000-0000-4000-8000-000000000005'::uuid,'b3000000-0000-4000-8000-000000000003'::uuid,'M','just_right',true); reset role;

-- Brand + Garment Type, no controlled attribute overlap.
set local role authenticated; set local request.jwt.claim.role='authenticated'; set local request.jwt.claim.sub='b0000000-0000-4000-8000-000000000006';
insert into public.closet_items(id,user_id,product_id,size_label,visibility) values('b6000000-0000-4000-8000-000000000006'::uuid,'b0000000-0000-4000-8000-000000000006'::uuid,'b3000000-0000-4000-8000-000000000004'::uuid,'M','shared');
insert into public.fit_reports(id,user_id,closet_item_id,product_id,size_label,fit,would_buy_again) values('b7000000-0000-4000-8000-000000000006'::uuid,'b0000000-0000-4000-8000-000000000006'::uuid,'b6000000-0000-4000-8000-000000000006'::uuid,'b3000000-0000-4000-8000-000000000004'::uuid,'M','just_right',true); reset role;

-- Category Fit only: different brand and different garment type, same bottoms category.
set local role authenticated; set local request.jwt.claim.role='authenticated'; set local request.jwt.claim.sub='b0000000-0000-4000-8000-000000000007';
insert into public.closet_items(id,user_id,product_id,size_label,visibility) values('b6000000-0000-4000-8000-000000000007'::uuid,'b0000000-0000-4000-8000-000000000007'::uuid,'b3000000-0000-4000-8000-000000000005'::uuid,'M','shared');
insert into public.fit_reports(id,user_id,closet_item_id,product_id,size_label,fit,would_buy_again) values('b7000000-0000-4000-8000-000000000007'::uuid,'b0000000-0000-4000-8000-000000000007'::uuid,'b6000000-0000-4000-8000-000000000007'::uuid,'b3000000-0000-4000-8000-000000000005'::uuid,'M','just_right',true); reset role;

set local role authenticated; set local request.jwt.claim.role='authenticated'; set local request.jwt.claim.sub='b0000000-0000-4000-8000-000000000001';
create temporary table hierarchy_results on commit drop as
select * from public.get_product_evidence_candidates('b3000000-0000-4000-8000-000000000001'::uuid,'b5000000-0000-4000-8000-000000000001'::uuid,50);

select is((select count(*) from hierarchy_results),6::bigint,'full hierarchy returns one row for each of six unique evidence wearers');
select is((select count(distinct user_id) from hierarchy_results),6::bigint,'all returned hierarchy rows belong to unique wearers');
select is((select count(*) from hierarchy_results where user_id='b0000000-0000-4000-8000-000000000002'::uuid),1::bigint,'wearer with strong and weak observations still contributes exactly once');
select is((select fit_report_id from hierarchy_results where user_id='b0000000-0000-4000-8000-000000000002'::uuid),'b7000000-0000-4000-8000-000000000001'::uuid,'strongest Exact Variant observation wins for a multi-observation wearer');

select is((select evidence_level::text from hierarchy_results where user_id='b0000000-0000-4000-8000-000000000002'::uuid),'exact_variant','tier 1 label is Exact Variant');
select is((select evidence_level::text from hierarchy_results where user_id='b0000000-0000-4000-8000-000000000003'::uuid),'exact_product','tier 2 label is Exact Product');
select is((select evidence_level::text from hierarchy_results where user_id='b0000000-0000-4000-8000-000000000004'::uuid),'product_family','tier 3 label is Product Family');
select is((select evidence_level::text from hierarchy_results where user_id='b0000000-0000-4000-8000-000000000005'::uuid),'similar_garments','tier 4 label is Similar Garments');
select is((select evidence_level::text from hierarchy_results where user_id='b0000000-0000-4000-8000-000000000006'::uuid),'brand_garment_type','tier 5 label is Brand + Garment Type');
select is((select evidence_level::text from hierarchy_results where user_id='b0000000-0000-4000-8000-000000000007'::uuid),'category_fit','tier 6 label is Category Fit');

select is((select evidence_rank from hierarchy_results where user_id='b0000000-0000-4000-8000-000000000002'::uuid),1,'Exact Variant rank is 1');
select is((select evidence_rank from hierarchy_results where user_id='b0000000-0000-4000-8000-000000000003'::uuid),2,'Exact Product rank is 2');
select is((select evidence_rank from hierarchy_results where user_id='b0000000-0000-4000-8000-000000000004'::uuid),3,'Product Family rank is 3');
select is((select evidence_rank from hierarchy_results where user_id='b0000000-0000-4000-8000-000000000005'::uuid),4,'Similar Garments rank is 4');
select is((select evidence_rank from hierarchy_results where user_id='b0000000-0000-4000-8000-000000000006'::uuid),5,'Brand + Garment Type rank is 5');
select is((select evidence_rank from hierarchy_results where user_id='b0000000-0000-4000-8000-000000000007'::uuid),6,'Category Fit rank is 6');
select is((select string_agg(evidence_level::text,',' order by evidence_rank) from hierarchy_results),'exact_variant,exact_product,product_family,similar_garments,brand_garment_type,category_fit','all six evidence tiers sort in the locked fallback order');
select is((select attribute_overlap from hierarchy_results where user_id='b0000000-0000-4000-8000-000000000005'::uuid),2,'Similar Garments tier carries its controlled attribute overlap');

reset role;
select * from finish();
rollback;

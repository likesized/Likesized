begin;

create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions,auth;
select plan(11);

insert into auth.users(id,aud,role,email,created_at,updated_at)
values
  ('f0000000-0000-4000-8000-000000000001'::uuid,'authenticated','authenticated','family-viewer@likesized.test',now(),now()),
  ('f0000000-0000-4000-8000-000000000002'::uuid,'authenticated','authenticated','family-exact@likesized.test',now(),now()),
  ('f0000000-0000-4000-8000-000000000003'::uuid,'authenticated','authenticated','family-sibling@likesized.test',now(),now()),
  ('f0000000-0000-4000-8000-000000000004'::uuid,'authenticated','authenticated','family-lookalike@likesized.test',now(),now());

set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='f0000000-0000-4000-8000-000000000001';
select public.save_fit_profile('family_viewer','imperial'::public.unit_system,'[{"measurement_type_key":"natural_waist","entered_value":32,"entered_unit":"in","source":"manual","method":"tape"},{"measurement_type_key":"full_hip_seat","entered_value":38,"entered_unit":"in","source":"manual","method":"tape"}]'::jsonb,'[]'::jsonb);
reset role;
set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='f0000000-0000-4000-8000-000000000002';
select public.save_fit_profile('family_exact','imperial'::public.unit_system,'[{"measurement_type_key":"natural_waist","entered_value":32,"entered_unit":"in","source":"manual","method":"tape"},{"measurement_type_key":"full_hip_seat","entered_value":38,"entered_unit":"in","source":"manual","method":"tape"}]'::jsonb,'[]'::jsonb);
reset role;
set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='f0000000-0000-4000-8000-000000000003';
select public.save_fit_profile('family_sibling','imperial'::public.unit_system,'[{"measurement_type_key":"natural_waist","entered_value":32,"entered_unit":"in","source":"manual","method":"tape"},{"measurement_type_key":"full_hip_seat","entered_value":38,"entered_unit":"in","source":"manual","method":"tape"}]'::jsonb,'[]'::jsonb);
reset role;
set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='f0000000-0000-4000-8000-000000000004';
select public.save_fit_profile('family_lookalike','imperial'::public.unit_system,'[{"measurement_type_key":"natural_waist","entered_value":32,"entered_unit":"in","source":"manual","method":"tape"},{"measurement_type_key":"full_hip_seat","entered_value":38,"entered_unit":"in","source":"manual","method":"tape"}]'::jsonb,'[]'::jsonb);
reset role;

insert into public.brands(id,name,slug,normalized_name)
values
  ('f1000000-0000-4000-8000-000000000001'::uuid,'Family Brand','family-brand','familybrand'),
  ('f1000000-0000-4000-8000-000000000002'::uuid,'Other Family Brand','other-family-brand','otherfamilybrand');

insert into public.product_families(id,brand_id,name,normalized_name,garment_type_key,market_segment)
values('f2000000-0000-4000-8000-000000000001'::uuid,'f1000000-0000-4000-8000-000000000001'::uuid,'Core Straight Fit','corestraightfit','jeans','unisex');

select lives_ok(
  $$insert into public.products(id,brand_id,name,slug,category,normalized_name,product_family_id,garment_type_key,market_segment)
    values('f3000000-0000-4000-8000-000000000001'::uuid,'f1000000-0000-4000-8000-000000000001'::uuid,'Core Straight 2026','family-core-straight-2026','bottoms','corestraight2026','f2000000-0000-4000-8000-000000000001'::uuid,'jeans','unisex')$$,
  'compatible product may join a Product Fit Family'
);
select lives_ok(
  $$insert into public.products(id,brand_id,name,slug,category,normalized_name,product_family_id,garment_type_key,market_segment)
    values('f3000000-0000-4000-8000-000000000002'::uuid,'f1000000-0000-4000-8000-000000000001'::uuid,'Core Straight Summer','family-core-straight-summer','bottoms','corestraightsummer','f2000000-0000-4000-8000-000000000001'::uuid,'jeans','unisex')$$,
  'same brand type and segment sibling may share the family'
);
select throws_like(
  $$insert into public.products(id,brand_id,name,slug,category,normalized_name,product_family_id,garment_type_key,market_segment)
    values('f3000000-0000-4000-8000-000000000003'::uuid,'f1000000-0000-4000-8000-000000000002'::uuid,'Wrong Brand Jeans','family-wrong-brand','bottoms','wrongbrandjeans','f2000000-0000-4000-8000-000000000001'::uuid,'jeans','unisex')$$,
  '%must match product brand, garment type, and market segment%',
  'different brand cannot join the family'
);
select throws_like(
  $$insert into public.products(id,brand_id,name,slug,category,normalized_name,product_family_id,garment_type_key,market_segment)
    values('f3000000-0000-4000-8000-000000000004'::uuid,'f1000000-0000-4000-8000-000000000001'::uuid,'Wrong Segment Jeans','family-wrong-segment','bottoms','wrongsegmentjeans','f2000000-0000-4000-8000-000000000001'::uuid,'jeans','mens')$$,
  '%must match product brand, garment type, and market segment%',
  'different market/cut segment cannot join the family'
);
select throws_like(
  $$insert into public.products(id,brand_id,name,slug,category,normalized_name,product_family_id,garment_type_key,market_segment)
    values('f3000000-0000-4000-8000-000000000005'::uuid,'f1000000-0000-4000-8000-000000000001'::uuid,'Wrong Type Tee','family-wrong-type','tops','wrongtypetee','f2000000-0000-4000-8000-000000000001'::uuid,'t_shirt','unisex')$$,
  '%must match product brand, garment type, and market segment%',
  'different garment type cannot join the family'
);

-- Similar name, same brand/type/segment, but deliberately NOT linked to the family.
insert into public.products(id,brand_id,name,slug,category,normalized_name,garment_type_key,market_segment)
values('f3000000-0000-4000-8000-000000000006'::uuid,'f1000000-0000-4000-8000-000000000001'::uuid,'Core Straight Lookalike','family-core-straight-lookalike','bottoms','corestraightlookalike','jeans','unisex');

set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='f0000000-0000-4000-8000-000000000002';
insert into public.closet_items(id,user_id,product_id,size_label,visibility)
values('f4000000-0000-4000-8000-000000000001'::uuid,'f0000000-0000-4000-8000-000000000002'::uuid,'f3000000-0000-4000-8000-000000000001'::uuid,'M','shared');
insert into public.fit_reports(id,user_id,closet_item_id,product_id,size_label,fit,would_buy_again)
values('f5000000-0000-4000-8000-000000000001'::uuid,'f0000000-0000-4000-8000-000000000002'::uuid,'f4000000-0000-4000-8000-000000000001'::uuid,'f3000000-0000-4000-8000-000000000001'::uuid,'M','just_right',true);
reset role;

set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='f0000000-0000-4000-8000-000000000003';
insert into public.closet_items(id,user_id,product_id,size_label,visibility)
values('f4000000-0000-4000-8000-000000000002'::uuid,'f0000000-0000-4000-8000-000000000003'::uuid,'f3000000-0000-4000-8000-000000000002'::uuid,'M','shared');
insert into public.fit_reports(id,user_id,closet_item_id,product_id,size_label,fit,would_buy_again)
values('f5000000-0000-4000-8000-000000000002'::uuid,'f0000000-0000-4000-8000-000000000003'::uuid,'f4000000-0000-4000-8000-000000000002'::uuid,'f3000000-0000-4000-8000-000000000002'::uuid,'M','just_right',true);
reset role;

set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='f0000000-0000-4000-8000-000000000004';
insert into public.closet_items(id,user_id,product_id,size_label,visibility)
values('f4000000-0000-4000-8000-000000000003'::uuid,'f0000000-0000-4000-8000-000000000004'::uuid,'f3000000-0000-4000-8000-000000000006'::uuid,'M','shared');
insert into public.fit_reports(id,user_id,closet_item_id,product_id,size_label,fit,would_buy_again)
values('f5000000-0000-4000-8000-000000000003'::uuid,'f0000000-0000-4000-8000-000000000004'::uuid,'f4000000-0000-4000-8000-000000000003'::uuid,'f3000000-0000-4000-8000-000000000006'::uuid,'M','just_right',true);
reset role;

set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='f0000000-0000-4000-8000-000000000001';
create temporary table family_evidence on commit drop as
select * from public.get_product_evidence_candidates('f3000000-0000-4000-8000-000000000001'::uuid,null,50);

select is((select evidence_level::text from family_evidence where user_id='f0000000-0000-4000-8000-000000000002'::uuid),'exact_product','target product wearer remains Exact Product');
select is((select evidence_rank from family_evidence where user_id='f0000000-0000-4000-8000-000000000002'::uuid),2,'Exact Product rank remains stronger than Product Family');
select is((select evidence_level::text from family_evidence where user_id='f0000000-0000-4000-8000-000000000003'::uuid),'product_family','explicit compatible sibling receives Product Family evidence');
select is((select evidence_rank from family_evidence where user_id='f0000000-0000-4000-8000-000000000003'::uuid),3,'Product Family evidence receives rank 3');
select is((select evidence_level::text from family_evidence where user_id='f0000000-0000-4000-8000-000000000004'::uuid),'brand_garment_type','similar name alone does not create Product Family evidence');
select ok((select min(evidence_rank) from family_evidence where user_id='f0000000-0000-4000-8000-000000000003'::uuid)<(select min(evidence_rank) from family_evidence where user_id='f0000000-0000-4000-8000-000000000004'::uuid),'explicit Product Family evidence outranks unlinked same-brand/type evidence');

reset role;
select * from finish();
rollback;

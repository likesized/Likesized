begin;

create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions,auth,private;
select plan(14);

select has_table('private','garment_proportion_rules','derived proportion rules stay in the private schema');
select hasnt_table('public','user_body_proportions','derived proportions are not stored as member profile data');
select ok((select max(weight) from private.garment_proportion_rules)<=.04,'no individual proportion rule carries more than 4% influence');
select ok((select max(total_weight) from (select garment_type_key,sum(weight) total_weight from private.garment_proportion_rules group by garment_type_key) x)<=.08,'configured proportion influence per garment type is capped at 8%');
select is(private.fit_proportion_similarity(1,1,.10),1::numeric,'identical proportions have exact similarity');
select is(private.fit_proportion_similarity(.80,.88,.15),private.fit_proportion_similarity(.88,.80,.15),'proportion similarity is symmetric');
select is(private.apply_proportion_refinement(90,null,.08),90,'missing proportion evidence leaves the qualified base Match unchanged');
select ok(private.apply_proportion_refinement(90,1,.08)<=94,'positive proportion refinement cannot add more than four Match points');
select ok(private.apply_proportion_refinement(90,0,.08)>=86,'negative proportion refinement cannot subtract more than four Match points');

insert into auth.users(id,aud,role,email,created_at,updated_at) values
('d0000000-0000-4000-8000-000000000001','authenticated','authenticated','ratio-viewer@likesized.test',now(),now()),
('d0000000-0000-4000-8000-000000000002','authenticated','authenticated','ratio-same@likesized.test',now(),now()),
('d0000000-0000-4000-8000-000000000003','authenticated','authenticated','ratio-different@likesized.test',now(),now());

set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='d0000000-0000-4000-8000-000000000001';
select public.save_fit_profile('ratio_viewer','imperial'::public.unit_system,
 '[{"measurement_type_key":"height","entered_value":70,"entered_unit":"in","source":"manual","method":"tape"},{"measurement_type_key":"chest_circumference","entered_value":40,"entered_unit":"in","source":"manual","method":"tape"},{"measurement_type_key":"natural_waist","entered_value":32,"entered_unit":"in","source":"manual","method":"tape"},{"measurement_type_key":"shoulder_width","entered_value":18,"entered_unit":"in","source":"manual","method":"tape"},{"measurement_type_key":"torso_body_length","entered_value":25,"entered_unit":"in","source":"manual","method":"tape"}]'::jsonb);
reset role;

set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='d0000000-0000-4000-8000-000000000002';
select public.save_fit_profile('ratio_same','imperial'::public.unit_system,
 '[{"measurement_type_key":"height","entered_value":70,"entered_unit":"in","source":"manual","method":"tape"},{"measurement_type_key":"chest_circumference","entered_value":40,"entered_unit":"in","source":"manual","method":"tape"},{"measurement_type_key":"natural_waist","entered_value":32,"entered_unit":"in","source":"manual","method":"tape"},{"measurement_type_key":"shoulder_width","entered_value":18,"entered_unit":"in","source":"manual","method":"tape"},{"measurement_type_key":"torso_body_length","entered_value":25,"entered_unit":"in","source":"manual","method":"tape"}]'::jsonb);
reset role;

set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='d0000000-0000-4000-8000-000000000003';
select public.save_fit_profile('ratio_different','imperial'::public.unit_system,
 '[{"measurement_type_key":"height","entered_value":64,"entered_unit":"in","source":"manual","method":"tape"},{"measurement_type_key":"chest_circumference","entered_value":40,"entered_unit":"in","source":"manual","method":"tape"},{"measurement_type_key":"natural_waist","entered_value":40,"entered_unit":"in","source":"manual","method":"tape"},{"measurement_type_key":"shoulder_width","entered_value":18,"entered_unit":"in","source":"manual","method":"tape"},{"measurement_type_key":"torso_body_length","entered_value":32,"entered_unit":"in","source":"manual","method":"tape"}]'::jsonb);
reset role;

set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='d0000000-0000-4000-8000-000000000001';

select ok(
 private.refine_current_garment_match_with_proportions('d0000000-0000-4000-8000-000000000002','t_shirt',90) >
 private.refine_current_garment_match_with_proportions('d0000000-0000-4000-8000-000000000003','t_shirt',90),
 'same raw-size neighborhood with more similar proportions receives the stronger t-shirt refinement'
);

select is(
 private.refine_current_garment_match_with_proportions('d0000000-0000-4000-8000-000000000002','shoes',90),
 90,
 'garment types without proportion rules keep their base Match unchanged'
);

insert into public.brands(id,name,slug,normalized_name)
values('d1000000-0000-4000-8000-000000000001','Ratio Brand','ratio-brand','ratiobrand');
insert into public.products(id,brand_id,name,slug,category,normalized_name,garment_type_key,market_segment)
values('d2000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000001','Ratio Tee','ratio-tee','tops','ratiotee','t_shirt','unisex');

select ok(
 private.refine_snapshot_product_match_with_proportions(
   (select id from public.fit_profile_versions where user_id='d0000000-0000-4000-8000-000000000002' order by created_at desc,id desc limit 1),
   'd2000000-0000-4000-8000-000000000001',90
 ) >
 private.refine_snapshot_product_match_with_proportions(
   (select id from public.fit_profile_versions where user_id='d0000000-0000-4000-8000-000000000003' order by created_at desc,id desc limit 1),
   'd2000000-0000-4000-8000-000000000001',90
 ),
 'historical product Match uses the same bounded proportion refinement against immutable snapshots'
);

select is(
 (select coverage_percent from public.get_garment_fit_matches('t_shirt',20) where user_id='d0000000-0000-4000-8000-000000000002'),
 (select coverage_percent from public.get_garment_fit_matches('t_shirt',20) where user_id='d0000000-0000-4000-8000-000000000003'),
 'derived proportions do not create a separate coverage requirement'
);

set local role authenticated;
select throws_like(
 $$select private.refine_current_garment_match_with_proportions('d0000000-0000-4000-8000-000000000002','t_shirt',90)$$,
 '%permission denied%',
 'authenticated clients cannot directly probe the private proportion helper'
);
reset role;

select * from finish();
rollback;
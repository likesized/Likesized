begin;

create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions,auth;
select plan(10);

insert into auth.users(id,aud,role,email,created_at,updated_at)
values
  ('a0000000-0000-4000-8000-000000000001'::uuid,'authenticated','authenticated','attr-viewer@likesized.test',now(),now()),
  ('a0000000-0000-4000-8000-000000000002'::uuid,'authenticated','authenticated','attr-similar@likesized.test',now(),now()),
  ('a0000000-0000-4000-8000-000000000003'::uuid,'authenticated','authenticated','attr-brand@likesized.test',now(),now());

set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='a0000000-0000-4000-8000-000000000001';
select public.save_fit_profile('attr_viewer','imperial'::public.unit_system,'[{"measurement_type_key":"natural_waist","entered_value":32,"entered_unit":"in","source":"manual","method":"tape"},{"measurement_type_key":"full_hip_seat","entered_value":38,"entered_unit":"in","source":"manual","method":"tape"}]'::jsonb,'[]'::jsonb);
reset role;
set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='a0000000-0000-4000-8000-000000000002';
select public.save_fit_profile('attr_similar','imperial'::public.unit_system,'[{"measurement_type_key":"natural_waist","entered_value":32,"entered_unit":"in","source":"manual","method":"tape"},{"measurement_type_key":"full_hip_seat","entered_value":38,"entered_unit":"in","source":"manual","method":"tape"}]'::jsonb,'[]'::jsonb);
reset role;
set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='a0000000-0000-4000-8000-000000000003';
select public.save_fit_profile('attr_brand','imperial'::public.unit_system,'[{"measurement_type_key":"natural_waist","entered_value":32,"entered_unit":"in","source":"manual","method":"tape"},{"measurement_type_key":"full_hip_seat","entered_value":38,"entered_unit":"in","source":"manual","method":"tape"}]'::jsonb,'[]'::jsonb);
reset role;

select is((select label from public.garment_attribute_definitions where key='primary_material'),'Primary material / fabric family','V1 controlled primary material definition exists');

insert into public.brands(id,name,slug,normalized_name)
values
  ('a1000000-0000-4000-8000-000000000001'::uuid,'Attribute Brand A','attribute-brand-a','attributebranda'),
  ('a1000000-0000-4000-8000-000000000002'::uuid,'Attribute Brand B','attribute-brand-b','attributebrandb');
insert into public.products(id,brand_id,name,slug,category,normalized_name,garment_type_key,market_segment)
values
  ('a2000000-0000-4000-8000-000000000001'::uuid,'a1000000-0000-4000-8000-000000000001'::uuid,'Target Denim','attribute-target-denim','bottoms','targetdenim','jeans','unisex'),
  ('a2000000-0000-4000-8000-000000000002'::uuid,'a1000000-0000-4000-8000-000000000002'::uuid,'Similar Denim','attribute-similar-denim','bottoms','similardenim','jeans','unisex'),
  ('a2000000-0000-4000-8000-000000000003'::uuid,'a1000000-0000-4000-8000-000000000001'::uuid,'Different Construction','attribute-different-construction','bottoms','differentconstruction','jeans','unisex');

select lives_ok(
  $$insert into public.product_attribute_values(product_id,attribute_key,option_key) values('a2000000-0000-4000-8000-000000000001'::uuid,'primary_material','denim')$$,
  'global primary material may be attached to a bottoms Product'
);
select lives_ok(
  $$insert into public.product_attribute_values(product_id,attribute_key,option_key) values('a2000000-0000-4000-8000-000000000001'::uuid,'rise','mid')$$,
  'bottoms-scoped rise may be attached to a bottoms Product'
);
select throws_like(
  $$insert into public.product_attribute_values(product_id,attribute_key,option_key) values('a2000000-0000-4000-8000-000000000001'::uuid,'sleeve_length','long')$$,
  '%not valid for this Product category%',
  'tops-scoped sleeve length cannot be attached to a bottoms Product'
);
insert into public.product_attribute_values(product_id,attribute_key,option_key)
values
  ('a2000000-0000-4000-8000-000000000001'::uuid,'stretch_level','medium'),
  ('a2000000-0000-4000-8000-000000000002'::uuid,'primary_material','denim'),
  ('a2000000-0000-4000-8000-000000000002'::uuid,'stretch_level','medium'),
  ('a2000000-0000-4000-8000-000000000003'::uuid,'primary_material','cotton'),
  ('a2000000-0000-4000-8000-000000000003'::uuid,'stretch_level','none');

set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='a0000000-0000-4000-8000-000000000002';
insert into public.closet_items(id,user_id,product_id,size_label,visibility)
values('a3000000-0000-4000-8000-000000000001'::uuid,'a0000000-0000-4000-8000-000000000002'::uuid,'a2000000-0000-4000-8000-000000000002'::uuid,'M','shared');
insert into public.fit_reports(id,user_id,closet_item_id,product_id,size_label,fit,would_buy_again)
values('a4000000-0000-4000-8000-000000000001'::uuid,'a0000000-0000-4000-8000-000000000002'::uuid,'a3000000-0000-4000-8000-000000000001'::uuid,'a2000000-0000-4000-8000-000000000002'::uuid,'M','just_right',true);
reset role;

set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='a0000000-0000-4000-8000-000000000003';
insert into public.closet_items(id,user_id,product_id,size_label,visibility)
values('a3000000-0000-4000-8000-000000000002'::uuid,'a0000000-0000-4000-8000-000000000003'::uuid,'a2000000-0000-4000-8000-000000000003'::uuid,'M','shared');
insert into public.fit_reports(id,user_id,closet_item_id,product_id,size_label,fit,would_buy_again)
values('a4000000-0000-4000-8000-000000000002'::uuid,'a0000000-0000-4000-8000-000000000003'::uuid,'a3000000-0000-4000-8000-000000000002'::uuid,'a2000000-0000-4000-8000-000000000003'::uuid,'M','just_right',true);
reset role;

set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='a0000000-0000-4000-8000-000000000001';
create temporary table attribute_evidence on commit drop as
select * from public.get_product_evidence_candidates('a2000000-0000-4000-8000-000000000001'::uuid,null,50);

select is((select evidence_level::text from attribute_evidence where user_id='a0000000-0000-4000-8000-000000000002'::uuid),'similar_garments','same garment type with controlled attribute overlap receives Similar Garments evidence');
select is((select evidence_rank from attribute_evidence where user_id='a0000000-0000-4000-8000-000000000002'::uuid),4,'Similar Garments receives evidence rank 4');
select is((select attribute_overlap from attribute_evidence where user_id='a0000000-0000-4000-8000-000000000002'::uuid),2,'attribute overlap counts matching controlled material and stretch signals');
select is((select evidence_level::text from attribute_evidence where user_id='a0000000-0000-4000-8000-000000000003'::uuid),'brand_garment_type','same brand and garment type with no attribute overlap stays Brand + Garment Type');
select is((select evidence_rank from attribute_evidence where user_id='a0000000-0000-4000-8000-000000000003'::uuid),5,'Brand + Garment Type remains evidence rank 5');
select ok((select evidence_rank from attribute_evidence where user_id='a0000000-0000-4000-8000-000000000002'::uuid)<(select evidence_rank from attribute_evidence where user_id='a0000000-0000-4000-8000-000000000003'::uuid),'controlled Similar Garments evidence outranks non-overlap same-brand/type evidence');

reset role;
select * from finish();
rollback;

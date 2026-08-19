begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, auth;

select plan(32);

insert into auth.users (id, aud, role, email, created_at, updated_at)
values
  ('d0000000-0000-4000-8000-000000000001'::uuid,'authenticated','authenticated','closet-a@likesized.test',now(),now()),
  ('d0000000-0000-4000-8000-000000000002'::uuid,'authenticated','authenticated','closet-b@likesized.test',now(),now());

set local role authenticated;
set local request.jwt.claim.sub = 'd0000000-0000-4000-8000-000000000001';
set local request.jwt.claim.role = 'authenticated';
select public.save_fit_profile(
  'closet_a','imperial'::public.unit_system,
  '[{"measurement_type_key":"height","entered_value":68,"entered_unit":"in","source":"manual","method":"tape"},{"measurement_type_key":"natural_waist","entered_value":31,"entered_unit":"in","source":"manual","method":"tape"}]'::jsonb,
  '[]'::jsonb
);
reset role;

set local role authenticated;
set local request.jwt.claim.sub = 'd0000000-0000-4000-8000-000000000002';
set local request.jwt.claim.role = 'authenticated';
select public.save_fit_profile(
  'closet_b','imperial'::public.unit_system,
  '[{"measurement_type_key":"height","entered_value":72,"entered_unit":"in","source":"manual","method":"tape"},{"measurement_type_key":"natural_waist","entered_value":36,"entered_unit":"in","source":"manual","method":"tape"}]'::jsonb,
  '[]'::jsonb
);
reset role;

insert into public.brands(id,name,slug,normalized_name)
values('d1000000-0000-4000-8000-000000000001'::uuid,'Closet Test','closet-test','closettest');

insert into public.products(id,brand_id,name,slug,category,normalized_name,garment_type_key,market_segment)
values('d2000000-0000-4000-8000-000000000001'::uuid,'d1000000-0000-4000-8000-000000000001'::uuid,'Integration Jeans','closet-test-integration-jeans','bottoms','integrationjeans','jeans','unisex');

set local role authenticated;
set local request.jwt.claim.sub = 'd0000000-0000-4000-8000-000000000001';
set local request.jwt.claim.role = 'authenticated';

insert into public.closet_items(id,user_id,product_id,size_label,visibility,wears_count)
values
  ('d3000000-0000-4000-8000-000000000001'::uuid,'d0000000-0000-4000-8000-000000000001'::uuid,'d2000000-0000-4000-8000-000000000001'::uuid,'M','private',0),
  ('d3000000-0000-4000-8000-000000000002'::uuid,'d0000000-0000-4000-8000-000000000001'::uuid,'d2000000-0000-4000-8000-000000000001'::uuid,'M','shared',0);

insert into public.fit_reports(id,user_id,closet_item_id,product_id,fit_profile_version_id,size_label,fit)
select 'd4000000-0000-4000-8000-000000000001'::uuid,'d0000000-0000-4000-8000-000000000001'::uuid,'d3000000-0000-4000-8000-000000000001'::uuid,'d2000000-0000-4000-8000-000000000001'::uuid,current_version_id,'M','just_right'
from public.fit_profiles where user_id='d0000000-0000-4000-8000-000000000001'::uuid;

insert into public.fit_reports(id,user_id,closet_item_id,product_id,fit_profile_version_id,size_label,fit)
select report_id,'d0000000-0000-4000-8000-000000000001'::uuid,'d3000000-0000-4000-8000-000000000002'::uuid,'d2000000-0000-4000-8000-000000000001'::uuid,current_version_id,'M',fit_value::public.fit_rating
from public.fit_profiles
cross join (values
  ('d4000000-0000-4000-8000-000000000002'::uuid,'snug'),
  ('d4000000-0000-4000-8000-000000000003'::uuid,'just_right')
) as observations(report_id,fit_value)
where user_id='d0000000-0000-4000-8000-000000000001'::uuid;

insert into public.fit_report_dimensions(fit_report_id,dimension_key,response_key)
values
  ('d4000000-0000-4000-8000-000000000001'::uuid,'waist','just_right'),
  ('d4000000-0000-4000-8000-000000000002'::uuid,'waist','just_right'),
  ('d4000000-0000-4000-8000-000000000003'::uuid,'waist','just_right');

insert into public.outfit_posts(id,user_id,caption,photo_url)
values('d5000000-0000-4000-8000-000000000001'::uuid,'d0000000-0000-4000-8000-000000000001'::uuid,'Closet integration test','d0000000-0000-4000-8000-000000000001/d5000000-0000-4000-8000-000000000001/outfit.jpg');
insert into public.outfit_post_items(post_id,closet_item_id)
values('d5000000-0000-4000-8000-000000000001'::uuid,'d3000000-0000-4000-8000-000000000002'::uuid);

select is((select count(*) from public.closet_items where user_id='d0000000-0000-4000-8000-000000000001'::uuid),2::bigint,'owner can read Private and Shared Closet items');
select is((select count(*) from public.fit_reports where closet_item_id='d3000000-0000-4000-8000-000000000002'::uuid),2::bigint,'same Closet item supports multiple immutable fit observations');
select is((select count(*) from public.fit_report_dimensions where fit_report_id in ('d4000000-0000-4000-8000-000000000002'::uuid,'d4000000-0000-4000-8000-000000000003'::uuid)),2::bigint,'controlled dimensions persist independently for repeat observations');
select throws_like(
  $$insert into public.fit_reference_photos(id,user_id,closet_item_id,storage_path) values(gen_random_uuid(),'d0000000-0000-4000-8000-000000000001'::uuid,'d3000000-0000-4000-8000-000000000001'::uuid,'private/forbidden.jpg')$$,
  '%requires a Shared Closet item%',
  'fit photo metadata cannot be attached to a Private Closet item'
);
select throws_like(
  $$insert into public.fit_reference_photos(id,user_id,closet_item_id,storage_path) values(gen_random_uuid(),'d0000000-0000-4000-8000-000000000002'::uuid,'d3000000-0000-4000-8000-000000000002'::uuid,'mismatch/forbidden.jpg')$$,
  '%owner must match Closet item owner%',
  'fit photo metadata owner must match the Closet owner'
);
select lives_ok(
  $$insert into public.fit_reference_photos(id,user_id,closet_item_id,storage_path) values('d6000000-0000-4000-8000-000000000001'::uuid,'d0000000-0000-4000-8000-000000000001'::uuid,'d3000000-0000-4000-8000-000000000002'::uuid,'shared/fit.jpg')$$,
  'owner can attach fit photo metadata to a Shared Closet item'
);
select throws_like(
  $$update public.closet_items set visibility='private' where id='d3000000-0000-4000-8000-000000000002'::uuid$$,
  '%Remove the fit reference photo before making this Closet item private%',
  'Shared Closet item with a fit photo cannot become Private'
);
select is((select visibility::text from public.closet_items where id='d3000000-0000-4000-8000-000000000002'::uuid),'shared','failed private transition leaves Shared visibility unchanged');

reset role;

set local role authenticated;
set local request.jwt.claim.sub = 'd0000000-0000-4000-8000-000000000002';
set local request.jwt.claim.role = 'authenticated';
select is((select count(*) from public.closet_items where user_id='d0000000-0000-4000-8000-000000000001'::uuid),1::bigint,'another member sees only the Shared Closet item');
select is((select count(*) from public.fit_reports where user_id='d0000000-0000-4000-8000-000000000001'::uuid),2::bigint,'another member sees only fit reports belonging to Shared Closet evidence');
select is((select count(*) from public.fit_report_dimensions where fit_report_id in ('d4000000-0000-4000-8000-000000000001'::uuid,'d4000000-0000-4000-8000-000000000002'::uuid,'d4000000-0000-4000-8000-000000000003'::uuid)),2::bigint,'another member sees controlled dimensions only through Shared fit reports');
select is((select count(*) from public.fit_reference_photos where closet_item_id='d3000000-0000-4000-8000-000000000002'::uuid),1::bigint,'another member can read fit photo metadata only for Shared evidence');
select is((select count(*) from public.outfit_post_items where closet_item_id='d3000000-0000-4000-8000-000000000002'::uuid),1::bigint,'another member can read an outfit link only while the tagged Closet item is Shared');
select lives_ok(
  $$update public.closet_items set wears_count=99 where id='d3000000-0000-4000-8000-000000000002'::uuid$$,
  'cross-user Closet update is filtered by RLS rather than modifying another member row'
);
reset role;
select is((select wears_count from public.closet_items where id='d3000000-0000-4000-8000-000000000002'::uuid),0,'cross-user update leaves owner Closet settings unchanged');

set local role authenticated;
set local request.jwt.claim.sub = 'd0000000-0000-4000-8000-000000000001';
set local request.jwt.claim.role = 'authenticated';
select lives_ok($$delete from public.fit_reference_photos where id='d6000000-0000-4000-8000-000000000001'::uuid$$,'owner can remove fit photo metadata');
select lives_ok($$update public.closet_items set visibility='private' where id='d3000000-0000-4000-8000-000000000002'::uuid$$,'Closet item may become Private after its fit photo is removed');
select is((select visibility::text from public.closet_items where id='d3000000-0000-4000-8000-000000000002'::uuid),'private','photo removal allows the intended Private state');
reset role;

set local role authenticated;
set local request.jwt.claim.sub = 'd0000000-0000-4000-8000-000000000002';
set local request.jwt.claim.role = 'authenticated';
select is((select count(*) from public.closet_items where user_id='d0000000-0000-4000-8000-000000000001'::uuid),0::bigint,'another member loses Closet access when the item becomes Private');
select is((select count(*) from public.fit_reports where user_id='d0000000-0000-4000-8000-000000000001'::uuid),0::bigint,'another member loses historical Fit Report access when the item becomes Private');
select is((select count(*) from public.fit_report_dimensions where fit_report_id in ('d4000000-0000-4000-8000-000000000002'::uuid,'d4000000-0000-4000-8000-000000000003'::uuid)),0::bigint,'another member loses controlled-dimension access when the item becomes Private');
select is((select count(*) from public.outfit_post_items where closet_item_id='d3000000-0000-4000-8000-000000000002'::uuid),0::bigint,'outfit garment link becomes hidden when the tagged Closet item is Private');
reset role;

set local role authenticated;
set local request.jwt.claim.sub = 'd0000000-0000-4000-8000-000000000001';
set local request.jwt.claim.role = 'authenticated';
select lives_ok($$update public.closet_items set visibility='shared' where id='d3000000-0000-4000-8000-000000000002'::uuid$$,'owner can reshare the Closet item');
select lives_ok($$insert into public.fit_reference_photos(id,user_id,closet_item_id,storage_path) values('d6000000-0000-4000-8000-000000000002'::uuid,'d0000000-0000-4000-8000-000000000001'::uuid,'d3000000-0000-4000-8000-000000000002'::uuid,'shared/fit-again.jpg')$$,'fit photo metadata can be reattached after resharing');
select lives_ok($$delete from public.closet_items where id='d3000000-0000-4000-8000-000000000002'::uuid$$,'owner can delete the Closet garment');
reset role;

select is((select count(*) from public.fit_reports where closet_item_id='d3000000-0000-4000-8000-000000000002'::uuid),0::bigint,'Closet deletion cascades all Fit Reports for that garment');
select is((select count(*) from public.fit_report_dimensions where fit_report_id in ('d4000000-0000-4000-8000-000000000002'::uuid,'d4000000-0000-4000-8000-000000000003'::uuid)),0::bigint,'Closet deletion cascades controlled fit dimensions through Fit Reports');
select is((select count(*) from public.fit_reference_photos where closet_item_id='d3000000-0000-4000-8000-000000000002'::uuid),0::bigint,'Closet deletion cascades fit-photo metadata');
select is((select count(*) from public.outfit_post_items where closet_item_id='d3000000-0000-4000-8000-000000000002'::uuid),0::bigint,'Closet deletion cascades outfit garment links');
select is((select count(*) from public.products where id='d2000000-0000-4000-8000-000000000001'::uuid),1::bigint,'Closet deletion preserves the canonical product catalog record');
select is((select count(*) from public.outfit_posts where id='d5000000-0000-4000-8000-000000000001'::uuid),1::bigint,'Closet deletion preserves the outfit post itself');
select is((select count(*) from public.closet_items where id='d3000000-0000-4000-8000-000000000001'::uuid),1::bigint,'deleting one garment leaves unrelated Private Closet items intact');

select * from finish();
rollback;

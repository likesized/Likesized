begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, auth;

select plan(20);

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

insert into public.closet_items(id,user_id,product_id,size_label,wears_count)
values
  ('d3000000-0000-4000-8000-000000000001'::uuid,'d0000000-0000-4000-8000-000000000001'::uuid,'d2000000-0000-4000-8000-000000000001'::uuid,'M',0),
  ('d3000000-0000-4000-8000-000000000002'::uuid,'d0000000-0000-4000-8000-000000000001'::uuid,'d2000000-0000-4000-8000-000000000001'::uuid,'M',0);

select is((select count(*) from public.closet_items where user_id='d0000000-0000-4000-8000-000000000001'::uuid),2::bigint,'owner can read all of their Closet garments');
select is((select count(*) from public.closet_items where user_id='d0000000-0000-4000-8000-000000000001'::uuid and visibility='shared'::public.closet_visibility),2::bigint,'current V1 Closet garments default to the legacy shared compatibility value');
select throws_like(
  $$insert into public.closet_items(id,user_id,product_id,size_label,visibility,wears_count) values(gen_random_uuid(),'d0000000-0000-4000-8000-000000000001'::uuid,'d2000000-0000-4000-8000-000000000001'::uuid,'M','private',0)$$,
  '%closet_items_shared_only_current_v1%',
  'current V1 rejects creation of a Private Closet garment'
);
select throws_like(
  $$update public.closet_items set visibility='private' where id='d3000000-0000-4000-8000-000000000001'::uuid$$,
  '%closet_items_shared_only_current_v1%',
  'current V1 rejects changing a Closet garment to Private'
);

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

select is((select count(*) from public.fit_reports where closet_item_id='d3000000-0000-4000-8000-000000000002'::uuid),2::bigint,'same Closet garment supports multiple immutable fit observations');
select is((select count(*) from public.fit_report_dimensions where fit_report_id in ('d4000000-0000-4000-8000-000000000002'::uuid,'d4000000-0000-4000-8000-000000000003'::uuid)),2::bigint,'controlled dimensions persist independently for repeat observations');

select lives_ok(
  $$insert into public.fit_reference_photos(id,user_id,closet_item_id,storage_path) values('d6000000-0000-4000-8000-000000000001'::uuid,'d0000000-0000-4000-8000-000000000001'::uuid,'d3000000-0000-4000-8000-000000000002'::uuid,'d0000000-0000-4000-8000-000000000001/d3000000-0000-4000-8000-000000000002/front.jpg')$$,
  'owner can attach member-visible Fit photo metadata without a visibility switch'
);
select throws_like(
  $$insert into public.fit_reference_photos(id,user_id,closet_item_id,storage_path) values(gen_random_uuid(),'d0000000-0000-4000-8000-000000000002'::uuid,'d3000000-0000-4000-8000-000000000002'::uuid,'mismatch/forbidden.jpg')$$,
  '%owner must match Closet item owner%',
  'Fit photo metadata owner must match the Closet owner'
);

insert into public.outfit_posts(id,user_id,caption,photo_url,headline,status,published_at)
values('d5000000-0000-4000-8000-000000000001'::uuid,'d0000000-0000-4000-8000-000000000001'::uuid,'Closet integration test','d0000000-0000-4000-8000-000000000001/d5000000-0000-4000-8000-000000000001/outfit.jpg','Closet integration test','published',now());
insert into public.outfit_post_items(post_id,closet_item_id)
values('d5000000-0000-4000-8000-000000000001'::uuid,'d3000000-0000-4000-8000-000000000002'::uuid);

reset role;

set local role authenticated;
set local request.jwt.claim.sub = 'd0000000-0000-4000-8000-000000000002';
set local request.jwt.claim.role = 'authenticated';
select is((select count(*) from public.closet_items where user_id='d0000000-0000-4000-8000-000000000001'::uuid),2::bigint,'another member can read the member-visible Closet garments');
select is((select count(*) from public.fit_reports where user_id='d0000000-0000-4000-8000-000000000001'::uuid),3::bigint,'another member can read the member-visible Fit Reports');
select is((select count(*) from public.fit_report_dimensions where fit_report_id in ('d4000000-0000-4000-8000-000000000001'::uuid,'d4000000-0000-4000-8000-000000000002'::uuid,'d4000000-0000-4000-8000-000000000003'::uuid)),3::bigint,'another member can read controlled dimensions through member-visible Fit Reports');
select is((select count(*) from public.fit_reference_photos where closet_item_id='d3000000-0000-4000-8000-000000000002'::uuid),1::bigint,'another member can read Fit photo metadata');
select is((select count(*) from public.outfit_post_items where closet_item_id='d3000000-0000-4000-8000-000000000002'::uuid),1::bigint,'another member can read a published Outfit garment link');
select lives_ok(
  $$update public.closet_items set wears_count=99 where id='d3000000-0000-4000-8000-000000000002'::uuid$$,
  'cross-user Closet update is filtered by RLS rather than modifying another member row'
);
reset role;
select is((select wears_count from public.closet_items where id='d3000000-0000-4000-8000-000000000002'::uuid),0,'cross-user update leaves owner Closet settings unchanged');

set local role authenticated;
set local request.jwt.claim.sub = 'd0000000-0000-4000-8000-000000000001';
set local request.jwt.claim.role = 'authenticated';
select lives_ok($$delete from public.closet_items where id='d3000000-0000-4000-8000-000000000002'::uuid$$,'owner can delete the Closet garment');
reset role;

select is((select count(*) from public.fit_reports where closet_item_id='d3000000-0000-4000-8000-000000000002'::uuid),0::bigint,'Closet deletion cascades all Fit Reports for that garment');
select is((select count(*) from public.fit_report_dimensions where fit_report_id in ('d4000000-0000-4000-8000-000000000002'::uuid,'d4000000-0000-4000-8000-000000000003'::uuid)),0::bigint,'Closet deletion cascades controlled fit dimensions through Fit Reports');
select is((select count(*) from public.fit_reference_photos where closet_item_id='d3000000-0000-4000-8000-000000000002'::uuid),0::bigint,'Closet deletion cascades Fit-photo metadata');
select is((select count(*) from public.outfit_post_items where closet_item_id='d3000000-0000-4000-8000-000000000002'::uuid),0::bigint,'Closet deletion cascades Outfit garment links');
select is((select count(*) from public.products where id='d2000000-0000-4000-8000-000000000001'::uuid),1::bigint,'Closet deletion preserves the canonical Product record');
select is((select count(*) from public.outfit_posts where id='d5000000-0000-4000-8000-000000000001'::uuid),1::bigint,'Closet deletion preserves the Outfit post itself');

select * from finish();
rollback;

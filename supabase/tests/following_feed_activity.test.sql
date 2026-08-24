begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, auth;
select plan(18);

insert into auth.users(id,aud,role,email,created_at,updated_at)
values
  ('f5200000-0000-4000-8000-000000000001'::uuid,'authenticated','authenticated','feed-viewer@likesized.test',now(),now()),
  ('f5200000-0000-4000-8000-000000000002'::uuid,'authenticated','authenticated','feed-followed@likesized.test',now(),now()),
  ('f5200000-0000-4000-8000-000000000003'::uuid,'authenticated','authenticated','feed-other@likesized.test',now(),now());

set local role authenticated;
set local request.jwt.claim.sub='f5200000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
select public.save_fit_profile('feed_viewer','metric','[{"measurement_type_key":"height","entered_value":170,"entered_unit":"cm","source":"manual","method":"tape"},{"measurement_type_key":"natural_waist","entered_value":80,"entered_unit":"cm","source":"manual","method":"tape"}]'::jsonb,'[]'::jsonb);
insert into public.follows(follower_id,followed_id)
values('f5200000-0000-4000-8000-000000000001'::uuid,'f5200000-0000-4000-8000-000000000002'::uuid);
reset role;

set local role authenticated;
set local request.jwt.claim.sub='f5200000-0000-4000-8000-000000000002';
set local request.jwt.claim.role='authenticated';
select public.save_fit_profile('feed_followed','metric','[{"measurement_type_key":"height","entered_value":171,"entered_unit":"cm","source":"manual","method":"tape"},{"measurement_type_key":"natural_waist","entered_value":81,"entered_unit":"cm","source":"manual","method":"tape"}]'::jsonb,'[]'::jsonb);
reset role;

set local role authenticated;
set local request.jwt.claim.sub='f5200000-0000-4000-8000-000000000003';
set local request.jwt.claim.role='authenticated';
select public.save_fit_profile('feed_other','metric','[{"measurement_type_key":"height","entered_value":180,"entered_unit":"cm","source":"manual","method":"tape"},{"measurement_type_key":"natural_waist","entered_value":88,"entered_unit":"cm","source":"manual","method":"tape"}]'::jsonb,'[]'::jsonb);
reset role;

insert into public.brands(id,name,slug,normalized_name)
values('f5210000-0000-4000-8000-000000000001'::uuid,'Feed Denim','feed-denim','feeddenim');
insert into public.products(id,brand_id,name,slug,category,normalized_name,garment_type_key,market_segment)
values('f5220000-0000-4000-8000-000000000001'::uuid,'f5210000-0000-4000-8000-000000000001'::uuid,'Straight Jeans','feed-denim-straight-jeans','bottoms','straightjeans','jeans','unisex');

select ok(not has_function_privilege('anon','public.get_following_feed(integer,timestamptz)','EXECUTE'),'anonymous visitors cannot execute the Following Feed RPC');
select ok(not has_table_privilege('authenticated','private.following_activity_events','SELECT'),'authenticated members cannot query the private activity ledger directly');

set local role authenticated;
set local request.jwt.claim.sub='f5200000-0000-4000-8000-000000000002';
set local request.jwt.claim.role='authenticated';
select throws_like(
  $$insert into public.closet_items(id,user_id,product_id,size_label,visibility,wears_count) values('f5230000-0000-4000-8000-000000000099'::uuid,'f5200000-0000-4000-8000-000000000002'::uuid,'f5220000-0000-4000-8000-000000000001'::uuid,'29','private',0)$$,
  '%closet_items_shared_only_current_v1%',
  'current V1 rejects revival of a Private Closet garment'
);
insert into public.closet_items(id,user_id,product_id,size_label,visibility,wears_count)
values('f5230000-0000-4000-8000-000000000002'::uuid,'f5200000-0000-4000-8000-000000000002'::uuid,'f5220000-0000-4000-8000-000000000001'::uuid,'29','shared',0);
insert into public.fit_reports(id,user_id,closet_item_id,product_id,fit_profile_version_id,size_label,fit,fit_notes,would_buy_again)
select 'f5240000-0000-4000-8000-000000000002'::uuid,'f5200000-0000-4000-8000-000000000002'::uuid,'f5230000-0000-4000-8000-000000000002'::uuid,'f5220000-0000-4000-8000-000000000001'::uuid,current_version_id,'29','snug','Perfect waist, snug through thighs',true
from public.fit_profiles where user_id='f5200000-0000-4000-8000-000000000002'::uuid;
reset role;

set local role authenticated;
set local request.jwt.claim.sub='f5200000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
select is((select count(*) from public.get_following_feed(50,null) where activity_type='closet_shared'),1::bigint,'first Fit Report on a member-visible Closet garment creates one garment feed event');
select is((select relevant_match_category::text from public.get_following_feed(50,null) where activity_type='closet_shared' limit 1),'bottoms','bottom garment activity carries Bottoms match context');
select is((select product_name from public.get_following_feed(50,null) where activity_type='closet_shared' limit 1),'Straight Jeans','feed exposes safe canonical Product identity');
select is((select size_label from public.get_following_feed(50,null) where activity_type='closet_shared' limit 1),'29','feed exposes the Fit Report size');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='f5200000-0000-4000-8000-000000000002';
set local request.jwt.claim.role='authenticated';
insert into public.fit_reports(id,user_id,closet_item_id,product_id,fit_profile_version_id,size_label,fit,fit_notes,would_buy_again)
select 'f5240000-0000-4000-8000-000000000003'::uuid,'f5200000-0000-4000-8000-000000000002'::uuid,'f5230000-0000-4000-8000-000000000002'::uuid,'f5220000-0000-4000-8000-000000000001'::uuid,current_version_id,'29','just_right','Fit better on the second try',true
from public.fit_profiles where user_id='f5200000-0000-4000-8000-000000000002'::uuid;
reset role;

set local role authenticated;
set local request.jwt.claim.sub='f5200000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
select is((select count(*) from public.get_following_feed(50,null) where activity_type='fit_report_added'),1::bigint,'later Fit Report on the same garment creates one re-try-on feed event');
select is((select count(*) from public.get_following_feed(50,null)),2::bigint,'Following Feed contains first-share plus re-try-on garment activity');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='f5200000-0000-4000-8000-000000000002';
set local request.jwt.claim.role='authenticated';
select public.create_outfit_post(
  'f5250000-0000-4000-8000-000000000001'::uuid,
  'Denim day',
  'f5200000-0000-4000-8000-000000000002/f5250000-0000-4000-8000-000000000001/outfit.jpg',
  array['f5230000-0000-4000-8000-000000000002'::uuid]
);
reset role;

set local role authenticated;
set local request.jwt.claim.sub='f5200000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
select is((select count(*) from public.get_following_feed(50,null) where activity_type='outfit_posted'),1::bigint,'published Outfit creates one Following Feed event');
insert into public.outfit_likes(post_id,user_id)
values('f5250000-0000-4000-8000-000000000001'::uuid,'f5200000-0000-4000-8000-000000000001'::uuid);
select is((select count(*) from public.get_following_feed(50,null)),3::bigint,'Outfit likes do not create Following Feed events');
delete from public.follows where follower_id='f5200000-0000-4000-8000-000000000001'::uuid and followed_id='f5200000-0000-4000-8000-000000000002'::uuid;
select is((select count(*) from public.get_following_feed(50,null)),0::bigint,'unfollow immediately removes that member from the personalized feed');
insert into public.follows(follower_id,followed_id)
values('f5200000-0000-4000-8000-000000000001'::uuid,'f5200000-0000-4000-8000-000000000002'::uuid);
select is((select count(*) from public.get_following_feed(50,null)),3::bigint,'refollow restores the currently visible canonical activity');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='f5200000-0000-4000-8000-000000000003';
set local request.jwt.claim.role='authenticated';
insert into public.closet_items(id,user_id,product_id,size_label,visibility,wears_count)
values('f5230000-0000-4000-8000-000000000003'::uuid,'f5200000-0000-4000-8000-000000000003'::uuid,'f5220000-0000-4000-8000-000000000001'::uuid,'31','shared',0);
insert into public.fit_reports(id,user_id,closet_item_id,product_id,fit_profile_version_id,size_label,fit)
select 'f5240000-0000-4000-8000-000000000004'::uuid,'f5200000-0000-4000-8000-000000000003'::uuid,'f5230000-0000-4000-8000-000000000003'::uuid,'f5220000-0000-4000-8000-000000000001'::uuid,current_version_id,'31','just_right'
from public.fit_profiles where user_id='f5200000-0000-4000-8000-000000000003'::uuid;
reset role;

set local role authenticated;
set local request.jwt.claim.sub='f5200000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
select is((select count(*) from public.get_following_feed(50,null) where actor_id='f5200000-0000-4000-8000-000000000003'::uuid),0::bigint,'unfollowed member activity is excluded');
insert into public.follows(follower_id,followed_id)
values('f5200000-0000-4000-8000-000000000001'::uuid,'f5200000-0000-4000-8000-000000000003'::uuid);
select is((select count(*) from public.get_following_feed(50,null) where actor_id='f5200000-0000-4000-8000-000000000003'::uuid),1::bigint,'following another member reveals their currently visible activity');
select public.block_member('f5200000-0000-4000-8000-000000000003'::uuid);
select is((select count(*) from public.get_following_feed(50,null) where actor_id='f5200000-0000-4000-8000-000000000003'::uuid),0::bigint,'blocking removes the member from signed-in Following discovery');
select throws_like(
  $$insert into public.follows(follower_id,followed_id) values('f5200000-0000-4000-8000-000000000001'::uuid,'f5200000-0000-4000-8000-000000000003'::uuid)$$,
  '%Blocked members cannot follow each other%',
  'blocked members cannot restore the Follow relationship'
);
reset role;

set local role authenticated;
set local request.jwt.claim.sub='f5200000-0000-4000-8000-000000000002';
set local request.jwt.claim.role='authenticated';
delete from public.fit_reports where id='f5240000-0000-4000-8000-000000000003'::uuid;
reset role;
set local role authenticated;
set local request.jwt.claim.sub='f5200000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
select is((select count(*) from public.get_following_feed(50,null)),2::bigint,'deleting a re-try-on removes its source-linked feed event');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='f5200000-0000-4000-8000-000000000002';
set local request.jwt.claim.role='authenticated';
delete from public.closet_items where id='f5230000-0000-4000-8000-000000000002'::uuid;
reset role;
set local role authenticated;
set local request.jwt.claim.sub='f5200000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
select is((select count(*) from public.get_following_feed(50,null)),1::bigint,'deleting the tagged Closet garment removes garment activity but leaves the published Outfit');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='f5200000-0000-4000-8000-000000000002';
set local request.jwt.claim.role='authenticated';
delete from public.outfit_posts where id='f5250000-0000-4000-8000-000000000001'::uuid;
reset role;
set local role authenticated;
set local request.jwt.claim.sub='f5200000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
select is((select count(*) from public.get_following_feed(50,null)),0::bigint,'deleting the Outfit removes its final Following Feed event');
reset role;

select * from finish();
rollback;

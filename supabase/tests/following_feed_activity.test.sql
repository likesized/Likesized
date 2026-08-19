begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, auth;

select plan(25);

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
select public.save_fit_profile('feed_other','metric','[{"measurement_type_key":"height","entered_value":180,"entered_unit":"cm","source":"manual","method":"tape"}]'::jsonb,'[]'::jsonb);
reset role;

insert into public.brands(id,name,slug,normalized_name)
values('f5210000-0000-4000-8000-000000000001'::uuid,'Feed Denim','feed-denim','feeddenim');
insert into public.products(id,brand_id,name,slug,category,normalized_name,garment_type_key,market_segment)
values('f5220000-0000-4000-8000-000000000001'::uuid,'f5210000-0000-4000-8000-000000000001'::uuid,'Straight Jeans','feed-denim-straight-jeans','bottoms','straightjeans','jeans','unisex');

-- A Private Closet report must never enter the viewer's Following Feed.
set local role authenticated;
set local request.jwt.claim.sub='f5200000-0000-4000-8000-000000000002';
set local request.jwt.claim.role='authenticated';
insert into public.closet_items(id,user_id,product_id,size_label,visibility,wears_count)
values('f5230000-0000-4000-8000-000000000001'::uuid,'f5200000-0000-4000-8000-000000000002'::uuid,'f5220000-0000-4000-8000-000000000001'::uuid,'29','private',0);
insert into public.fit_reports(id,user_id,closet_item_id,product_id,fit_profile_version_id,size_label,fit,fit_notes)
select 'f5240000-0000-4000-8000-000000000001'::uuid,'f5200000-0000-4000-8000-000000000002'::uuid,'f5230000-0000-4000-8000-000000000001'::uuid,'f5220000-0000-4000-8000-000000000001'::uuid,current_version_id,'29','just_right','Private evidence'
from public.fit_profiles where user_id='f5200000-0000-4000-8000-000000000002'::uuid;
reset role;
set local role authenticated;
set local request.jwt.claim.sub='f5200000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
select is((select count(*) from public.get_following_feed(50,null)),0::bigint,'Private Closet Fit Report creates no visible Following Feed activity');
reset role;

-- First Shared report is a Shared-garment activity; later report is a re-try-on.
set local role authenticated;
set local request.jwt.claim.sub='f5200000-0000-4000-8000-000000000002';
set local request.jwt.claim.role='authenticated';
insert into public.closet_items(id,user_id,product_id,size_label,visibility,wears_count)
values('f5230000-0000-4000-8000-000000000002'::uuid,'f5200000-0000-4000-8000-000000000002'::uuid,'f5220000-0000-4000-8000-000000000001'::uuid,'29','shared',0);
insert into public.fit_reports(id,user_id,closet_item_id,product_id,fit_profile_version_id,size_label,fit,fit_notes,would_buy_again)
select 'f5240000-0000-4000-8000-000000000002'::uuid,'f5200000-0000-4000-8000-000000000002'::uuid,'f5230000-0000-4000-8000-000000000002'::uuid,'f5220000-0000-4000-8000-000000000001'::uuid,current_version_id,'29','snug','Perfect waist, snug through thighs',true
from public.fit_profiles where user_id='f5200000-0000-4000-8000-000000000002'::uuid;
reset role;
set local role authenticated;
set local request.jwt.claim.sub='f5200000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
select is((select count(*) from public.get_following_feed(50,null) where activity_type='closet_shared'),1::bigint,'first Fit Report on a Shared garment creates one Shared-garment feed event');
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
select is((select count(*) from public.get_following_feed(50,null) where activity_type='fit_report_added'),1::bigint,'later Fit Report on a Shared garment creates one re-try-on feed event');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='f5200000-0000-4000-8000-000000000002';
set local request.jwt.claim.role='authenticated';
insert into public.outfit_posts(id,user_id,caption,photo_url)
values('f5250000-0000-4000-8000-000000000001'::uuid,'f5200000-0000-4000-8000-000000000002'::uuid,'Denim day','f5200000-0000-4000-8000-000000000002/f5250000-0000-4000-8000-000000000001/outfit.jpg');
reset role;
set local role authenticated;
set local request.jwt.claim.sub='f5200000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
select is((select count(*) from public.get_following_feed(50,null) where activity_type='outfit_posted'),1::bigint,'outfit post creates one Following Feed event');

insert into public.outfit_likes(post_id,user_id)
values('f5250000-0000-4000-8000-000000000001'::uuid,'f5200000-0000-4000-8000-000000000001'::uuid);
select is((select count(*) from public.get_following_feed(50,null)),3::bigint,'likes do not create Following Feed events');
reset role;

-- Unfollowed activity is excluded; following that member later proves the canonical event exists.
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
select is((select count(*) from public.get_following_feed(50,null) where actor_id='f5200000-0000-4000-8000-000000000003'::uuid),1::bigint,'following a member reveals their currently visible canonical activity');
delete from public.follows where follower_id='f5200000-0000-4000-8000-000000000001'::uuid and followed_id='f5200000-0000-4000-8000-000000000003'::uuid;
select is((select count(*) from public.get_following_feed(50,null) where actor_id='f5200000-0000-4000-8000-000000000003'::uuid),0::bigint,'unfollowing that member removes their activity again');

select is((select count(*) from public.get_following_feed(50,null)),3::bigint,'Following Feed returns the three meaningful events from the followed Fit Twin');
select is((select count(*) from public.get_following_feed(50,null) where activity_type='closet_shared'),1::bigint,'feed contains one Shared-garment event');
select is((select count(*) from public.get_following_feed(50,null) where activity_type='fit_report_added'),1::bigint,'feed contains one re-try-on event');
select is((select count(*) from public.get_following_feed(50,null) where activity_type='outfit_posted'),1::bigint,'feed contains one outfit event');
select is((select count(*) from public.get_following_feed(50,null) where closet_item_id='f5230000-0000-4000-8000-000000000001'::uuid),0::bigint,'Private Closet garment is absent from the feed');
select is((select relevant_match_category::text from public.get_following_feed(50,null) where activity_type='closet_shared' limit 1),'bottoms','bottom garment activity carries Bottoms match context');
select is((select product_name from public.get_following_feed(50,null) where activity_type='closet_shared' limit 1),'Straight Jeans','feed exposes safe canonical product identity');
select is((select size_label from public.get_following_feed(50,null) where activity_type='closet_shared' limit 1),'29','feed exposes the Shared Fit Report size');
reset role;

-- Private transition must immediately remove old garment activity from the safe feed.
set local role authenticated;
set local request.jwt.claim.sub='f5200000-0000-4000-8000-000000000002';
set local request.jwt.claim.role='authenticated';
update public.closet_items set visibility='private' where id='f5230000-0000-4000-8000-000000000002'::uuid;
reset role;
set local role authenticated;
set local request.jwt.claim.sub='f5200000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
select is((select count(*) from public.get_following_feed(50,null)),1::bigint,'after garment becomes Private only the followed outfit remains');
reset role;

-- Re-share creates one fresh Shared-garment event; old retry history does not resurface as activity.
set local role authenticated;
set local request.jwt.claim.sub='f5200000-0000-4000-8000-000000000002';
set local request.jwt.claim.role='authenticated';
update public.closet_items set visibility='shared' where id='f5230000-0000-4000-8000-000000000002'::uuid;
reset role;
set local role authenticated;
set local request.jwt.claim.sub='f5200000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
select is((select count(*) from public.get_following_feed(50,null)),2::bigint,'re-sharing adds one fresh Shared-garment event beside the outfit');
select is((select count(*) from public.get_following_feed(50,null) where closet_item_id='f5230000-0000-4000-8000-000000000002'::uuid and activity_type='fit_report_added'),0::bigint,'old re-try-on events do not resurrect after re-sharing');

delete from public.follows where follower_id='f5200000-0000-4000-8000-000000000001'::uuid and followed_id='f5200000-0000-4000-8000-000000000002'::uuid;
select is((select count(*) from public.get_following_feed(50,null)),0::bigint,'unfollow immediately removes the member from the personalized feed');
insert into public.follows(follower_id,followed_id)
values('f5200000-0000-4000-8000-000000000001'::uuid,'f5200000-0000-4000-8000-000000000002'::uuid);
select is((select count(*) from public.get_following_feed(50,null)),2::bigint,'refollow uses the same canonical relationship and restores currently visible activity');
reset role;

-- Source deletion cascades activity visibility.
set local role authenticated;
set local request.jwt.claim.sub='f5200000-0000-4000-8000-000000000002';
set local request.jwt.claim.role='authenticated';
delete from public.outfit_posts where id='f5250000-0000-4000-8000-000000000001'::uuid;
reset role;
set local role authenticated;
set local request.jwt.claim.sub='f5200000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
select is((select count(*) from public.get_following_feed(50,null)),1::bigint,'deleting the outfit removes its Following Feed event');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='f5200000-0000-4000-8000-000000000002';
set local request.jwt.claim.role='authenticated';
delete from public.closet_items where id='f5230000-0000-4000-8000-000000000002'::uuid;
reset role;
set local role authenticated;
set local request.jwt.claim.sub='f5200000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
select is((select count(*) from public.get_following_feed(50,null)),0::bigint,'deleting the Shared garment removes its feed activity');
reset role;

select ok(not has_function_privilege('anon','public.get_following_feed(integer,timestamptz)','EXECUTE'),'anonymous visitors cannot execute the Following Feed RPC');
select ok(not has_table_privilege('authenticated','private.following_activity_events','SELECT'),'authenticated members cannot query the private activity ledger directly');

select * from finish();
rollback;

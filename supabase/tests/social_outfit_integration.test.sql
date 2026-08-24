begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, auth;
select plan(29);

insert into auth.users(id,aud,role,email,created_at,updated_at)
values
  ('fb400000-0000-4000-8000-000000000001'::uuid,'authenticated','authenticated','social-viewer@likesized.test',now(),now()),
  ('fb400000-0000-4000-8000-000000000002'::uuid,'authenticated','authenticated','social-followed@likesized.test',now(),now()),
  ('fb400000-0000-4000-8000-000000000003'::uuid,'authenticated','authenticated','social-other@likesized.test',now(),now());

set local role authenticated;
set local request.jwt.claim.sub='fb400000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
select public.save_fit_profile('social_viewer','metric','[{"measurement_type_key":"height","entered_value":170,"entered_unit":"cm","source":"manual","method":"tape"},{"measurement_type_key":"natural_waist","entered_value":80,"entered_unit":"cm","source":"manual","method":"tape"}]'::jsonb,'[]'::jsonb);
insert into public.follows(follower_id,followed_id)
values('fb400000-0000-4000-8000-000000000001'::uuid,'fb400000-0000-4000-8000-000000000002'::uuid);
select is((select count(*) from public.get_following_notification_subscriptions()),0::bigint,'ordinary Follow does not silently opt into notifications');
select is(public.set_following_notification_subscription('fb400000-0000-4000-8000-000000000002'::uuid,true),true,'viewer can explicitly turn the followed-member bell on');
select is((select count(*) from public.get_following_notification_subscriptions()),1::bigint,'explicit bell stores one per-person subscription');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fb400000-0000-4000-8000-000000000002';
set local request.jwt.claim.role='authenticated';
select public.save_fit_profile('social_followed','metric','[{"measurement_type_key":"height","entered_value":171,"entered_unit":"cm","source":"manual","method":"tape"},{"measurement_type_key":"natural_waist","entered_value":81,"entered_unit":"cm","source":"manual","method":"tape"}]'::jsonb,'[]'::jsonb);
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fb400000-0000-4000-8000-000000000003';
set local request.jwt.claim.role='authenticated';
select public.save_fit_profile('social_other','metric','[{"measurement_type_key":"height","entered_value":178,"entered_unit":"cm","source":"manual","method":"tape"},{"measurement_type_key":"natural_waist","entered_value":88,"entered_unit":"cm","source":"manual","method":"tape"}]'::jsonb,'[]'::jsonb);
reset role;

insert into public.brands(id,name,slug,normalized_name)
values('fb410000-0000-4000-8000-000000000001'::uuid,'Social Denim','social-denim','socialdenim');
insert into public.products(id,brand_id,name,slug,category,normalized_name,garment_type_key,market_segment)
values('fb420000-0000-4000-8000-000000000001'::uuid,'fb410000-0000-4000-8000-000000000001'::uuid,'Social Jeans','social-denim-social-jeans','bottoms','socialjeans','jeans','unisex');

set local role authenticated;
set local request.jwt.claim.sub='fb400000-0000-4000-8000-000000000002';
set local request.jwt.claim.role='authenticated';
insert into public.closet_items(id,user_id,product_id,size_label,visibility,wears_count)
values
  ('fb430000-0000-4000-8000-000000000001'::uuid,'fb400000-0000-4000-8000-000000000002'::uuid,'fb420000-0000-4000-8000-000000000001'::uuid,'29','shared',0),
  ('fb430000-0000-4000-8000-000000000002'::uuid,'fb400000-0000-4000-8000-000000000002'::uuid,'fb420000-0000-4000-8000-000000000001'::uuid,'30','shared',0);
insert into public.fit_reports(id,user_id,closet_item_id,product_id,fit_profile_version_id,size_label,fit,fit_notes,created_at)
select 'fb440000-0000-4000-8000-000000000001'::uuid,'fb400000-0000-4000-8000-000000000002'::uuid,'fb430000-0000-4000-8000-000000000001'::uuid,'fb420000-0000-4000-8000-000000000001'::uuid,current_version_id,'29','snug','Initial visible fit',clock_timestamp()-interval '2 minutes'
from public.fit_profiles where user_id='fb400000-0000-4000-8000-000000000002'::uuid;
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fb400000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
select is((select count(*) from public.get_following_feed(50,null) where activity_type='closet_shared'),1::bigint,'first visible Fit Report reaches the followed-member Style Feed');
select is((select count(*) from public.get_fit_twin_activity_notifications(50,null)),1::bigint,'explicit bell receives the first visible garment notification');
select throws_like(
  $$select public.create_outfit_post('fb450000-0000-4000-8000-000000000009'::uuid,'Wrong owner','fb400000-0000-4000-8000-000000000001/fb450000-0000-4000-8000-000000000009/outfit.jpg',array['fb430000-0000-4000-8000-000000000001'::uuid])$$,
  '%Every tagged garment must belong to the current member%',
  'Outfit RPC cannot tag another member Closet item'
);
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fb400000-0000-4000-8000-000000000002';
set local request.jwt.claim.role='authenticated';
select throws_like(
  $$select public.create_outfit_post('fb450000-0000-4000-8000-000000000010'::uuid,'Missing report','fb400000-0000-4000-8000-000000000002/fb450000-0000-4000-8000-000000000010/outfit.jpg',array['fb430000-0000-4000-8000-000000000001'::uuid,'fb430000-0000-4000-8000-000000000002'::uuid])$$,
  '%Every tagged garment must have Fit Report evidence%',
  'Outfit creation rejects a selected garment without Fit Report evidence'
);
select is((select count(*) from public.outfit_posts where id='fb450000-0000-4000-8000-000000000010'::uuid),0::bigint,'failed Outfit transaction leaves no post behind');
select is(
  public.create_outfit_post(
    'fb450000-0000-4000-8000-000000000001'::uuid,
    'Followed Outfit',
    'fb400000-0000-4000-8000-000000000002/fb450000-0000-4000-8000-000000000001/outfit.jpg',
    array['fb430000-0000-4000-8000-000000000001'::uuid]
  ),
  'fb450000-0000-4000-8000-000000000001'::uuid,
  'valid compatibility creation returns the canonical Outfit id'
);
select is((select visibility::text from public.closet_items where id='fb430000-0000-4000-8000-000000000001'::uuid),'shared','posting an Outfit does not mutate the unified Closet visibility state');
select is((select count(*) from public.outfit_posts where id='fb450000-0000-4000-8000-000000000001'::uuid),1::bigint,'valid Outfit creation creates one published post');
select is((select count(*) from public.outfit_post_items where post_id='fb450000-0000-4000-8000-000000000001'::uuid),1::bigint,'valid Outfit creation stores one canonical garment relationship');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fb400000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
select is((select count(*) from public.get_following_feed(50,null)),2::bigint,'followed-member feed contains the garment activity and published Outfit');
select is((select count(*) from public.get_following_feed(50,null) where activity_type='outfit_posted'),1::bigint,'published Outfit contributes exactly one Outfit feed event');
select is((select count(*) from public.get_fit_twin_activity_notifications(50,null)),2::bigint,'bell-subscribed viewer receives garment plus Outfit notifications');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fb400000-0000-4000-8000-000000000003';
set local request.jwt.claim.role='authenticated';
insert into public.closet_items(id,user_id,product_id,size_label,visibility,wears_count)
values('fb430000-0000-4000-8000-000000000003'::uuid,'fb400000-0000-4000-8000-000000000003'::uuid,'fb420000-0000-4000-8000-000000000001'::uuid,'31','shared',0);
insert into public.fit_reports(id,user_id,closet_item_id,product_id,fit_profile_version_id,size_label,fit)
select 'fb440000-0000-4000-8000-000000000003'::uuid,'fb400000-0000-4000-8000-000000000003'::uuid,'fb430000-0000-4000-8000-000000000003'::uuid,'fb420000-0000-4000-8000-000000000001'::uuid,current_version_id,'31','just_right'
from public.fit_profiles where user_id='fb400000-0000-4000-8000-000000000003'::uuid;
select public.create_outfit_post(
  'fb450000-0000-4000-8000-000000000003'::uuid,
  'Other member Outfit',
  'fb400000-0000-4000-8000-000000000003/fb450000-0000-4000-8000-000000000003/outfit.jpg',
  array['fb430000-0000-4000-8000-000000000003'::uuid]
);
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fb400000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
select is((select count(*) from public.outfit_posts where status='published'),2::bigint,'overall Outfit discovery contains followed and unfollowed published posts');
select is((select count(*) from public.get_following_feed(50,null) where actor_id='fb400000-0000-4000-8000-000000000003'::uuid),0::bigint,'Following Feed excludes unfollowed member Outfit activity');
select is((select count(*) from public.get_fit_twin_activity_notifications(50,null) where actor_id='fb400000-0000-4000-8000-000000000003'::uuid),0::bigint,'person notifications exclude unfollowed member activity');
select lives_ok($$insert into public.outfit_likes(post_id,user_id) values('fb450000-0000-4000-8000-000000000001'::uuid,'fb400000-0000-4000-8000-000000000001'::uuid)$$,'member can like a visible published Outfit');
select throws_like(
  $$insert into public.outfit_likes(post_id,user_id) values('fb450000-0000-4000-8000-000000000001'::uuid,'fb400000-0000-4000-8000-000000000001'::uuid)$$,
  '%duplicate key value%',
  'same member cannot create duplicate Outfit likes'
);
select is((select like_count from public.outfit_posts where id='fb450000-0000-4000-8000-000000000001'::uuid),1,'public Outfit like counter follows the canonical like relationship');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fb400000-0000-4000-8000-000000000002';
set local request.jwt.claim.role='authenticated';
insert into public.fit_reports(id,user_id,closet_item_id,product_id,fit_profile_version_id,size_label,fit,fit_notes,created_at)
select 'fb440000-0000-4000-8000-000000000002'::uuid,'fb400000-0000-4000-8000-000000000002'::uuid,'fb430000-0000-4000-8000-000000000001'::uuid,'fb420000-0000-4000-8000-000000000001'::uuid,current_version_id,'29','relaxed','Latest visible fit',clock_timestamp()
from public.fit_profiles where user_id='fb400000-0000-4000-8000-000000000002'::uuid;
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fb400000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
select is((select count(*) from public.get_following_feed(50,null) where activity_type='fit_report_added'),1::bigint,'later Fit Report appears as one followed-member re-try-on event');
select is((select count(*) from public.get_fit_twin_activity_notifications(50,null) where activity_type='fit_report_added'),1::bigint,'later Fit Report creates one opted-in person notification');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fb400000-0000-4000-8000-000000000002';
set local request.jwt.claim.role='authenticated';
delete from public.outfit_posts where id='fb450000-0000-4000-8000-000000000001'::uuid;
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fb400000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
select is((select count(*) from public.outfit_likes where post_id='fb450000-0000-4000-8000-000000000001'::uuid),0::bigint,'Outfit deletion cascades its likes');
select is((select count(*) from public.get_following_feed(50,null) where activity_type='outfit_posted'),0::bigint,'Outfit deletion removes its Following Feed event');
select is((select count(*) from public.get_fit_twin_activity_notifications(50,null)),2::bigint,'deleting the Outfit removes its notification but preserves garment notifications');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fb400000-0000-4000-8000-000000000002';
set local request.jwt.claim.role='authenticated';
delete from public.closet_items where id='fb430000-0000-4000-8000-000000000001'::uuid;
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fb400000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
select is((select count(*) from public.get_following_feed(50,null)),0::bigint,'deleting the source Closet garment removes all remaining followed-member garment activity');
select is((select count(*) from public.get_fit_twin_activity_notifications(50,null)),0::bigint,'deleting the source Closet garment removes all remaining source-linked notifications');
reset role;

select ok(not has_function_privilege('anon','public.create_outfit_post(uuid,text,text,uuid[])','EXECUTE'),'anonymous visitors cannot execute Outfit creation');

select * from finish();
rollback;

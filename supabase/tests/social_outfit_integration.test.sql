begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, auth;

select plan(51);

insert into auth.users(id,aud,role,email,created_at,updated_at)
values
  ('fb400000-0000-4000-8000-000000000001'::uuid,'authenticated','authenticated','social-viewer@likesized.test',now(),now()),
  ('fb400000-0000-4000-8000-000000000002'::uuid,'authenticated','authenticated','social-followed@likesized.test',now(),now()),
  ('fb400000-0000-4000-8000-000000000003'::uuid,'authenticated','authenticated','social-other@likesized.test',now(),now());

set local role authenticated;
set local request.jwt.claim.sub='fb400000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
select public.save_fit_profile('social_viewer','metric','[{"measurement_type_key":"height","entered_value":170,"entered_unit":"cm","source":"manual","method":"tape"},{"measurement_type_key":"natural_waist","entered_value":80,"entered_unit":"cm","source":"manual","method":"tape"}]'::jsonb,'[]'::jsonb);
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
 ('fb430000-0000-4000-8000-000000000001'::uuid,'fb400000-0000-4000-8000-000000000002'::uuid,'fb420000-0000-4000-8000-000000000001'::uuid,'29','private',0),
 ('fb430000-0000-4000-8000-000000000002'::uuid,'fb400000-0000-4000-8000-000000000002'::uuid,'fb420000-0000-4000-8000-000000000001'::uuid,'30','private',0);
insert into public.fit_reports(id,user_id,closet_item_id,product_id,fit_profile_version_id,size_label,fit,fit_notes,created_at)
select 'fb440000-0000-4000-8000-000000000001'::uuid,'fb400000-0000-4000-8000-000000000002'::uuid,'fb430000-0000-4000-8000-000000000001'::uuid,'fb420000-0000-4000-8000-000000000001'::uuid,current_version_id,'29','snug','Initial private fit',clock_timestamp()-interval '2 minutes'
from public.fit_profiles where user_id='fb400000-0000-4000-8000-000000000002'::uuid;
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fb400000-0000-4000-8000-000000000003';
set local request.jwt.claim.role='authenticated';
insert into public.closet_items(id,user_id,product_id,size_label,visibility,wears_count)
values('fb430000-0000-4000-8000-000000000003'::uuid,'fb400000-0000-4000-8000-000000000003'::uuid,'fb420000-0000-4000-8000-000000000001'::uuid,'31','shared',0);
insert into public.fit_reports(id,user_id,closet_item_id,product_id,fit_profile_version_id,size_label,fit,created_at)
select 'fb440000-0000-4000-8000-000000000003'::uuid,'fb400000-0000-4000-8000-000000000003'::uuid,'fb430000-0000-4000-8000-000000000003'::uuid,'fb420000-0000-4000-8000-000000000001'::uuid,current_version_id,'31','just_right',clock_timestamp()-interval '1 minute'
from public.fit_profiles where user_id='fb400000-0000-4000-8000-000000000003'::uuid;
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fb400000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
insert into public.follows(follower_id,followed_id)
values('fb400000-0000-4000-8000-000000000001'::uuid,'fb400000-0000-4000-8000-000000000002'::uuid);
select is((select count(*) from public.get_following_notification_subscriptions()),0::bigint,'Following alone does not opt the member into person notifications');
select is(public.set_following_notification_subscription('fb400000-0000-4000-8000-000000000002'::uuid,true),true,'explicit person-bell opt-in enables notifications for the followed member');
select throws_like(
 $$select public.create_outfit_post('fb450000-0000-4000-8000-000000000009'::uuid,null,'fb400000-0000-4000-8000-000000000001/fb450000-0000-4000-8000-000000000009/outfit.jpg',array['fb430000-0000-4000-8000-000000000001'::uuid])$$,
 '%Every tagged garment must belong to the current member%',
 'outfit RPC cannot tag another member Closet item'
);
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fb400000-0000-4000-8000-000000000002';
set local request.jwt.claim.role='authenticated';
select throws_like(
 $$select public.create_outfit_post('fb450000-0000-4000-8000-000000000010'::uuid,'Should roll back','fb400000-0000-4000-8000-000000000002/fb450000-0000-4000-8000-000000000010/outfit.jpg',array['fb430000-0000-4000-8000-000000000001'::uuid,'fb430000-0000-4000-8000-000000000002'::uuid])$$,
 '%Every tagged garment must have Fit Report evidence%',
 'atomic outfit creation rejects any selected garment without Fit Report evidence'
);
select is((select visibility::text from public.closet_items where id='fb430000-0000-4000-8000-000000000001'::uuid),'private','failed outfit transaction leaves previously Private valid garment Private');
select is((select count(*) from public.outfit_posts where id='fb450000-0000-4000-8000-000000000010'::uuid),0::bigint,'failed outfit transaction creates no outfit post');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fb400000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
select is((select count(*) from public.get_following_feed(50,null)),0::bigint,'failed outfit transaction creates no Following Feed activity');
select is((select count(*) from public.get_fit_twin_activity_notifications(50,null)),0::bigint,'failed outfit transaction creates no person notification');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fb400000-0000-4000-8000-000000000002';
set local request.jwt.claim.role='authenticated';
select is(
 public.create_outfit_post('fb450000-0000-4000-8000-000000000001'::uuid,'Followed outfit','fb400000-0000-4000-8000-000000000002/fb450000-0000-4000-8000-000000000001/outfit.jpg',array['fb430000-0000-4000-8000-000000000001'::uuid]),
 'fb450000-0000-4000-8000-000000000001'::uuid,
 'valid atomic outfit creation returns canonical post id'
);
select is((select visibility::text from public.closet_items where id='fb430000-0000-4000-8000-000000000001'::uuid),'shared','successful outfit tagging auto-shares previously Private garment');
select is((select count(*) from public.outfit_posts where id='fb450000-0000-4000-8000-000000000001'::uuid),1::bigint,'successful atomic outfit creation creates one post');
select is((select count(*) from public.outfit_post_items where post_id='fb450000-0000-4000-8000-000000000001'::uuid),1::bigint,'successful atomic outfit creation creates one garment tag');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fb400000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
select is((select count(*) from public.closet_items where id='fb430000-0000-4000-8000-000000000001'::uuid),1::bigint,'another member can read auto-shared Closet garment');
select is((select count(*) from public.fit_reports where closet_item_id='fb430000-0000-4000-8000-000000000001'::uuid),1::bigint,'another member can read auto-shared Shared Fit History');
select is((select count(*) from public.outfit_post_items where post_id='fb450000-0000-4000-8000-000000000001'::uuid),1::bigint,'another member can read outfit tag while garment is Shared');
select is((select count(*) from public.get_following_feed(50,null)),2::bigint,'auto-share plus outfit post produce the two locked meaningful followed activities');
select is((select count(*) from public.get_following_feed(50,null) where activity_type='closet_shared'),1::bigint,'Following Feed contains newly Shared garment activity');
select is((select count(*) from public.get_following_feed(50,null) where activity_type='outfit_posted'),1::bigint,'Following Feed contains new outfit activity');
select is((select count(*) from public.get_fit_twin_activity_notifications(50,null)),2::bigint,'explicitly subscribed followed member produces two person notifications for the two meaningful activities');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fb400000-0000-4000-8000-000000000003';
set local request.jwt.claim.role='authenticated';
select is(
 public.create_outfit_post('fb450000-0000-4000-8000-000000000003'::uuid,'Other member outfit','fb400000-0000-4000-8000-000000000003/fb450000-0000-4000-8000-000000000003/outfit.jpg',array['fb430000-0000-4000-8000-000000000003'::uuid]),
 'fb450000-0000-4000-8000-000000000003'::uuid,
 'unfollowed member can independently create a valid outfit'
);
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fb400000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
select is((select count(*) from public.outfit_posts),2::bigint,'All outfits surface contains both followed and unfollowed member posts');
select is((select count(*) from public.outfit_posts op where op.user_id in (select f.followed_id from public.follows f where f.follower_id='fb400000-0000-4000-8000-000000000001'::uuid)),1::bigint,'Following-based outfit filtering resolves only posts from followed members');
select is((select count(*) from public.get_following_feed(50,null) where actor_id='fb400000-0000-4000-8000-000000000003'::uuid),0::bigint,'Following Feed excludes unfollowed member outfit activity');
select is((select count(*) from public.get_fit_twin_activity_notifications(50,null) where actor_id='fb400000-0000-4000-8000-000000000003'::uuid),0::bigint,'notifications exclude unfollowed member outfit activity');
select lives_ok($$insert into public.outfit_likes(post_id,user_id) values('fb450000-0000-4000-8000-000000000001'::uuid,'fb400000-0000-4000-8000-000000000001'::uuid)$$,'member can like an outfit');
select is((select count(*) from public.outfit_likes where post_id='fb450000-0000-4000-8000-000000000001'::uuid),1::bigint,'one member creates one outfit like');
select throws_like(
 $$insert into public.outfit_likes(post_id,user_id) values('fb450000-0000-4000-8000-000000000001'::uuid,'fb400000-0000-4000-8000-000000000001'::uuid)$$,
 '%duplicate key value%',
 'duplicate like from same member is rejected'
);
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fb400000-0000-4000-8000-000000000003';
set local request.jwt.claim.role='authenticated';
select lives_ok($$delete from public.outfit_likes where post_id='fb450000-0000-4000-8000-000000000001'::uuid and user_id='fb400000-0000-4000-8000-000000000001'::uuid$$,'another member cannot remove someone else like but RLS filters the delete safely');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fb400000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
select is((select count(*) from public.outfit_likes where post_id='fb450000-0000-4000-8000-000000000001'::uuid),1::bigint,'cross-member unlike attempt leaves original like intact');
select is((select count(*) from public.get_following_feed(50,null)),2::bigint,'outfit like does not create Following Feed activity');
select is((select count(*) from public.get_fit_twin_activity_notifications(50,null)),2::bigint,'outfit like does not create a person notification');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fb400000-0000-4000-8000-000000000002';
set local request.jwt.claim.role='authenticated';
select lives_ok($$
 insert into public.fit_reports(id,user_id,closet_item_id,product_id,fit_profile_version_id,size_label,fit,fit_notes,created_at)
 select 'fb440000-0000-4000-8000-000000000002'::uuid,'fb400000-0000-4000-8000-000000000002'::uuid,'fb430000-0000-4000-8000-000000000001'::uuid,'fb420000-0000-4000-8000-000000000001'::uuid,current_version_id,'29','relaxed','Latest visible fit',clock_timestamp()
 from public.fit_profiles where user_id='fb400000-0000-4000-8000-000000000002'::uuid
$$,'Shared tagged garment can receive a later Fit Report observation');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fb400000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
select is((select count(*) from public.fit_reports where closet_item_id='fb430000-0000-4000-8000-000000000001'::uuid),2::bigint,'Shared Fit History exposes both immutable observations');
select is((select fit::text from public.fit_reports where closet_item_id='fb430000-0000-4000-8000-000000000001'::uuid order by created_at desc,id desc limit 1),'relaxed','outfit latest-visible-report selection resolves the newest observation');
select is((select count(*) from public.get_following_feed(50,null) where activity_type='fit_report_added'),1::bigint,'later Shared Fit Report appears as one Following Feed re-try-on event');
select is((select count(*) from public.get_fit_twin_activity_notifications(50,null) where activity_type='fit_report_added'),1::bigint,'later Shared Fit Report creates one opted-in person notification');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fb400000-0000-4000-8000-000000000002';
set local request.jwt.claim.role='authenticated';
select lives_ok($$update public.closet_items set visibility='private' where id='fb430000-0000-4000-8000-000000000001'::uuid$$,'owner can make tagged garment Private when no shared fit photo blocks it');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fb400000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
select is((select count(*) from public.closet_items where id='fb430000-0000-4000-8000-000000000001'::uuid),0::bigint,'Private tagged garment disappears from another member Closet access');
select is((select count(*) from public.fit_reports where closet_item_id='fb430000-0000-4000-8000-000000000001'::uuid),0::bigint,'Private transition removes Shared Fit History access');
select is((select count(*) from public.outfit_post_items where post_id='fb450000-0000-4000-8000-000000000001'::uuid),0::bigint,'Private transition hides the outfit garment tag from other members');
select is((select count(*) from public.outfit_posts where id='fb450000-0000-4000-8000-000000000001'::uuid),1::bigint,'outfit social post itself remains member-visible after a tagged garment becomes Private');
select is((select count(*) from public.outfit_likes where post_id='fb450000-0000-4000-8000-000000000001'::uuid),1::bigint,'outfit like remains attached to the still-visible outfit post');
select is((select count(*) from public.get_following_feed(50,null)),1::bigint,'Private transition removes garment activities but preserves followed outfit activity');
select is((select count(*) from public.get_fit_twin_activity_notifications(50,null)),1::bigint,'Private transition removes garment notifications but preserves the opted-in outfit notification');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fb400000-0000-4000-8000-000000000002';
set local request.jwt.claim.role='authenticated';
select lives_ok($$delete from public.outfit_posts where id='fb450000-0000-4000-8000-000000000001'::uuid$$,'outfit owner can delete the social post');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fb400000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
select is((select count(*) from public.outfit_posts where id='fb450000-0000-4000-8000-000000000001'::uuid),0::bigint,'deleted outfit is no longer visible');
select is((select count(*) from public.outfit_likes where post_id='fb450000-0000-4000-8000-000000000001'::uuid),0::bigint,'outfit deletion cascades likes');
select is((select count(*) from public.get_following_feed(50,null)),0::bigint,'outfit deletion removes final followed social activity from Following Feed');
select is((select count(*) from public.get_fit_twin_activity_notifications(50,null)),0::bigint,'outfit deletion removes final source-linked person notification');
select is((select count(*) from public.outfit_posts where id='fb450000-0000-4000-8000-000000000003'::uuid),1::bigint,'unrelated unfollowed member outfit remains intact');
reset role;

select ok(not has_function_privilege('anon','public.create_outfit_post(uuid,text,text,uuid[])','EXECUTE'),'anonymous visitors cannot execute atomic outfit creation');

select * from finish();
rollback;

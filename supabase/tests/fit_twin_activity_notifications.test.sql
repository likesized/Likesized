begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, auth;

select plan(51);

insert into auth.users(id,aud,role,email,created_at,updated_at)
values
  ('fa300000-0000-4000-8000-000000000001'::uuid,'authenticated','authenticated','notify-viewer-a@likesized.test',now(),now()),
  ('fa300000-0000-4000-8000-000000000002'::uuid,'authenticated','authenticated','notify-actor@likesized.test',now(),now()),
  ('fa300000-0000-4000-8000-000000000003'::uuid,'authenticated','authenticated','notify-viewer-c@likesized.test',now(),now());

set local role authenticated;
set local request.jwt.claim.sub='fa300000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
select public.save_fit_profile('notify_viewer_a','metric','[{"measurement_type_key":"height","entered_value":170,"entered_unit":"cm","source":"manual","method":"tape"},{"measurement_type_key":"natural_waist","entered_value":80,"entered_unit":"cm","source":"manual","method":"tape"}]'::jsonb,'[]'::jsonb);
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fa300000-0000-4000-8000-000000000002';
set local request.jwt.claim.role='authenticated';
select public.save_fit_profile('notify_actor','metric','[{"measurement_type_key":"height","entered_value":171,"entered_unit":"cm","source":"manual","method":"tape"},{"measurement_type_key":"natural_waist","entered_value":81,"entered_unit":"cm","source":"manual","method":"tape"}]'::jsonb,'[]'::jsonb);
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fa300000-0000-4000-8000-000000000003';
set local request.jwt.claim.role='authenticated';
select public.save_fit_profile('notify_viewer_c','metric','[{"measurement_type_key":"height","entered_value":172,"entered_unit":"cm","source":"manual","method":"tape"},{"measurement_type_key":"natural_waist","entered_value":82,"entered_unit":"cm","source":"manual","method":"tape"}]'::jsonb,'[]'::jsonb);
reset role;

insert into public.brands(id,name,slug,normalized_name)
values('fa310000-0000-4000-8000-000000000001'::uuid,'Notify Denim','notify-denim','notifydenim');
insert into public.products(id,brand_id,name,slug,category,normalized_name,garment_type_key,market_segment)
values('fa320000-0000-4000-8000-000000000001'::uuid,'fa310000-0000-4000-8000-000000000001'::uuid,'Notification Jeans','notify-denim-notification-jeans','bottoms','notificationjeans','jeans','unisex');

-- Following alone is feed-only and notifications default OFF.
set local role authenticated;
set local request.jwt.claim.sub='fa300000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
insert into public.follows(follower_id,followed_id)
values('fa300000-0000-4000-8000-000000000001'::uuid,'fa300000-0000-4000-8000-000000000002'::uuid);
select is((select fit_twin_activity_enabled from public.get_fit_twin_notification_settings()),false,'following notifications are OFF by default');
select is((select count(*) from public.get_following_notification_subscriptions()),0::bigint,'Follow alone does not create a notification subscription');
reset role;

-- Bell ON auto-follows, explicitly subscribes, and enables the master switch.
set local role authenticated;
set local request.jwt.claim.sub='fa300000-0000-4000-8000-000000000003';
set local request.jwt.claim.role='authenticated';
select is(public.set_following_notification_subscription('fa300000-0000-4000-8000-000000000002'::uuid,true),true,'notification bell can be turned on');
select is((select count(*) from public.follows where follower_id='fa300000-0000-4000-8000-000000000003'::uuid and followed_id='fa300000-0000-4000-8000-000000000002'::uuid),1::bigint,'bell ON auto-follows the member');
select is((select count(*) from public.get_following_notification_subscriptions() where followed_id='fa300000-0000-4000-8000-000000000002'::uuid),1::bigint,'bell ON stores explicit per-person notification subscription');
select is((select fit_twin_activity_enabled from public.get_fit_twin_notification_settings()),true,'bell ON enables the notification master switch');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fa300000-0000-4000-8000-000000000002';
set local request.jwt.claim.role='authenticated';
insert into public.closet_items(id,user_id,product_id,size_label,visibility,wears_count)
values('fa330000-0000-4000-8000-000000000001'::uuid,'fa300000-0000-4000-8000-000000000002'::uuid,'fa320000-0000-4000-8000-000000000001'::uuid,'29','shared',0);
insert into public.fit_reports(id,user_id,closet_item_id,product_id,fit_profile_version_id,size_label,fit,fit_notes,would_buy_again)
select 'fa340000-0000-4000-8000-000000000001'::uuid,'fa300000-0000-4000-8000-000000000002'::uuid,'fa330000-0000-4000-8000-000000000001'::uuid,'fa320000-0000-4000-8000-000000000001'::uuid,current_version_id,'29','snug','First notification fit report',true
from public.fit_profiles where user_id='fa300000-0000-4000-8000-000000000002'::uuid;
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fa300000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
select is((select count(*) from public.get_fit_twin_activity_notifications(50,null)),0::bigint,'Follow-only member receives no notification');
select is((select count(*) from public.get_following_feed(50,null) where activity_type='closet_shared'),1::bigint,'Follow-only member still receives the activity in Style Feed');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fa300000-0000-4000-8000-000000000003';
set local request.jwt.claim.role='authenticated';
select is((select count(*) from public.get_fit_twin_activity_notifications(50,null)),1::bigint,'bell-subscribed member receives the Shared garment notification');
select is(public.get_fit_twin_notification_unread_count(),1,'new bell-subscribed notification is unread');
select is((select product_name from public.get_fit_twin_activity_notifications(50,null) limit 1),'Notification Jeans','notification exposes safe canonical product identity');
select is(public.mark_fit_twin_notifications_read((select notification_id from public.get_fit_twin_activity_notifications(50,null) limit 1)),1,'member can mark one own notification read');
select is(public.get_fit_twin_notification_unread_count(),0,'marking notification read clears unread count');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fa300000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
select is(public.set_following_notification_subscription('fa300000-0000-4000-8000-000000000002'::uuid,true),true,'followed member can explicitly turn the bell on');
select is((select count(*) from public.get_following_notification_subscriptions()),1::bigint,'bell ON creates the subscription after an ordinary Follow');
select is((select fit_twin_activity_enabled from public.get_fit_twin_notification_settings()),true,'bell ON turns the master switch on for an existing Follow');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fa300000-0000-4000-8000-000000000002';
set local request.jwt.claim.role='authenticated';
insert into public.fit_reports(id,user_id,closet_item_id,product_id,fit_profile_version_id,size_label,fit,fit_notes)
select 'fa340000-0000-4000-8000-000000000002'::uuid,'fa300000-0000-4000-8000-000000000002'::uuid,'fa330000-0000-4000-8000-000000000001'::uuid,'fa320000-0000-4000-8000-000000000001'::uuid,current_version_id,'29','just_right','Second notification fit report'
from public.fit_profiles where user_id='fa300000-0000-4000-8000-000000000002'::uuid;
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fa300000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
select is((select count(*) from public.get_fit_twin_activity_notifications(50,null)),1::bigint,'newly bell-subscribed member receives future activity only');
select is(public.get_fit_twin_notification_unread_count(),1,'future bell notification is unread');
reset role;
set local role authenticated;
set local request.jwt.claim.sub='fa300000-0000-4000-8000-000000000003';
set local request.jwt.claim.role='authenticated';
select is((select count(*) from public.get_fit_twin_activity_notifications(50,null)),2::bigint,'continuously subscribed member receives second activity notification');
select is(public.get_fit_twin_notification_unread_count(),1,'read first notification stays read while second is unread');
reset role;

-- Bell OFF removes notifications only; Follow and feed remain.
set local role authenticated;
set local request.jwt.claim.sub='fa300000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
select is(public.set_following_notification_subscription('fa300000-0000-4000-8000-000000000002'::uuid,false),false,'notification bell can be turned off');
select is((select count(*) from public.get_following_notification_subscriptions()),0::bigint,'bell OFF removes the per-person subscription');
select is((select count(*) from public.follows where follower_id='fa300000-0000-4000-8000-000000000001'::uuid and followed_id='fa300000-0000-4000-8000-000000000002'::uuid),1::bigint,'bell OFF preserves the Follow relationship');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fa300000-0000-4000-8000-000000000002';
set local request.jwt.claim.role='authenticated';
insert into public.outfit_posts(id,user_id,caption,photo_url)
values('fa350000-0000-4000-8000-000000000001'::uuid,'fa300000-0000-4000-8000-000000000002'::uuid,'Notification outfit','fa300000-0000-4000-8000-000000000002/fa350000-0000-4000-8000-000000000001/outfit.jpg');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fa300000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
select is((select count(*) from public.get_fit_twin_activity_notifications(50,null)),1::bigint,'bell OFF suppresses future notifications');
select is((select count(*) from public.get_following_feed(50,null) where activity_type='outfit_posted'),1::bigint,'bell OFF does not remove activity from Style Feed');
reset role;
set local role authenticated;
set local request.jwt.claim.sub='fa300000-0000-4000-8000-000000000003';
set local request.jwt.claim.role='authenticated';
select is((select count(*) from public.get_fit_twin_activity_notifications(50,null)),3::bigint,'subscribed member receives outfit notification');
select is(public.get_fit_twin_notification_unread_count(),2,'second Fit Report and outfit remain unread');
reset role;

-- Global switch pauses selected bells without changing feed or subscription selection.
set local role authenticated;
set local request.jwt.claim.sub='fa300000-0000-4000-8000-000000000003';
set local request.jwt.claim.role='authenticated';
select is(public.set_fit_twin_activity_notifications(false),false,'member can globally pause following notifications');
select is((select fit_twin_activity_enabled from public.get_fit_twin_notification_settings()),false,'global pause state is readable by owner');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fa300000-0000-4000-8000-000000000002';
set local request.jwt.claim.role='authenticated';
insert into public.fit_reports(id,user_id,closet_item_id,product_id,fit_profile_version_id,size_label,fit,fit_notes)
select 'fa340000-0000-4000-8000-000000000003'::uuid,'fa300000-0000-4000-8000-000000000002'::uuid,'fa330000-0000-4000-8000-000000000001'::uuid,'fa320000-0000-4000-8000-000000000001'::uuid,current_version_id,'29','relaxed','Global pause fit report'
from public.fit_profiles where user_id='fa300000-0000-4000-8000-000000000002'::uuid;
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fa300000-0000-4000-8000-000000000003';
set local request.jwt.claim.role='authenticated';
select is((select count(*) from public.get_fit_twin_activity_notifications(50,null)),3::bigint,'global pause suppresses future notifications without deleting existing ones');
select is((select count(*) from public.get_following_feed(50,null) where activity_type='fit_report_added'),2::bigint,'global pause does not alter Style Feed activity');
select is(public.set_fit_twin_activity_notifications(true),true,'member can resume globally paused following notifications');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fa300000-0000-4000-8000-000000000002';
set local request.jwt.claim.role='authenticated';
insert into public.fit_reports(id,user_id,closet_item_id,product_id,fit_profile_version_id,size_label,fit,fit_notes)
select 'fa340000-0000-4000-8000-000000000004'::uuid,'fa300000-0000-4000-8000-000000000002'::uuid,'fa330000-0000-4000-8000-000000000001'::uuid,'fa320000-0000-4000-8000-000000000001'::uuid,current_version_id,'29','just_right','Notifications resumed'
from public.fit_profiles where user_id='fa300000-0000-4000-8000-000000000002'::uuid;
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fa300000-0000-4000-8000-000000000003';
set local request.jwt.claim.role='authenticated';
select is((select count(*) from public.get_fit_twin_activity_notifications(50,null)),4::bigint,'resumed master switch allows future subscribed notifications');
reset role;

-- Unfollow removes the bell subscription, but existing notifications stay until their source is removed.
set local role authenticated;
set local request.jwt.claim.sub='fa300000-0000-4000-8000-000000000003';
set local request.jwt.claim.role='authenticated';
delete from public.follows where follower_id='fa300000-0000-4000-8000-000000000003'::uuid and followed_id='fa300000-0000-4000-8000-000000000002'::uuid;
select is((select count(*) from public.get_following_notification_subscriptions()),0::bigint,'unfollow cascades the per-person notification subscription');
select is((select count(*) from public.get_fit_twin_activity_notifications(50,null)),4::bigint,'unfollow preserves existing notifications');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fa300000-0000-4000-8000-000000000002';
set local request.jwt.claim.role='authenticated';
insert into public.fit_reports(id,user_id,closet_item_id,product_id,fit_profile_version_id,size_label,fit,fit_notes)
select 'fa340000-0000-4000-8000-000000000005'::uuid,'fa300000-0000-4000-8000-000000000002'::uuid,'fa330000-0000-4000-8000-000000000001'::uuid,'fa320000-0000-4000-8000-000000000001'::uuid,current_version_id,'29','snug','After unfollow'
from public.fit_profiles where user_id='fa300000-0000-4000-8000-000000000002'::uuid;
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fa300000-0000-4000-8000-000000000003';
set local request.jwt.claim.role='authenticated';
select is((select count(*) from public.get_fit_twin_activity_notifications(50,null)),4::bigint,'unfollow stops future notifications');
select is(public.set_following_notification_subscription('fa300000-0000-4000-8000-000000000002'::uuid,true),true,'bell can be turned back on after unfollow');
select is((select count(*) from public.follows where follower_id='fa300000-0000-4000-8000-000000000003'::uuid and followed_id='fa300000-0000-4000-8000-000000000002'::uuid),1::bigint,'bell ON re-creates the Follow after unfollow');
select is((select count(*) from public.get_following_notification_subscriptions()),1::bigint,'bell ON re-creates the explicit subscription');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fa300000-0000-4000-8000-000000000002';
set local request.jwt.claim.role='authenticated';
insert into public.fit_reports(id,user_id,closet_item_id,product_id,fit_profile_version_id,size_label,fit,fit_notes)
select 'fa340000-0000-4000-8000-000000000006'::uuid,'fa300000-0000-4000-8000-000000000002'::uuid,'fa330000-0000-4000-8000-000000000001'::uuid,'fa320000-0000-4000-8000-000000000001'::uuid,current_version_id,'29','just_right','After bell refollow'
from public.fit_profiles where user_id='fa300000-0000-4000-8000-000000000002'::uuid;
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fa300000-0000-4000-8000-000000000003';
set local request.jwt.claim.role='authenticated';
select is((select count(*) from public.get_fit_twin_activity_notifications(50,null)),5::bigint,'bell-refollowed member receives future notifications again');
reset role;

-- Source privacy/deletion still removes notifications derived from that source.
set local role authenticated;
set local request.jwt.claim.sub='fa300000-0000-4000-8000-000000000002';
set local request.jwt.claim.role='authenticated';
update public.closet_items set visibility='private' where id='fa330000-0000-4000-8000-000000000001'::uuid;
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fa300000-0000-4000-8000-000000000003';
set local request.jwt.claim.role='authenticated';
select is((select count(*) from public.get_fit_twin_activity_notifications(50,null)),1::bigint,'making source garment Private removes old garment notifications and leaves unrelated outfit notification');
reset role;
set local role authenticated;
set local request.jwt.claim.sub='fa300000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
select is((select count(*) from public.get_fit_twin_activity_notifications(50,null)),0::bigint,'source privacy removal clears garment notifications for bell-off follower too');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fa300000-0000-4000-8000-000000000002';
set local request.jwt.claim.role='authenticated';
delete from public.outfit_posts where id='fa350000-0000-4000-8000-000000000001'::uuid;
reset role;
set local role authenticated;
set local request.jwt.claim.sub='fa300000-0000-4000-8000-000000000003';
set local request.jwt.claim.role='authenticated';
select is((select count(*) from public.get_fit_twin_activity_notifications(50,null)),0::bigint,'deleting source outfit removes its old notification');
reset role;

select ok(not has_function_privilege('anon','public.get_following_notification_subscriptions()','EXECUTE'),'anonymous visitors cannot list per-person notification subscriptions');
select ok(not has_function_privilege('anon','public.set_following_notification_subscription(uuid,boolean)','EXECUTE'),'anonymous visitors cannot change per-person notification subscriptions');
select ok(not has_function_privilege('anon','public.get_fit_twin_activity_notifications(integer,timestamptz)','EXECUTE'),'anonymous visitors cannot list following notifications');
select ok(not has_function_privilege('anon','public.set_fit_twin_activity_notifications(boolean)','EXECUTE'),'anonymous visitors cannot change global notification preference');
select ok(not has_function_privilege('anon','public.mark_fit_twin_notifications_read(uuid)','EXECUTE'),'anonymous visitors cannot mutate notification read state');
select ok(not has_table_privilege('authenticated','private.following_notification_subscriptions','SELECT'),'authenticated members cannot read private per-person notification subscriptions directly');
select ok(not has_table_privilege('authenticated','private.fit_twin_activity_notifications','SELECT'),'authenticated members cannot read the private notification ledger directly');
select ok(not has_table_privilege('authenticated','private.fit_twin_activity_notification_preferences','SELECT'),'authenticated members cannot read private global notification preferences directly');

select * from finish();
rollback;

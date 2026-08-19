begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, auth;

select plan(48);

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

set local role authenticated;
set local request.jwt.claim.sub='fa300000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
insert into public.follows(follower_id,followed_id)
values('fa300000-0000-4000-8000-000000000001'::uuid,'fa300000-0000-4000-8000-000000000002'::uuid);
select is((select fit_twin_activity_enabled from public.get_fit_twin_notification_settings()),true,'Fit Twin activity notifications are ON by default');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fa300000-0000-4000-8000-000000000003';
set local request.jwt.claim.role='authenticated';
insert into public.follows(follower_id,followed_id)
values('fa300000-0000-4000-8000-000000000003'::uuid,'fa300000-0000-4000-8000-000000000002'::uuid);
select is(public.set_fit_twin_activity_notifications(false),false,'global notification setting can be disabled');
select is((select fit_twin_activity_enabled from public.get_fit_twin_notification_settings()),false,'disabled global setting is persisted privately');
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
select is((select count(*) from public.get_fit_twin_activity_notifications(50,null)),1::bigint,'default-enabled follower receives Shared garment notification');
select is((select count(*) from public.get_fit_twin_activity_notifications(50,null) where activity_type='closet_shared'),1::bigint,'first Shared garment notification has closet_shared activity type');
select is(public.get_fit_twin_notification_unread_count(),1,'new notification is unread');
select is((select product_name from public.get_fit_twin_activity_notifications(50,null) limit 1),'Notification Jeans','notification exposes safe canonical product identity');
select is(public.mark_fit_twin_notifications_read((select notification_id from public.get_fit_twin_activity_notifications(50,null) limit 1)),1,'member can mark one own notification read');
select is(public.get_fit_twin_notification_unread_count(),0,'single-notification read clears unread count');
select is(public.mark_fit_twin_notifications_read((select notification_id from public.get_fit_twin_activity_notifications(50,null) limit 1)),0,'already-read notification is not counted twice');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fa300000-0000-4000-8000-000000000003';
set local request.jwt.claim.role='authenticated';
select is((select count(*) from public.get_fit_twin_activity_notifications(50,null)),0::bigint,'globally-disabled follower receives no notification');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fa300000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
select is(public.set_fit_twin_notification_mute('fa300000-0000-4000-8000-000000000002'::uuid,true),true,'member can mute a followed Fit Twin');
select is((select count(*) from public.get_fit_twin_notification_mutes() where followed_id='fa300000-0000-4000-8000-000000000002'::uuid),1::bigint,'per-Fit-Twin mute is stored privately');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fa300000-0000-4000-8000-000000000002';
set local request.jwt.claim.role='authenticated';
insert into public.fit_reports(id,user_id,closet_item_id,product_id,fit_profile_version_id,size_label,fit,fit_notes)
select 'fa340000-0000-4000-8000-000000000002'::uuid,'fa300000-0000-4000-8000-000000000002'::uuid,'fa330000-0000-4000-8000-000000000001'::uuid,'fa320000-0000-4000-8000-000000000001'::uuid,current_version_id,'29','just_right','Muted re-try-on'
from public.fit_profiles where user_id='fa300000-0000-4000-8000-000000000002'::uuid;
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fa300000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
select is((select count(*) from public.get_fit_twin_activity_notifications(50,null)),1::bigint,'muted Fit Twin future activity creates no new notification');
select is((select count(*) from public.get_following_feed(50,null) where activity_type='fit_report_added'),1::bigint,'per-Fit-Twin mute does not remove activity from Following Feed');
select is(public.set_fit_twin_notification_mute('fa300000-0000-4000-8000-000000000002'::uuid,false),false,'member can unmute a Fit Twin');
select is((select count(*) from public.get_fit_twin_notification_mutes()),0::bigint,'unmuting removes private mute state');
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
select is((select count(*) from public.get_fit_twin_activity_notifications(50,null)),2::bigint,'unmuted follower receives new outfit notification');
select is(public.get_fit_twin_notification_unread_count(),1,'new outfit notification increments unread count');
insert into public.outfit_likes(post_id,user_id)
values('fa350000-0000-4000-8000-000000000001'::uuid,'fa300000-0000-4000-8000-000000000001'::uuid);
select is((select count(*) from public.get_fit_twin_activity_notifications(50,null)),2::bigint,'likes do not generate Fit Twin activity notifications');
select is(public.set_fit_twin_activity_notifications(false),false,'member can globally disable future Fit Twin notifications');
select is((select fit_twin_activity_enabled from public.get_fit_twin_notification_settings()),false,'global OFF state is readable by owner');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fa300000-0000-4000-8000-000000000002';
set local request.jwt.claim.role='authenticated';
insert into public.fit_reports(id,user_id,closet_item_id,product_id,fit_profile_version_id,size_label,fit,fit_notes)
select 'fa340000-0000-4000-8000-000000000003'::uuid,'fa300000-0000-4000-8000-000000000002'::uuid,'fa330000-0000-4000-8000-000000000001'::uuid,'fa320000-0000-4000-8000-000000000001'::uuid,current_version_id,'29','relaxed','Global-off re-try-on'
from public.fit_profiles where user_id='fa300000-0000-4000-8000-000000000002'::uuid;
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fa300000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
select is((select count(*) from public.get_fit_twin_activity_notifications(50,null)),2::bigint,'global OFF suppresses future notifications without deleting existing ones');
select is((select count(*) from public.get_following_feed(50,null) where activity_type='fit_report_added'),2::bigint,'global notification OFF does not alter Following Feed');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fa300000-0000-4000-8000-000000000003';
set local request.jwt.claim.role='authenticated';
select is(public.set_fit_twin_activity_notifications(true),true,'globally-disabled second follower can re-enable notifications');
select is((select count(*) from public.get_fit_twin_activity_notifications(50,null)),0::bigint,'re-enabling does not backfill missed notifications');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fa300000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
select is(public.set_fit_twin_activity_notifications(true),true,'first follower can re-enable notifications');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fa300000-0000-4000-8000-000000000002';
set local request.jwt.claim.role='authenticated';
insert into public.fit_reports(id,user_id,closet_item_id,product_id,fit_profile_version_id,size_label,fit,fit_notes)
select 'fa340000-0000-4000-8000-000000000004'::uuid,'fa300000-0000-4000-8000-000000000002'::uuid,'fa330000-0000-4000-8000-000000000001'::uuid,'fa320000-0000-4000-8000-000000000001'::uuid,current_version_id,'29','just_right','Notifications back on'
from public.fit_profiles where user_id='fa300000-0000-4000-8000-000000000002'::uuid;
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fa300000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
select is((select count(*) from public.get_fit_twin_activity_notifications(50,null)),3::bigint,'re-enabled first follower receives future notification');
reset role;
set local role authenticated;
set local request.jwt.claim.sub='fa300000-0000-4000-8000-000000000003';
set local request.jwt.claim.role='authenticated';
select is((select count(*) from public.get_fit_twin_activity_notifications(50,null)),1::bigint,'re-enabled second follower receives future notification only');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fa300000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
delete from public.follows where follower_id='fa300000-0000-4000-8000-000000000001'::uuid and followed_id='fa300000-0000-4000-8000-000000000002'::uuid;
select is((select count(*) from public.get_fit_twin_activity_notifications(50,null)),3::bigint,'unfollow preserves existing notifications');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fa300000-0000-4000-8000-000000000002';
set local request.jwt.claim.role='authenticated';
insert into public.fit_reports(id,user_id,closet_item_id,product_id,fit_profile_version_id,size_label,fit,fit_notes)
select 'fa340000-0000-4000-8000-000000000005'::uuid,'fa300000-0000-4000-8000-000000000002'::uuid,'fa330000-0000-4000-8000-000000000001'::uuid,'fa320000-0000-4000-8000-000000000001'::uuid,current_version_id,'29','snug','After unfollow'
from public.fit_profiles where user_id='fa300000-0000-4000-8000-000000000002'::uuid;
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fa300000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
select is((select count(*) from public.get_fit_twin_activity_notifications(50,null)),3::bigint,'unfollow stops future notifications');
select throws_like(
  $$select public.set_fit_twin_notification_mute('fa300000-0000-4000-8000-000000000002'::uuid,true)$$,
  '%Fit Twin follow required%',
  'cannot create a per-Fit-Twin mute without an active follow'
);
insert into public.follows(follower_id,followed_id)
values('fa300000-0000-4000-8000-000000000001'::uuid,'fa300000-0000-4000-8000-000000000002'::uuid);
select is((select count(*) from public.get_fit_twin_notification_mutes()),0::bigint,'refollow starts unmuted after prior relationship ended');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fa300000-0000-4000-8000-000000000002';
set local request.jwt.claim.role='authenticated';
insert into public.fit_reports(id,user_id,closet_item_id,product_id,fit_profile_version_id,size_label,fit,fit_notes)
select 'fa340000-0000-4000-8000-000000000006'::uuid,'fa300000-0000-4000-8000-000000000002'::uuid,'fa330000-0000-4000-8000-000000000001'::uuid,'fa320000-0000-4000-8000-000000000001'::uuid,current_version_id,'29','just_right','After refollow'
from public.fit_profiles where user_id='fa300000-0000-4000-8000-000000000002'::uuid;
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fa300000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
select is((select count(*) from public.get_fit_twin_activity_notifications(50,null)),4::bigint,'refollow allows future notifications again');
reset role;
set local role authenticated;
set local request.jwt.claim.sub='fa300000-0000-4000-8000-000000000003';
set local request.jwt.claim.role='authenticated';
select is((select count(*) from public.get_fit_twin_activity_notifications(50,null)),3::bigint,'continuously-following enabled member receives each later notification');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fa300000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
select is(public.set_fit_twin_notification_mute('fa300000-0000-4000-8000-000000000002'::uuid,true),true,'mute can be set before testing follow-delete cleanup');
delete from public.follows where follower_id='fa300000-0000-4000-8000-000000000001'::uuid and followed_id='fa300000-0000-4000-8000-000000000002'::uuid;
insert into public.follows(follower_id,followed_id)
values('fa300000-0000-4000-8000-000000000001'::uuid,'fa300000-0000-4000-8000-000000000002'::uuid);
select is((select count(*) from public.get_fit_twin_notification_mutes()),0::bigint,'unfollow cascades per-Fit-Twin mute so refollow is not silently muted');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fa300000-0000-4000-8000-000000000002';
set local request.jwt.claim.role='authenticated';
update public.closet_items set visibility='private' where id='fa330000-0000-4000-8000-000000000001'::uuid;
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fa300000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
select is((select count(*) from public.get_fit_twin_activity_notifications(50,null)),1::bigint,'making source garment Private removes all of its old notifications and leaves unrelated outfit notification');
reset role;
set local role authenticated;
set local request.jwt.claim.sub='fa300000-0000-4000-8000-000000000003';
set local request.jwt.claim.role='authenticated';
select is((select count(*) from public.get_fit_twin_activity_notifications(50,null)),0::bigint,'source privacy removal also clears garment notifications for other recipients');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fa300000-0000-4000-8000-000000000002';
set local request.jwt.claim.role='authenticated';
delete from public.outfit_posts where id='fa350000-0000-4000-8000-000000000001'::uuid;
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fa300000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
select is((select count(*) from public.get_fit_twin_activity_notifications(50,null)),0::bigint,'deleting source outfit removes its old notification');
select is(public.get_fit_twin_notification_unread_count(),0,'source privacy/deletion leaves no stale unread notifications');
reset role;

select ok(not has_function_privilege('anon','public.get_fit_twin_activity_notifications(integer,timestamptz)','EXECUTE'),'anonymous visitors cannot list Fit Twin notifications');
select ok(not has_function_privilege('anon','public.set_fit_twin_activity_notifications(boolean)','EXECUTE'),'anonymous visitors cannot change global notification preference');
select ok(not has_function_privilege('anon','public.set_fit_twin_notification_mute(uuid,boolean)','EXECUTE'),'anonymous visitors cannot change Fit Twin mute state');
select ok(not has_function_privilege('anon','public.mark_fit_twin_notifications_read(uuid)','EXECUTE'),'anonymous visitors cannot mutate notification read state');
select ok(not has_table_privilege('authenticated','private.fit_twin_activity_notifications','SELECT'),'authenticated members cannot read the private notification ledger directly');
select ok(not has_table_privilege('authenticated','private.fit_twin_activity_notification_preferences','SELECT'),'authenticated members cannot read private global notification preferences directly');
select ok(not has_table_privilege('authenticated','private.fit_twin_notification_mutes','SELECT'),'authenticated members cannot read private Fit Twin mute state directly');

select * from finish();
rollback;
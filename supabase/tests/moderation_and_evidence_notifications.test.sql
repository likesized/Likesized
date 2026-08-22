begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions,auth;
select plan(13);

select has_table('public','content_reports','Content report queue exists');
select has_table('public','moderation_actions','Moderation audit exists');
select has_table('public','product_description_evidence','Member description evidence exists');
select has_table('public','product_evidence_notifications','Product evidence watches exist');
select isnt_empty('select 1 from pg_class where oid=''public.content_reports''::regclass and relrowsecurity','Content reports use RLS');
select isnt_empty('select 1 from pg_class where oid=''public.product_evidence_notifications''::regclass and relrowsecurity','Evidence watches use RLS');

insert into auth.users(id,aud,role,email,created_at,updated_at) values
('fb100000-0000-4000-8000-000000000001','authenticated','authenticated','owner@moderation.test',now(),now()),
('fb100000-0000-4000-8000-000000000002','authenticated','authenticated','actor@moderation.test',now(),now());
select ok(private.is_admin('fb100000-0000-4000-8000-000000000001'),'First account is bootstrapped as admin');
select ok(not private.is_admin('fb100000-0000-4000-8000-000000000002'),'Later accounts are not auto-promoted');

set local role authenticated;
set local request.jwt.claim.sub='fb100000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
select public.save_fit_profile('moderation_owner','metric','[{"measurement_type_key":"height","entered_value":170,"entered_unit":"cm","source":"manual","method":"tape"}]'::jsonb,'[]'::jsonb);
reset role;
set local role authenticated;
set local request.jwt.claim.sub='fb100000-0000-4000-8000-000000000002';
set local request.jwt.claim.role='authenticated';
select public.save_fit_profile('moderation_actor','metric','[{"measurement_type_key":"height","entered_value":171,"entered_unit":"cm","source":"manual","method":"tape"}]'::jsonb,'[]'::jsonb);
reset role;

insert into public.brands(id,name,slug) values('fb110000-0000-4000-8000-000000000001','Evidence Test','evidence-test');
insert into public.products(id,brand_id,name,slug,category,garment_type_key,market_segment)
values('fb120000-0000-4000-8000-000000000001','fb110000-0000-4000-8000-000000000001','Evidence Tee','evidence-test-tee','tops','t_shirt','unisex');

set local role authenticated;
set local request.jwt.claim.sub='fb100000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
insert into public.product_evidence_notifications(user_id,product_id)
values('fb100000-0000-4000-8000-000000000001','fb120000-0000-4000-8000-000000000001');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fb100000-0000-4000-8000-000000000002';
set local request.jwt.claim.role='authenticated';
select is((select count(*) from public.product_evidence_notifications),0::bigint,'Another member cannot read evidence watches');
insert into public.closet_items(id,user_id,product_id,size_label,visibility,wears_count)
values('fb130000-0000-4000-8000-000000000001','fb100000-0000-4000-8000-000000000002','fb120000-0000-4000-8000-000000000001','M','shared',0);
insert into public.fit_reports(id,user_id,closet_item_id,product_id,fit_profile_version_id,size_label,fit)
select 'fb140000-0000-4000-8000-000000000001','fb100000-0000-4000-8000-000000000002','fb130000-0000-4000-8000-000000000001','fb120000-0000-4000-8000-000000000001',current_version_id,'M','just_right'
from public.fit_profiles where user_id='fb100000-0000-4000-8000-000000000002';
insert into public.outfit_posts(id,user_id,caption,photo_url)
values('fb150000-0000-4000-8000-000000000001','fb100000-0000-4000-8000-000000000002','Reported outfit','fb100000-0000-4000-8000-000000000002/fb150000-0000-4000-8000-000000000001/display.webp');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fb100000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
select ok((select last_notified_at is not null from public.product_evidence_notifications where product_id='fb120000-0000-4000-8000-000000000001'),'A later Fit Report activates the requested notification');
select ok(public.report_content('outfit_post','fb150000-0000-4000-8000-000000000001','spam_or_scam',null) is not null,'Member can report supported shared photo content');
select is((select count(*) from public.content_reports where target_id='fb150000-0000-4000-8000-000000000001'),1::bigint,'Reporter can read the submitted report');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fb100000-0000-4000-8000-000000000002';
set local request.jwt.claim.role='authenticated';
select is((select count(*) from public.content_reports),0::bigint,'Reported non-admin cannot read another member report');
reset role;

select * from finish();
rollback;

begin;

create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions,auth;
select plan(4);

insert into auth.users(id,aud,role,email,created_at,updated_at)
values('c0000000-0000-4000-8000-000000000001'::uuid,'authenticated','authenticated','fit-dimension@likesized.test',now(),now());

set local role authenticated;
set local request.jwt.claim.sub='c0000000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
select public.save_fit_profile('fit_dimension_tester','metric','[{"measurement_type_key":"height","entered_value":175,"entered_unit":"cm","source":"manual","method":"tape"}]'::jsonb,'[]'::jsonb);
reset role;

insert into public.brands(id,name,slug,normalized_name)
values('c1000000-0000-4000-8000-000000000001'::uuid,'Dimension Test','dimension-test','dimensiontest');
insert into public.products(id,brand_id,name,slug,category,normalized_name,garment_type_key,market_segment)
values('c2000000-0000-4000-8000-000000000001'::uuid,'c1000000-0000-4000-8000-000000000001'::uuid,'Guard Jeans','dimension-test-guard-jeans','bottoms','guardjeans','jeans','unisex');
insert into public.closet_items(id,user_id,product_id,size_label,visibility)
values('c3000000-0000-4000-8000-000000000001'::uuid,'c0000000-0000-4000-8000-000000000001'::uuid,'c2000000-0000-4000-8000-000000000001'::uuid,'M','private');
insert into public.fit_reports(id,user_id,closet_item_id,product_id,fit_profile_version_id,size_label,fit)
select 'c4000000-0000-4000-8000-000000000001'::uuid,'c0000000-0000-4000-8000-000000000001'::uuid,'c3000000-0000-4000-8000-000000000001'::uuid,'c2000000-0000-4000-8000-000000000001'::uuid,current_version_id,'M','just_right'
from public.fit_profiles where user_id='c0000000-0000-4000-8000-000000000001'::uuid;

select lives_ok($$insert into public.fit_report_dimensions(fit_report_id,dimension_key,response_key) values('c4000000-0000-4000-8000-000000000001','waist','just_right')$$,'jeans accept a mapped waist response');
select dies_ok($$insert into public.fit_report_dimensions(fit_report_id,dimension_key,response_key) values('c4000000-0000-4000-8000-000000000001','chest','just_right')$$,'Fit dimension chest is not valid for garment type jeans','jeans reject an unmapped chest dimension');
select dies_ok($$insert into public.fit_report_dimensions(fit_report_id,dimension_key,response_key) values('c4000000-0000-4000-8000-000000000001','rise','too_tight')$$,'insert or update on table "fit_report_dimensions" violates foreign key constraint "fit_report_dimensions_dimension_key_response_key_fkey"','response keys remain controlled per dimension');
select is((select count(*) from public.fit_report_dimensions where fit_report_id='c4000000-0000-4000-8000-000000000001'::uuid),1::bigint,'only the valid controlled dimension remains');

select * from finish();
rollback;

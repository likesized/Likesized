begin;

create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions,auth,private;
select plan(23);

select has_table('public','catalog_candidates','Pending catalog candidates have one canonical table');
select has_table('public','garment_submissions','Unresolved member garments have one canonical submission table');
select has_table('public','catalog_review_flags','Catalog review reasons have one canonical flag table');
select has_table('public','catalog_resolution_actions','Catalog resolution actions have an audit table');

-- First account is the existing bootstrap-admin behavior; the next two are ordinary members.
insert into auth.users(id,aud,role,email,created_at,updated_at) values
('c9000000-0000-4000-8000-000000000001','authenticated','authenticated','catalog-admin@likesized.test',now(),now()),
('c9000000-0000-4000-8000-000000000002','authenticated','authenticated','catalog-a@likesized.test',now(),now()),
('c9000000-0000-4000-8000-000000000003','authenticated','authenticated','catalog-b@likesized.test',now(),now());
select ok(private.is_admin('c9000000-0000-4000-8000-000000000001'),'Explicit bootstrap admin boundary is available for catalog resolution');

insert into public.normalized_sizes(id,kind,normalized_key,display_label,sizing_system,alpha_size)
values('c9100000-0000-4000-8000-000000000001','alpha','test:alpha:m','M','test','M');

-- Member A gets an immutable body version and logs a garment with no canonical Product.
set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='c9000000-0000-4000-8000-000000000002';
select public.save_fit_profile(
  'catalog_a','imperial'::public.unit_system,
  '[{"measurement_type_key":"height","entered_value":68,"entered_unit":"in","source":"manual","method":"tape"}]'::jsonb,
  '[]'::jsonb
);
insert into public.closet_items(id,user_id,product_id,variant_id,size_label,normalized_size_id,visibility,wears_count)
values('c9200000-0000-4000-8000-000000000001','c9000000-0000-4000-8000-000000000002',null,null,'M','c9100000-0000-4000-8000-000000000001','shared',0);
insert into public.fit_reports(id,user_id,closet_item_id,product_id,variant_id,fit_profile_version_id,size_label,normalized_size_id,fit,garment_condition,reported_condition)
select 'c9300000-0000-4000-8000-000000000001','c9000000-0000-4000-8000-000000000002','c9200000-0000-4000-8000-000000000001',null,null,current_version_id,'M','c9100000-0000-4000-8000-000000000001','just_right','normal','new'
from public.fit_profiles where user_id='c9000000-0000-4000-8000-000000000002';
select public.record_pending_garment_submission(
  p_closet_item_id := 'c9200000-0000-4000-8000-000000000001',
  p_fit_report_id := 'c9300000-0000-4000-8000-000000000001',
  p_brand_text := 'Solid Ground Brand',
  p_model_text := 'Pending Tee',
  p_garment_type_key := 't_shirt',
  p_color_family_key := 'blue',
  p_normalized_size_id := 'c9100000-0000-4000-8000-000000000001',
  p_size_label := 'M'
);
reset role;

select is((select count(*) from public.catalog_candidates where normalized_brand='solidgroundbrand' and normalized_model='pendingtee' and garment_type_key='t_shirt'),1::bigint,'First unresolved Fit Report creates one pending candidate');
select is((select submission_count from public.catalog_candidates where normalized_brand='solidgroundbrand' and normalized_model='pendingtee' and garment_type_key='t_shirt'),1,'Candidate demand starts at one submission');
select is((select count(*) from public.products p join public.brands b on b.id=p.brand_id where b.normalized_name='solidgroundbrand' and p.normalized_name='pendingtee'),0::bigint,'Unresolved member intake does not create a canonical Product');

-- Member B enters an equivalent spelling form; normalization aggregates demand without destroying either submission.
set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='c9000000-0000-4000-8000-000000000003';
select public.save_fit_profile(
  'catalog_b','imperial'::public.unit_system,
  '[{"measurement_type_key":"height","entered_value":70,"entered_unit":"in","source":"manual","method":"tape"}]'::jsonb,
  '[]'::jsonb
);
insert into public.closet_items(id,user_id,product_id,variant_id,size_label,normalized_size_id,visibility,wears_count)
values('c9200000-0000-4000-8000-000000000002','c9000000-0000-4000-8000-000000000003',null,null,'M','c9100000-0000-4000-8000-000000000001','shared',0);
insert into public.fit_reports(id,user_id,closet_item_id,product_id,variant_id,fit_profile_version_id,size_label,normalized_size_id,fit,garment_condition,reported_condition)
select 'c9300000-0000-4000-8000-000000000002','c9000000-0000-4000-8000-000000000003','c9200000-0000-4000-8000-000000000002',null,null,current_version_id,'M','c9100000-0000-4000-8000-000000000001','snug','normal','used'
from public.fit_profiles where user_id='c9000000-0000-4000-8000-000000000003';
select public.record_pending_garment_submission(
  p_closet_item_id := 'c9200000-0000-4000-8000-000000000002',
  p_fit_report_id := 'c9300000-0000-4000-8000-000000000002',
  p_brand_text := 'solid-ground brand',
  p_model_text := 'Pending Tee',
  p_garment_type_key := 't_shirt',
  p_color_family_key := 'blue',
  p_normalized_size_id := 'c9100000-0000-4000-8000-000000000001',
  p_size_label := 'M'
);
reset role;

select is((select count(*) from public.catalog_candidates where normalized_brand='solidgroundbrand' and normalized_model='pendingtee' and garment_type_key='t_shirt'),1::bigint,'Equivalent unresolved submissions aggregate into one candidate');
select is((select submission_count from public.catalog_candidates where normalized_brand='solidgroundbrand' and normalized_model='pendingtee' and garment_type_key='t_shirt'),2,'Independent submissions increase candidate demand');
select is((select count(*) from public.garment_submissions where candidate_id=(select id from public.catalog_candidates where normalized_brand='solidgroundbrand' and normalized_model='pendingtee' and garment_type_key='t_shirt')),2::bigint,'Aggregation preserves both underlying garment submissions');

-- Ordinary members can read only their own pending submission and cannot see the admin candidate queue.
set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='c9000000-0000-4000-8000-000000000002';
select is((select count(*) from public.garment_submissions where user_id='c9000000-0000-4000-8000-000000000003'),0::bigint,'A member cannot read another member pending garment submission');
select is((select count(*) from public.catalog_candidates),0::bigint,'Ordinary members cannot read the admin catalog candidate queue');
select throws_like(
  $$select public.admin_map_catalog_candidate((select id from public.catalog_candidates where normalized_brand='solidgroundbrand' and normalized_model='pendingtee' and garment_type_key='t_shirt'),'c9500000-0000-4000-8000-000000000001','member should not resolve')$$,
  '%Admin required%',
  'Ordinary members cannot resolve catalog candidates'
);
reset role;

-- A reviewed canonical Product is created outside member intake, then the authorized resolver maps both historical submissions to it.
insert into public.brands(id,name,slug,normalized_name)
values('c9400000-0000-4000-8000-000000000001','Solid Ground Brand','solid-ground-brand','solidgroundbrand');
insert into public.products(id,brand_id,name,slug,category,normalized_name,garment_type_key,market_segment,catalog_status)
values('c9500000-0000-4000-8000-000000000001','c9400000-0000-4000-8000-000000000001','Pending Tee','solid-ground-brand-pending-tee','tops','pendingtee','t_shirt','unknown','verified');

set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='c9000000-0000-4000-8000-000000000001';
select is((select count(*) from public.catalog_candidates where normalized_brand='solidgroundbrand' and normalized_model='pendingtee'),1::bigint,'Admin can read the candidate queue');
select is((select count(*) from public.garment_submissions where candidate_id=(select id from public.catalog_candidates where normalized_brand='solidgroundbrand' and normalized_model='pendingtee')),2::bigint,'Admin can inspect all submissions behind a candidate');
select lives_ok(
  $$select public.admin_map_catalog_candidate((select id from public.catalog_candidates where normalized_brand='solidgroundbrand' and normalized_model='pendingtee' and garment_type_key='t_shirt'),'c9500000-0000-4000-8000-000000000001','Reviewed as the existing exact Product')$$,
  'Authorized admin can map a candidate to one canonical Product'
);
reset role;

select is((select status from public.catalog_candidates where normalized_brand='solidgroundbrand' and normalized_model='pendingtee' and garment_type_key='t_shirt'),'merged','Resolved candidate becomes Merged history rather than a second Product');
select is((select resolved_product_id from public.catalog_candidates where normalized_brand='solidgroundbrand' and normalized_model='pendingtee' and garment_type_key='t_shirt'),'c9500000-0000-4000-8000-000000000001'::uuid,'Candidate records the canonical Product it resolved to');
select is((select count(*) from public.closet_items where id in ('c9200000-0000-4000-8000-000000000001','c9200000-0000-4000-8000-000000000002') and product_id='c9500000-0000-4000-8000-000000000001'),2::bigint,'Resolution maps both Closet garments to the canonical Product');
select is((select count(*) from public.fit_reports where id in ('c9300000-0000-4000-8000-000000000001','c9300000-0000-4000-8000-000000000002') and product_id='c9500000-0000-4000-8000-000000000001'),2::bigint,'Resolution maps both Fit Reports without replacing them');
select is((select count(*) from public.garment_submissions where resolved_product_id='c9500000-0000-4000-8000-000000000001'),2::bigint,'Original garment submissions remain as resolved audit evidence');
select ok((select fit_profile_version_id=(select current_version_id from public.fit_profiles where user_id='c9000000-0000-4000-8000-000000000002') and fit='just_right'::public.fit_rating from public.fit_reports where id='c9300000-0000-4000-8000-000000000001'),'Candidate mapping preserves member A immutable body snapshot and Fit Result');
select ok((select fit_profile_version_id=(select current_version_id from public.fit_profiles where user_id='c9000000-0000-4000-8000-000000000003') and fit='snug'::public.fit_rating from public.fit_reports where id='c9300000-0000-4000-8000-000000000002'),'Candidate mapping preserves member B immutable body snapshot and Fit Result');
select is((select count(*) from public.catalog_resolution_actions where candidate_id=(select id from public.catalog_candidates where normalized_brand='solidgroundbrand' and normalized_model='pendingtee') and action='map_existing'),1::bigint,'Catalog mapping writes one accountable resolution audit action');
select is((select count(*) from public.products p join public.brands b on b.id=p.brand_id where b.normalized_name='solidgroundbrand' and p.normalized_name='pendingtee' and p.garment_type_key='t_shirt'),1::bigint,'Resolution leaves exactly one canonical Product identity');

select * from finish();
rollback;

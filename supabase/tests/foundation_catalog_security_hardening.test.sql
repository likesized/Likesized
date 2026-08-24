begin;

create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions,auth,private;
select plan(17);

-- First account preserves the bootstrap-admin behavior. Owner/other are ordinary members.
insert into auth.users(id,aud,role,email,created_at,updated_at) values
('fa000000-0000-4000-8000-000000000001','authenticated','authenticated','foundation-admin@likesized.test',now(),now()),
('fa000000-0000-4000-8000-000000000002','authenticated','authenticated','foundation-owner@likesized.test',now(),now()),
('fa000000-0000-4000-8000-000000000003','authenticated','authenticated','foundation-other@likesized.test',now(),now());
select ok(private.is_admin('fa000000-0000-4000-8000-000000000001'),'Foundation test has an explicit admin');
select ok(not private.is_admin('fa000000-0000-4000-8000-000000000002'),'Foundation evidence owner is not an admin');

set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='fa000000-0000-4000-8000-000000000002';
select public.save_fit_profile(
  'foundation_owner','imperial'::public.unit_system,
  '[{"measurement_type_key":"height","entered_value":68,"entered_unit":"in","source":"manual","method":"tape"}]'::jsonb,
  '[]'::jsonb
);
reset role;

set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='fa000000-0000-4000-8000-000000000003';
select public.save_fit_profile(
  'foundation_other','imperial'::public.unit_system,
  '[{"measurement_type_key":"height","entered_value":70,"entered_unit":"in","source":"manual","method":"tape"}]'::jsonb,
  '[]'::jsonb
);
reset role;

insert into public.normalized_sizes(id,kind,normalized_key,display_label,sizing_system,alpha_size)
values('fa100000-0000-4000-8000-000000000001','alpha','foundation:alpha:m','M','foundation','M');

insert into public.brands(id,name,slug,normalized_name)
values('fa200000-0000-4000-8000-000000000001','Foundation Brand','foundation-brand','foundationbrand');
insert into public.products(id,brand_id,name,slug,category,normalized_name,garment_type_key,market_segment,catalog_status)
values
('fa300000-0000-4000-8000-000000000001','fa200000-0000-4000-8000-000000000001','Foundation Tee','foundation-brand-foundation-tee','tops','foundationtee','t_shirt','unisex','provisional'),
('fa300000-0000-4000-8000-000000000002','fa200000-0000-4000-8000-000000000001','Foundation Tee Alt','foundation-brand-foundation-tee-alt','tops','foundationteealt','t_shirt','unisex','provisional');

-- A known Product Fit Report owns private label/tag evidence.
set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='fa000000-0000-4000-8000-000000000002';
insert into public.closet_items(id,user_id,product_id,size_label,normalized_size_id,visibility,wears_count)
values('fa400000-0000-4000-8000-000000000001','fa000000-0000-4000-8000-000000000002','fa300000-0000-4000-8000-000000000001','M','fa100000-0000-4000-8000-000000000001','shared',0);
insert into public.fit_reports(id,user_id,closet_item_id,product_id,fit_profile_version_id,size_label,normalized_size_id,fit,garment_condition,reported_condition)
select 'fa500000-0000-4000-8000-000000000001','fa000000-0000-4000-8000-000000000002','fa400000-0000-4000-8000-000000000001','fa300000-0000-4000-8000-000000000001',current_version_id,'M','fa100000-0000-4000-8000-000000000001','just_right','normal','new'
from public.fit_profiles where user_id='fa000000-0000-4000-8000-000000000002';

select lives_ok(
  $$insert into public.product_label_photo_evidence(product_id,fit_report_id,storage_path,submitted_by)
    values('fa300000-0000-4000-8000-000000000001','fa500000-0000-4000-8000-000000000001',
      'fa000000-0000-4000-8000-000000000002/labels/fa300000-0000-4000-8000-000000000001/fa500000-0000-4000-8000-000000000001/correct.jpg',
      'fa000000-0000-4000-8000-000000000002')$$,
  'Owner can attach a correctly scoped private label photo to the exact Product Fit Report'
);
select throws_like(
  $$insert into public.product_label_photo_evidence(product_id,fit_report_id,storage_path,submitted_by)
    values('fa300000-0000-4000-8000-000000000002','fa500000-0000-4000-8000-000000000001',
      'fa000000-0000-4000-8000-000000000002/labels/fa300000-0000-4000-8000-000000000002/fa500000-0000-4000-8000-000000000001/wrong-product.jpg',
      'fa000000-0000-4000-8000-000000000002')$$,
  '%row-level security%',
  'A crafted label insert cannot bind an owned Fit Report to the wrong Product'
);
reset role;

set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='fa000000-0000-4000-8000-000000000003';
select is((select count(*) from public.product_label_photo_evidence),0::bigint,'Another member cannot read private Product Label / Tag metadata');
reset role;

-- Seed one unresolved, non-Unconfirmed candidate with separate Product and Label objects.
-- The deferred candidate auto-promotion trigger will not fire before this test rolls back.
insert into public.closet_items(id,user_id,product_id,size_label,normalized_size_id,visibility,wears_count)
values('fa400000-0000-4000-8000-000000000010','fa000000-0000-4000-8000-000000000002',null,'M','fa100000-0000-4000-8000-000000000001','shared',0);
insert into public.fit_reports(id,user_id,closet_item_id,product_id,fit_profile_version_id,size_label,normalized_size_id,fit,garment_condition,reported_condition)
select 'fa500000-0000-4000-8000-000000000010','fa000000-0000-4000-8000-000000000002','fa400000-0000-4000-8000-000000000010',null,current_version_id,'M','fa100000-0000-4000-8000-000000000001','just_right','normal','new'
from public.fit_profiles where user_id='fa000000-0000-4000-8000-000000000002';
insert into public.catalog_candidates(
  id,identity_key,brand_text,normalized_brand,model_text,normalized_model,garment_type_key,status,source,identity_confidence
) values(
  'fa600000-0000-4000-8000-000000000010','scannerbrand|pendingtee|t_shirt','Scanner Brand','scannerbrand','Pending Tee','pendingtee','t_shirt','needs_review','member','provisional'
);
insert into public.garment_submissions(
  id,user_id,closet_item_id,fit_report_id,candidate_id,brand_text,normalized_brand,model_text,normalized_model,
  garment_type_key,color_family_key,normalized_size_id,size_label,product_photo_storage_path,product_label_photo_storage_path,identity_uncertain
) values(
  'fa700000-0000-4000-8000-000000000010','fa000000-0000-4000-8000-000000000002','fa400000-0000-4000-8000-000000000010','fa500000-0000-4000-8000-000000000010','fa600000-0000-4000-8000-000000000010',
  'Scanner Brand','scannerbrand','Pending Tee','pendingtee','t_shirt','blue','fa100000-0000-4000-8000-000000000001','M',
  'fa000000-0000-4000-8000-000000000002/pending/fa400000-0000-4000-8000-000000000010/product-photo.jpg',
  'fa000000-0000-4000-8000-000000000002/pending/fa400000-0000-4000-8000-000000000010/label-photo.jpg',false
);
insert into storage.objects(bucket_id,name,owner,owner_id) values
('catalog-submission-photos','fa000000-0000-4000-8000-000000000002/pending/fa400000-0000-4000-8000-000000000010/product-photo.jpg','fa000000-0000-4000-8000-000000000002','fa000000-0000-4000-8000-000000000002'),
('catalog-submission-photos','fa000000-0000-4000-8000-000000000002/pending/fa400000-0000-4000-8000-000000000010/label-photo.jpg','fa000000-0000-4000-8000-000000000002','fa000000-0000-4000-8000-000000000002');

set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='fa000000-0000-4000-8000-000000000003';
select is(
  (select count(*) from storage.objects where bucket_id='catalog-submission-photos' and name like 'fa000000-0000-4000-8000-000000000002/pending/fa400000-0000-4000-8000-000000000010/%'),
  1::bigint,
  'Another member can read eligible pending Product Photo evidence but not the private Label / Tag object'
);
select is(
  (select product_photo_storage_path from public.get_scan_match_image_source(null,'fa600000-0000-4000-8000-000000000010') limit 1),
  'fa000000-0000-4000-8000-000000000002/pending/fa400000-0000-4000-8000-000000000010/product-photo.jpg',
  'Direct scanner image lookup returns eligible pending Product Photo evidence'
);
reset role;

update public.catalog_candidates
set identity_confidence='unconfirmed',status='needs_review'
where id='fa600000-0000-4000-8000-000000000010';

set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='fa000000-0000-4000-8000-000000000003';
select is(
  (select count(*) from storage.objects where name='fa000000-0000-4000-8000-000000000002/pending/fa400000-0000-4000-8000-000000000010/product-photo.jpg'),
  0::bigint,
  'Unconfirmed candidate Product Photo storage is not readable by another member'
);
select is(
  (select count(*) from public.get_scan_match_image_source(null,'fa600000-0000-4000-8000-000000000010')),
  0::bigint,
  'A crafted direct scanner image RPC cannot expose an Unconfirmed candidate'
);
reset role;

set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='fa000000-0000-4000-8000-000000000002';
select is(
  (select count(*) from storage.objects where bucket_id='catalog-submission-photos' and name like 'fa000000-0000-4000-8000-000000000002/pending/fa400000-0000-4000-8000-000000000010/%'),
  2::bigint,
  'Evidence owner retains access to both private pending Product and Label objects'
);
reset role;

-- A SECURITY DEFINER pending submission cannot attach somebody else's storage prefix.
insert into public.closet_items(id,user_id,product_id,size_label,normalized_size_id,visibility,wears_count)
values('fa400000-0000-4000-8000-000000000020','fa000000-0000-4000-8000-000000000002',null,'M','fa100000-0000-4000-8000-000000000001','shared',0);
insert into public.fit_reports(id,user_id,closet_item_id,product_id,fit_profile_version_id,size_label,normalized_size_id,fit,garment_condition,reported_condition)
select 'fa500000-0000-4000-8000-000000000020','fa000000-0000-4000-8000-000000000002','fa400000-0000-4000-8000-000000000020',null,current_version_id,'M','fa100000-0000-4000-8000-000000000001','just_right','normal','new'
from public.fit_profiles where user_id='fa000000-0000-4000-8000-000000000002';
set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='fa000000-0000-4000-8000-000000000002';
select throws_like(
  $$select public.record_pending_garment_submission(
    p_closet_item_id := 'fa400000-0000-4000-8000-000000000020',
    p_fit_report_id := 'fa500000-0000-4000-8000-000000000020',
    p_brand_text := 'Path Guard Brand',
    p_model_text := 'Path Guard Tee',
    p_garment_type_key := 't_shirt',
    p_color_family_key := 'blue',
    p_normalized_size_id := 'fa100000-0000-4000-8000-000000000001',
    p_size_label := 'M',
    p_product_photo_storage_path := 'fa000000-0000-4000-8000-000000000003/pending/fa400000-0000-4000-8000-000000000020/product-stolen.jpg',
    p_identity_uncertain := true
  )$$,
  '%garment_submissions_product_photo_path_owner_check%',
  'Pending submission writer rejects a cross-user Product Photo storage path'
);
reset role;

-- Resolved candidate history must not permanently occupy the base identity key.
insert into public.catalog_candidates(
  id,identity_key,brand_text,normalized_brand,model_text,normalized_model,garment_type_key,status,source,identity_confidence
) values(
  'fa600000-0000-4000-8000-000000000030','foundationbrand|foundationtee|t_shirt','Foundation Brand','foundationbrand','Foundation Tee','foundationtee','t_shirt','needs_review','member','provisional'
);
update public.catalog_candidates
set status='merged',resolved_product_id='fa300000-0000-4000-8000-000000000001'
where id='fa600000-0000-4000-8000-000000000030';
select ok(
  (select identity_key like 'foundationbrand|foundationtee|t_shirt|resolved|%' from public.catalog_candidates where id='fa600000-0000-4000-8000-000000000030'),
  'Resolving a candidate archives its internal identity key while preserving the historical row'
);

insert into public.closet_items(id,user_id,product_id,size_label,normalized_size_id,visibility,wears_count)
values('fa400000-0000-4000-8000-000000000030','fa000000-0000-4000-8000-000000000002',null,'M','fa100000-0000-4000-8000-000000000001','shared',0);
insert into public.fit_reports(id,user_id,closet_item_id,product_id,fit_profile_version_id,size_label,normalized_size_id,fit,garment_condition,reported_condition)
select 'fa500000-0000-4000-8000-000000000030','fa000000-0000-4000-8000-000000000002','fa400000-0000-4000-8000-000000000030',null,current_version_id,'M','fa100000-0000-4000-8000-000000000001','snug','normal','used'
from public.fit_profiles where user_id='fa000000-0000-4000-8000-000000000002';

set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='fa000000-0000-4000-8000-000000000002';
select lives_ok(
  $$select public.record_pending_garment_submission(
    p_closet_item_id := 'fa400000-0000-4000-8000-000000000030',
    p_fit_report_id := 'fa500000-0000-4000-8000-000000000030',
    p_brand_text := 'Foundation Brand',
    p_model_text := 'Foundation Tee',
    p_garment_type_key := 't_shirt',
    p_color_family_key := 'blue',
    p_normalized_size_id := 'fa100000-0000-4000-8000-000000000001',
    p_size_label := 'M',
    p_identity_uncertain := true
  )$$,
  'A later uncertain submission can open a fresh unresolved case for an identity that has resolved history'
);
reset role;
select is(
  (select count(*) from public.catalog_candidates where normalized_brand='foundationbrand' and normalized_model='foundationtee' and garment_type_key='t_shirt'),
  2::bigint,
  'Resolved history and the fresh unresolved candidate coexist without duplicate live review cases'
);
select ok(
  (select resolved_product_id is null and identity_confidence='unconfirmed'::public.product_data_status and status='needs_review'
   from public.catalog_candidates where identity_key='foundationbrand|foundationtee|t_shirt'),
  'The fresh uncertain case stays unresolved, Unconfirmed, and in active review'
);

set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='fa000000-0000-4000-8000-000000000001';
select lives_ok(
  $$select public.admin_set_catalog_candidate_status(
    (select id from public.catalog_candidates where identity_key='foundationbrand|foundationtee|t_shirt'),
    'needs_more_evidence',
    'Need a clearer label photo'
  )$$,
  'Admin can park the fresh Unconfirmed case in Needs More Evidence'
);
reset role;
select is(
  (select action from public.catalog_resolution_actions where candidate_id=(select id from public.catalog_candidates where identity_key='foundationbrand|foundationtee|t_shirt') order by created_at desc,id desc limit 1),
  'mark_needs_more_evidence',
  'Needs More Evidence writes an accurate audit action instead of generic enrichment'
);

select * from finish();
rollback;

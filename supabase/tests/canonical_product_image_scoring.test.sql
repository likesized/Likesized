-- Roadmap 13A canonical Product-image scoring, selection, fallback and admin-lock safeguards.
begin;

create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions,auth,private;
select plan(22);

select has_function(
  'public','get_canonical_product_images',array['uuid[]','text[]'],
  'Canonical Product imagery has one bounded batch resolver'
);
select has_function(
  'public','admin_set_canonical_product_image',array['uuid','text','text','uuid','boolean','text'],
  'Admins have one audited Set/Lock Product-image RPC'
);
select has_function(
  'public','admin_unlock_canonical_product_image',array['uuid','text','text'],
  'Admins have one audited Product-image unlock RPC'
);
select has_function(
  'public','admin_set_fit_photo_canonical_eligibility',array['uuid','boolean','text'],
  'Admins have one audited Fit Photo eligibility RPC'
);
select is(
  (select fit_photo_replacement_margin from public.canonical_product_image_config where singleton),
  5::smallint,
  'Automatic Fit Photo replacement starts at the locked five-point margin'
);

insert into auth.users(id,aud,role,email,created_at,updated_at) values
('d1000000-0000-4000-8000-000000000001','authenticated','authenticated','image-admin@likesized.test',now(),now()),
('d1000000-0000-4000-8000-000000000002','authenticated','authenticated','image-member@likesized.test',now(),now());
select ok(private.is_admin('d1000000-0000-4000-8000-000000000001'),'Bootstrap admin boundary authorizes canonical Product-image controls');

insert into public.brands(id,name,slug,normalized_name)
values('d1100000-0000-4000-8000-000000000001','Image Test Brand','image-test-brand','imagetestbrand');

insert into public.products(id,brand_id,name,slug,category,normalized_name,garment_type_key,market_segment,catalog_status,image_url)
values
('d1200000-0000-4000-8000-000000000001','d1100000-0000-4000-8000-000000000001','Image Test Tee','image-test-brand-tee','tops','imagetesttee','t_shirt','unknown','verified','https://example.invalid/official-tee.webp'),
('d1200000-0000-4000-8000-000000000002','d1100000-0000-4000-8000-000000000001','Image Test Hoodie','image-test-brand-hoodie','tops','imagetesthoodie','hoodie','unknown','verified','https://example.invalid/official-hoodie.webp'),
('d1200000-0000-4000-8000-000000000003','d1100000-0000-4000-8000-000000000001','Image Test Polo','image-test-brand-polo','tops','imagetestpolo','polo','unknown','verified','https://example.invalid/official-polo.webp');

-- Official/imported imagery is the fallback when no eligible community image exists.
update public.products
set image_url='https://example.invalid/official-polo-v2.webp'
where id='d1200000-0000-4000-8000-000000000003';
select is(
  (select source_kind from public.canonical_product_images where product_id='d1200000-0000-4000-8000-000000000003' and variation_key is null),
  'official_product_image',
  'Official/imported Product imagery is selected only as the base fallback'
);

-- Product Photo evidence outranks official/imported fallback when no eligible Fit Photo exists.
insert into public.product_photo_evidence(id,product_id,storage_path,public_url,source_status)
values('d1300000-0000-4000-8000-000000000001','d1200000-0000-4000-8000-000000000002','roadmap13a/product.webp','https://example.invalid/community-product.webp','provisional');
select is(
  (select source_kind from public.canonical_product_images where product_id='d1200000-0000-4000-8000-000000000002' and variation_key is null),
  'product_photo_evidence',
  'Eligible Product Photo evidence outranks the official/imported fallback'
);

insert into public.closet_items(id,user_id,product_id,size_label) values
('d1400000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000002','d1200000-0000-4000-8000-000000000001','M'),
('d1400000-0000-4000-8000-000000000002','d1000000-0000-4000-8000-000000000002','d1200000-0000-4000-8000-000000000001','M'),
('d1400000-0000-4000-8000-000000000003','d1000000-0000-4000-8000-000000000002','d1200000-0000-4000-8000-000000000001','M'),
('d1400000-0000-4000-8000-000000000004','d1000000-0000-4000-8000-000000000002','d1200000-0000-4000-8000-000000000001','M'),
('d1400000-0000-4000-8000-000000000005','d1000000-0000-4000-8000-000000000002','d1200000-0000-4000-8000-000000000001','M'),
('d1400000-0000-4000-8000-000000000006','d1000000-0000-4000-8000-000000000002','d1200000-0000-4000-8000-000000000001','M');

-- All five component scores are equal so the generated deterministic weighted score is exact.
insert into public.fit_reference_photos(
  id,user_id,closet_item_id,storage_path,photo_role,
  garment_visibility_score,sharpness_score,resolution_score,framing_score,exposure_score,
  quality_source,quality_scored_at
) values(
  'd1500000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000002','d1400000-0000-4000-8000-000000000001','d1/base-70.webp','front',
  70,70,70,70,70,'automatic',now()
);
select is(
  (select photo_quality_score from public.fit_reference_photos where id='d1500000-0000-4000-8000-000000000001'),
  70::smallint,
  'Deterministic component weighting produces the stored 0-100 quality score'
);
select is(
  (select fit_reference_photo_id from public.canonical_product_images where product_id='d1200000-0000-4000-8000-000000000001' and variation_key is null),
  'd1500000-0000-4000-8000-000000000001'::uuid,
  'Eligible real-world Fit Photo outranks Product/official imagery'
);

-- A four-point improvement must not churn the canonical Fit Photo.
insert into public.fit_reference_photos(
  id,user_id,closet_item_id,storage_path,photo_role,
  garment_visibility_score,sharpness_score,resolution_score,framing_score,exposure_score,
  quality_source,quality_scored_at
) values(
  'd1500000-0000-4000-8000-000000000002','d1000000-0000-4000-8000-000000000002','d1400000-0000-4000-8000-000000000002','d1/plus-four.webp','front',
  74,74,74,74,74,'automatic',now()
);
select is(
  (select fit_reference_photo_id from public.canonical_product_images where product_id='d1200000-0000-4000-8000-000000000001' and variation_key is null),
  'd1500000-0000-4000-8000-000000000001'::uuid,
  'A Fit Photo less than five points better does not replace the current canonical image'
);

-- Exactly five points better replaces it.
insert into public.fit_reference_photos(
  id,user_id,closet_item_id,storage_path,photo_role,
  garment_visibility_score,sharpness_score,resolution_score,framing_score,exposure_score,
  quality_source,quality_scored_at
) values(
  'd1500000-0000-4000-8000-000000000003','d1000000-0000-4000-8000-000000000002','d1400000-0000-4000-8000-000000000003','d1/plus-five.webp','front',
  75,75,75,75,75,'automatic',now()
);
select is(
  (select fit_reference_photo_id from public.canonical_product_images where product_id='d1200000-0000-4000-8000-000000000001' and variation_key is null),
  'd1500000-0000-4000-8000-000000000003'::uuid,
  'A Fit Photo five points better replaces the current canonical image'
);

-- Ineligible and duplicate photos never compete even with stronger technical scores.
insert into public.fit_reference_photos(
  id,user_id,closet_item_id,storage_path,photo_role,
  garment_visibility_score,sharpness_score,resolution_score,framing_score,exposure_score,
  canonical_eligible,canonical_ineligible_reason,quality_source,quality_scored_at
) values(
  'd1500000-0000-4000-8000-000000000004','d1000000-0000-4000-8000-000000000002','d1400000-0000-4000-8000-000000000004','d1/ineligible.webp','front',
  100,100,100,100,100,false,'garment not usable for canonical display','admin',now()
);
insert into public.fit_reference_photos(
  id,user_id,closet_item_id,storage_path,photo_role,
  garment_visibility_score,sharpness_score,resolution_score,framing_score,exposure_score,
  duplicate_of,quality_source,quality_scored_at
) values(
  'd1500000-0000-4000-8000-000000000005','d1000000-0000-4000-8000-000000000002','d1400000-0000-4000-8000-000000000005','d1/duplicate.webp','front',
  100,100,100,100,100,'d1500000-0000-4000-8000-000000000003','admin',now()
);
select is(
  (select fit_reference_photo_id from public.canonical_product_images where product_id='d1200000-0000-4000-8000-000000000001' and variation_key is null),
  'd1500000-0000-4000-8000-000000000003'::uuid,
  'Ineligible and duplicate Fit Photos cannot displace the canonical image'
);

-- Ordinary members cannot use the admin override boundary.
set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='d1000000-0000-4000-8000-000000000002';
select throws_like(
  $$select public.admin_set_canonical_product_image('d1200000-0000-4000-8000-000000000001',null,'fit_reference_photo','d1500000-0000-4000-8000-000000000003',true,'member attempt')$$,
  '%Admin required%',
  'Ordinary members cannot set or lock canonical Product images'
);
reset role;

-- Admin lock wins even when a much better eligible photo arrives.
set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='d1000000-0000-4000-8000-000000000001';
select lives_ok(
  $$select public.admin_set_canonical_product_image('d1200000-0000-4000-8000-000000000001',null,'fit_reference_photo','d1500000-0000-4000-8000-000000000003',true,'Owner selected canonical image')$$,
  'Authorized admin can explicitly lock a canonical Product image'
);
reset role;

insert into public.fit_reference_photos(
  id,user_id,closet_item_id,storage_path,photo_role,
  garment_visibility_score,sharpness_score,resolution_score,framing_score,exposure_score,
  quality_source,quality_scored_at
) values(
  'd1500000-0000-4000-8000-000000000006','d1000000-0000-4000-8000-000000000002','d1400000-0000-4000-8000-000000000006','d1/best-95.webp','front',
  95,95,95,95,95,'automatic',now()
);
select ok(
  (select canonical_locked and fit_reference_photo_id='d1500000-0000-4000-8000-000000000003'::uuid
   from public.canonical_product_images where product_id='d1200000-0000-4000-8000-000000000001' and variation_key is null),
  'An admin-locked canonical image cannot be displaced by automatic scoring'
);

set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='d1000000-0000-4000-8000-000000000001';
select lives_ok(
  $$select public.admin_unlock_canonical_product_image('d1200000-0000-4000-8000-000000000001',null,'Return Product to automatic selection')$$,
  'Authorized admin can explicitly return a Product image to automatic selection'
);
reset role;
select ok(
  (select not canonical_locked and fit_reference_photo_id='d1500000-0000-4000-8000-000000000006'::uuid
   from public.canonical_product_images where product_id='d1200000-0000-4000-8000-000000000001' and variation_key is null),
  'Unlock immediately resumes automatic selection and chooses the stronger eligible image'
);

-- Exact tracked-variation rows override the Product-level winner; missing variations fall back to base.
insert into public.canonical_product_images(
  product_id,variation_key,source_kind,fit_reference_photo_id,photo_quality_score
) values(
  'd1200000-0000-4000-8000-000000000001','test_variation','fit_reference_photo','d1500000-0000-4000-8000-000000000003',75
);
select is(
  (select source_id from public.get_canonical_product_images(
    array['d1200000-0000-4000-8000-000000000001'::uuid],array['test_variation'::text]
  )),
  'd1500000-0000-4000-8000-000000000003'::uuid,
  'Exact tracked-variation selection wins over the broader Product canonical image'
);
select is(
  (select source_id from public.get_canonical_product_images(
    array['d1200000-0000-4000-8000-000000000001'::uuid],array['missing_variation'::text]
  )),
  'd1500000-0000-4000-8000-000000000006'::uuid,
  'A missing exact variation falls back to the broader Product canonical image'
);
select is(
  (select count(*) from public.get_canonical_product_images(
    array['d1200000-0000-4000-8000-000000000001'::uuid,'d1200000-0000-4000-8000-000000000002'::uuid,'d1200000-0000-4000-8000-000000000003'::uuid],null
  )),
  3::bigint,
  'One bounded resolver returns multiple Product images without per-Product RPC fan-out'
);
select throws_like(
  $$select * from public.get_canonical_product_images(array_fill('d1200000-0000-4000-8000-000000000001'::uuid,array[201]),null)$$,
  '%At most 200 Product images%',
  'The canonical image batch resolver enforces its scale boundary'
);

select * from finish();
rollback;
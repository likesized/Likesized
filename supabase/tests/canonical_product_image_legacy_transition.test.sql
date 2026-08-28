-- Roadmap 13A legacy-neutral bootstrap transition safeguards.
begin;

create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions,auth,private;
select plan(4);

insert into auth.users(id,aud,role,email,created_at,updated_at)
values('a1000000-0000-4000-8000-000000000001','authenticated','authenticated','legacy-image-owner@likesized.test',now(),now());

insert into public.brands(id,name,slug,normalized_name)
values('a1100000-0000-4000-8000-000000000001','Legacy Image Brand','legacy-image-brand','legacyimagebrand');

insert into public.products(id,brand_id,name,slug,category,normalized_name,garment_type_key,market_segment,catalog_status,image_url)
values('a1200000-0000-4000-8000-000000000001','a1100000-0000-4000-8000-000000000001','Legacy Image Tee','legacy-image-tee','tops','legacyimagetee','t_shirt','unknown','verified','https://example.invalid/legacy-image-fallback.webp');

insert into public.closet_items(id,user_id,product_id,size_label) values
('a1300000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000001','a1200000-0000-4000-8000-000000000001','M'),
('a1300000-0000-4000-8000-000000000002','a1000000-0000-4000-8000-000000000001','a1200000-0000-4000-8000-000000000001','M'),
('a1300000-0000-4000-8000-000000000003','a1000000-0000-4000-8000-000000000001','a1200000-0000-4000-8000-000000000001','M');

-- Legacy rows carry a synthetic neutral score used only to bootstrap pre-13A evidence.
insert into public.fit_reference_photos(
  id,user_id,closet_item_id,storage_path,photo_role,quality_source,quality_scored_at
) values(
  'a1400000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000001','a1300000-0000-4000-8000-000000000001','legacy/bootstrap.webp','front','legacy_neutral',now()
);
select is(
  (select photo_quality_score from public.fit_reference_photos where id='a1400000-0000-4000-8000-000000000001'),
  68::smallint,
  'Legacy-neutral bootstrap carries the expected synthetic score'
);
select is(
  (select fit_reference_photo_id from public.canonical_product_images where product_id='a1200000-0000-4000-8000-000000000001' and variation_key is null),
  'a1400000-0000-4000-8000-000000000001'::uuid,
  'Legacy-neutral Fit Photo may bootstrap canonical imagery before measured evidence exists'
);

-- A real measured 70 is only two points above the synthetic 68, but it must replace the
-- legacy bootstrap because the +5 anti-churn margin is meaningful only between measured photos.
insert into public.fit_reference_photos(
  id,user_id,closet_item_id,storage_path,photo_role,
  garment_visibility_score,sharpness_score,resolution_score,framing_score,exposure_score,
  quality_source,quality_scored_at
) values(
  'a1400000-0000-4000-8000-000000000002','a1000000-0000-4000-8000-000000000001','a1300000-0000-4000-8000-000000000002','legacy/measured-70.webp','front',
  70,70,70,70,70,'automatic',now()
);
select is(
  (select fit_reference_photo_id from public.canonical_product_images where product_id='a1200000-0000-4000-8000-000000000001' and variation_key is null),
  'a1400000-0000-4000-8000-000000000002'::uuid,
  'First eligible measured winner replaces a legacy-neutral bootstrap without a synthetic five-point hurdle'
);

-- Once a measured incumbent exists, the normal owner-locked +5 anti-churn margin resumes.
insert into public.fit_reference_photos(
  id,user_id,closet_item_id,storage_path,photo_role,
  garment_visibility_score,sharpness_score,resolution_score,framing_score,exposure_score,
  quality_source,quality_scored_at
) values(
  'a1400000-0000-4000-8000-000000000003','a1000000-0000-4000-8000-000000000001','a1300000-0000-4000-8000-000000000003','legacy/measured-74.webp','front',
  74,74,74,74,74,'automatic',now()
);
select is(
  (select fit_reference_photo_id from public.canonical_product_images where product_id='a1200000-0000-4000-8000-000000000001' and variation_key is null),
  'a1400000-0000-4000-8000-000000000002'::uuid,
  'Measured Fit Photo stays canonical when the challenger improves by fewer than five points'
);

select * from finish();
rollback;

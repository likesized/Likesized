-- Roadmap 13A perceptual duplicate behavior and privacy safeguards.
begin;

create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions,auth,private;
select plan(8);

select has_function(
  'public','record_fit_photo_perceptual_fingerprint',array['uuid','text'],
  'Fit Photo perceptual fingerprints have one owner-scoped registration boundary'
);
select has_table(
  'private','fit_photo_perceptual_fingerprints',
  'Perceptual fingerprints stay in the private schema'
);
select is(
  (select perceptual_duplicate_hamming_distance from public.canonical_product_image_config where singleton),
  5::smallint,
  'Perceptual duplicate matching starts at five dHash bits'
);

insert into auth.users(id,aud,role,email,created_at,updated_at) values
('e1000000-0000-4000-8000-000000000001','authenticated','authenticated','duplicate-owner@likesized.test',now(),now());

insert into public.brands(id,name,slug,normalized_name)
values('e1100000-0000-4000-8000-000000000001','Duplicate Test Brand','duplicate-test-brand','duplicatetestbrand');

insert into public.products(id,brand_id,name,slug,category,normalized_name,garment_type_key,market_segment,catalog_status,image_url)
values('e1200000-0000-4000-8000-000000000001','e1100000-0000-4000-8000-000000000001','Duplicate Test Tee','duplicate-test-brand-tee','tops','duplicatetesttee','t_shirt','unknown','verified','https://example.invalid/duplicate-fallback.webp');

insert into public.closet_items(id,user_id,product_id,size_label) values
('e1300000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000001','e1200000-0000-4000-8000-000000000001','M'),
('e1300000-0000-4000-8000-000000000002','e1000000-0000-4000-8000-000000000001','e1200000-0000-4000-8000-000000000001','M'),
('e1300000-0000-4000-8000-000000000003','e1000000-0000-4000-8000-000000000001','e1200000-0000-4000-8000-000000000001','M');

insert into public.fit_reference_photos(
  id,user_id,closet_item_id,storage_path,photo_role,
  garment_visibility_score,sharpness_score,resolution_score,framing_score,exposure_score,
  quality_source,quality_scored_at
) values
('e1400000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000001','e1300000-0000-4000-8000-000000000001','dup/base.webp','front',80,80,80,80,80,'automatic',now()),
('e1400000-0000-4000-8000-000000000002','e1000000-0000-4000-8000-000000000001','e1300000-0000-4000-8000-000000000002','dup/better-near.webp','front',90,90,90,90,90,'automatic',now()),
('e1400000-0000-4000-8000-000000000003','e1000000-0000-4000-8000-000000000001','e1300000-0000-4000-8000-000000000003','dup/different.webp','front',95,95,95,95,95,'automatic',now());

set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='e1000000-0000-4000-8000-000000000001';
select lives_ok(
  $$select public.record_fit_photo_perceptual_fingerprint('e1400000-0000-4000-8000-000000000001','0000000000000000000000000000000000000000000000000000000000000000')$$,
  'Owner may register the first private dHash fingerprint'
);
select lives_ok(
  $$select public.record_fit_photo_perceptual_fingerprint('e1400000-0000-4000-8000-000000000002','0000000000000000000000000000000000000000000000000000000000000001')$$,
  'A one-bit-near dHash is accepted and grouped perceptually'
);
reset role;

select ok(
  (select duplicate_of='e1400000-0000-4000-8000-000000000002'::uuid
   from public.fit_reference_photos where id='e1400000-0000-4000-8000-000000000001')
  and (select duplicate_of is null
       from public.fit_reference_photos where id='e1400000-0000-4000-8000-000000000002'),
  'The stronger near-duplicate becomes the representative and the weaker copy cannot compete'
);
select is(
  (select fit_reference_photo_id from public.canonical_product_images
   where product_id='e1200000-0000-4000-8000-000000000001' and variation_key is null),
  'e1400000-0000-4000-8000-000000000002'::uuid,
  'Canonical Product selection follows the stronger perceptual duplicate representative'
);

set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='e1000000-0000-4000-8000-000000000001';
select lives_ok(
  $$select public.record_fit_photo_perceptual_fingerprint('e1400000-0000-4000-8000-000000000003','1111111100000000111111110000000011111111000000001111111100000000')$$,
  'A perceptually different photo records independently'
);
select throws_like(
  $$select fingerprint from private.fit_photo_perceptual_fingerprints limit 1$$,
  '%permission denied%',
  'Ordinary members cannot read private perceptual fingerprints'
);
reset role;

select * from finish();
rollback;

-- Roadmap 13A: tracked-variation separation plus automatic eligibility gates.
begin;

create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions,auth,private;
select plan(5);

select is(
  length(private.current_tracked_variation_key('t_shirt','{"cropped":"yes","sleeve_length":"short"}'::jsonb)),
  64,
  'Tracked Product-image variation identity is a stable 64-character key'
);

select is(
  private.current_tracked_variation_key('t_shirt','{"cropped":"yes","sleeve_length":"short"}'::jsonb),
  private.current_tracked_variation_key('t_shirt','{"cropped":"yes","sleeve_length":"short","intended_fit":"oversized","shoe_use":"running"}'::jsonb),
  'Retired non-variation questions cannot alter the tracked Product-image variation key'
);

select isnt(
  private.current_tracked_variation_key('t_shirt','{"cropped":"yes","sleeve_length":"short"}'::jsonb),
  private.current_tracked_variation_key('t_shirt','{"cropped":"yes","sleeve_length":"long"}'::jsonb),
  'A current variation-defining answer changes the tracked Product-image variation key'
);

insert into auth.users(id,aud,role,email,created_at,updated_at) values
('e1000000-0000-4000-8000-000000000001','authenticated','authenticated','image-owner@likesized.test',now(),now()),
('e1000000-0000-4000-8000-000000000002','authenticated','authenticated','image-reporter@likesized.test',now(),now());

insert into public.brands(id,name,slug,normalized_name)
values('e1100000-0000-4000-8000-000000000001','Eligibility Brand','eligibility-brand','eligibilitybrand');

insert into public.products(id,brand_id,name,slug,category,normalized_name,garment_type_key,market_segment,catalog_status,image_url)
values
('e1200000-0000-4000-8000-000000000001','e1100000-0000-4000-8000-000000000001','Low Resolution Tee','eligibility-low-resolution-tee','tops','lowresolutiontee','t_shirt','unknown','verified','https://example.invalid/low-resolution-official.webp'),
('e1200000-0000-4000-8000-000000000002','e1100000-0000-4000-8000-000000000001','Reported Tee','eligibility-reported-tee','tops','reportedtee','t_shirt','unknown','verified','https://example.invalid/reported-official.webp');

insert into public.closet_items(id,user_id,product_id,size_label) values
('e1300000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000001','e1200000-0000-4000-8000-000000000001','M'),
('e1300000-0000-4000-8000-000000000002','e1000000-0000-4000-8000-000000000001','e1200000-0000-4000-8000-000000000002','M');

insert into public.fit_reference_photos(
  id,user_id,closet_item_id,storage_path,photo_role,
  garment_visibility_score,sharpness_score,resolution_score,framing_score,exposure_score,
  quality_source,quality_scored_at
) values(
  'e1400000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000001','e1300000-0000-4000-8000-000000000001','eligibility/low-resolution.webp','front',
  100,100,30,100,100,'automatic',now()
);

select is(
  (select source_kind from public.canonical_product_images where product_id='e1200000-0000-4000-8000-000000000001' and variation_key is null),
  'official_product_image',
  'Extremely low-resolution automatically scored Fit Photos are excluded from automatic Product-image selection'
);

insert into public.fit_reference_photos(
  id,user_id,closet_item_id,storage_path,photo_role,
  garment_visibility_score,sharpness_score,resolution_score,framing_score,exposure_score,
  quality_source,quality_scored_at
) values(
  'e1400000-0000-4000-8000-000000000002','e1000000-0000-4000-8000-000000000001','e1300000-0000-4000-8000-000000000002','eligibility/reported.webp','front',
  90,90,90,90,90,'automatic',now()
);

insert into public.content_reports(
  reporter_id,target_type,target_id,reported_user_id,reason,details
) values(
  'e1000000-0000-4000-8000-000000000002','fit_reference_photo','e1400000-0000-4000-8000-000000000002','e1000000-0000-4000-8000-000000000001','other','Roadmap 13A eligibility fixture'
);

select is(
  (select source_kind from public.canonical_product_images where product_id='e1200000-0000-4000-8000-000000000002' and variation_key is null),
  'official_product_image',
  'A Fit Photo with an open moderation report is removed from automatic Product-image selection'
);

select * from finish();
rollback;

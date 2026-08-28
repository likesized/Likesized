-- Roadmap 13A: member image resolution is safe; internal selection/audit rows stay admin-only.
begin;

create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions,auth,private;
select plan(3);

insert into auth.users(id,aud,role,email,created_at,updated_at) values
('f1000000-0000-4000-8000-000000000001','authenticated','authenticated','image-privacy-admin@likesized.test',now(),now()),
('f1000000-0000-4000-8000-000000000002','authenticated','authenticated','image-privacy-member@likesized.test',now(),now());

insert into public.brands(id,name,slug,normalized_name)
values('f1100000-0000-4000-8000-000000000001','Privacy Image Brand','privacy-image-brand','privacyimagebrand');
insert into public.products(id,brand_id,name,slug,category,normalized_name,garment_type_key,market_segment,catalog_status,image_url)
values('f1200000-0000-4000-8000-000000000001','f1100000-0000-4000-8000-000000000001','Privacy Image Tee','privacy-image-tee','tops','privacyimagetee','t_shirt','unknown','verified','https://example.invalid/privacy-image.webp');

do $$ begin
  perform private.recompute_canonical_product_images('f1200000-0000-4000-8000-000000000001'::uuid);
end $$;
insert into public.canonical_product_image_actions(admin_user_id,product_id,action,source_kind,reason)
values('f1000000-0000-4000-8000-000000000001','f1200000-0000-4000-8000-000000000001','set','official_product_image','privacy fixture');

set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='f1000000-0000-4000-8000-000000000002';

select is(
  (select count(*) from public.canonical_product_images),
  0::bigint,
  'Ordinary members cannot read internal canonical Product-image selection rows directly'
);
select is(
  (select count(*) from public.canonical_product_image_actions),
  0::bigint,
  'Ordinary members cannot read canonical Product-image audit rows'
);
select is(
  (select count(*) from public.get_canonical_product_images(array['f1200000-0000-4000-8000-000000000001'::uuid],null)),
  1::bigint,
  'Ordinary members resolve the safe canonical Product image through the bounded RPC'
);

reset role;
select * from finish();
rollback;

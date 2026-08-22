begin;

create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions,auth,private;
select plan(20);

select has_function('public','admin_dismiss_catalog_review_flag',array['uuid','text'],'Catalog flags have one audited admin dismissal RPC');
select has_function('public','admin_add_product_alias',array['uuid','text','text'],'Product aliases have one audited admin RPC');
select has_function('public','admin_add_brand_alias',array['uuid','text','text'],'Brand aliases have one audited admin RPC');
select has_function('public','admin_clear_pending_product_photo',array['uuid','text'],'Pending Product Photos have one audited admin DB-finalization RPC');
select has_function('public','admin_remove_product_photo_evidence',array['uuid','text'],'Canonical Product-photo evidence has one audited admin DB-finalization RPC');

insert into auth.users(id,aud,role,email,created_at,updated_at) values
('ca000000-0000-4000-8000-000000000001','authenticated','authenticated','admin-controls@likesized.test',now(),now()),
('ca000000-0000-4000-8000-000000000002','authenticated','authenticated','member-controls@likesized.test',now(),now());
select ok(private.is_admin('ca000000-0000-4000-8000-000000000001'),'Bootstrap admin boundary authorizes catalog operating controls');

insert into public.brands(id,name,slug,normalized_name)
values('ca100000-0000-4000-8000-000000000001','Control Brand','control-brand','controlbrand');
insert into public.products(id,brand_id,name,slug,category,normalized_name,garment_type_key,market_segment,catalog_status)
values('ca200000-0000-4000-8000-000000000001','ca100000-0000-4000-8000-000000000001','Control Tee','control-brand-control-tee','tops','controltee','t_shirt','unknown','verified');

set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='ca000000-0000-4000-8000-000000000002';
select throws_like(
  $$select public.admin_add_product_alias('ca200000-0000-4000-8000-000000000001','Control T-Shirt','member cannot add canonical alias')$$,
  '%Admin required%',
  'Ordinary members cannot use the reviewed Product-alias RPC'
);
select throws_like(
  $$insert into public.brand_aliases(brand_id,alias,normalized_alias) values('ca100000-0000-4000-8000-000000000001','ControlBrand','controlbrandalias')$$,
  '%permission denied%',
  'Ordinary members cannot bypass the reviewed Brand-alias RPC with direct table writes'
);
reset role;

set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='ca000000-0000-4000-8000-000000000001';
select lives_ok(
  $$select public.admin_add_product_alias('ca200000-0000-4000-8000-000000000001','Control T-Shirt','Reviewed alternate public model wording')$$,
  'Authorized admin can add a reviewed Product alias'
);
reset role;
select is((select count(*) from public.product_aliases where product_id='ca200000-0000-4000-8000-000000000001' and normalized_alias='controltshirt'),1::bigint,'Reviewed Product alias is stored once');
select is((select count(*) from public.catalog_resolution_actions where product_id='ca200000-0000-4000-8000-000000000001' and action='add_product_alias'),1::bigint,'Product alias creation writes an audit action');

set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='ca000000-0000-4000-8000-000000000001';
select lives_ok(
  $$select public.admin_add_brand_alias('ca100000-0000-4000-8000-000000000001','Control Co.','Reviewed alternate Brand wording')$$,
  'Authorized admin can add a reviewed Brand alias'
);
reset role;
select is((select count(*) from public.brand_aliases where brand_id='ca100000-0000-4000-8000-000000000001' and normalized_alias='controlco'),1::bigint,'Reviewed Brand alias is stored once');
select is((select count(*) from public.catalog_resolution_actions where action='add_brand_alias' and details->>'brand_id'='ca100000-0000-4000-8000-000000000001'),1::bigint,'Brand alias creation writes an audit action');

insert into public.catalog_review_flags(id,flag_type,product_id,details)
values('ca300000-0000-4000-8000-000000000001','possible_duplicate','ca200000-0000-4000-8000-000000000001','{"reason":"test false duplicate"}'::jsonb);
set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='ca000000-0000-4000-8000-000000000001';
select lives_ok(
  $$select public.admin_dismiss_catalog_review_flag('ca300000-0000-4000-8000-000000000001','Reviewed and confirmed distinct Product')$$,
  'Authorized admin can dismiss a false catalog flag'
);
reset role;
select is((select status from public.catalog_review_flags where id='ca300000-0000-4000-8000-000000000001'),'dismissed','Dismissed catalog flag remains as resolved history');
select is((select count(*) from public.catalog_resolution_actions where action='dismiss_flag' and details->>'flag_id'='ca300000-0000-4000-8000-000000000001'),1::bigint,'Flag dismissal writes an audit action');

insert into public.product_photo_evidence(id,product_id,storage_path,public_url,source_status)
values('ca400000-0000-4000-8000-000000000001','ca200000-0000-4000-8000-000000000001','ca/test-product.webp','https://example.invalid/test-product.webp','provisional');
set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='ca000000-0000-4000-8000-000000000001';
select lives_ok(
  $$select public.admin_remove_product_photo_evidence('ca400000-0000-4000-8000-000000000001','Photo violates Product Photo rules')$$,
  'Authorized admin can finalize removal of Product-photo evidence after storage deletion'
);
reset role;
select is((select count(*) from public.product_photo_evidence where id='ca400000-0000-4000-8000-000000000001'),0::bigint,'Removed Product-photo evidence no longer appears in the canonical photo evidence table');
select is((select count(*) from public.catalog_resolution_actions where product_id='ca200000-0000-4000-8000-000000000001' and action='remove_product_photo'),1::bigint,'Product-photo removal writes an audit action');

select * from finish();
rollback;

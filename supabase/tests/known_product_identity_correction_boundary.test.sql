begin;

create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions,auth,private;
select plan(7);

insert into auth.users(id,aud,role,email,created_at,updated_at)
values('fb000000-0000-4000-8000-000000000001','authenticated','authenticated','known-correction@likesized.test',now(),now());

insert into public.brands(id,name,slug,normalized_name)
values('fb100000-0000-4000-8000-000000000001','Correction Brand','correction-brand','correctionbrand');
insert into public.products(id,brand_id,name,slug,category,normalized_name,garment_type_key,market_segment,catalog_status)
values('fb200000-0000-4000-8000-000000000001','fb100000-0000-4000-8000-000000000001','Correction Tee','correction-brand-correction-tee','tops','correctiontee','t_shirt','unisex','provisional');

select ok(
  not has_function_privilege('authenticated','public.normalize_identifier(text)','execute'),
  'Authenticated members still cannot execute the general identifier-normalization helper directly'
);

set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='fb000000-0000-4000-8000-000000000001';

select lives_ok(
  $$select public.record_member_product_identity_issue(
    'fb200000-0000-4000-8000-000000000001','item_name','Correction Tee Revised'
  )$$,
  'A member can record a known Product Item-name correction without normalize_identifier permission'
);

select lives_ok(
  $$select public.record_member_product_identity_issue(
    'fb200000-0000-4000-8000-000000000001','brand_name','Correction Brand Revised'
  )$$,
  'A member can record a known Product Brand correction without normalize_identifier permission'
);

select lives_ok(
  $$select public.record_member_product_identity_issue(
    'fb200000-0000-4000-8000-000000000001','barcode','196-988323504'
  )$$,
  'The correction boundary validates a formatted barcode locally while the shared helper stays restricted'
);

reset role;

select is(
  (select count(*) from public.product_identity_evidence
   where product_id='fb200000-0000-4000-8000-000000000001'
     and submitted_by='fb000000-0000-4000-8000-000000000001'),
  3::bigint,
  'Each corrected identity field is preserved as separate provisional member evidence'
);

select is(
  (select p.name||'|'||b.name from public.products p join public.brands b on b.id=p.brand_id
   where p.id='fb200000-0000-4000-8000-000000000001'),
  'Correction Tee|Correction Brand',
  'Member correction evidence never silently overwrites canonical Product identity'
);

select ok(
  (select catalog_review_needed from public.products where id='fb200000-0000-4000-8000-000000000001'),
  'A conflicting Item/Brand correction marks the canonical Product for review'
);

select * from finish();
rollback;

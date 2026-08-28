begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, auth;

select plan(26);

-- The stale shared-Closet policy must be gone. Current V1 Closet rows are always shared,
-- so that policy would bypass the owner/published Outfit boundary for draft item links.
select is(
  (select count(*) from pg_policies
   where schemaname='public' and tablename='outfit_post_items'
     and policyname='members read shared outfit item links'),
  0::bigint,
  'stale shared-Closet Outfit item policy is removed'
);
select is(
  (select count(*) from pg_policies
   where schemaname='public' and tablename='outfit_post_items' and cmd='SELECT'
     and 'authenticated'::name=any(roles)),
  1::bigint,
  'authenticated Outfit item reads have one canonical policy'
);
select is(
  (select count(*) from pg_policies
   where schemaname='public' and tablename='outfit_posts' and cmd='SELECT'
     and 'authenticated'::name=any(roles)),
  1::bigint,
  'authenticated Outfit reads have one canonical policy'
);
select is(
  (select count(*) from pg_policies
   where schemaname='public' and tablename='outfit_photos' and cmd='SELECT'
     and 'authenticated'::name=any(roles)),
  1::bigint,
  'authenticated Outfit photo reads have one canonical policy'
);
select is(
  (select count(*) from pg_policies
   where schemaname='public' and tablename='outfit_occasions' and cmd='SELECT'
     and 'authenticated'::name=any(roles)),
  1::bigint,
  'authenticated Outfit occasion reads have one canonical policy'
);
select is(
  (select count(*) from pg_policies
   where schemaname='public' and tablename='outfit_style_tags' and cmd='SELECT'
     and 'authenticated'::name=any(roles)),
  1::bigint,
  'authenticated Outfit style-tag reads have one canonical policy'
);
select is(
  (select count(*) from pg_policies
   where schemaname='public' and tablename='outfit_comments' and cmd='SELECT'
     and 'authenticated'::name=any(roles)),
  1::bigint,
  'authenticated Outfit comment reads have one canonical policy'
);
select is(
  (select count(*) from pg_policies
   where schemaname='public' and tablename='outfit_comments' and cmd='DELETE'
     and 'authenticated'::name=any(roles)),
  1::bigint,
  'authenticated Outfit comment deletes have one canonical policy'
);
select is(
  (select count(*) from pg_policies
   where schemaname='public' and tablename='fit_reference_photos' and cmd='DELETE'
     and 'authenticated'::name=any(roles)),
  1::bigint,
  'authenticated Fit Photo deletes have one canonical owner-or-admin policy'
);
select is(
  (select count(*) from pg_policies
   where schemaname='public' and tablename='outfit_posts' and cmd='DELETE'
     and 'authenticated'::name=any(roles)),
  1::bigint,
  'authenticated Outfit deletes have one canonical owner-or-admin policy'
);

-- Anonymous SECURITY DEFINER exposure is deliberately restricted to the narrow published-
-- Outfit projection/counter allowlist. Raw Profile/Closet/Fit tables remain protected.
select is(
  (select array_agg(p.proname::text order by p.proname::text)
   from pg_proc p
   join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public'
     and p.prosecdef
     and has_function_privilege('anon',p.oid,'EXECUTE')),
  array[
    'get_outfit_comments_page',
    'get_outfit_comments_sorted_page',
    'get_public_outfit_comments',
    'get_public_outfit_creator',
    'get_public_outfit_hotspots',
    'get_public_outfit_product_teasers',
    'get_public_outfit_tagged_items',
    'record_outfit_share',
    'record_outfit_view'
  ]::text[],
  'anonymous SECURITY DEFINER exposure is limited to approved published-Outfit boundaries'
);
select is(
  (select count(*)
   from pg_proc p
   join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public' and p.prosecdef and p.proname like 'admin_%'
     and has_function_privilege('anon',p.oid,'EXECUTE')),
  0::bigint,
  'anonymous callers cannot execute public admin SECURITY DEFINER functions'
);
select is(
  (select bool_and(position('private.is_admin' in pg_get_functiondef(p.oid))>0)
   from pg_proc p
   join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public' and p.prosecdef and p.proname like 'admin_%'),
  true,
  'every public admin SECURITY DEFINER function enforces the private admin boundary'
);

-- Representative high-growth FK relationships have explicit covering indexes.
select ok(to_regclass('public.member_blocks_blocked_idx') is not null,
  'reverse block lookup has a covering index');
select ok(to_regclass('public.outfit_comments_user_idx') is not null,
  'Outfit comment author relationship has a covering index');
select ok(to_regclass('public.outfit_photo_tags_closet_item_idx') is not null,
  'Outfit hotspot Closet relationship has a covering index');
select ok(to_regclass('public.fit_reports_match_profile_version_idx') is not null,
  'Fit Report active Match snapshot relationship has a covering index');
select ok(to_regclass('private.following_activity_events_fit_report_idx') is not null,
  'following activity Fit Report relationship has a covering index');
select ok(to_regclass('public.catalog_candidates_resolved_product_idx') is not null,
  'catalog candidate resolved Product relationship has a covering index');
select ok(to_regclass('public.garment_submissions_resolved_product_idx') is not null,
  'garment submission resolved Product relationship has a covering index');

-- Behavioral proof for the repaired Outfit item-link boundary.
insert into auth.users(id,aud,role,email,created_at,updated_at)
values
  ('fa000000-0000-4000-8000-000000000001'::uuid,'authenticated','authenticated','advisor-a@likesized.test',now(),now()),
  ('fa000000-0000-4000-8000-000000000002'::uuid,'authenticated','authenticated','advisor-b@likesized.test',now(),now());

update public.profiles
set username='advisor_a',display_name='Advisor A'
where id='fa000000-0000-4000-8000-000000000001'::uuid;
update public.profiles
set username='advisor_b',display_name='Advisor B'
where id='fa000000-0000-4000-8000-000000000002'::uuid;

insert into public.brands(id,name,slug,normalized_name)
values('fa100000-0000-4000-8000-000000000001'::uuid,'Advisor Test','advisor-test','advisortest');
insert into public.products(id,brand_id,name,slug,category,normalized_name,garment_type_key,market_segment)
values(
  'fa200000-0000-4000-8000-000000000001'::uuid,
  'fa100000-0000-4000-8000-000000000001'::uuid,
  'Boundary Jeans','advisor-boundary-jeans','bottoms','boundaryjeans','jeans','unisex'
);
insert into public.closet_items(id,user_id,product_id,size_label,wears_count)
values(
  'fa300000-0000-4000-8000-000000000001'::uuid,
  'fa000000-0000-4000-8000-000000000001'::uuid,
  'fa200000-0000-4000-8000-000000000001'::uuid,
  'M',0
);
insert into public.outfit_posts(id,user_id,headline,status,comments_enabled)
values
  ('fa400000-0000-4000-8000-000000000001'::uuid,'fa000000-0000-4000-8000-000000000001'::uuid,'Draft boundary','draft',true),
  ('fa400000-0000-4000-8000-000000000002'::uuid,'fa000000-0000-4000-8000-000000000001'::uuid,'Published boundary','published',true);
insert into public.outfit_post_items(post_id,closet_item_id)
values
  ('fa400000-0000-4000-8000-000000000001'::uuid,'fa300000-0000-4000-8000-000000000001'::uuid),
  ('fa400000-0000-4000-8000-000000000002'::uuid,'fa300000-0000-4000-8000-000000000001'::uuid);

set local role authenticated;
set local request.jwt.claim.sub='fa000000-0000-4000-8000-000000000002';
set local request.jwt.claim.role='authenticated';
select is(
  (select count(*) from public.outfit_post_items
   where post_id in ('fa400000-0000-4000-8000-000000000001'::uuid,'fa400000-0000-4000-8000-000000000002'::uuid)),
  1::bigint,
  'another member sees the published Outfit item link but not the draft link'
);
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fa000000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
select is(
  (select count(*) from public.outfit_post_items
   where post_id in ('fa400000-0000-4000-8000-000000000001'::uuid,'fa400000-0000-4000-8000-000000000002'::uuid)),
  2::bigint,
  'Outfit owner still sees both draft and published garment links'
);
reset role;

set local request.jwt.claim.sub='';
set local request.jwt.claim.role='anon';
set local role anon;
select is(has_table_privilege('anon','public.outfit_post_items','SELECT'),false,
  'anonymous visitors still cannot directly read Outfit-to-Closet links');
select is(has_table_privilege('anon','public.profiles','SELECT'),false,
  'anonymous visitors still cannot directly read member profiles');
select is(
  (select username from public.get_public_outfit_creator('fa400000-0000-4000-8000-000000000002'::uuid)),
  'advisor_a',
  'published Outfit public creator projection still works'
);
select is(
  (select count(*) from public.get_public_outfit_creator('fa400000-0000-4000-8000-000000000001'::uuid)),
  0::bigint,
  'draft Outfit remains hidden from the public creator projection'
);
reset role;

select * from finish();
rollback;

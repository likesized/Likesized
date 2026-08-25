begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions,auth;
select plan(8);

select has_table('public','profile_locations','Private profile location table exists');
select has_column('public','profile_locations','city','Private profile location stores city');
select has_column('public','profile_locations','state_region','Private profile location stores canonical state code');
select ok((select relrowsecurity from pg_class where oid='public.profile_locations'::regclass),'Private profile location has RLS enabled');
select ok(not has_table_privilege('anon','public.profile_locations','SELECT'),'Anonymous users cannot read private profile location');
select ok(has_table_privilege('authenticated','public.profile_locations','SELECT'),'Authenticated role can reach owner-scoped location through RLS');
select ok(exists(
  select 1 from pg_constraint c
  where c.conrelid='public.profile_locations'::regclass
    and c.conname='profile_locations_state_region_code'
    and pg_get_constraintdef(c.oid) like '%NY%'
),'State is constrained to canonical postal codes');
select ok(exists(
  select 1 from pg_policies
  where schemaname='public' and tablename='profile_locations'
    and policyname='owner reads own profile location'
    and cmd='SELECT'
),'Owner-scoped location read policy exists');

select * from finish();
rollback;

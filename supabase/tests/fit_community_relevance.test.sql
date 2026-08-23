begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions,auth;
select plan(12);

select ok(exists(
  select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
  where n.nspname='public' and t.typname='fit_community'
),'Fit Community has one controlled database enum');

select is((
  select count(*) from pg_enum e join pg_type t on t.oid=e.enumtypid join pg_namespace n on n.oid=t.typnamespace
  where n.nspname='public' and t.typname='fit_community' and e.enumlabel in ('men','women','both')
),3::bigint,'Fit Community allows exactly Men, Women, and Both');

select has_column('public','fit_profiles','fit_community','Fit Profile owns the current Fit Community preference');
select is((select is_nullable from information_schema.columns where table_schema='public' and table_name='fit_profiles' and column_name='fit_community'),'NO','Fit Community is never null once stored');
select matches((select column_default from information_schema.columns where table_schema='public' and table_name='fit_profiles' and column_name='fit_community'),'both','Existing members default safely to Both');
select ok((select relrowsecurity from pg_class where oid='public.fit_profiles'::regclass),'Fit Community stays behind the owner-private Fit Profile RLS boundary');

select ok(exists(
  select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='save_fit_profile' and p.pronargs=6
    and pg_get_function_identity_arguments(p.oid) like '%p_fit_community fit_community%'
),'Atomic Fit Profile save accepts Fit Community');

select ok(exists(
  select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='get_fit_matches' and p.pronargs=3
    and pg_get_function_identity_arguments(p.oid) like '%p_fit_community fit_community%'
),'People matching supports an explicit Fit Community view override');

select ok(exists(
  select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='get_following_feed' and p.pronargs=3
    and pg_get_function_identity_arguments(p.oid) like '%p_fit_community fit_community%'
),'Following feed supports an explicit Fit Community view override');

select matches((
  select pg_get_functiondef(p.oid) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='private' and p.proname='calculate_fit_matches_for_profile_community'
),'fp.fit_community','Fit Community narrows candidate members without becoming Match math');

select matches((
  select pg_get_functiondef(p.oid) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='private' and p.proname='get_following_feed_for_current_user_community'
),'actor_fp.fit_community','Following relevance is tied to the posting member Fit Community');

select ok(position('department' in lower((
  select pg_get_functiondef(p.oid) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='private' and p.proname='get_following_feed_for_current_user_community'
)))=0,'Garment Department is not used as the member-community gate');

select * from finish();
rollback;

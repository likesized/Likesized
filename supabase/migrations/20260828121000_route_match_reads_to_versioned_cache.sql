-- Route existing list/discovery Match RPCs through the versioned bounded neighborhood cache.
-- Direct person pages use public.get_person_fit_match_cached(uuid) so an explicitly opened
-- profile is calculated exactly even when that person is outside the viewer's cached top list.

create or replace function public.get_fit_matches_batch(
  p_match_categories public.fit_match_category[],
  p_result_limit integer default 100,
  p_fit_community public.fit_community default null
)
returns table(
  match_category public.fit_match_category,
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  match_score integer,
  coverage_percent integer
)
language sql
security invoker
set search_path=''
as $$
  select *
  from public.get_fit_matches_cached_batch(p_match_categories,p_result_limit,p_fit_community);
$$;

revoke all on function public.get_fit_matches_batch(public.fit_match_category[],integer,public.fit_community) from public,anon;
grant execute on function public.get_fit_matches_batch(public.fit_match_category[],integer,public.fit_community) to authenticated,service_role;

create or replace function public.get_fit_matches(
  p_match_category public.fit_match_category default 'overall'::public.fit_match_category,
  p_result_limit integer default 30
)
returns table(user_id uuid,username text,display_name text,avatar_url text,match_score integer)
language sql
security invoker
set search_path=''
as $$
  select m.user_id,m.username,m.display_name,m.avatar_url,m.match_score
  from public.get_fit_matches_cached_batch(array[p_match_category],p_result_limit,null) m
  where m.match_category=p_match_category;
$$;

create or replace function public.get_fit_matches(
  p_match_category public.fit_match_category,
  p_result_limit integer,
  p_fit_community public.fit_community
)
returns table(user_id uuid,username text,display_name text,avatar_url text,match_score integer)
language sql
security invoker
set search_path=''
as $$
  select m.user_id,m.username,m.display_name,m.avatar_url,m.match_score
  from public.get_fit_matches_cached_batch(array[p_match_category],p_result_limit,p_fit_community) m
  where m.match_category=p_match_category;
$$;

revoke all on function public.get_fit_matches(public.fit_match_category,integer) from public,anon;
grant execute on function public.get_fit_matches(public.fit_match_category,integer) to authenticated,service_role;
revoke all on function public.get_fit_matches(public.fit_match_category,integer,public.fit_community) from public,anon;
grant execute on function public.get_fit_matches(public.fit_match_category,integer,public.fit_community) to authenticated,service_role;

comment on function public.get_fit_matches(public.fit_match_category,integer) is
  'Compatibility wrapper over the bounded versioned Fit neighborhood cache. Exact Match math is unchanged.';
comment on function public.get_fit_matches(public.fit_match_category,integer,public.fit_community) is
  'Fit Community compatibility wrapper over the bounded versioned Fit neighborhood cache. Exact Match math is unchanged.';

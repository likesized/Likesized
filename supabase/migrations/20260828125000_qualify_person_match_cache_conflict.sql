-- Repair the direct-person Match cache upsert after database behavior testing exposed
-- a PL/pgSQL name collision between the table-return column `match_category` and
-- the current_person_match_cache primary-key column of the same name.
--
-- Product behavior is unchanged: a stale direct person Match still recalculates only
-- the requested pair and upserts the three canonical categories. The conflict target
-- is now identified by the table's primary-key constraint so PostgreSQL never resolves
-- it as the function output variable.

create or replace function public.get_person_fit_match_cached(p_target_user_id uuid)
returns table(
  match_category public.fit_match_category,
  match_score integer,
  coverage_percent integer,
  cache_hit boolean
)
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user_id uuid:=auth.uid();
  v_viewer_version bigint;
  v_target_version bigint;
  v_algorithm_version integer;
  v_cache_hit boolean:=false;
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode='28000'; end if;
  if p_target_user_id is null or p_target_user_id=v_user_id then return; end if;

  select fp.match_input_version into v_viewer_version
  from public.fit_profiles fp where fp.user_id=v_user_id and fp.completed_at is not null;
  select fp.match_input_version into v_target_version
  from public.fit_profiles fp where fp.user_id=p_target_user_id and fp.completed_at is not null;
  if v_viewer_version is null or v_target_version is null then return; end if;
  select s.algorithm_version into v_algorithm_version from private.fit_match_algorithm_state s where s.singleton;

  select count(*)=3 into v_cache_hit
  from private.current_person_match_cache c
  where c.viewer_user_id=v_user_id and c.target_user_id=p_target_user_id
    and c.viewer_input_version=v_viewer_version and c.target_input_version=v_target_version
    and c.algorithm_version=v_algorithm_version
    and c.match_category in ('overall'::public.fit_match_category,'tops'::public.fit_match_category,'bottoms'::public.fit_match_category);

  if not v_cache_hit then
    insert into private.current_person_match_cache(
      viewer_user_id,target_user_id,match_category,viewer_input_version,target_input_version,
      algorithm_version,match_score,coverage_percent,qualified,computed_at
    )
    select v_user_id,p_target_user_id,m.match_category,v_viewer_version,v_target_version,
      v_algorithm_version,m.match_score,m.coverage_percent,m.qualified,now()
    from private.calculate_targeted_current_matches(
      array[p_target_user_id],
      array['overall'::public.fit_match_category,'tops'::public.fit_match_category,'bottoms'::public.fit_match_category]
    ) m
    on conflict on constraint current_person_match_cache_pkey do update set
      viewer_input_version=excluded.viewer_input_version,
      target_input_version=excluded.target_input_version,
      algorithm_version=excluded.algorithm_version,
      match_score=excluded.match_score,
      coverage_percent=excluded.coverage_percent,
      qualified=excluded.qualified,
      computed_at=now();
  end if;

  return query
  with requested(category,ord) as (
    values
      ('overall'::public.fit_match_category,1),
      ('tops'::public.fit_match_category,2),
      ('bottoms'::public.fit_match_category,3)
  )
  select r.category,case when c.qualified then c.match_score else null end,c.coverage_percent,v_cache_hit
  from requested r
  left join private.current_person_match_cache c
    on c.viewer_user_id=v_user_id and c.target_user_id=p_target_user_id and c.match_category=r.category
  order by r.ord;
end;
$$;

revoke all on function public.get_person_fit_match_cached(uuid) from public,anon;
grant execute on function public.get_person_fit_match_cached(uuid) to authenticated,service_role;

comment on function public.get_person_fit_match_cached(uuid) is
  'Direct person-to-person current Match resolver. Reuses exact cached Overall/Tops/Bottoms scores while both Match-input revisions and the Match algorithm version remain current; otherwise calculates only the requested pair.';

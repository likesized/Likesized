-- Fix an ambiguity between the RETURNS TABLE output column `user_id` and fit_profiles.user_id.
-- This preserves current-person matching semantics while allowing the matcher to execute under PL/pgSQL.

create or replace function private.calculate_fit_matches_for_profile(
  p_profile_key text,
  p_result_limit integer default 30
)
returns table(
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  match_score integer,
  coverage_percent integer
)
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user_id uuid := auth.uid();
  v_limit integer := least(greatest(coalesce(p_result_limit,30),1),100);
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode='28000';
  end if;

  if not exists (
    select 1 from public.match_profiles mp where mp.key=p_profile_key
  ) then
    raise exception 'Unknown match profile';
  end if;

  if not exists (
    select 1 from public.fit_profiles fp
    where fp.user_id=v_user_id and fp.completed_at is not null
  ) then
    return;
  end if;

  return query
  with profile_weights as (
    select
      mpm.measurement_type_key,
      mpm.weight,
      coalesce(mpm.tolerance_override_canonical, mt.default_tolerance_canonical) as tolerance
    from public.match_profile_measurements mpm
    join public.measurement_types mt on mt.key=mpm.measurement_type_key
    where mpm.profile_key=p_profile_key
  ),
  total as (
    select sum(weight) as total_weight from profile_weights
  ),
  candidates as (
    select p.id, p.username, p.display_name, p.avatar_url
    from public.profiles p
    join public.fit_profiles fp on fp.user_id=p.id and fp.completed_at is not null
    where p.id<>v_user_id and p.username is not null
  ),
  scored as (
    select
      c.id,
      c.username,
      c.display_name,
      c.avatar_url,
      sum(
        case when me.value_canonical is not null and them.value_canonical is not null
          then private.clamped_similarity(me.value_canonical,them.value_canonical,pw.tolerance)*pw.weight
          else 0 end
      ) as weighted_similarity,
      sum(
        case when me.value_canonical is not null and them.value_canonical is not null
          then pw.weight else 0 end
      ) as shared_weight,
      max(t.total_weight) as total_weight
    from candidates c
    cross join profile_weights pw
    cross join total t
    left join public.body_measurements me
      on me.user_id=v_user_id and me.measurement_type_key=pw.measurement_type_key
    left join public.body_measurements them
      on them.user_id=c.id and them.measurement_type_key=pw.measurement_type_key
    group by c.id,c.username,c.display_name,c.avatar_url
  )
  select
    s.id,
    s.username,
    s.display_name,
    s.avatar_url,
    round(least(1::numeric,greatest(0::numeric,s.weighted_similarity/nullif(s.shared_weight,0)))*100)::integer,
    round(least(1::numeric,greatest(0::numeric,s.shared_weight/nullif(s.total_weight,0)))*100)::integer
  from scored s
  where s.shared_weight>0
  order by 5 desc, 6 desc, s.username
  limit v_limit;
end;
$$;

revoke all on function private.calculate_fit_matches_for_profile(text,integer)
from public,anon,authenticated;

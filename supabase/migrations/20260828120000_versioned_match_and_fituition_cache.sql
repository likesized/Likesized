-- LikeSized long-term scale architecture: demand-driven, versioned current Match and FITuition caches.
-- Exact Match math remains canonical. Candidate discovery is only a bounded shortlist and never
-- becomes the user-facing score. Raw measurements and derived fingerprints stay private.

alter table public.fit_profiles
  add column match_input_version bigint not null default 1
    check (match_input_version > 0);

comment on column public.fit_profiles.match_input_version is
  'Monotonic private Match-input revision. Current-person caches key to this value so measurement/reliability edits invalidate derived Match results without global recomputation.';

create table private.fit_match_algorithm_state (
  singleton boolean primary key default true check (singleton),
  algorithm_version integer not null check (algorithm_version > 0),
  updated_at timestamptz not null default now()
);
insert into private.fit_match_algorithm_state(singleton,algorithm_version) values(true,1);
revoke all on private.fit_match_algorithm_state from public,anon,authenticated;

create table private.fit_match_candidate_fingerprints (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  match_input_version bigint not null,
  fit_community public.fit_community not null,
  height_bucket integer,
  upper_body_bucket integer,
  waist_bucket integer,
  hip_bucket integer,
  inseam_bucket integer,
  shoulder_bucket integer,
  torso_bucket integer,
  updated_at timestamptz not null default now()
);
revoke all on private.fit_match_candidate_fingerprints from public,anon,authenticated;

create index fit_match_fingerprint_height_idx on private.fit_match_candidate_fingerprints(height_bucket,fit_community,user_id) where height_bucket is not null;
create index fit_match_fingerprint_upper_idx on private.fit_match_candidate_fingerprints(upper_body_bucket,fit_community,user_id) where upper_body_bucket is not null;
create index fit_match_fingerprint_waist_idx on private.fit_match_candidate_fingerprints(waist_bucket,fit_community,user_id) where waist_bucket is not null;
create index fit_match_fingerprint_hip_idx on private.fit_match_candidate_fingerprints(hip_bucket,fit_community,user_id) where hip_bucket is not null;
create index fit_match_fingerprint_inseam_idx on private.fit_match_candidate_fingerprints(inseam_bucket,fit_community,user_id) where inseam_bucket is not null;
create index fit_match_fingerprint_shoulder_idx on private.fit_match_candidate_fingerprints(shoulder_bucket,fit_community,user_id) where shoulder_bucket is not null;
create index fit_match_fingerprint_torso_idx on private.fit_match_candidate_fingerprints(torso_bucket,fit_community,user_id) where torso_bucket is not null;

create or replace function private.fit_match_bucket(p_value numeric)
returns integer
language sql
immutable
set search_path=''
as $$
  select case when p_value is null then null else round(p_value/2.5)::integer end;
$$;
revoke all on function private.fit_match_bucket(numeric) from public,anon,authenticated;

create or replace function private.refresh_fit_match_candidate_fingerprint(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare
  v_input_version bigint;
  v_community public.fit_community;
  v_completed_at timestamptz;
  v_height numeric;
  v_upper numeric;
  v_waist numeric;
  v_hip numeric;
  v_inseam numeric;
  v_shoulder numeric;
  v_torso numeric;
begin
  select fp.match_input_version,fp.fit_community,fp.completed_at
    into v_input_version,v_community,v_completed_at
  from public.fit_profiles fp
  where fp.user_id=p_user_id;

  if not found or v_completed_at is null then
    delete from private.fit_match_candidate_fingerprints f where f.user_id=p_user_id;
    return;
  end if;

  select
    max(bm.value_canonical) filter(where bm.measurement_type_key='height'),
    coalesce(
      max(bm.value_canonical) filter(where bm.measurement_type_key='full_bust'),
      max(bm.value_canonical) filter(where bm.measurement_type_key='chest_circumference')
    ),
    max(bm.value_canonical) filter(where bm.measurement_type_key='natural_waist'),
    max(bm.value_canonical) filter(where bm.measurement_type_key='full_hip_seat'),
    max(bm.value_canonical) filter(where bm.measurement_type_key='inseam'),
    max(bm.value_canonical) filter(where bm.measurement_type_key='shoulder_width'),
    max(bm.value_canonical) filter(where bm.measurement_type_key='torso_body_length')
  into v_height,v_upper,v_waist,v_hip,v_inseam,v_shoulder,v_torso
  from public.body_measurements bm
  where bm.user_id=p_user_id;

  if v_height is null and v_upper is null and v_waist is null and v_hip is null
     and v_inseam is null and v_shoulder is null and v_torso is null then
    delete from private.fit_match_candidate_fingerprints f where f.user_id=p_user_id;
    return;
  end if;

  insert into private.fit_match_candidate_fingerprints(
    user_id,match_input_version,fit_community,height_bucket,upper_body_bucket,
    waist_bucket,hip_bucket,inseam_bucket,shoulder_bucket,torso_bucket,updated_at
  ) values (
    p_user_id,v_input_version,v_community,
    private.fit_match_bucket(v_height),private.fit_match_bucket(v_upper),
    private.fit_match_bucket(v_waist),private.fit_match_bucket(v_hip),
    private.fit_match_bucket(v_inseam),private.fit_match_bucket(v_shoulder),
    private.fit_match_bucket(v_torso),now()
  )
  on conflict(user_id) do update set
    match_input_version=excluded.match_input_version,
    fit_community=excluded.fit_community,
    height_bucket=excluded.height_bucket,
    upper_body_bucket=excluded.upper_body_bucket,
    waist_bucket=excluded.waist_bucket,
    hip_bucket=excluded.hip_bucket,
    inseam_bucket=excluded.inseam_bucket,
    shoulder_bucket=excluded.shoulder_bucket,
    torso_bucket=excluded.torso_bucket,
    updated_at=now();
end;
$$;
revoke all on function private.refresh_fit_match_candidate_fingerprint(uuid) from public,anon,authenticated;

create or replace function private.bump_current_match_input_version()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user_id uuid;
begin
  v_user_id:=case when tg_op='DELETE' then old.user_id else new.user_id end;
  update public.fit_profiles
  set match_input_version=match_input_version+1
  where user_id=v_user_id;
  perform private.refresh_fit_match_candidate_fingerprint(v_user_id);
  if tg_op='DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function private.bump_current_match_input_version() from public,anon,authenticated;

create trigger body_measurements_bump_match_input_version
after insert or update or delete on public.body_measurements
for each row execute function private.bump_current_match_input_version();

create or replace function private.refresh_fit_match_fingerprint_on_profile_relevance_change()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  perform private.refresh_fit_match_candidate_fingerprint(new.user_id);
  return new;
end;
$$;
revoke all on function private.refresh_fit_match_fingerprint_on_profile_relevance_change() from public,anon,authenticated;

create trigger fit_profiles_refresh_match_fingerprint
after update of fit_community,completed_at on public.fit_profiles
for each row execute function private.refresh_fit_match_fingerprint_on_profile_relevance_change();

do $$
declare r record;
begin
  for r in select fp.user_id from public.fit_profiles fp where fp.completed_at is not null loop
    perform private.refresh_fit_match_candidate_fingerprint(r.user_id);
  end loop;
end;
$$;

create table private.current_person_match_cache (
  viewer_user_id uuid not null references public.profiles(id) on delete cascade,
  target_user_id uuid not null references public.profiles(id) on delete cascade,
  match_category public.fit_match_category not null,
  viewer_input_version bigint not null,
  target_input_version bigint not null,
  algorithm_version integer not null,
  match_score integer not null check(match_score between 0 and 100),
  coverage_percent integer not null check(coverage_percent between 0 and 100),
  qualified boolean not null,
  computed_at timestamptz not null default now(),
  primary key(viewer_user_id,target_user_id,match_category),
  check(viewer_user_id<>target_user_id)
);
create index current_person_match_cache_target_idx on private.current_person_match_cache(target_user_id,computed_at desc);
revoke all on private.current_person_match_cache from public,anon,authenticated;

create table private.fit_match_neighborhood_cache (
  viewer_user_id uuid not null references public.profiles(id) on delete cascade,
  match_category public.fit_match_category not null,
  fit_community public.fit_community not null,
  viewer_input_version bigint not null,
  algorithm_version integer not null,
  payload jsonb not null default '[]'::jsonb check(jsonb_typeof(payload)='array'),
  built_at timestamptz not null default now(),
  primary key(viewer_user_id,match_category,fit_community)
);
revoke all on private.fit_match_neighborhood_cache from public,anon,authenticated;

create or replace function private.discover_fit_match_candidates(
  p_viewer_user_id uuid,
  p_fit_community public.fit_community,
  p_candidate_limit integer default 700
)
returns table(user_id uuid)
language plpgsql
security definer
set search_path=''
as $$
declare
  v_limit integer:=least(greatest(coalesce(p_candidate_limit,700),50),900);
  v_community public.fit_community;
begin
  if p_viewer_user_id is null then return; end if;
  perform private.refresh_fit_match_candidate_fingerprint(p_viewer_user_id);
  select coalesce(p_fit_community,fp.fit_community,'both'::public.fit_community)
    into v_community
  from public.fit_profiles fp
  where fp.user_id=p_viewer_user_id;

  return query
  with viewer as materialized (
    select * from private.fit_match_candidate_fingerprints f where f.user_id=p_viewer_user_id
  ),
  seeds as (
    (select f.user_id,1 as hit from private.fit_match_candidate_fingerprints f cross join viewer v
      where v.height_bucket is not null and f.user_id<>p_viewer_user_id
        and f.height_bucket between v.height_bucket-1 and v.height_bucket+1
        and (v_community='both'::public.fit_community or f.fit_community='both'::public.fit_community or f.fit_community=v_community)
      limit 110)
    union all
    (select f.user_id,1 from private.fit_match_candidate_fingerprints f cross join viewer v
      where v.upper_body_bucket is not null and f.user_id<>p_viewer_user_id
        and f.upper_body_bucket between v.upper_body_bucket-1 and v.upper_body_bucket+1
        and (v_community='both'::public.fit_community or f.fit_community='both'::public.fit_community or f.fit_community=v_community)
      limit 110)
    union all
    (select f.user_id,1 from private.fit_match_candidate_fingerprints f cross join viewer v
      where v.waist_bucket is not null and f.user_id<>p_viewer_user_id
        and f.waist_bucket between v.waist_bucket-1 and v.waist_bucket+1
        and (v_community='both'::public.fit_community or f.fit_community='both'::public.fit_community or f.fit_community=v_community)
      limit 110)
    union all
    (select f.user_id,1 from private.fit_match_candidate_fingerprints f cross join viewer v
      where v.hip_bucket is not null and f.user_id<>p_viewer_user_id
        and f.hip_bucket between v.hip_bucket-1 and v.hip_bucket+1
        and (v_community='both'::public.fit_community or f.fit_community='both'::public.fit_community or f.fit_community=v_community)
      limit 110)
    union all
    (select f.user_id,1 from private.fit_match_candidate_fingerprints f cross join viewer v
      where v.inseam_bucket is not null and f.user_id<>p_viewer_user_id
        and f.inseam_bucket between v.inseam_bucket-1 and v.inseam_bucket+1
        and (v_community='both'::public.fit_community or f.fit_community='both'::public.fit_community or f.fit_community=v_community)
      limit 110)
    union all
    (select f.user_id,1 from private.fit_match_candidate_fingerprints f cross join viewer v
      where v.shoulder_bucket is not null and f.user_id<>p_viewer_user_id
        and f.shoulder_bucket between v.shoulder_bucket-1 and v.shoulder_bucket+1
        and (v_community='both'::public.fit_community or f.fit_community='both'::public.fit_community or f.fit_community=v_community)
      limit 110)
    union all
    (select f.user_id,1 from private.fit_match_candidate_fingerprints f cross join viewer v
      where v.torso_bucket is not null and f.user_id<>p_viewer_user_id
        and f.torso_bucket between v.torso_bucket-1 and v.torso_bucket+1
        and (v_community='both'::public.fit_community or f.fit_community='both'::public.fit_community or f.fit_community=v_community)
      limit 110)
    union all
    (select c.target_user_id,2 from private.current_person_match_cache c
      where c.viewer_user_id=p_viewer_user_id
      order by c.computed_at desc
      limit 100)
  ),
  ranked as (
    select s.user_id,count(*)::integer as hits
    from seeds s
    join public.fit_profiles fp on fp.user_id=s.user_id and fp.completed_at is not null
    group by s.user_id
    order by count(*) desc,s.user_id
    limit v_limit
  )
  select r.user_id from ranked r;
end;
$$;
revoke all on function private.discover_fit_match_candidates(uuid,public.fit_community,integer) from public,anon,authenticated;

create or replace function private.calculate_targeted_current_matches(
  p_target_user_ids uuid[],
  p_match_categories public.fit_match_category[]
)
returns table(
  match_category public.fit_match_category,
  target_user_id uuid,
  match_score integer,
  coverage_percent integer,
  qualified boolean
)
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user_id uuid:=auth.uid();
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode='28000'; end if;
  if not exists(select 1 from public.fit_profiles fp where fp.user_id=v_user_id and fp.completed_at is not null) then return; end if;

  return query
  with requested as (
    select distinct category,
      case category
        when 'tops'::public.fit_match_category then 'tops_default'
        when 'bottoms'::public.fit_match_category then 'bottoms_default'
        else 'overall'
      end as profile_key
    from unnest(coalesce(p_match_categories,'{}'::public.fit_match_category[])) q(category)
    where category in ('overall'::public.fit_match_category,'tops'::public.fit_match_category,'bottoms'::public.fit_match_category)
  ),
  targets as materialized (
    select distinct fp.user_id
    from unnest(coalesce(p_target_user_ids,'{}'::uuid[])) ids(user_id)
    join public.fit_profiles fp on fp.user_id=ids.user_id and fp.completed_at is not null
    where fp.user_id<>v_user_id
    limit 900
  ),
  weights as (
    select r.category,mpm.measurement_type_key,mpm.weight,mpm.coverage_weight,
      coalesce(mpm.tolerance_override_canonical,mt.default_tolerance_canonical) as tolerance
    from requested r
    join public.match_profile_measurements mpm on mpm.profile_key=r.profile_key
    join public.measurement_types mt on mt.key=mpm.measurement_type_key
  ),
  meta as (
    select r.category,sum(w.coverage_weight) as total_coverage,count(*)::integer as measurement_count,
      mp.minimum_shared_measurements,mp.minimum_coverage
    from requested r
    join weights w on w.category=r.category
    join public.match_profiles mp on mp.key=r.profile_key
    group by r.category,mp.minimum_shared_measurements,mp.minimum_coverage
  ),
  aggregated as (
    select
      w.category,t.user_id,
      sum(case when me.value_canonical is not null and them.value_canonical is not null
        then private.fit_measurement_similarity(me.value_canonical,them.value_canonical,w.tolerance)*w.weight
          *sqrt(private.fit_measurement_reliability(me.source,me.method)*private.fit_measurement_reliability(them.source,them.method)) else 0 end) as weighted_similarity,
      sum(case when me.value_canonical is not null and them.value_canonical is not null
        then w.weight*sqrt(private.fit_measurement_reliability(me.source,me.method)*private.fit_measurement_reliability(them.source,them.method)) else 0 end) as similarity_weight,
      sum(case when me.value_canonical is not null and them.value_canonical is not null then w.coverage_weight else 0 end) as shared_coverage,
      sum(case when me.value_canonical is not null and them.value_canonical is not null
        then w.coverage_weight*sqrt(
          private.fit_measurement_confidence_reliability(me.source,me.method,w.measurement_type_key,me.confirmed_at,now())
          *private.fit_measurement_confidence_reliability(them.source,them.method,w.measurement_type_key,them.confirmed_at,now())
        ) else 0 end) as reliable_coverage,
      count(*) filter(where me.value_canonical is not null and them.value_canonical is not null)::integer as shared_count,
      max(meta.total_coverage) as total_coverage,max(meta.measurement_count) as measurement_count,
      max(meta.minimum_shared_measurements) as minimum_shared_measurements,max(meta.minimum_coverage) as minimum_coverage
    from targets t cross join weights w join meta on meta.category=w.category
    left join public.body_measurements me on me.user_id=v_user_id and me.measurement_type_key=w.measurement_type_key
    left join public.body_measurements them on them.user_id=t.user_id and them.measurement_type_key=w.measurement_type_key
    group by w.category,t.user_id
  )
  select
    a.category,a.user_id,
    case when a.similarity_weight>0 and a.shared_count>=a.minimum_shared_measurements
      and a.shared_coverage/nullif(a.total_coverage,0)>=a.minimum_coverage
      then private.confidence_adjusted_match(a.weighted_similarity,a.similarity_weight,a.shared_coverage,a.reliable_coverage,a.total_coverage,a.shared_count,a.measurement_count)
      else 0 end,
    case when a.total_coverage>0 then round(100*least(1::numeric,greatest(0::numeric,a.shared_coverage/nullif(a.total_coverage,0))))::integer else 0 end,
    (a.similarity_weight>0 and a.shared_count>=a.minimum_shared_measurements
      and a.shared_coverage/nullif(a.total_coverage,0)>=a.minimum_coverage)
  from aggregated a;
end;
$$;
revoke all on function private.calculate_targeted_current_matches(uuid[],public.fit_match_category[]) from public,anon,authenticated;

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
    on conflict(viewer_user_id,target_user_id,match_category) do update set
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

create or replace function public.get_fit_matches_cached_batch(
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
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user_id uuid:=auth.uid();
  v_limit integer:=least(greatest(coalesce(p_result_limit,100),1),100);
  v_cache_size integer:=greatest(120,least(200,v_limit*2));
  v_viewer_version bigint;
  v_algorithm_version integer;
  v_community public.fit_community;
  v_categories public.fit_match_category[];
  v_candidate_ids uuid[];
  v_needs_rebuild boolean:=false;
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode='28000'; end if;

  select array_agg(category order by category::text) into v_categories
  from (
    select distinct category
    from unnest(coalesce(p_match_categories,'{}'::public.fit_match_category[])) q(category)
    where category in ('overall'::public.fit_match_category,'tops'::public.fit_match_category,'bottoms'::public.fit_match_category)
  ) requested_categories;
  if coalesce(array_length(v_categories,1),0)=0 then return; end if;

  select fp.match_input_version,coalesce(p_fit_community,fp.fit_community,'both'::public.fit_community)
    into v_viewer_version,v_community
  from public.fit_profiles fp
  where fp.user_id=v_user_id and fp.completed_at is not null;
  if v_viewer_version is null then return; end if;
  select s.algorithm_version into v_algorithm_version from private.fit_match_algorithm_state s where s.singleton;

  select exists(
    select 1
    from unnest(v_categories) requested(category)
    left join private.fit_match_neighborhood_cache n
      on n.viewer_user_id=v_user_id and n.match_category=requested.category and n.fit_community=v_community
    where n.viewer_user_id is null
      or n.viewer_input_version<>v_viewer_version
      or n.algorithm_version<>v_algorithm_version
      or n.built_at<now()-interval '12 hours'
      or exists(
        select 1
        from jsonb_array_elements(coalesce(n.payload,'[]'::jsonb)) item
        left join public.fit_profiles target_fp on target_fp.user_id=(item->>'target_user_id')::uuid
        where target_fp.user_id is null or target_fp.completed_at is null
          or target_fp.match_input_version<>(item->>'target_input_version')::bigint
      )
  ) into v_needs_rebuild;

  if v_needs_rebuild then
    select array_agg(d.user_id) into v_candidate_ids
    from private.discover_fit_match_candidates(v_user_id,v_community,700) d;
    v_candidate_ids:=coalesce(v_candidate_ids,'{}'::uuid[]);

    delete from private.fit_match_neighborhood_cache n
    where n.viewer_user_id=v_user_id and n.fit_community=v_community and n.match_category=any(v_categories);

    insert into private.fit_match_neighborhood_cache(
      viewer_user_id,match_category,fit_community,viewer_input_version,algorithm_version,payload,built_at
    )
    with requested as (
      select unnest(v_categories) as category
    ),
    scored as materialized (
      select * from private.calculate_targeted_current_matches(v_candidate_ids,v_categories)
    ),
    ranked as (
      select s.*,fp.match_input_version as target_input_version,
        row_number() over(partition by s.match_category order by s.match_score desc,s.coverage_percent desc,s.target_user_id) as result_rank
      from scored s
      join public.fit_profiles fp on fp.user_id=s.target_user_id and fp.completed_at is not null
      where s.qualified
    ),
    payloads as (
      select r.match_category,
        jsonb_agg(jsonb_build_object(
          'target_user_id',r.target_user_id,
          'target_input_version',r.target_input_version,
          'match_score',r.match_score,
          'coverage_percent',r.coverage_percent
        ) order by r.result_rank) as payload
      from ranked r
      where r.result_rank<=v_cache_size
      group by r.match_category
    )
    select v_user_id,requested.category,v_community,v_viewer_version,v_algorithm_version,
      coalesce(payloads.payload,'[]'::jsonb),now()
    from requested
    left join payloads on payloads.match_category=requested.category;
  end if;

  return query
  select
    n.match_category,p.id,p.username,p.display_name,p.avatar_url,
    (item.value->>'match_score')::integer,
    (item.value->>'coverage_percent')::integer
  from private.fit_match_neighborhood_cache n
  cross join lateral jsonb_array_elements(n.payload) with ordinality item(value,position)
  join public.profiles p on p.id=(item.value->>'target_user_id')::uuid
  where n.viewer_user_id=v_user_id and n.fit_community=v_community
    and n.match_category=any(v_categories) and item.position<=v_limit
  order by n.match_category,item.position;
end;
$$;
revoke all on function public.get_fit_matches_cached_batch(public.fit_match_category[],integer,public.fit_community) from public,anon;
grant execute on function public.get_fit_matches_cached_batch(public.fit_match_category[],integer,public.fit_community) to authenticated,service_role;

comment on function public.get_fit_matches_cached_batch(public.fit_match_category[],integer,public.fit_community) is
  'Returns a bounded persisted Fit neighborhood. Exact canonical Match math runs only when the viewer/input neighborhood is stale; cached neighborhoods refresh at most every 12 hours or immediately when a displayed target Match input revision changes.';
comment on function public.get_person_fit_match_cached(uuid) is
  'Direct person-to-person current Match resolver. Reuses exact cached Overall/Tops/Bottoms scores while both Match-input revisions and the Match algorithm version remain current; otherwise calculates only the requested pair.';

-- FITuition evidence cache invalidation uses narrow evidence scopes plus a periodic TTL for
-- broad category fallback. This prevents every Fit Report anywhere in a broad category from
-- invalidating millions of personalized garment caches at once.
create table private.fituition_algorithm_state (
  singleton boolean primary key default true check(singleton),
  algorithm_version integer not null check(algorithm_version>0),
  updated_at timestamptz not null default now()
);
insert into private.fituition_algorithm_state(singleton,algorithm_version) values(true,1);
revoke all on private.fituition_algorithm_state from public,anon,authenticated;

create table private.fit_evidence_scope_versions (
  scope_type text not null check(scope_type in ('product','family','garment_type','brand_garment_type')),
  scope_key text not null,
  evidence_version bigint not null default 1 check(evidence_version>0),
  updated_at timestamptz not null default now(),
  primary key(scope_type,scope_key)
);
revoke all on private.fit_evidence_scope_versions from public,anon,authenticated;

create or replace function private.bump_fit_evidence_scope(p_scope_type text,p_scope_key text)
returns void
language plpgsql
security definer
set search_path=''
as $$
begin
  if p_scope_key is null or btrim(p_scope_key)='' then return; end if;
  insert into private.fit_evidence_scope_versions(scope_type,scope_key,evidence_version,updated_at)
  values(p_scope_type,p_scope_key,1,now())
  on conflict(scope_type,scope_key) do update
  set evidence_version=private.fit_evidence_scope_versions.evidence_version+1,updated_at=now();
end;
$$;
revoke all on function private.bump_fit_evidence_scope(text,text) from public,anon,authenticated;

create or replace function private.bump_fit_evidence_for_product(p_product_id uuid)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare
  p record;
begin
  select id,brand_id,product_family_id,garment_type_key into p
  from public.products where id=p_product_id;
  if not found then return; end if;
  perform private.bump_fit_evidence_scope('product',p.id::text);
  if p.product_family_id is not null then perform private.bump_fit_evidence_scope('family',p.product_family_id::text); end if;
  if p.garment_type_key is not null then perform private.bump_fit_evidence_scope('garment_type',p.garment_type_key); end if;
  if p.brand_id is not null and p.garment_type_key is not null then
    perform private.bump_fit_evidence_scope('brand_garment_type',p.brand_id::text||':'||p.garment_type_key);
  end if;
end;
$$;
revoke all on function private.bump_fit_evidence_for_product(uuid) from public,anon,authenticated;

create or replace function private.current_fit_evidence_token(p_product_id uuid)
returns text
language sql
stable
security definer
set search_path=''
as $$
  with target as (
    select p.id,p.brand_id,p.product_family_id,p.garment_type_key from public.products p where p.id=p_product_id
  )
  select concat_ws('|',
    'p:'||coalesce((select v.evidence_version::text from target t left join private.fit_evidence_scope_versions v on v.scope_type='product' and v.scope_key=t.id::text),'0'),
    'f:'||coalesce((select v.evidence_version::text from target t left join private.fit_evidence_scope_versions v on v.scope_type='family' and v.scope_key=t.product_family_id::text),'0'),
    'g:'||coalesce((select v.evidence_version::text from target t left join private.fit_evidence_scope_versions v on v.scope_type='garment_type' and v.scope_key=t.garment_type_key),'0'),
    'b:'||coalesce((select v.evidence_version::text from target t left join private.fit_evidence_scope_versions v on v.scope_type='brand_garment_type' and v.scope_key=t.brand_id::text||':'||t.garment_type_key),'0')
  );
$$;
revoke all on function private.current_fit_evidence_token(uuid) from public,anon,authenticated;

create or replace function private.fit_report_bump_evidence_versions()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  if tg_op<>'INSERT' then perform private.bump_fit_evidence_for_product(old.product_id); end if;
  if tg_op<>'DELETE' and (tg_op='INSERT' or new.product_id is distinct from old.product_id) then
    perform private.bump_fit_evidence_for_product(new.product_id);
  elsif tg_op='UPDATE' then
    perform private.bump_fit_evidence_for_product(new.product_id);
  end if;
  if tg_op='DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function private.fit_report_bump_evidence_versions() from public,anon,authenticated;

create trigger fit_reports_bump_fituition_evidence
after insert or update or delete on public.fit_reports
for each row execute function private.fit_report_bump_evidence_versions();

create or replace function private.product_attribute_bump_evidence_versions()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  if tg_op<>'INSERT' then perform private.bump_fit_evidence_for_product(old.product_id); end if;
  if tg_op<>'DELETE' and (tg_op='INSERT' or new.product_id is distinct from old.product_id) then
    perform private.bump_fit_evidence_for_product(new.product_id);
  elsif tg_op='UPDATE' then
    perform private.bump_fit_evidence_for_product(new.product_id);
  end if;
  if tg_op='DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function private.product_attribute_bump_evidence_versions() from public,anon,authenticated;

create trigger product_attribute_values_bump_fituition_evidence
after insert or update or delete on public.product_attribute_values
for each row execute function private.product_attribute_bump_evidence_versions();

create or replace function private.closet_visibility_bump_evidence_versions()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare r record;
begin
  if new.visibility is distinct from old.visibility then
    for r in select distinct fr.product_id from public.fit_reports fr where fr.closet_item_id=new.id loop
      perform private.bump_fit_evidence_for_product(r.product_id);
    end loop;
  end if;
  return new;
end;
$$;
revoke all on function private.closet_visibility_bump_evidence_versions() from public,anon,authenticated;

create trigger closet_items_bump_fituition_evidence
after update of visibility on public.closet_items
for each row execute function private.closet_visibility_bump_evidence_versions();

create table private.fituition_evidence_cache (
  viewer_user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  variant_cache_key text not null default '',
  viewer_input_version bigint not null,
  algorithm_version integer not null,
  evidence_token text not null,
  payload jsonb not null default '[]'::jsonb check(jsonb_typeof(payload)='array'),
  computed_at timestamptz not null default now(),
  primary key(viewer_user_id,product_id,variant_cache_key)
);
create index fituition_evidence_cache_product_idx on private.fituition_evidence_cache(product_id,computed_at desc);
revoke all on private.fituition_evidence_cache from public,anon,authenticated;

-- Re-bound the canonical evidence core to a private approximate body-neighborhood shortlist.
-- The shortlist only decides which historical snapshots are worth exact scoring. Evidence rank,
-- historical snapshot Match math, directional support and recommendation semantics remain exact.
create or replace function private.resolve_product_evidence_core(
  p_product_id uuid,
  p_variant_id uuid,
  p_result_limit integer
)
returns table(
  fit_report_id uuid,user_id uuid,closet_item_id uuid,evidence_product_id uuid,evidence_variant_id uuid,
  fit_profile_version_id uuid,original_size_label text,normalized_size_id uuid,fit public.fit_rating,
  would_buy_again boolean,historical_match_score integer,historical_coverage_percent integer,
  evidence_level public.evidence_level,evidence_rank integer,attribute_overlap integer
)
language sql
security definer
set search_path=''
as $$
with viewer as (
  select auth.uid() as user_id
),
candidate_users as materialized (
  select d.user_id from private.discover_fit_match_candidates(auth.uid(),'both'::public.fit_community,850) d
  union select auth.uid()
),
target as (
  select p.*,
    case when p_variant_id is not null and exists(select 1 from public.product_variants pv where pv.id=p_variant_id and pv.product_id=p.id)
      then p_variant_id else null::uuid end as target_variant_id
  from public.products p where p.id=p_product_id
),
raw_candidates as (
  select fr.id as fit_report_id,fr.user_id,fr.closet_item_id,fr.product_id as evidence_product_id,
    fr.variant_id as evidence_variant_id,fr.objective_variant_key,fr.fit_profile_version_id,
    fr.size_label as original_size_label,fr.normalized_size_id,fr.fit,fr.would_buy_again,fr.created_at as observed_at,
    ep.brand_id,ep.product_family_id,ep.garment_type_key,ep.category,
    t.brand_id as target_brand_id,t.product_family_id as target_family_id,t.garment_type_key as target_garment_type,
    t.category as target_category,t.target_variant_id
  from candidate_users cu
  join public.fit_reports fr on fr.user_id=cu.user_id
  join public.closet_items ci on ci.id=fr.closet_item_id and ci.visibility='shared'::public.closet_visibility
  join public.products ep on ep.id=fr.product_id
  cross join target t cross join viewer v
  where v.user_id is not null and fr.garment_condition='normal'::public.garment_condition
    and (fr.product_id=p_product_id
      or (t.product_family_id is not null and ep.product_family_id=t.product_family_id)
      or (t.garment_type_key is not null and ep.garment_type_key=t.garment_type_key)
      or ep.category=t.category)
),
latest_candidates as materialized (
  select * from (
    select r.*,row_number() over(partition by r.user_id,r.evidence_product_id,coalesce(r.objective_variant_key,'') order by r.observed_at desc,r.fit_report_id desc) as evidence_unit_rank
    from raw_candidates r
  ) ranked where ranked.evidence_unit_rank=1
),
with_overlap as materialized (
  select c.*,coalesce(overlap.attribute_overlap,0) as attribute_overlap
  from latest_candidates c
  left join lateral (
    select count(*)::integer as attribute_overlap
    from public.product_attribute_values ta
    join public.product_attribute_values ea on ea.attribute_key=ta.attribute_key and ea.option_key=ta.option_key
    where ta.product_id=p_product_id and ea.product_id=c.evidence_product_id
      and ta.source_status in ('corroborated'::public.product_data_status,'verified'::public.product_data_status)
      and ea.source_status in ('corroborated'::public.product_data_status,'verified'::public.product_data_status)
      and ta.confidence>=.75 and ea.confidence>=.75
  ) overlap on true
),
snapshot_scores as materialized (
  select * from private.calculate_snapshot_matches_for_product(
    array(select distinct c.fit_profile_version_id from with_overlap c where c.fit_profile_version_id is not null),p_product_id
  )
),
scored as (
  select c.*,hm.match_score as snapshot_match_score,hm.coverage_percent as snapshot_coverage_percent,
    case
      when c.target_variant_id is not null and c.evidence_variant_id=c.target_variant_id then 'exact_variant'::public.evidence_level
      when c.evidence_product_id=p_product_id then 'exact_product'::public.evidence_level
      when c.target_family_id is not null and c.product_family_id=c.target_family_id then 'product_family'::public.evidence_level
      when c.target_garment_type is not null and c.garment_type_key=c.target_garment_type and c.attribute_overlap>0 then 'similar_garments'::public.evidence_level
      when c.brand_id=c.target_brand_id and c.garment_type_key=c.target_garment_type then 'brand_garment_type'::public.evidence_level
      else 'category_fit'::public.evidence_level end as resolved_evidence_level,
    case
      when c.target_variant_id is not null and c.evidence_variant_id=c.target_variant_id then 1
      when c.evidence_product_id=p_product_id then 2
      when c.target_family_id is not null and c.product_family_id=c.target_family_id then 3
      when c.target_garment_type is not null and c.garment_type_key=c.target_garment_type and c.attribute_overlap>0 then 4
      when c.brand_id=c.target_brand_id and c.garment_type_key=c.target_garment_type then 5
      else 6 end as resolved_evidence_rank
  from with_overlap c join snapshot_scores hm using(fit_profile_version_id)
),
limited as materialized (
  select s.* from scored s where s.snapshot_match_score>0
  order by s.resolved_evidence_rank,s.snapshot_match_score desc,s.snapshot_coverage_percent desc,s.attribute_overlap desc,s.fit_report_id
  limit least(greatest(coalesce(p_result_limit,200),1),500)
)
select l.fit_report_id,l.user_id,l.closet_item_id,l.evidence_product_id,l.evidence_variant_id,
  l.fit_profile_version_id,l.original_size_label,l.normalized_size_id,l.fit,l.would_buy_again,
  l.snapshot_match_score,l.snapshot_coverage_percent,l.resolved_evidence_level,l.resolved_evidence_rank,l.attribute_overlap
from limited l
order by l.resolved_evidence_rank,l.snapshot_match_score desc,l.snapshot_coverage_percent desc,l.attribute_overlap desc,l.fit_report_id;
$$;
revoke all on function private.resolve_product_evidence_core(uuid,uuid,integer) from public,anon,authenticated;

create or replace function public.get_cached_product_evidence_candidates(
  p_product_id uuid,
  p_variant_id uuid default null::uuid,
  p_result_limit integer default 300
)
returns table(
  fit_report_id uuid,user_id uuid,closet_item_id uuid,evidence_product_id uuid,evidence_variant_id uuid,
  fit_profile_version_id uuid,original_size_label text,normalized_size_id uuid,fit public.fit_rating,
  would_buy_again boolean,historical_match_score integer,historical_coverage_percent integer,
  evidence_level public.evidence_level,evidence_rank integer,attribute_overlap integer,directional_fit_support numeric
)
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user_id uuid:=auth.uid();
  v_limit integer:=least(greatest(coalesce(p_result_limit,300),1),300);
  v_input_version bigint;
  v_algorithm_version integer;
  v_token text;
  v_variant_key text:=coalesce(p_variant_id::text,'');
  v_payload jsonb;
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode='28000'; end if;
  select fp.match_input_version into v_input_version from public.fit_profiles fp
    where fp.user_id=v_user_id and fp.completed_at is not null;
  if v_input_version is null then return; end if;
  select s.algorithm_version into v_algorithm_version from private.fituition_algorithm_state s where s.singleton;
  v_token:=private.current_fit_evidence_token(p_product_id);

  select c.payload into v_payload
  from private.fituition_evidence_cache c
  where c.viewer_user_id=v_user_id and c.product_id=p_product_id and c.variant_cache_key=v_variant_key
    and c.viewer_input_version=v_input_version and c.algorithm_version=v_algorithm_version
    and c.evidence_token=v_token and c.computed_at>=now()-interval '12 hours';

  if v_payload is null then
    perform set_config('statement_timeout','4000',true);
    select coalesce(jsonb_agg(to_jsonb(e) order by e.evidence_rank,e.historical_match_score desc,e.historical_coverage_percent desc,e.fit_report_id),'[]'::jsonb)
      into v_payload
    from public.get_product_evidence_candidates(p_product_id,p_variant_id,300) e;

    insert into private.fituition_evidence_cache(
      viewer_user_id,product_id,variant_cache_key,viewer_input_version,algorithm_version,evidence_token,payload,computed_at
    ) values(v_user_id,p_product_id,v_variant_key,v_input_version,v_algorithm_version,v_token,v_payload,now())
    on conflict(viewer_user_id,product_id,variant_cache_key) do update set
      viewer_input_version=excluded.viewer_input_version,
      algorithm_version=excluded.algorithm_version,
      evidence_token=excluded.evidence_token,
      payload=excluded.payload,
      computed_at=now();
  end if;

  return query
  select x.fit_report_id,x.user_id,x.closet_item_id,x.evidence_product_id,x.evidence_variant_id,
    x.fit_profile_version_id,x.original_size_label,x.normalized_size_id,x.fit,x.would_buy_again,
    x.historical_match_score,x.historical_coverage_percent,x.evidence_level,x.evidence_rank,
    x.attribute_overlap,x.directional_fit_support
  from jsonb_to_recordset(v_payload) as x(
    fit_report_id uuid,user_id uuid,closet_item_id uuid,evidence_product_id uuid,evidence_variant_id uuid,
    fit_profile_version_id uuid,original_size_label text,normalized_size_id uuid,fit public.fit_rating,
    would_buy_again boolean,historical_match_score integer,historical_coverage_percent integer,
    evidence_level public.evidence_level,evidence_rank integer,attribute_overlap integer,directional_fit_support numeric
  )
  limit v_limit;
end;
$$;
revoke all on function public.get_cached_product_evidence_candidates(uuid,uuid,integer) from public,anon;
grant execute on function public.get_cached_product_evidence_candidates(uuid,uuid,integer) to authenticated,service_role;

comment on function public.get_cached_product_evidence_candidates(uuid,uuid,integer) is
  'Demand-driven personalized FITuition evidence cache. Validity is keyed to the viewer Match-input revision, FITuition algorithm version, narrow evidence-scope token and a 12-hour broad-fallback TTL. Cache misses use the bounded candidate neighborhood and exact historical Match scorer.';

create index if not exists fit_reports_user_product_created_idx on public.fit_reports(user_id,product_id,created_at desc);

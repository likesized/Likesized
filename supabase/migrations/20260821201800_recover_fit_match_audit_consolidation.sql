-- LikeSized canonical migration: Fit Match audit consolidation.
-- Locks V1 manual measurement provenance, per-measurement freshness confidence,
-- locks approved audit behavior while preserving the existing single Match pipeline.

-- #6: measurement freshness is explicit per measurement. Age never changes the stored
-- value, raw anthropometric similarity, qualification, or coverage. It can only make
-- evidence confidence slightly more conservative until the member reconfirms the value.
alter table public.measurement_types
  add column reconfirm_after_days integer not null default 270
    check (reconfirm_after_days between 30 and 3650);

update public.measurement_types set reconfirm_after_days=90 where key='weight';
update public.measurement_types set reconfirm_after_days=180 where key in (
  'chest_circumference','full_bust','high_bust','underbust','overbust',
  'natural_waist','lower_pants_waist','high_hip','full_hip_seat','torso_girth',
  'bicep_upper_arm','elbow_circumference','wrist_circumference','neck_collar_circumference',
  'thigh_circumference','knee_circumference','calf_circumference'
);
update public.measurement_types set reconfirm_after_days=365 where key in (
  'height','shoulder_width','individual_shoulder_length','foot_length','foot_width'
);

alter table public.body_measurements add column confirmed_at timestamptz;
update public.body_measurements
set confirmed_at=coalesce(measured_at,updated_at,created_at,now())
where confirmed_at is null;
alter table public.body_measurements alter column confirmed_at set default now();
alter table public.body_measurements alter column confirmed_at set not null;

alter table public.fit_profile_version_measurements add column confirmed_at timestamptz;
update public.fit_profile_version_measurements m
set confirmed_at=v.created_at
from public.fit_profile_versions v
where v.id=m.fit_profile_version_id and m.confirmed_at is null;
alter table public.fit_profile_version_measurements alter column confirmed_at set not null;

-- Confirmation age starts at full confidence, then decays gently after the configured
-- reconfirmation window. Even very old measurements retain most of their confidence.
create or replace function private.measurement_freshness_factor(
  p_measurement_type_key text,
  p_confirmed_at timestamptz,
  p_as_of timestamptz default now()
) returns numeric
language sql
stable
set search_path=''
as $$
with cfg as (
  select mt.reconfirm_after_days,
    case
      when mt.key='weight' then .94::numeric
      when mt.key in (
        'chest_circumference','full_bust','high_bust','underbust','overbust',
        'natural_waist','lower_pants_waist','high_hip','full_hip_seat','torso_girth',
        'bicep_upper_arm','elbow_circumference','wrist_circumference','neck_collar_circumference',
        'thigh_circumference','knee_circumference','calf_circumference'
      ) then .95::numeric
      when mt.key in ('height','shoulder_width','individual_shoulder_length','foot_length','foot_width') then .98::numeric
      else .97::numeric
    end confidence_floor
  from public.measurement_types mt where mt.key=p_measurement_type_key
), age as (
  select cfg.*,
    greatest(0::numeric,extract(epoch from (coalesce(p_as_of,now())-coalesce(p_confirmed_at,coalesce(p_as_of,now()))))/86400::numeric) age_days
  from cfg
)
select coalesce(
  case
    when age_days<=reconfirm_after_days then 1::numeric
    when age_days>=reconfirm_after_days*2 then confidence_floor
    else 1::numeric-
      ((age_days-reconfirm_after_days)/reconfirm_after_days::numeric)*(1::numeric-confidence_floor)
  end,
  1::numeric
) from age;
$$;
revoke all on function private.measurement_freshness_factor(text,timestamptz,timestamptz) from public,anon,authenticated;

create or replace function private.fit_measurement_confidence_reliability(
  p_source public.measurement_source,
  p_method public.measurement_method,
  p_measurement_type_key text,
  p_confirmed_at timestamptz,
  p_as_of timestamptz default now()
) returns numeric
language sql
stable
set search_path=''
as $$
  select private.fit_measurement_reliability(p_source,p_method)
       * private.measurement_freshness_factor(p_measurement_type_key,p_confirmed_at,p_as_of);
$$;
revoke all on function private.fit_measurement_confidence_reliability(public.measurement_source,public.measurement_method,text,timestamptz,timestamptz) from public,anon,authenticated;

-- #7: the V1 Fit Profile save is manual-entry only. The public enum remains extensible,
-- but this canonical V1 intake cannot claim a device/import path that the product does not have.
-- A changed measurement refreshes its confirmation date. An unchanged value refreshes only
-- when the member explicitly sends confirm_unchanged=true.
create or replace function public.save_fit_profile(
  p_username text,
  p_unit_system public.unit_system,
  p_measurements jsonb,
  p_size_references jsonb default '[]'::jsonb,
  p_fit_preferences jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security invoker
set search_path=''
as $$
declare
  v_user_id uuid:=auth.uid();
  v_version_id uuid;
  v_count integer;
  v_reference_count integer;
  v_preference_count integer;
  v_measurement jsonb;
  v_measurement_key text;
  v_confirm_unchanged boolean;
  v_dimension public.measurement_dimension;
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode='28000'; end if;
  if p_username is null or p_username !~ '^[A-Za-z0-9_]{3,32}$' then raise exception 'Invalid username' using errcode='22023'; end if;
  if p_measurements is null or jsonb_typeof(p_measurements)<>'array' then raise exception 'Measurements must be an array' using errcode='22023'; end if;
  if p_size_references is null or jsonb_typeof(p_size_references)<>'array' then raise exception 'Size references must be an array' using errcode='22023'; end if;
  if p_fit_preferences is null or jsonb_typeof(p_fit_preferences)<>'array' then raise exception 'Fit preferences must be an array' using errcode='22023'; end if;

  v_count:=jsonb_array_length(p_measurements);
  if v_count<1 or v_count>100 then raise exception 'Invalid measurement count' using errcode='22023'; end if;
  if exists(select 1 from jsonb_array_elements(p_measurements) e group by e->>'measurement_type_key' having count(*)>1) then
    raise exception 'Duplicate measurement type' using errcode='22023';
  end if;
  if exists(
    select 1 from jsonb_array_elements(p_measurements) e
    left join public.measurement_types mt on mt.key=e->>'measurement_type_key'
    where mt.key is null
       or nullif(e->>'entered_value','') is null
       or (e->>'entered_value')::numeric<=0
       or (e->>'entered_unit') not in ('in','cm','lb','kg')
       or (e ? 'confirm_unchanged' and jsonb_typeof(e->'confirm_unchanged')<>'boolean')
  ) then raise exception 'Invalid measurement payload' using errcode='22023'; end if;

  v_reference_count:=jsonb_array_length(p_size_references);
  if v_reference_count>6 then raise exception 'Invalid size reference count' using errcode='22023'; end if;
  if exists(select 1 from jsonb_array_elements(p_size_references) e group by e->>'reference_type' having count(*)>1) then
    raise exception 'Duplicate size reference type' using errcode='22023';
  end if;
  if exists(
    select 1 from jsonb_array_elements(p_size_references) e
    where (e->>'reference_type') not in ('bra','shoe','shirt','pants','dress','other')
       or nullif(btrim(e->>'original_size_label'),'') is null
       or char_length(btrim(e->>'original_size_label'))>60
       or char_length(coalesce(e->>'sizing_system',''))>20
       or char_length(coalesce(e->>'cup_designation',''))>10
       or (e->>'reference_type'='bra' and (
         coalesce(e->>'sizing_system','') not in ('US','UK','EU')
         or coalesce(e->>'band_size','') !~ '^[0-9]+([.][0-9]+)?$'
         or (e->>'band_size')::numeric<=0
         or nullif(upper(btrim(e->>'cup_designation')),'') is null
       ))
       or (e->>'reference_type'='shoe' and (
         coalesce(e->>'sizing_system','') not in ('US','UK','EU','JP')
         or coalesce(e->>'shoe_size','') !~ '^[0-9]+([.][0-9]+)?$'
         or (e->>'shoe_size')::numeric<=0
       ))
  ) then raise exception 'Invalid size reference payload' using errcode='22023'; end if;

  v_preference_count:=jsonb_array_length(p_fit_preferences);
  if v_preference_count>100 then raise exception 'Invalid fit preference count' using errcode='22023'; end if;
  if exists(select 1 from jsonb_array_elements(p_fit_preferences) e group by e->>'garment_type_key' having count(*)>1) then
    raise exception 'Duplicate garment fit preference' using errcode='22023';
  end if;
  if exists(
    select 1 from jsonb_array_elements(p_fit_preferences) e
    left join public.garment_types gt on gt.key=e->>'garment_type_key' and gt.active=true
    where gt.key is null or coalesce(e->>'preference','') not in ('fitted','standard','relaxed')
  ) then raise exception 'Invalid fit preference payload' using errcode='22023'; end if;

  update public.profiles set username=p_username,updated_at=now() where id=v_user_id;
  if not found then raise exception 'Profile not found'; end if;

  insert into public.fit_profiles(user_id,preferred_unit_system,completed_at,updated_at)
  values(v_user_id,p_unit_system,now(),now())
  on conflict(user_id) do update set preferred_unit_system=excluded.preferred_unit_system,completed_at=excluded.completed_at,updated_at=excluded.updated_at;

  delete from public.body_measurements bm
  where bm.user_id=v_user_id and not exists(
    select 1 from jsonb_array_elements(p_measurements) e where e->>'measurement_type_key'=bm.measurement_type_key
  );

  for v_measurement in select value from jsonb_array_elements(p_measurements)
  loop
    v_measurement_key:=v_measurement->>'measurement_type_key';
    v_confirm_unchanged:=coalesce((v_measurement->>'confirm_unchanged')::boolean,false);
    select mt.dimension into v_dimension from public.measurement_types mt where mt.key=v_measurement_key;

    insert into public.body_measurements(
      user_id,measurement_type_key,entered_value,entered_unit,source,method,context_note,measured_at,confirmed_at
    ) values(
      v_user_id,
      v_measurement_key,
      (v_measurement->>'entered_value')::numeric,
      (v_measurement->>'entered_unit')::public.measurement_unit,
      'manual'::public.measurement_source,
      case when v_dimension='weight'::public.measurement_dimension then 'scale'::public.measurement_method else 'tape'::public.measurement_method end,
      null,
      now(),
      now()
    )
    on conflict(user_id,measurement_type_key) do update set
      entered_value=excluded.entered_value,
      entered_unit=excluded.entered_unit,
      source='manual'::public.measurement_source,
      method=excluded.method,
      context_note=null,
      measured_at=case
        when public.body_measurements.value_canonical is distinct from excluded.value_canonical then now()
        else public.body_measurements.measured_at
      end,
      confirmed_at=case
        when public.body_measurements.value_canonical is distinct from excluded.value_canonical or v_confirm_unchanged then now()
        else public.body_measurements.confirmed_at
      end,
      updated_at=now();
  end loop;

  delete from public.user_size_references usr
  where usr.user_id=v_user_id and not exists(
    select 1 from jsonb_array_elements(p_size_references) e where e->>'reference_type'=usr.reference_type::text
  );

  insert into public.user_size_references(
    user_id,reference_type,original_size_label,sizing_system,band_size,cup_designation,shoe_size,normalized_value
  )
  select
    v_user_id,(e->>'reference_type')::public.size_reference_type,btrim(e->>'original_size_label'),
    nullif(upper(btrim(e->>'sizing_system')),''),
    case when e->>'reference_type'='bra' then (e->>'band_size')::numeric else null end,
    case when e->>'reference_type'='bra' then upper(btrim(e->>'cup_designation')) else null end,
    case when e->>'reference_type'='shoe' then (e->>'shoe_size')::numeric else null end,
    case
      when e->>'reference_type'='bra' then upper(btrim(e->>'sizing_system'))||':'||((e->>'band_size')::numeric(6,2))::text||':'||upper(btrim(e->>'cup_designation'))
      when e->>'reference_type'='shoe' then upper(btrim(e->>'sizing_system'))||':'||((e->>'shoe_size')::numeric(6,2))::text
      else public.normalize_search_text(btrim(e->>'original_size_label'))
    end
  from jsonb_array_elements(p_size_references) e
  on conflict(user_id,reference_type) do update set
    original_size_label=excluded.original_size_label,sizing_system=excluded.sizing_system,
    band_size=excluded.band_size,cup_designation=excluded.cup_designation,shoe_size=excluded.shoe_size,
    normalized_value=excluded.normalized_value,updated_at=now();

  delete from public.user_garment_fit_preferences where user_id=v_user_id;
  insert into public.user_garment_fit_preferences(user_id,garment_type_key,preference,updated_at)
  select v_user_id,e->>'garment_type_key',(e->>'preference')::public.garment_fit_preference,now()
  from jsonb_array_elements(p_fit_preferences) e where e->>'preference'<>'standard';

  v_version_id:=private.ensure_current_fit_profile_version('profile_save');
  return v_version_id;
end;
$$;
revoke all on function public.save_fit_profile(text,public.unit_system,jsonb,jsonb,jsonb) from public,anon;
grant execute on function public.save_fit_profile(text,public.unit_system,jsonb,jsonb,jsonb) to authenticated;

-- Immutable snapshots copy the confirmation state, but confirmation date is deliberately
-- omitted from the fingerprint. Confirming an unchanged value therefore does not invent a
-- new body state or rewrite any historical Fit Report association.
create or replace function private.ensure_fit_profile_version_for_user(
  p_user_id uuid,
  p_reason text default 'fit_report_lock'
) returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  v_current_version_id uuid;
  v_current_fingerprint text;
  v_fingerprint text;
  v_version_number integer;
  v_new_version_id uuid;
begin
  if p_reason not in ('profile_save','fit_report_lock','system') then raise exception 'Invalid Fit Profile version reason'; end if;

  select fp.current_version_id into v_current_version_id
  from public.fit_profiles fp where fp.user_id=p_user_id for update;
  if not found then raise exception 'Fit Profile not found'; end if;
  if not exists(select 1 from public.body_measurements bm where bm.user_id=p_user_id) then raise exception 'Cannot snapshot an empty Fit Profile'; end if;

  select encode(extensions.digest(
    coalesce((select string_agg(bm.measurement_type_key||':'||bm.value_canonical::text,'|' order by bm.measurement_type_key)
              from public.body_measurements bm where bm.user_id=p_user_id),'')
    ||'||'||
    coalesce((select string_agg(
      usr.reference_type::text||':'||coalesce(usr.normalized_value,'')||':'||coalesce(usr.sizing_system,'')||':'||
      coalesce(usr.band_size::text,'')||':'||coalesce(usr.cup_designation,'')||':'||coalesce(usr.shoe_size::text,''),
      '|' order by usr.reference_type::text)
      from public.user_size_references usr where usr.user_id=p_user_id),''),
    'sha256'),'hex') into v_fingerprint;

  if v_current_version_id is not null then
    select fpv.measurement_fingerprint into v_current_fingerprint
    from public.fit_profile_versions fpv where fpv.id=v_current_version_id and fpv.user_id=p_user_id;
    if v_current_fingerprint=v_fingerprint then return v_current_version_id; end if;
  end if;

  select coalesce(max(fpv.version_number),0)+1 into v_version_number
  from public.fit_profile_versions fpv where fpv.user_id=p_user_id;

  insert into public.fit_profile_versions(user_id,version_number,measurement_fingerprint,created_reason)
  values(p_user_id,v_version_number,v_fingerprint,p_reason) returning id into v_new_version_id;

  insert into public.fit_profile_version_measurements(
    fit_profile_version_id,measurement_type_key,entered_value,entered_unit,value_canonical,source,method,confirmed_at
  )
  select v_new_version_id,bm.measurement_type_key,bm.entered_value,bm.entered_unit,bm.value_canonical,bm.source,bm.method,bm.confirmed_at
  from public.body_measurements bm where bm.user_id=p_user_id;

  insert into public.fit_profile_version_size_references(
    fit_profile_version_id,reference_type,original_size_label,sizing_system,band_size,cup_designation,shoe_size,normalized_value
  )
  select v_new_version_id,usr.reference_type,usr.original_size_label,usr.sizing_system,usr.band_size,usr.cup_designation,usr.shoe_size,usr.normalized_value
  from public.user_size_references usr where usr.user_id=p_user_id;

  update public.fit_profiles set current_version_id=v_new_version_id,updated_at=now() where user_id=p_user_id;
  return v_new_version_id;
end;
$$;
revoke all on function private.ensure_fit_profile_version_for_user(uuid,text) from public,anon,authenticated;

-- #8 is already satisfied by the canonical bra match profile and garment adjustments:
-- Full Bust + Underbust remain the core, High Bust remains supporting evidence, and
-- bust_point_to_bust_point / shoulder_to_bust_point are optional advanced rows with small
-- weights. Do not add a second bra-specific scoring formula here; missing advanced geometry
-- remains coverage-neutral and never disqualifies a bra Match.

-- Freshness is applied only to reliable_coverage. The raw similarity numerator/denominator,
-- shared coverage and qualification tests remain exactly the existing canonical model.
create or replace function private.calculate_fit_matches_for_profile(p_profile_key text,p_result_limit integer default 30)
returns table(user_id uuid,username text,display_name text,avatar_url text,match_score integer,coverage_percent integer)
language plpgsql security definer set search_path='' as $$
declare v_user_id uuid:=auth.uid(); v_limit integer:=least(greatest(coalesce(p_result_limit,30),1),100);
begin
 if v_user_id is null then raise exception 'Authentication required' using errcode='28000'; end if;
 if not exists(select 1 from public.match_profiles where key=p_profile_key) then raise exception 'Unknown match profile'; end if;
 if not exists(select 1 from public.fit_profiles fp where fp.user_id=v_user_id and fp.completed_at is not null) then return; end if;
 return query
 with w as (
  select mpm.measurement_type_key,mpm.weight,mpm.coverage_weight,coalesce(mpm.tolerance_override_canonical,mt.default_tolerance_canonical) tolerance
  from public.match_profile_measurements mpm join public.measurement_types mt on mt.key=mpm.measurement_type_key where mpm.profile_key=p_profile_key
 ), meta as (
  select sum(w.coverage_weight) total_coverage,count(*)::integer measurement_count,mp.minimum_shared_measurements,mp.minimum_coverage from w cross join public.match_profiles mp where mp.key=p_profile_key group by mp.minimum_shared_measurements,mp.minimum_coverage
 ), candidates as (
  select p.id,p.username,p.display_name,p.avatar_url from public.profiles p join public.fit_profiles fp on fp.user_id=p.id and fp.completed_at is not null where p.id<>v_user_id and p.username is not null
 ), s as (
  select c.id,c.username,c.display_name,c.avatar_url,
   sum(case when me.value_canonical is not null and them.value_canonical is not null then private.fit_measurement_similarity(me.value_canonical,them.value_canonical,w.tolerance)*w.weight*sqrt(private.fit_measurement_reliability(me.source,me.method)*private.fit_measurement_reliability(them.source,them.method)) else 0 end) weighted_similarity,
   sum(case when me.value_canonical is not null and them.value_canonical is not null then w.weight*sqrt(private.fit_measurement_reliability(me.source,me.method)*private.fit_measurement_reliability(them.source,them.method)) else 0 end) similarity_weight,
   sum(case when me.value_canonical is not null and them.value_canonical is not null then w.coverage_weight else 0 end) shared_coverage,
   sum(case when me.value_canonical is not null and them.value_canonical is not null then w.coverage_weight*sqrt(private.fit_measurement_confidence_reliability(me.source,me.method,w.measurement_type_key,me.confirmed_at,now())*private.fit_measurement_confidence_reliability(them.source,them.method,w.measurement_type_key,them.confirmed_at,now())) else 0 end) reliable_coverage,
   count(*) filter(where me.value_canonical is not null and them.value_canonical is not null)::integer shared_count,
   max(meta.total_coverage) total_coverage,max(meta.measurement_count) measurement_count,max(meta.minimum_shared_measurements) minimum_shared_measurements,max(meta.minimum_coverage) minimum_coverage
  from candidates c cross join w cross join meta
  left join public.body_measurements me on me.user_id=v_user_id and me.measurement_type_key=w.measurement_type_key
  left join public.body_measurements them on them.user_id=c.id and them.measurement_type_key=w.measurement_type_key
  group by c.id,c.username,c.display_name,c.avatar_url
 ), q as (
  select s.*,least(1::numeric,greatest(0::numeric,shared_coverage/nullif(total_coverage,0))) coverage from s
  where similarity_weight>0 and shared_count>=minimum_shared_measurements and shared_coverage/nullif(total_coverage,0)>=minimum_coverage
 )
 select q.id,q.username,q.display_name,q.avatar_url,private.confidence_adjusted_match(weighted_similarity,similarity_weight,shared_coverage,reliable_coverage,total_coverage,shared_count,measurement_count),round(coverage*100)::integer
 from q order by 5 desc,6 desc,q.username limit v_limit;
end; $$;
revoke all on function private.calculate_fit_matches_for_profile(text,integer) from public,anon,authenticated;
grant execute on function private.calculate_fit_matches_for_profile(text,integer) to authenticated;

create or replace function private.calculate_fit_matches_for_garment(p_garment_type_key text,p_result_limit integer default 100)
returns table(user_id uuid,username text,display_name text,avatar_url text,match_score integer,coverage_percent integer)
language plpgsql security definer set search_path='' as $$
declare v_user_id uuid:=auth.uid(); v_limit integer:=least(greatest(coalesce(p_result_limit,100),1),100);
begin
 if v_user_id is null then raise exception 'Authentication required' using errcode='28000'; end if;
 if not exists(select 1 from public.garment_types where key=p_garment_type_key and active) then raise exception 'Unknown garment type'; end if;
 if not exists(select 1 from public.fit_profiles fp where fp.user_id=v_user_id and fp.completed_at is not null) then return; end if;
 return query
 with w as (select * from private.garment_match_measurements(p_garment_type_key)), meta as (
  select sum(coverage_weight) total_coverage,count(*)::integer measurement_count,max(minimum_shared_measurements) minimum_shared_measurements,max(minimum_coverage) minimum_coverage from w
 ), candidates as (
  select p.id,p.username,p.display_name,p.avatar_url from public.profiles p join public.fit_profiles fp on fp.user_id=p.id and fp.completed_at is not null where p.id<>v_user_id and p.username is not null
 ), s as (
  select c.id,c.username,c.display_name,c.avatar_url,
   sum(case when me.value_canonical is not null and them.value_canonical is not null then private.fit_measurement_similarity(me.value_canonical,them.value_canonical,w.tolerance)*w.weight*sqrt(private.fit_measurement_reliability(me.source,me.method)*private.fit_measurement_reliability(them.source,them.method)) else 0 end) weighted_similarity,
   sum(case when me.value_canonical is not null and them.value_canonical is not null then w.weight*sqrt(private.fit_measurement_reliability(me.source,me.method)*private.fit_measurement_reliability(them.source,them.method)) else 0 end) similarity_weight,
   sum(case when me.value_canonical is not null and them.value_canonical is not null then w.coverage_weight else 0 end) shared_coverage,
   sum(case when me.value_canonical is not null and them.value_canonical is not null then w.coverage_weight*sqrt(private.fit_measurement_confidence_reliability(me.source,me.method,w.measurement_type_key,me.confirmed_at,now())*private.fit_measurement_confidence_reliability(them.source,them.method,w.measurement_type_key,them.confirmed_at,now())) else 0 end) reliable_coverage,
   count(*) filter(where me.value_canonical is not null and them.value_canonical is not null)::integer shared_count,
   max(meta.total_coverage) total_coverage,max(meta.measurement_count) measurement_count,max(meta.minimum_shared_measurements) minimum_shared_measurements,max(meta.minimum_coverage) minimum_coverage
  from candidates c cross join w cross join meta
  left join public.body_measurements me on me.user_id=v_user_id and me.measurement_type_key=w.measurement_type_key
  left join public.body_measurements them on them.user_id=c.id and them.measurement_type_key=w.measurement_type_key
  group by c.id,c.username,c.display_name,c.avatar_url
 ), q as (
  select s.*,least(1::numeric,greatest(0::numeric,shared_coverage/nullif(total_coverage,0))) coverage from s
  where similarity_weight>0 and shared_count>=minimum_shared_measurements and shared_coverage/nullif(total_coverage,0)>=minimum_coverage
 ), base as (
  select q.*,private.confidence_adjusted_match(weighted_similarity,similarity_weight,shared_coverage,reliable_coverage,total_coverage,shared_count,measurement_count) base_match from q
 ), proportioned as (
  select base.*,private.refine_current_garment_match_with_proportions(base.id,p_garment_type_key,base.base_match) proportion_match from base
 )
 select proportioned.id,proportioned.username,proportioned.display_name,proportioned.avatar_url,
   proportioned.proportion_match,round(proportioned.coverage*100)::integer
 from proportioned order by 5 desc,6 desc,proportioned.username limit v_limit;
end; $$;
revoke all on function private.calculate_fit_matches_for_garment(text,integer) from public,anon,authenticated;
grant execute on function private.calculate_fit_matches_for_garment(text,integer) to authenticated;

create or replace function private.calculate_snapshot_match(p_fit_profile_version_id uuid,p_profile_key text)
returns table(match_score integer,coverage_percent integer)
language plpgsql security definer set search_path='' as $$
declare v_user_id uuid:=auth.uid();
begin
 if v_user_id is null then raise exception 'Authentication required' using errcode='28000'; end if;
 return query
 with snapshot as (select created_at from public.fit_profile_versions where id=p_fit_profile_version_id),
 w as (
  select mpm.measurement_type_key,mpm.weight,mpm.coverage_weight,coalesce(mpm.tolerance_override_canonical,mt.default_tolerance_canonical) tolerance from public.match_profile_measurements mpm join public.measurement_types mt on mt.key=mpm.measurement_type_key where mpm.profile_key=p_profile_key
 ), meta as (
  select sum(coverage_weight) total_coverage,count(*)::integer measurement_count,mp.minimum_shared_measurements,mp.minimum_coverage from w cross join public.match_profiles mp where mp.key=p_profile_key group by mp.minimum_shared_measurements,mp.minimum_coverage
 ), s as (
  select sum(case when me.value_canonical is not null and hist.value_canonical is not null then private.fit_measurement_similarity(me.value_canonical,hist.value_canonical,w.tolerance)*w.weight*sqrt(private.fit_measurement_reliability(me.source,me.method)*private.fit_measurement_reliability(hist.source,hist.method)) else 0 end) weighted_similarity,
   sum(case when me.value_canonical is not null and hist.value_canonical is not null then w.weight*sqrt(private.fit_measurement_reliability(me.source,me.method)*private.fit_measurement_reliability(hist.source,hist.method)) else 0 end) similarity_weight,
   sum(case when me.value_canonical is not null and hist.value_canonical is not null then w.coverage_weight else 0 end) shared_coverage,
   sum(case when me.value_canonical is not null and hist.value_canonical is not null then w.coverage_weight*sqrt(private.fit_measurement_confidence_reliability(me.source,me.method,w.measurement_type_key,me.confirmed_at,now())*private.fit_measurement_confidence_reliability(hist.source,hist.method,w.measurement_type_key,hist.confirmed_at,snapshot.created_at)) else 0 end) reliable_coverage,
   count(*) filter(where me.value_canonical is not null and hist.value_canonical is not null)::integer shared_count,
   max(meta.total_coverage) total_coverage,max(meta.measurement_count) measurement_count,max(meta.minimum_shared_measurements) minimum_shared_measurements,max(meta.minimum_coverage) minimum_coverage
  from w cross join meta cross join snapshot
  left join public.body_measurements me on me.user_id=v_user_id and me.measurement_type_key=w.measurement_type_key
  left join public.fit_profile_version_measurements hist on hist.fit_profile_version_id=p_fit_profile_version_id and hist.measurement_type_key=w.measurement_type_key
 ), resolved as (
  select case when similarity_weight>0 and shared_count>=minimum_shared_measurements and shared_coverage/nullif(total_coverage,0)>=minimum_coverage then private.confidence_adjusted_match(weighted_similarity,similarity_weight,shared_coverage,reliable_coverage,total_coverage,shared_count,measurement_count) else 0 end match_score,
         case when total_coverage>0 then round(100*least(1::numeric,greatest(0::numeric,shared_coverage/nullif(total_coverage,0))))::integer else 0 end coverage_percent from s
 )
 select resolved.match_score,resolved.coverage_percent from resolved;
end; $$;
revoke all on function private.calculate_snapshot_match(uuid,text) from public,anon;
grant execute on function private.calculate_snapshot_match(uuid,text) to authenticated;

create or replace function private.calculate_snapshot_match_for_product(p_fit_profile_version_id uuid,p_product_id uuid)
returns table(match_score integer,coverage_percent integer)
language plpgsql security definer set search_path='' as $$
declare v_user_id uuid:=auth.uid();
begin
 if v_user_id is null then raise exception 'Authentication required' using errcode='28000'; end if;
 return query
 with snapshot as (select created_at from public.fit_profile_versions where id=p_fit_profile_version_id),
 w as (select * from private.product_match_measurements(p_product_id)), meta as (
  select sum(coverage_weight) total_coverage,count(*)::integer measurement_count,max(minimum_shared_measurements) minimum_shared_measurements,max(minimum_coverage) minimum_coverage from w
 ), s as (
  select sum(case when me.value_canonical is not null and hist.value_canonical is not null then private.fit_measurement_similarity(me.value_canonical,hist.value_canonical,w.tolerance)*w.weight*sqrt(private.fit_measurement_reliability(me.source,me.method)*private.fit_measurement_reliability(hist.source,hist.method)) else 0 end) weighted_similarity,
   sum(case when me.value_canonical is not null and hist.value_canonical is not null then w.weight*sqrt(private.fit_measurement_reliability(me.source,me.method)*private.fit_measurement_reliability(hist.source,hist.method)) else 0 end) similarity_weight,
   sum(case when me.value_canonical is not null and hist.value_canonical is not null then w.coverage_weight else 0 end) shared_coverage,
   sum(case when me.value_canonical is not null and hist.value_canonical is not null then w.coverage_weight*sqrt(private.fit_measurement_confidence_reliability(me.source,me.method,w.measurement_type_key,me.confirmed_at,now())*private.fit_measurement_confidence_reliability(hist.source,hist.method,w.measurement_type_key,hist.confirmed_at,snapshot.created_at)) else 0 end) reliable_coverage,
   count(*) filter(where me.value_canonical is not null and hist.value_canonical is not null)::integer shared_count,
   max(meta.total_coverage) total_coverage,max(meta.measurement_count) measurement_count,max(meta.minimum_shared_measurements) minimum_shared_measurements,max(meta.minimum_coverage) minimum_coverage
  from w cross join meta cross join snapshot
  left join public.body_measurements me on me.user_id=v_user_id and me.measurement_type_key=w.measurement_type_key
  left join public.fit_profile_version_measurements hist on hist.fit_profile_version_id=p_fit_profile_version_id and hist.measurement_type_key=w.measurement_type_key
 ), base as (
  select case when similarity_weight>0 and shared_count>=minimum_shared_measurements and shared_coverage/nullif(total_coverage,0)>=minimum_coverage
      then private.confidence_adjusted_match(weighted_similarity,similarity_weight,shared_coverage,reliable_coverage,total_coverage,shared_count,measurement_count)
      else 0 end base_match,
    case when total_coverage>0 then round(100*least(1::numeric,greatest(0::numeric,shared_coverage/nullif(total_coverage,0))))::integer else 0 end coverage_percent
  from s
 ), proportioned as (
  select private.refine_snapshot_product_match_with_proportions(p_fit_profile_version_id,p_product_id,base.base_match) proportion_match,base.coverage_percent from base
 )
 select proportioned.proportion_match,proportioned.coverage_percent from proportioned;
end; $$;
revoke all on function private.calculate_snapshot_match_for_product(uuid,uuid) from public,anon,authenticated;

comment on column public.measurement_types.reconfirm_after_days is 'Private-Fit-Profile UX cadence for asking a member to reconfirm a measurement; age never invalidates the measurement.';
comment on column public.body_measurements.confirmed_at is 'Owner-private timestamp when this exact current measurement value was last measured or explicitly confirmed unchanged.';
comment on column public.fit_profile_version_measurements.confirmed_at is 'Historical copy of confirmation state used only as-of the immutable snapshot time; historical Fit Reports do not decay with calendar age.';
comment on function private.measurement_freshness_factor(text,timestamptz,timestamptz) is 'Mild confidence-only freshness factor. Does not alter raw similarity, qualification or coverage.';

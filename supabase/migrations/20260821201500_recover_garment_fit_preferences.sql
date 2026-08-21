-- LikeSized canonical migration: private garment-specific fit preferences.
-- Fit preference personalizes size recommendations only. It never changes body Match %
-- and is not copied into immutable historical body snapshots.

create type public.garment_fit_preference as enum ('fitted','standard','relaxed');

create table public.user_garment_fit_preferences (
  user_id uuid not null references public.profiles(id) on delete cascade,
  garment_type_key text not null references public.garment_types(key) on delete cascade,
  preference public.garment_fit_preference not null,
  updated_at timestamptz not null default now(),
  primary key(user_id,garment_type_key)
);

alter table public.user_garment_fit_preferences enable row level security;
create policy "owner reads garment fit preferences" on public.user_garment_fit_preferences
for select to authenticated using ((select auth.uid())=user_id);
create policy "owner inserts garment fit preferences" on public.user_garment_fit_preferences
for insert to authenticated with check ((select auth.uid())=user_id);
create policy "owner updates garment fit preferences" on public.user_garment_fit_preferences
for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "owner deletes garment fit preferences" on public.user_garment_fit_preferences
for delete to authenticated using ((select auth.uid())=user_id);

revoke all on public.user_garment_fit_preferences from public,anon,authenticated;
grant select,insert,update,delete on public.user_garment_fit_preferences to authenticated;

-- Extend the one canonical Fit Profile save so measurements, private normally-worn size
-- references, and current garment-fit preferences commit together.
revoke all on function public.save_fit_profile(text, public.unit_system, jsonb, jsonb)
from public,anon,authenticated;
drop function public.save_fit_profile(text, public.unit_system, jsonb, jsonb);

create function public.save_fit_profile(
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
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode='28000';
  end if;
  if p_username is null or p_username !~ '^[A-Za-z0-9_]{3,32}$' then
    raise exception 'Invalid username' using errcode='22023';
  end if;
  if p_measurements is null or jsonb_typeof(p_measurements)<>'array' then
    raise exception 'Measurements must be an array' using errcode='22023';
  end if;
  if p_size_references is null or jsonb_typeof(p_size_references)<>'array' then
    raise exception 'Size references must be an array' using errcode='22023';
  end if;
  if p_fit_preferences is null or jsonb_typeof(p_fit_preferences)<>'array' then
    raise exception 'Fit preferences must be an array' using errcode='22023';
  end if;

  v_count:=jsonb_array_length(p_measurements);
  if v_count<1 or v_count>100 then
    raise exception 'Invalid measurement count' using errcode='22023';
  end if;
  if exists(
    select 1 from jsonb_array_elements(p_measurements) e
    group by e->>'measurement_type_key' having count(*)>1
  ) then
    raise exception 'Duplicate measurement type' using errcode='22023';
  end if;
  if exists(
    select 1
    from jsonb_array_elements(p_measurements) e
    left join public.measurement_types mt on mt.key=e->>'measurement_type_key'
    where mt.key is null
       or nullif(e->>'entered_value','') is null
       or (e->>'entered_value')::numeric<=0
       or (e->>'entered_unit') not in ('in','cm','lb','kg')
  ) then
    raise exception 'Invalid measurement payload' using errcode='22023';
  end if;

  v_reference_count:=jsonb_array_length(p_size_references);
  if v_reference_count>6 then
    raise exception 'Invalid size reference count' using errcode='22023';
  end if;
  if exists(
    select 1 from jsonb_array_elements(p_size_references) e
    group by e->>'reference_type' having count(*)>1
  ) then
    raise exception 'Duplicate size reference type' using errcode='22023';
  end if;
  if exists(
    select 1
    from jsonb_array_elements(p_size_references) e
    where (e->>'reference_type') not in ('bra','shoe','shirt','pants','dress','other')
       or nullif(btrim(e->>'original_size_label'),'') is null
       or char_length(btrim(e->>'original_size_label'))>60
       or char_length(coalesce(e->>'sizing_system',''))>20
       or char_length(coalesce(e->>'cup_designation',''))>10
       or (
         e->>'reference_type'='bra'
         and (
           coalesce(e->>'sizing_system','') not in ('US','UK','EU')
           or coalesce(e->>'band_size','') !~ '^[0-9]+([.][0-9]+)?$'
           or (e->>'band_size')::numeric<=0
           or nullif(upper(btrim(e->>'cup_designation')),'') is null
         )
       )
       or (
         e->>'reference_type'='shoe'
         and (
           coalesce(e->>'sizing_system','') not in ('US','UK','EU','JP')
           or coalesce(e->>'shoe_size','') !~ '^[0-9]+([.][0-9]+)?$'
           or (e->>'shoe_size')::numeric<=0
         )
       )
  ) then
    raise exception 'Invalid size reference payload' using errcode='22023';
  end if;

  v_preference_count:=jsonb_array_length(p_fit_preferences);
  if v_preference_count>100 then
    raise exception 'Invalid fit preference count' using errcode='22023';
  end if;
  if exists(
    select 1 from jsonb_array_elements(p_fit_preferences) e
    group by e->>'garment_type_key' having count(*)>1
  ) then
    raise exception 'Duplicate garment fit preference' using errcode='22023';
  end if;
  if exists(
    select 1
    from jsonb_array_elements(p_fit_preferences) e
    left join public.garment_types gt on gt.key=e->>'garment_type_key' and gt.active=true
    where gt.key is null
       or coalesce(e->>'preference','') not in ('fitted','standard','relaxed')
  ) then
    raise exception 'Invalid fit preference payload' using errcode='22023';
  end if;

  update public.profiles
  set username=p_username,updated_at=now()
  where id=v_user_id;
  if not found then raise exception 'Profile not found'; end if;

  insert into public.fit_profiles(user_id,preferred_unit_system,completed_at,updated_at)
  values(v_user_id,p_unit_system,now(),now())
  on conflict(user_id) do update set
    preferred_unit_system=excluded.preferred_unit_system,
    completed_at=excluded.completed_at,
    updated_at=excluded.updated_at;

  delete from public.body_measurements bm
  where bm.user_id=v_user_id
    and not exists(
      select 1 from jsonb_array_elements(p_measurements) e
      where e->>'measurement_type_key'=bm.measurement_type_key
    );

  insert into public.body_measurements(
    user_id,measurement_type_key,entered_value,entered_unit,source,method,context_note,measured_at
  )
  select
    v_user_id,
    e->>'measurement_type_key',
    (e->>'entered_value')::numeric,
    (e->>'entered_unit')::public.measurement_unit,
    coalesce(nullif(e->>'source','')::public.measurement_source,'manual'::public.measurement_source),
    coalesce(nullif(e->>'method','')::public.measurement_method,'unknown'::public.measurement_method),
    nullif(e->>'context_note',''),
    case when nullif(e->>'measured_at','') is null then null else (e->>'measured_at')::timestamptz end
  from jsonb_array_elements(p_measurements) e
  on conflict(user_id,measurement_type_key) do update set
    entered_value=excluded.entered_value,
    entered_unit=excluded.entered_unit,
    source=excluded.source,
    method=excluded.method,
    context_note=excluded.context_note,
    measured_at=excluded.measured_at,
    updated_at=now();

  delete from public.user_size_references usr
  where usr.user_id=v_user_id
    and not exists(
      select 1 from jsonb_array_elements(p_size_references) e
      where e->>'reference_type'=usr.reference_type::text
    );

  insert into public.user_size_references(
    user_id,reference_type,original_size_label,sizing_system,
    band_size,cup_designation,shoe_size,normalized_value
  )
  select
    v_user_id,
    (e->>'reference_type')::public.size_reference_type,
    btrim(e->>'original_size_label'),
    nullif(upper(btrim(e->>'sizing_system')),''),
    case when e->>'reference_type'='bra' then (e->>'band_size')::numeric else null end,
    case when e->>'reference_type'='bra' then upper(btrim(e->>'cup_designation')) else null end,
    case when e->>'reference_type'='shoe' then (e->>'shoe_size')::numeric else null end,
    case
      when e->>'reference_type'='bra' then
        upper(btrim(e->>'sizing_system'))||':'||((e->>'band_size')::numeric(6,2))::text||':'||upper(btrim(e->>'cup_designation'))
      when e->>'reference_type'='shoe' then
        upper(btrim(e->>'sizing_system'))||':'||((e->>'shoe_size')::numeric(6,2))::text
      else public.normalize_search_text(btrim(e->>'original_size_label'))
    end
  from jsonb_array_elements(p_size_references) e
  on conflict(user_id,reference_type) do update set
    original_size_label=excluded.original_size_label,
    sizing_system=excluded.sizing_system,
    band_size=excluded.band_size,
    cup_designation=excluded.cup_designation,
    shoe_size=excluded.shoe_size,
    normalized_value=excluded.normalized_value,
    updated_at=now();

  -- Standard is the neutral default and is stored sparsely: no row means Standard.
  delete from public.user_garment_fit_preferences where user_id=v_user_id;
  insert into public.user_garment_fit_preferences(user_id,garment_type_key,preference,updated_at)
  select
    v_user_id,
    e->>'garment_type_key',
    (e->>'preference')::public.garment_fit_preference,
    now()
  from jsonb_array_elements(p_fit_preferences) e
  where e->>'preference'<>'standard';

  v_version_id:=private.ensure_current_fit_profile_version('profile_save');
  return v_version_id;
end;
$$;

revoke all on function public.save_fit_profile(text,public.unit_system,jsonb,jsonb,jsonb)
from public,anon;
grant execute on function public.save_fit_profile(text,public.unit_system,jsonb,jsonb,jsonb)
to authenticated;

comment on table public.user_garment_fit_preferences is
  'Owner-private current fit-style preferences by garment type. Missing row means Standard. Preferences personalize recommendation desirability only and are not body Match inputs.';
comment on function public.save_fit_profile(text,public.unit_system,jsonb,jsonb,jsonb) is
  'Atomically replaces authenticated owner measurements, private size references, and current garment fit preferences, then creates/reuses the immutable body-state version.';

-- LikeSized canonical migration: 20260819151101_atomic_fit_profile_version_saves
-- Exact SQL applied to the connected Supabase project.

-- Canonical atomic Fit Profile save. Replaces the current measurement set and commits an immutable version in one transaction.

create or replace function public.save_fit_profile(
  p_username text,
  p_unit_system public.unit_system,
  p_measurements jsonb
)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user_id uuid := auth.uid();
  v_version_id uuid;
  v_count integer;
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

  v_count := jsonb_array_length(p_measurements);
  if v_count < 1 or v_count > 100 then
    raise exception 'Invalid measurement count' using errcode='22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_measurements) e
    group by e->>'measurement_type_key'
    having count(*)>1
  ) then
    raise exception 'Duplicate measurement type' using errcode='22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_measurements) e
    left join public.measurement_types mt on mt.key=e->>'measurement_type_key'
    where mt.key is null
       or nullif(e->>'entered_value','') is null
       or (e->>'entered_value')::numeric <= 0
       or (e->>'entered_unit') not in ('in','cm','lb','kg')
  ) then
    raise exception 'Invalid measurement payload' using errcode='22023';
  end if;

  update public.profiles
  set username=p_username,
      updated_at=now()
  where id=v_user_id;

  if not found then
    raise exception 'Profile not found';
  end if;

  insert into public.fit_profiles(user_id,preferred_unit_system,completed_at,updated_at)
  values(v_user_id,p_unit_system,now(),now())
  on conflict(user_id) do update set
    preferred_unit_system=excluded.preferred_unit_system,
    completed_at=excluded.completed_at,
    updated_at=excluded.updated_at;

  delete from public.body_measurements bm
  where bm.user_id=v_user_id
    and not exists (
      select 1
      from jsonb_array_elements(p_measurements) e
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

  v_version_id := private.ensure_fit_profile_version_for_user(v_user_id,'profile_save');
  return v_version_id;
end;
$$;

revoke all on function public.save_fit_profile(text,public.unit_system,jsonb) from public,anon;
grant execute on function public.save_fit_profile(text,public.unit_system,jsonb) to authenticated;

comment on function public.save_fit_profile(text,public.unit_system,jsonb) is
  'Atomic canonical current Fit Profile save: replaces current measurements, normalizes via body_measurements trigger, and commits/reuses the immutable current version.';

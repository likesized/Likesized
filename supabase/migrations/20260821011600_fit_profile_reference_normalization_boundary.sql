-- LikeSized canonical migration: keep generic size-reference normalization inside the
-- authenticated atomic Fit Profile save. The general-purpose public normalizer remains
-- non-executable to API roles; this preserves the locked least-privilege boundary from
-- 20260819170808_inline_private_size_reference_normalization.sql while retaining the
-- Fit Match audit freshness/manual-entry behavior.

revoke all on function public.normalize_search_text(text) from public, anon, authenticated;

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
      else nullif(regexp_replace(lower(btrim(e->>'original_size_label')), '[^a-z0-9]+', '', 'g'), '')
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

comment on function public.save_fit_profile(text,public.unit_system,jsonb,jsonb,jsonb) is
  'Authenticated SECURITY INVOKER atomic Fit Profile save: manual measurements, private size references normalized internally without exposing the general-purpose normalizer, current garment-fit preferences, and immutable body-state versioning.';

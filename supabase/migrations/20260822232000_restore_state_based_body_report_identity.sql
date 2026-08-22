-- Fit Reports represent reusable body-fit states, not chronological episodes.
-- For the same member + Product + normalized size + objective garment variant,
-- reuse/update any existing report whose established garment-relevant body state
-- remains within the 2% threshold. Returning later to a prior body state should
-- not create a duplicate Fit Report solely because time passed.

create or replace function public.save_known_fit_report(
  p_new_closet_item_id uuid,
  p_product_id uuid,
  p_variant_id uuid,
  p_fit_profile_version_id uuid,
  p_size_label text,
  p_normalized_size_id uuid,
  p_fit public.fit_rating,
  p_garment_condition public.garment_condition,
  p_reported_condition text,
  p_fit_notes text,
  p_garment_type_key text,
  p_garment_answers jsonb,
  p_objective_variant_key text
)
returns table(fit_report_id uuid,closet_item_id uuid,created boolean)
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_user_id uuid:=auth.uid();
  v_fit_report_id uuid;
  v_closet_item_id uuid;
  v_previous_match_profile_version_id uuid;
  v_can_strengthen boolean:=false;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode='28000';
  end if;
  if p_new_closet_item_id is null or p_product_id is null or p_variant_id is null
     or p_fit_profile_version_id is null or p_normalized_size_id is null then
    raise exception 'Missing Fit Report identity';
  end if;
  if nullif(btrim(coalesce(p_size_label,'')),'') is null then
    raise exception 'Size required';
  end if;
  if nullif(btrim(coalesce(p_objective_variant_key,'')),'') is null
     or p_objective_variant_key !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid objective variant key';
  end if;
  if jsonb_typeof(coalesce(p_garment_answers,'{}'::jsonb))<>'object' then
    raise exception 'Invalid garment answers';
  end if;
  if p_reported_condition not in ('new','used','altered') then
    raise exception 'Invalid reported condition';
  end if;
  if not exists(
    select 1 from public.products
    where id=p_product_id and catalog_status<>'rejected'::public.product_data_status
  ) then
    raise exception 'Unknown Product';
  end if;
  if not exists(
    select 1 from public.product_variants
    where id=p_variant_id and product_id=p_product_id
  ) then
    raise exception 'Unknown Product variant';
  end if;
  if not exists(select 1 from public.normalized_sizes where id=p_normalized_size_id) then
    raise exception 'Unknown normalized size';
  end if;
  if not exists(
    select 1 from public.fit_profile_versions
    where id=p_fit_profile_version_id and user_id=v_user_id
  ) then
    raise exception 'Unknown Fit Profile version';
  end if;
  if not exists(
    select 1 from public.garment_types
    where key=p_garment_type_key and intake_active
  ) then
    raise exception 'Unknown garment type';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      v_user_id::text||':'||p_product_id::text||':'||p_normalized_size_id::text||':'||p_objective_variant_key,
      0
    )
  );

  select
    fr.id,
    fr.closet_item_id,
    coalesce(fr.match_fit_profile_version_id,fr.fit_profile_version_id)
  into
    v_fit_report_id,
    v_closet_item_id,
    v_previous_match_profile_version_id
  from public.fit_reports fr
  where fr.user_id=v_user_id
    and fr.product_id=p_product_id
    and fr.normalized_size_id=p_normalized_size_id
    and fr.objective_variant_key=p_objective_variant_key
    and not exists (
      select 1
      from private.fit_report_body_identity_measurements baseline
      join private.product_match_measurements(p_product_id) pm
        on pm.measurement_type_key=baseline.measurement_type_key
      join public.fit_profile_version_measurements current_measurement
        on current_measurement.fit_profile_version_id=p_fit_profile_version_id
       and current_measurement.measurement_type_key=baseline.measurement_type_key
       and current_measurement.value_canonical is not null
      where baseline.fit_report_id=fr.id
        and abs(current_measurement.value_canonical-baseline.value_canonical)
            / nullif(abs(baseline.value_canonical),0) >= 0.02
    )
  order by
    (
      select count(*)
      from private.fit_report_body_identity_measurements baseline
      join public.fit_profile_version_measurements current_measurement
        on current_measurement.fit_profile_version_id=p_fit_profile_version_id
       and current_measurement.measurement_type_key=baseline.measurement_type_key
       and current_measurement.value_canonical is not null
      where baseline.fit_report_id=fr.id
    ) desc,
    fr.updated_at desc,
    fr.id
  limit 1
  for update of fr;

  if v_fit_report_id is not null then
    select not exists (
      select 1
      from private.product_match_measurements(p_product_id) pm
      join public.fit_profile_version_measurements previous_measurement
        on previous_measurement.fit_profile_version_id=v_previous_match_profile_version_id
       and previous_measurement.measurement_type_key=pm.measurement_type_key
       and previous_measurement.value_canonical is not null
      where not exists (
        select 1
        from public.fit_profile_version_measurements current_measurement
        where current_measurement.fit_profile_version_id=p_fit_profile_version_id
          and current_measurement.measurement_type_key=pm.measurement_type_key
          and current_measurement.value_canonical is not null
      )
    ) into v_can_strengthen;

    update public.fit_reports
    set size_label=btrim(p_size_label),
        fit=p_fit,
        garment_condition=p_garment_condition,
        reported_condition=p_reported_condition,
        fit_notes=nullif(btrim(coalesce(p_fit_notes,'')),''),
        garment_type_key=p_garment_type_key,
        garment_answers=coalesce(p_garment_answers,'{}'::jsonb),
        match_fit_profile_version_id=case
          when v_can_strengthen then p_fit_profile_version_id
          else match_fit_profile_version_id
        end,
        revision_count=revision_count+1,
        updated_at=now()
    where id=v_fit_report_id;

    insert into private.fit_report_body_identity_measurements(
      fit_report_id,measurement_type_key,value_canonical,source_profile_version_id
    )
    select
      v_fit_report_id,
      pm.measurement_type_key,
      current_measurement.value_canonical,
      p_fit_profile_version_id
    from private.product_match_measurements(p_product_id) pm
    join public.fit_profile_version_measurements current_measurement
      on current_measurement.fit_profile_version_id=p_fit_profile_version_id
     and current_measurement.measurement_type_key=pm.measurement_type_key
     and current_measurement.value_canonical is not null
     and current_measurement.value_canonical>0
    on conflict on constraint fit_report_body_identity_measurements_pkey do nothing;

    return query select v_fit_report_id,v_closet_item_id,false;
    return;
  end if;

  insert into public.closet_items(
    id,user_id,product_id,variant_id,size_label,normalized_size_id,visibility,wears_count
  ) values(
    p_new_closet_item_id,v_user_id,p_product_id,p_variant_id,btrim(p_size_label),
    p_normalized_size_id,'shared',0
  );

  insert into public.fit_reports(
    user_id,closet_item_id,product_id,variant_id,fit_profile_version_id,
    match_fit_profile_version_id,size_label,normalized_size_id,fit,garment_condition,
    reported_condition,fit_notes,would_buy_again,garment_type_key,garment_answers,
    objective_variant_key,revision_count
  ) values(
    v_user_id,p_new_closet_item_id,p_product_id,p_variant_id,p_fit_profile_version_id,
    p_fit_profile_version_id,btrim(p_size_label),p_normalized_size_id,p_fit,
    p_garment_condition,p_reported_condition,nullif(btrim(coalesce(p_fit_notes,'')),''),
    null,p_garment_type_key,coalesce(p_garment_answers,'{}'::jsonb),
    p_objective_variant_key,1
  ) returning id into v_fit_report_id;

  insert into private.fit_report_body_identity_measurements(
    fit_report_id,measurement_type_key,value_canonical,source_profile_version_id
  )
  select
    v_fit_report_id,
    pm.measurement_type_key,
    current_measurement.value_canonical,
    p_fit_profile_version_id
  from private.product_match_measurements(p_product_id) pm
  join public.fit_profile_version_measurements current_measurement
    on current_measurement.fit_profile_version_id=p_fit_profile_version_id
   and current_measurement.measurement_type_key=pm.measurement_type_key
   and current_measurement.value_canonical is not null
   and current_measurement.value_canonical>0
  on conflict on constraint fit_report_body_identity_measurements_pkey do nothing;

  return query select v_fit_report_id,p_new_closet_item_id,true;
end;
$function$;

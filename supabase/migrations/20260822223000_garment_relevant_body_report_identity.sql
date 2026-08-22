-- Count a new known-Product Fit Report only when garment-relevant body evidence
-- meaningfully changes. Newly added relevant measurements enrich the existing
-- report rather than splitting it. The original immutable body snapshot remains
-- on fit_profile_version_id; match_fit_profile_version_id may advance only when
-- it safely strengthens the report's matching evidence.

alter table public.fit_reports
  add column if not exists match_fit_profile_version_id uuid
  references public.fit_profile_versions(id) on delete restrict;

update public.fit_reports
set match_fit_profile_version_id=fit_profile_version_id
where match_fit_profile_version_id is null;

create table if not exists private.fit_report_body_identity_measurements (
  fit_report_id uuid not null references public.fit_reports(id) on delete cascade,
  measurement_type_key text not null references public.measurement_types(key),
  value_canonical numeric not null check (value_canonical>0),
  source_profile_version_id uuid not null references public.fit_profile_versions(id) on delete restrict,
  established_at timestamptz not null default now(),
  primary key (fit_report_id,measurement_type_key)
);

revoke all on private.fit_report_body_identity_measurements from public,anon,authenticated;

insert into private.fit_report_body_identity_measurements(
  fit_report_id,measurement_type_key,value_canonical,source_profile_version_id,established_at
)
select
  fr.id,
  pm.measurement_type_key,
  hist.value_canonical,
  fr.fit_profile_version_id,
  fr.created_at
from public.fit_reports fr
cross join lateral private.product_match_measurements(fr.product_id) pm
join public.fit_profile_version_measurements hist
  on hist.fit_profile_version_id=fr.fit_profile_version_id
 and hist.measurement_type_key=pm.measurement_type_key
where fr.product_id is not null
  and hist.value_canonical is not null
  and hist.value_canonical>0
on conflict (fit_report_id,measurement_type_key) do nothing;

drop index if exists public.fit_reports_known_counted_identity_uq;
drop index if exists public.fit_reports_product_variant_lookup_idx;

create index if not exists fit_reports_product_variant_lookup_idx
on public.fit_reports(user_id,product_id,normalized_size_id,objective_variant_key,updated_at desc)
where product_id is not null and objective_variant_key is not null;

create or replace function private.lock_fit_report_history()
returns trigger
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_version_user_id uuid;
  v_catalog_resolution boolean:=coalesce(current_setting('likesized.catalog_resolution',true),'off')='on';
begin
  if tg_op='INSERT' then
    if new.fit_profile_version_id is null then
      new.fit_profile_version_id := private.ensure_fit_profile_version_for_user(new.user_id,'fit_report_lock');
    end if;
    if new.match_fit_profile_version_id is null then
      new.match_fit_profile_version_id := new.fit_profile_version_id;
    end if;
    select fpv.user_id into v_version_user_id
    from public.fit_profile_versions fpv
    where fpv.id=new.fit_profile_version_id;
    if v_version_user_id is distinct from new.user_id then
      raise exception 'Fit Report snapshot does not belong to this user';
    end if;
    select fpv.user_id into v_version_user_id
    from public.fit_profile_versions fpv
    where fpv.id=new.match_fit_profile_version_id;
    if v_version_user_id is distinct from new.user_id then
      raise exception 'Fit Report match snapshot does not belong to this user';
    end if;
    return new;
  end if;

  if v_catalog_resolution
     and old.product_id is null and new.product_id is not null and old.variant_id is null
     and new.fit_profile_version_id is not distinct from old.fit_profile_version_id
     and new.match_fit_profile_version_id is not distinct from old.match_fit_profile_version_id
     and new.user_id is not distinct from old.user_id
     and new.closet_item_id is not distinct from old.closet_item_id
     and new.size_label is not distinct from old.size_label
     and new.normalized_size_id is not distinct from old.normalized_size_id
     and exists (
       select 1 from public.closet_items ci
       where ci.id=new.closet_item_id
         and ci.user_id=new.user_id
         and ci.product_id=new.product_id
         and ci.variant_id is not distinct from new.variant_id
         and ci.normalized_size_id is not distinct from new.normalized_size_id
         and ci.size_label=new.size_label
     ) then
    return new;
  end if;

  if new.fit_profile_version_id is distinct from old.fit_profile_version_id
     or new.user_id is distinct from old.user_id
     or new.closet_item_id is distinct from old.closet_item_id
     or new.product_id is distinct from old.product_id
     or new.variant_id is distinct from old.variant_id
     or new.size_label is distinct from old.size_label
     or new.normalized_size_id is distinct from old.normalized_size_id then
    raise exception 'Historical Fit Report garment/body association is immutable; create a new Fit Report observation instead';
  end if;

  if new.match_fit_profile_version_id is distinct from old.match_fit_profile_version_id then
    if new.match_fit_profile_version_id is null then
      raise exception 'Fit Report match snapshot is required';
    end if;

    select fpv.user_id into v_version_user_id
    from public.fit_profile_versions fpv
    where fpv.id=new.match_fit_profile_version_id;
    if v_version_user_id is distinct from old.user_id then
      raise exception 'Fit Report match snapshot does not belong to this user';
    end if;

    -- A safely enriched snapshot cannot drop garment-relevant measurements that
    -- the report was already using for Match.
    if exists (
      select 1
      from private.product_match_measurements(old.product_id) pm
      join public.fit_profile_version_measurements previous_measurement
        on previous_measurement.fit_profile_version_id=coalesce(old.match_fit_profile_version_id,old.fit_profile_version_id)
       and previous_measurement.measurement_type_key=pm.measurement_type_key
       and previous_measurement.value_canonical is not null
      where not exists (
        select 1
        from public.fit_profile_version_measurements next_measurement
        where next_measurement.fit_profile_version_id=new.match_fit_profile_version_id
          and next_measurement.measurement_type_key=pm.measurement_type_key
          and next_measurement.value_canonical is not null
      )
    ) then
      raise exception 'Fit Report match enrichment cannot remove established garment-relevant evidence';
    end if;

    -- Once a relevant measurement has been established for this report, a
    -- change of 2% or more is a new body situation rather than enrichment.
    if exists (
      select 1
      from private.fit_report_body_identity_measurements baseline
      join private.product_match_measurements(old.product_id) pm
        on pm.measurement_type_key=baseline.measurement_type_key
      join public.fit_profile_version_measurements next_measurement
        on next_measurement.fit_profile_version_id=new.match_fit_profile_version_id
       and next_measurement.measurement_type_key=baseline.measurement_type_key
       and next_measurement.value_canonical is not null
      where baseline.fit_report_id=old.id
        and abs(next_measurement.value_canonical-baseline.value_canonical)
            / nullif(abs(baseline.value_canonical),0) >= 0.02
    ) then
      raise exception 'Meaningful garment-relevant body change requires a new Fit Report';
    end if;
  end if;

  return new;
end;
$function$;

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

  -- Match an existing counted report when every already-established relevant
  -- body measurement remains within 2%. Missing -> filled is deliberately not
  -- a split; it is handled as enrichment below.
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
    -- Advance the matching snapshot only when the new profile retains every
    -- relevant measurement the report was already using. This lets newly
    -- filled measurements strengthen the report without letting a later blank
    -- erase useful historical evidence.
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

    -- A relevant measurement that used to be blank becomes established body
    -- evidence for this report. Future >=2% changes to it can then split.
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
    on conflict (fit_report_id,measurement_type_key) do nothing;

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
  on conflict (fit_report_id,measurement_type_key) do nothing;

  return query select v_fit_report_id,p_new_closet_item_id,true;
end;
$function$;

create or replace function public.get_fit_report_snapshot_matches(p_fit_report_ids uuid[])
returns table(fit_report_id uuid,historical_match_score integer,historical_coverage_percent integer)
language sql
security definer
set search_path=''
as $function$
with viewer as (
  select auth.uid() user_id
)
select
  fr.id,
  hm.match_score,
  hm.coverage_percent
from public.fit_reports fr
join public.closet_items ci on ci.id=fr.closet_item_id
cross join viewer v
cross join lateral private.calculate_snapshot_match_for_product(
  coalesce(fr.match_fit_profile_version_id,fr.fit_profile_version_id),
  fr.product_id
) hm
where v.user_id is not null
  and fr.id=any(coalesce(p_fit_report_ids,'{}'::uuid[]))
  and (
    fr.user_id=v.user_id
    or ci.visibility='shared'::public.closet_visibility
  )
limit 100;
$function$;

create or replace function public.get_product_evidence_candidates(
  p_product_id uuid,
  p_variant_id uuid default null,
  p_result_limit integer default 200
)
returns table(
  fit_report_id uuid,
  user_id uuid,
  closet_item_id uuid,
  evidence_product_id uuid,
  evidence_variant_id uuid,
  fit_profile_version_id uuid,
  original_size_label text,
  normalized_size_id uuid,
  fit public.fit_rating,
  would_buy_again boolean,
  historical_match_score integer,
  historical_coverage_percent integer,
  evidence_level public.evidence_level,
  evidence_rank integer,
  attribute_overlap integer,
  directional_fit_support numeric
)
language sql
security definer
set search_path=''
as $function$
with viewer as (
  select auth.uid() user_id
), target as (
  select p.*,
    case
      when p_variant_id is not null
       and exists(select 1 from public.product_variants pv where pv.id=p_variant_id and pv.product_id=p.id)
      then p_variant_id
      else null::uuid
    end target_variant_id
  from public.products p
  where p.id=p_product_id
), candidates as (
  select
    fr.id fit_report_id,
    fr.user_id,
    fr.closet_item_id,
    fr.product_id evidence_product_id,
    fr.variant_id evidence_variant_id,
    fr.fit_profile_version_id,
    coalesce(fr.match_fit_profile_version_id,fr.fit_profile_version_id) match_fit_profile_version_id,
    fr.size_label original_size_label,
    fr.normalized_size_id,
    fr.fit,
    fr.would_buy_again,
    fr.created_at observed_at,
    ep.brand_id,
    ep.product_family_id,
    ep.garment_type_key,
    ep.category,
    (select count(*)::integer
       from public.product_attribute_values ta
       join public.product_attribute_values ea
         on ea.attribute_key=ta.attribute_key and ea.option_key=ta.option_key
       where ta.product_id=p_product_id
         and ea.product_id=ep.id
         and ta.source_status in ('corroborated'::public.product_data_status,'verified'::public.product_data_status)
         and ea.source_status in ('corroborated'::public.product_data_status,'verified'::public.product_data_status)
         and ta.confidence>=.75
         and ea.confidence>=.75) attribute_overlap,
    t.brand_id target_brand_id,
    t.product_family_id target_family_id,
    t.garment_type_key target_garment_type,
    t.category target_category,
    t.target_variant_id
  from public.fit_reports fr
  join public.closet_items ci
    on ci.id=fr.closet_item_id
   and ci.visibility='shared'::public.closet_visibility
  join public.products ep on ep.id=fr.product_id
  cross join target t
  cross join viewer v
  where v.user_id is not null
    and fr.garment_condition='normal'::public.garment_condition
    and (fr.garment_type_key is null or ep.garment_type_key is null or fr.garment_type_key=ep.garment_type_key)
    and (
      fr.product_id=p_product_id
      or (t.product_family_id is not null and ep.product_family_id=t.product_family_id)
      or (t.garment_type_key is not null and ep.garment_type_key=t.garment_type_key)
      or ep.category=t.category
    )
), scored as (
  select
    c.*,
    hm.match_score snapshot_match_score,
    hm.coverage_percent snapshot_coverage_percent,
    private.calculate_directional_fit_support_for_product(c.match_fit_profile_version_id,p_product_id,c.fit) resolved_directional_fit_support,
    case
      when c.target_variant_id is not null and c.evidence_variant_id=c.target_variant_id then 'exact_variant'::public.evidence_level
      when c.evidence_product_id=p_product_id then 'exact_product'::public.evidence_level
      when c.target_family_id is not null and c.product_family_id=c.target_family_id then 'product_family'::public.evidence_level
      when c.target_garment_type is not null and c.garment_type_key=c.target_garment_type and c.attribute_overlap>0 then 'similar_garments'::public.evidence_level
      when c.brand_id=c.target_brand_id and c.garment_type_key=c.target_garment_type then 'brand_garment_type'::public.evidence_level
      else 'category_fit'::public.evidence_level
    end resolved_evidence_level,
    case
      when c.target_variant_id is not null and c.evidence_variant_id=c.target_variant_id then 1
      when c.evidence_product_id=p_product_id then 2
      when c.target_family_id is not null and c.product_family_id=c.target_family_id then 3
      when c.target_garment_type is not null and c.garment_type_key=c.target_garment_type and c.attribute_overlap>0 then 4
      when c.brand_id=c.target_brand_id and c.garment_type_key=c.target_garment_type then 5
      else 6
    end resolved_evidence_rank
  from candidates c
  cross join lateral private.calculate_snapshot_match_for_product(c.match_fit_profile_version_id,p_product_id) hm
)
select
  s.fit_report_id,
  s.user_id,
  s.closet_item_id,
  s.evidence_product_id,
  s.evidence_variant_id,
  s.fit_profile_version_id,
  s.original_size_label,
  s.normalized_size_id,
  s.fit,
  s.would_buy_again,
  s.snapshot_match_score,
  s.snapshot_coverage_percent,
  s.resolved_evidence_level,
  s.resolved_evidence_rank,
  s.attribute_overlap,
  s.resolved_directional_fit_support
from scored s
where s.snapshot_match_score>0
order by
  s.resolved_evidence_rank,
  s.snapshot_match_score desc,
  s.snapshot_coverage_percent desc,
  s.attribute_overlap desc,
  s.observed_at desc,
  s.fit_report_id
limit least(greatest(coalesce(p_result_limit,200),1),500);
$function$;

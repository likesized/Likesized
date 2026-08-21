-- LikeSized canonical migration: contextual Chest vs Full Bust handling.
-- Full Bust becomes the primary upper-body circumference only when the target Product is
-- explicitly a women's garment in a bust-shaped garment type. Generic Tops/Overall stay
-- neutral, and mens/kids/unisex/unknown Products are never inferred into this context.

create table private.bust_shaping_product_rules (
  garment_type_key text primary key references public.garment_types(key) on delete cascade,
  full_bust_weight_multiplier numeric(6,4) not null check(full_bust_weight_multiplier>=1 and full_bust_weight_multiplier<=2),
  chest_weight_multiplier numeric(6,4) not null check(chest_weight_multiplier>0 and chest_weight_multiplier<=1),
  full_bust_coverage_floor numeric(6,5) not null check(full_bust_coverage_floor>=0 and full_bust_coverage_floor<=.35),
  bust_to_chest_ratio_weight numeric(6,5) not null default 0 check(bust_to_chest_ratio_weight>=0 and bust_to_chest_ratio_weight<=.04),
  bust_to_chest_relative_tolerance numeric(6,5) not null default .10 check(bust_to_chest_relative_tolerance>0 and bust_to_chest_relative_tolerance<=.30)
);
revoke all on private.bust_shaping_product_rules from public,anon,authenticated;

insert into private.bust_shaping_product_rules
(garment_type_key,full_bust_weight_multiplier,chest_weight_multiplier,full_bust_coverage_floor,bust_to_chest_ratio_weight,bust_to_chest_relative_tolerance)
values
  ('blouse',1.40,.75,.10,.025,.10),
  ('dresses',1.15,.85,.18,.020,.10),
  ('bodysuits',1.20,.85,.18,.020,.10),
  ('suit_jackets',1.25,.85,.10,.020,.10),
  ('blazers',1.25,.85,.10,.020,.10);

-- Preserve the provenance-aware product measurement resolver from the garment enrichment
-- migration and add only the explicit women's bust-shaping layer. Full Bust remains absent
-- for mens/kids, optional/downweighted for unisex, and neutral for unknown market segment.
create or replace function private.product_match_measurements(p_product_id uuid)
returns table(measurement_type_key text,weight numeric,coverage_weight numeric,tolerance numeric,minimum_shared_measurements integer,minimum_coverage numeric)
language sql security definer set search_path='' as $$
with target as (
  select p.id,p.garment_type_key,p.category,p.market_segment,
         case when p.market_segment='womens'::public.garment_market_segment then r.full_bust_weight_multiplier else null end bust_multiplier,
         case when p.market_segment='womens'::public.garment_market_segment then r.chest_weight_multiplier else null end chest_multiplier,
         case when p.market_segment='womens'::public.garment_market_segment then r.full_bust_coverage_floor else null end bust_coverage_floor
  from public.products p
  left join private.bust_shaping_product_rules r on r.garment_type_key=p.garment_type_key
  where p.id=p_product_id
), base as (
  select gm.* from target t cross join lateral private.garment_match_measurements(t.garment_type_key) gm where t.garment_type_key is not null
  union all
  select mpm.measurement_type_key,mpm.weight,mpm.coverage_weight,coalesce(mpm.tolerance_override_canonical,mt.default_tolerance_canonical),mp.minimum_shared_measurements::integer,mp.minimum_coverage
  from target t join public.match_profiles mp on mp.key=case t.category when 'tops' then 'tops_default' when 'bottoms' then 'bottoms_default' when 'dresses' then 'dresses_default' when 'shoes' then 'shoes' else 'overall' end
  join public.match_profile_measurements mpm on mpm.profile_key=mp.key join public.measurement_types mt on mt.key=mpm.measurement_type_key where t.garment_type_key is null
), meta as (
  select max(minimum_shared_measurements)::integer minimum_shared_measurements,max(minimum_coverage) minimum_coverage from base
), attribute_effects as (
  select pav.attribute_key,pav.option_key,
    case pav.source_status
      when 'verified'::public.product_data_status then 1::numeric
      when 'corroborated'::public.product_data_status then greatest(.80::numeric,pav.confidence)
      when 'provisional'::public.product_data_status then least(.60::numeric,pav.confidence)
      else 0::numeric end evidence_confidence
  from public.product_attribute_values pav where pav.product_id=p_product_id
), attr_rows as (
  select a.measurement_type_key,
    case when bool_or((1+(a.weight_multiplier-1)*ae.evidence_confidence)=0) then 0::numeric else exp(sum(ln(nullif(1+(a.weight_multiplier-1)*ae.evidence_confidence,0)))) end weight_multiplier,
    case when bool_or((1+(a.coverage_multiplier-1)*ae.evidence_confidence)=0) then 0::numeric else exp(sum(ln(nullif(1+(a.coverage_multiplier-1)*ae.evidence_confidence,0)))) end coverage_multiplier,
    exp(sum(ln(1+(a.tolerance_multiplier-1)*ae.evidence_confidence))) tolerance_multiplier,
    sum(a.extra_weight*ae.evidence_confidence) extra_weight,
    sum(a.extra_coverage_weight*ae.evidence_confidence) extra_coverage_weight
  from attribute_effects ae join public.garment_attribute_match_adjustments a on a.attribute_key=ae.attribute_key and a.option_key=ae.option_key
  where ae.evidence_confidence>0 group by a.measurement_type_key
), keys as (
  select measurement_type_key from base union select measurement_type_key from attr_rows where extra_weight>0 or extra_coverage_weight>0
), resolved as (
  select k.measurement_type_key,coalesce(b.weight,0)*coalesce(a.weight_multiplier,1)+coalesce(a.extra_weight,0) raw_weight,
    coalesce(b.coverage_weight,0)*coalesce(a.coverage_multiplier,1)+coalesce(a.extra_coverage_weight,0) raw_coverage,
    coalesce(b.tolerance,mt.default_tolerance_canonical)*coalesce(a.tolerance_multiplier,1) tolerance,
    m.minimum_shared_measurements,m.minimum_coverage,t.market_segment,t.garment_type_key,
    t.bust_multiplier,t.chest_multiplier,t.bust_coverage_floor
  from keys k cross join target t cross join meta m join public.measurement_types mt on mt.key=k.measurement_type_key
  left join base b on b.measurement_type_key=k.measurement_type_key left join attr_rows a on a.measurement_type_key=k.measurement_type_key
), contextual as (
  select measurement_type_key,
    case
      when garment_type_key<>'bras_intimate' and market_segment in ('mens','kids_youth') and measurement_type_key in ('full_bust','high_bust','underbust','bust_point_to_bust_point','shoulder_to_bust_point') then 0::numeric
      when garment_type_key<>'bras_intimate' and market_segment='unisex' and measurement_type_key in ('bust_point_to_bust_point','shoulder_to_bust_point') then 0::numeric
      when market_segment='unisex' and measurement_type_key='full_bust' then raw_weight*.70
      when bust_multiplier is not null and measurement_type_key='full_bust' then raw_weight*bust_multiplier
      when chest_multiplier is not null and measurement_type_key='chest_circumference' then raw_weight*chest_multiplier
      else raw_weight end weight,
    case
      when garment_type_key<>'bras_intimate' and market_segment in ('mens','kids_youth') and measurement_type_key in ('full_bust','high_bust','underbust','bust_point_to_bust_point','shoulder_to_bust_point') then 0::numeric
      when garment_type_key<>'bras_intimate' and market_segment='unisex' and measurement_type_key in ('full_bust','bust_point_to_bust_point','shoulder_to_bust_point') then 0::numeric
      when bust_coverage_floor is not null and measurement_type_key='full_bust' then greatest(raw_coverage,bust_coverage_floor)
      else raw_coverage end coverage_weight,
    tolerance,minimum_shared_measurements,minimum_coverage from resolved
)
select measurement_type_key,weight,coverage_weight,tolerance,minimum_shared_measurements,minimum_coverage from contextual where weight>0 or coverage_weight>0;
$$;
revoke all on function private.product_match_measurements(uuid) from public,anon,authenticated;

-- Add Chest-vs-Full-Bust shape only to the existing bounded product-level proportion
-- refinement. It never affects qualification/coverage and remains inside the same global
-- 8% influence / +/-4 Match-point cap from the derived-proportion engine.
create or replace function private.refine_snapshot_product_match_with_proportions(
  p_fit_profile_version_id uuid,
  p_product_id uuid,
  p_base_match integer
) returns integer
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user_id uuid:=auth.uid();
  v_garment_type_key text;
  v_market_segment public.garment_market_segment;
  v_similarity numeric;
  v_influence numeric;
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode='28000'; end if;
  if p_base_match is null or p_base_match<=0 then return p_base_match; end if;
  select garment_type_key,market_segment into v_garment_type_key,v_market_segment from public.products where id=p_product_id;
  if v_garment_type_key is null then return p_base_match; end if;

  with standard_available as (
    select r.weight,r.relative_tolerance,
      me_n.value_canonical/me_d.value_canonical viewer_ratio,
      hist_n.value_canonical/hist_d.value_canonical historical_ratio,
      sqrt(
        sqrt(private.fit_measurement_reliability(me_n.source,me_n.method)*private.fit_measurement_reliability(me_d.source,me_d.method)) *
        sqrt(private.fit_measurement_reliability(hist_n.source,hist_n.method)*private.fit_measurement_reliability(hist_d.source,hist_d.method))
      ) reliability
    from private.garment_proportion_rules r
    join public.body_measurements me_n on me_n.user_id=v_user_id and me_n.measurement_type_key=r.numerator_measurement_type_key
    join public.body_measurements me_d on me_d.user_id=v_user_id and me_d.measurement_type_key=r.denominator_measurement_type_key
    join public.fit_profile_version_measurements hist_n on hist_n.fit_profile_version_id=p_fit_profile_version_id and hist_n.measurement_type_key=r.numerator_measurement_type_key
    join public.fit_profile_version_measurements hist_d on hist_d.fit_profile_version_id=p_fit_profile_version_id and hist_d.measurement_type_key=r.denominator_measurement_type_key
    where r.garment_type_key=v_garment_type_key
  ), bust_shape_available as (
    select r.bust_to_chest_ratio_weight weight,r.bust_to_chest_relative_tolerance relative_tolerance,
      me_bust.value_canonical/me_chest.value_canonical viewer_ratio,
      hist_bust.value_canonical/hist_chest.value_canonical historical_ratio,
      sqrt(
        sqrt(private.fit_measurement_reliability(me_bust.source,me_bust.method)*private.fit_measurement_reliability(me_chest.source,me_chest.method)) *
        sqrt(private.fit_measurement_reliability(hist_bust.source,hist_bust.method)*private.fit_measurement_reliability(hist_chest.source,hist_chest.method))
      ) reliability
    from private.bust_shaping_product_rules r
    join public.body_measurements me_bust on me_bust.user_id=v_user_id and me_bust.measurement_type_key='full_bust'
    join public.body_measurements me_chest on me_chest.user_id=v_user_id and me_chest.measurement_type_key='chest_circumference'
    join public.fit_profile_version_measurements hist_bust on hist_bust.fit_profile_version_id=p_fit_profile_version_id and hist_bust.measurement_type_key='full_bust'
    join public.fit_profile_version_measurements hist_chest on hist_chest.fit_profile_version_id=p_fit_profile_version_id and hist_chest.measurement_type_key='chest_circumference'
    where r.garment_type_key=v_garment_type_key
      and v_market_segment='womens'::public.garment_market_segment
      and r.bust_to_chest_ratio_weight>0
  ), available as (
    select * from standard_available
    union all
    select * from bust_shape_available
  )
  select
    sum(private.fit_proportion_similarity(viewer_ratio,historical_ratio,relative_tolerance)*weight*reliability)/nullif(sum(weight*reliability),0),
    least(.08::numeric,coalesce(sum(weight*reliability),0))
  into v_similarity,v_influence
  from available;

  return private.apply_proportion_refinement(p_base_match,v_similarity,v_influence);
end;
$$;
revoke all on function private.refine_snapshot_product_match_with_proportions(uuid,uuid,integer) from public,anon,authenticated;

comment on table private.bust_shaping_product_rules is
  'Private cold-start rules for explicitly women''s bust-shaped Products. Full Bust may become primary to Chest and may add a small product-only Full-Bust-to-Chest proportion refinement.';
comment on function private.product_match_measurements(uuid) is
  'Target-product anthropometric model with provenance-aware product attributes, market-segment bust-field safeguards, and explicit women''s bust-shaping context. No user sex/gender is inferred.';

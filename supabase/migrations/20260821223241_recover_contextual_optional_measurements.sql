-- LikeSized canonical migration: contextual optional measurements
-- Missing optional/body-specific measurements must not masquerade as poor fit evidence.
-- Generic discovery uses universally practical measurements for confidence, while
-- garment/product context may add body-specific advanced dimensions when relevant.

-- Full Bust remains a valuable similarity refinement, but generic Overall/Tops
-- confidence does not require it. This prevents members who reasonably provide Chest
-- but not Full Bust from being systematically discounted.
update public.match_profile_measurements
set coverage_weight=0
where profile_key in ('overall','tops_default')
  and measurement_type_key='full_bust';

-- Product attributes may introduce a genuinely relevant advanced body dimension, not
-- merely multiply a dimension that happened to exist in the garment base model.
alter table public.garment_attribute_match_adjustments
  add column if not exists extra_weight numeric(8,6) not null default 0 check(extra_weight>=0),
  add column if not exists extra_coverage_weight numeric(8,6) not null default 0 check(extra_coverage_weight>=0);

-- Complete advanced upper-body routing. These remain refinement signals: useful when
-- known, never a blanket requirement for every member.
insert into public.garment_type_match_adjustments
(garment_type_key,measurement_type_key,weight_multiplier,coverage_multiplier,tolerance_multiplier,extra_weight,extra_coverage_weight)
values
('dress_shirt','wrist_circumference',1,1,1,.040,.025),
('work_shirt','wrist_circumference',1,1,1,.040,.025),
('casual_button_down','wrist_circumference',1,1,1,.035,.020),
('dress_shirt','across_front_chest_width',1,1,1,.030,.020),
('work_shirt','across_front_chest_width',1,1,1,.030,.020),
('casual_button_down','across_front_chest_width',1,1,1,.025,.015),
('blouse','high_bust',1,1,1,.040,.025),
('dresses','high_bust',1,1,1,.035,.020),
('dresses','bust_point_to_bust_point',1,1,1,.030,.020),
('dresses','shoulder_to_waist',1,1,1,.035,.025),
('jumpsuits','front_waist_length',1,1,1,.030,.020),
('jumpsuits','back_waist_length',1,1,1,.030,.020),
('jumpsuits','shoulder_to_waist',1,1,1,.035,.025),
('rompers','front_waist_length',1,1,1,.030,.020),
('rompers','back_waist_length',1,1,1,.030,.020),
('rompers','shoulder_to_waist',1,1,1,.035,.025)
on conflict (garment_type_key,measurement_type_key) do update
set extra_weight=greatest(public.garment_type_match_adjustments.extra_weight,excluded.extra_weight),
    extra_coverage_weight=greatest(public.garment_type_match_adjustments.extra_coverage_weight,excluded.extra_coverage_weight);

-- Sleeve/collar attributes can add dimensions even when the generic garment type did
-- not already contain them. This is especially important for long sleeves and collars.
update public.garment_attribute_match_adjustments
set extra_weight=.040,extra_coverage_weight=.025
where attribute_key='sleeve_length' and option_key='long' and measurement_type_key='wrist_circumference';
update public.garment_attribute_match_adjustments
set extra_weight=.025,extra_coverage_weight=.015
where attribute_key='sleeve_length' and option_key='long' and measurement_type_key='elbow_circumference';
update public.garment_attribute_match_adjustments
set extra_weight=.025,extra_coverage_weight=.015
where attribute_key='sleeve_length' and option_key='long' and measurement_type_key='bicep_upper_arm';

insert into public.garment_attribute_match_adjustments
(attribute_key,option_key,measurement_type_key,weight_multiplier,coverage_multiplier,tolerance_multiplier,extra_weight,extra_coverage_weight)
values
('sleeve_length','sleeveless','individual_shoulder_length',1,1,1,.030,.020),
('sleeve_length','sleeveless','across_front_chest_width',1,1,1,.025,.015),
('collar_style','spread','neck_collar_circumference',1,1,.96,.060,.040),
('collar_style','point','neck_collar_circumference',1,1,.96,.060,.040),
('collar_style','button_down','neck_collar_circumference',1,1,.98,.050,.035),
('neckline','high','neck_collar_circumference',1,1,1,.025,.015)
on conflict (attribute_key,option_key,measurement_type_key) do update
set extra_weight=greatest(public.garment_attribute_match_adjustments.extra_weight,excluded.extra_weight),
    extra_coverage_weight=greatest(public.garment_attribute_match_adjustments.extra_coverage_weight,excluded.extra_coverage_weight),
    tolerance_multiplier=excluded.tolerance_multiplier;

-- Re-resolve target Product measurements so product attributes can introduce advanced
-- rows and Product market segment can remove body-specific dimensions that are not
-- appropriate to score. No user gender/sex field is inferred or required.
create or replace function private.product_match_measurements(p_product_id uuid)
returns table(measurement_type_key text,weight numeric,coverage_weight numeric,tolerance numeric,minimum_shared_measurements integer,minimum_coverage numeric)
language sql security definer set search_path='' as $$
with target as (
  select p.id,p.garment_type_key,p.category,p.market_segment
  from public.products p where p.id=p_product_id
), base as (
  select gm.*
  from target t
  cross join lateral private.garment_match_measurements(t.garment_type_key) gm
  where t.garment_type_key is not null
  union all
  select mpm.measurement_type_key,mpm.weight,mpm.coverage_weight,
         coalesce(mpm.tolerance_override_canonical,mt.default_tolerance_canonical),
         mp.minimum_shared_measurements::integer,mp.minimum_coverage
  from target t
  join public.match_profiles mp on mp.key=case t.category
    when 'tops' then 'tops_default'
    when 'bottoms' then 'bottoms_default'
    when 'dresses' then 'dresses_default'
    when 'shoes' then 'shoes'
    else 'overall' end
  join public.match_profile_measurements mpm on mpm.profile_key=mp.key
  join public.measurement_types mt on mt.key=mpm.measurement_type_key
  where t.garment_type_key is null
), meta as (
  select max(minimum_shared_measurements)::integer minimum_shared_measurements,
         max(minimum_coverage) minimum_coverage
  from base
), attr_rows as (
  select a.measurement_type_key,
         case when bool_or(a.weight_multiplier=0) then 0::numeric
              else exp(sum(ln(nullif(a.weight_multiplier,0)))) end weight_multiplier,
         case when bool_or(a.coverage_multiplier=0) then 0::numeric
              else exp(sum(ln(nullif(a.coverage_multiplier,0)))) end coverage_multiplier,
         exp(sum(ln(a.tolerance_multiplier))) tolerance_multiplier,
         sum(a.extra_weight) extra_weight,
         sum(a.extra_coverage_weight) extra_coverage_weight
  from public.product_attribute_values pav
  join public.garment_attribute_match_adjustments a
    on a.attribute_key=pav.attribute_key and a.option_key=pav.option_key
  where pav.product_id=p_product_id
  group by a.measurement_type_key
), keys as (
  select measurement_type_key from base
  union
  select measurement_type_key from attr_rows where extra_weight>0 or extra_coverage_weight>0
), resolved as (
  select k.measurement_type_key,
         coalesce(b.weight,0)*coalesce(a.weight_multiplier,1)+coalesce(a.extra_weight,0) raw_weight,
         coalesce(b.coverage_weight,0)*coalesce(a.coverage_multiplier,1)+coalesce(a.extra_coverage_weight,0) raw_coverage,
         coalesce(b.tolerance,mt.default_tolerance_canonical)*coalesce(a.tolerance_multiplier,1) tolerance,
         m.minimum_shared_measurements,m.minimum_coverage,
         t.market_segment,t.garment_type_key
  from keys k
  cross join target t
  cross join meta m
  join public.measurement_types mt on mt.key=k.measurement_type_key
  left join base b on b.measurement_type_key=k.measurement_type_key
  left join attr_rows a on a.measurement_type_key=k.measurement_type_key
), contextual as (
  select measurement_type_key,
    case
      when garment_type_key<>'bras_intimate' and market_segment in ('mens','kids_youth')
       and measurement_type_key in ('full_bust','high_bust','underbust','bust_point_to_bust_point','shoulder_to_bust_point') then 0::numeric
      when garment_type_key<>'bras_intimate' and market_segment='unisex'
       and measurement_type_key in ('bust_point_to_bust_point','shoulder_to_bust_point') then 0::numeric
      when market_segment='unisex' and measurement_type_key='full_bust' then raw_weight*.70
      else raw_weight end weight,
    case
      when garment_type_key<>'bras_intimate' and market_segment in ('mens','kids_youth')
       and measurement_type_key in ('full_bust','high_bust','underbust','bust_point_to_bust_point','shoulder_to_bust_point') then 0::numeric
      when garment_type_key<>'bras_intimate' and market_segment='unisex'
       and measurement_type_key in ('full_bust','bust_point_to_bust_point','shoulder_to_bust_point') then 0::numeric
      else raw_coverage end coverage_weight,
    tolerance,minimum_shared_measurements,minimum_coverage
  from resolved
)
select measurement_type_key,weight,coverage_weight,tolerance,minimum_shared_measurements,minimum_coverage
from contextual
where weight>0 or coverage_weight>0;
$$;
revoke all on function private.product_match_measurements(uuid) from public,anon,authenticated;

comment on function private.product_match_measurements(uuid) is
  'Target-product anthropometric model. Garment attributes may add relevant advanced dimensions; Product market segment removes body-specific dimensions where inappropriate without inferring user gender/sex.';

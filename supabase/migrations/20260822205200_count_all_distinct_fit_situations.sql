-- Owner-locked Fit Report counting rule:
-- every distinct Product + objective variant + normalized size + Fit Profile version is valid evidence,
-- even when several valid reports belong to the same member. True duplicates are already collapsed
-- by save_known_fit_report, so recommendation/summary functions must not collapse again by wearer.

create or replace function public.get_product_fit_summary(p_product_id uuid)
returns table(
  total_fit_count integer,
  too_small_count integer,
  snug_count integer,
  just_right_count integer,
  relaxed_count integer,
  too_big_count integer
)
language sql
set search_path=''
as $$
select
  count(*)::integer,
  count(*) filter(where fr.fit='too_small'::public.fit_rating)::integer,
  count(*) filter(where fr.fit='snug'::public.fit_rating)::integer,
  count(*) filter(where fr.fit='just_right'::public.fit_rating)::integer,
  count(*) filter(where fr.fit='relaxed'::public.fit_rating)::integer,
  count(*) filter(where fr.fit='too_big'::public.fit_rating)::integer
from public.fit_reports fr
join public.closet_items ci on ci.id=fr.closet_item_id
join public.products p on p.id=fr.product_id
where fr.product_id=p_product_id
  and ci.visibility='shared'::public.closet_visibility
  and fr.garment_condition='normal'::public.garment_condition
  and (fr.garment_type_key is null or p.garment_type_key is null or fr.garment_type_key=p.garment_type_key);
$$;

create or replace function public.get_product_evidence_candidates(
  p_product_id uuid,
  p_variant_id uuid default null::uuid,
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
as $$
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
    private.calculate_directional_fit_support_for_product(c.fit_profile_version_id,p_product_id,c.fit) resolved_directional_fit_support,
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
  cross join lateral private.calculate_snapshot_match_for_product(c.fit_profile_version_id,p_product_id) hm
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
$$;

comment on function public.get_product_fit_summary(uuid) is
  'Counts every distinct saved Fit Report situation. Multiple valid sizes/variants/body versions from one member remain separate evidence; true duplicates update one row upstream.';
comment on function public.get_product_evidence_candidates(uuid,uuid,integer) is
  'Returns every distinct valid Fit Report situation instead of collapsing to one report per member. True duplicates are already deduplicated by save_known_fit_report.';

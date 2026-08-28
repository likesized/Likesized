-- Historical snapshot discovery chooses which wearers are worth exact evaluation, but evidence-unit
-- deduplication must still see each shortlisted wearer's complete relevant report history. Otherwise
-- an older body-similar report could incorrectly survive when that wearer later logged the same
-- Product/tracked variation from a newer body state.

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
candidate_snapshots as materialized (
  select d.fit_profile_version_id
  from private.discover_historical_product_snapshot_candidates(p_product_id,1400) d
),
candidate_users as materialized (
  select distinct fpv.user_id
  from candidate_snapshots cs
  join public.fit_profile_versions fpv on fpv.id=cs.fit_profile_version_id
),
target as (
  select p.*,
    case when p_variant_id is not null and exists(
      select 1 from public.product_variants pv
      where pv.id=p_variant_id and pv.product_id=p.id
    ) then p_variant_id else null::uuid end as target_variant_id
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
    select r.*,row_number() over(
      partition by r.user_id,r.evidence_product_id,coalesce(r.objective_variant_key,'')
      order by r.observed_at desc,r.fit_report_id desc
    ) as evidence_unit_rank
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
    array(select distinct c.fit_profile_version_id from with_overlap c where c.fit_profile_version_id is not null),
    p_product_id
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

comment on function private.resolve_product_evidence_core(uuid,uuid,integer) is
  'Canonical personalized Product evidence core. Historical snapshot buckets only shortlist bounded wearers; the core then considers each shortlisted wearer complete relevant report history, dedupes to the latest person + Product + tracked-variation evidence unit, and scores that immutable report snapshot exactly.';

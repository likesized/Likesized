-- LikeSized canonical migration: observation-level garment condition.
-- Materially changed garments remain in personal Fit History but do not redefine how a
-- normal/new copy of the Product fits other members.

create type public.garment_condition as enum ('normal','shrunk','stretched_out','altered');

alter table public.fit_reports
  add column garment_condition public.garment_condition not null default 'normal';

-- Exact-product physical Fit Result summary represents normal product fit only.
-- One latest normal-condition Shared observation per unique wearer prevents repeat logging
-- from inflating the distribution while allowing a member's older normal observation to
-- remain useful after they later report that their own garment shrank/changed.
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
security invoker
set search_path=''
as $$
with ranked as (
  select fr.fit,
    row_number() over(partition by fr.user_id order by fr.created_at desc,fr.id desc) wearer_rank
  from public.fit_reports fr
  join public.closet_items ci on ci.id=fr.closet_item_id
  where fr.product_id=p_product_id
    and ci.visibility='shared'::public.closet_visibility
    and fr.garment_condition='normal'::public.garment_condition
), latest as (
  select fit from ranked where wearer_rank=1
)
select
  count(*)::integer,
  count(*) filter(where fit='too_small'::public.fit_rating)::integer,
  count(*) filter(where fit='snug'::public.fit_rating)::integer,
  count(*) filter(where fit='just_right'::public.fit_rating)::integer,
  count(*) filter(where fit='relaxed'::public.fit_rating)::integer,
  count(*) filter(where fit='too_big'::public.fit_rating)::integer
from latest;
$$;
revoke all on function public.get_product_fit_summary(uuid) from public,anon;
grant execute on function public.get_product_fit_summary(uuid) to authenticated;

-- Product-wide recommendation evidence intentionally excludes materially changed garments.
-- The observation is still retained in the owner's history. If that wearer has an earlier
-- normal-condition observation it remains eligible because filtering happens before the
-- unique-wearer ranking.
drop function public.get_product_evidence_candidates(uuid,uuid,integer);
create function public.get_product_evidence_candidates(
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
 select p.*,case when p_variant_id is not null and exists(select 1 from public.product_variants pv where pv.id=p_variant_id and pv.product_id=p.id) then p_variant_id else null::uuid end target_variant_id
 from public.products p where p.id=p_product_id
), candidates as (
 select fr.id fit_report_id,fr.user_id,fr.closet_item_id,fr.product_id evidence_product_id,fr.variant_id evidence_variant_id,
   fr.fit_profile_version_id,fr.size_label original_size_label,fr.normalized_size_id,fr.fit,fr.would_buy_again,fr.created_at observed_at,
   ep.brand_id,ep.product_family_id,ep.garment_type_key,ep.category,
   (select count(*)::integer
      from public.product_attribute_values ta
      join public.product_attribute_values ea on ea.attribute_key=ta.attribute_key and ea.option_key=ta.option_key
      where ta.product_id=p_product_id and ea.product_id=ep.id
        and ta.source_status in ('corroborated'::public.product_data_status,'verified'::public.product_data_status)
        and ea.source_status in ('corroborated'::public.product_data_status,'verified'::public.product_data_status)
        and ta.confidence>=.75 and ea.confidence>=.75) attribute_overlap,
   t.brand_id target_brand_id,t.product_family_id target_family_id,t.garment_type_key target_garment_type,
   t.category target_category,t.target_variant_id
 from public.fit_reports fr
 join public.closet_items ci on ci.id=fr.closet_item_id and ci.visibility='shared'::public.closet_visibility
 join public.products ep on ep.id=fr.product_id
 cross join target t
 cross join viewer v
 where v.user_id is not null
   and fr.garment_condition='normal'::public.garment_condition
   and (fr.product_id=p_product_id
     or (t.product_family_id is not null and ep.product_family_id=t.product_family_id)
     or (t.garment_type_key is not null and ep.garment_type_key=t.garment_type_key)
     or ep.category=t.category)
), scored as (
 select c.*,hm.match_score snapshot_match_score,hm.coverage_percent snapshot_coverage_percent,
   private.calculate_directional_fit_support_for_product(c.fit_profile_version_id,p_product_id,c.fit) resolved_directional_fit_support,
   case
     when c.target_variant_id is not null and c.evidence_variant_id=c.target_variant_id then 'exact_variant'::public.evidence_level
     when c.evidence_product_id=p_product_id then 'exact_product'::public.evidence_level
     when c.target_family_id is not null and c.product_family_id=c.target_family_id then 'product_family'::public.evidence_level
     when c.target_garment_type is not null and c.garment_type_key=c.target_garment_type and c.attribute_overlap>0 then 'similar_garments'::public.evidence_level
     when c.brand_id=c.target_brand_id and c.garment_type_key=c.target_garment_type then 'brand_garment_type'::public.evidence_level
     else 'category_fit'::public.evidence_level end resolved_evidence_level,
   case
     when c.target_variant_id is not null and c.evidence_variant_id=c.target_variant_id then 1
     when c.evidence_product_id=p_product_id then 2
     when c.target_family_id is not null and c.product_family_id=c.target_family_id then 3
     when c.target_garment_type is not null and c.garment_type_key=c.target_garment_type and c.attribute_overlap>0 then 4
     when c.brand_id=c.target_brand_id and c.garment_type_key=c.target_garment_type then 5
     else 6 end resolved_evidence_rank
 from candidates c
 cross join lateral private.calculate_snapshot_match_for_product(c.fit_profile_version_id,p_product_id) hm
), one_per_person as (
 select s.*,row_number() over(
   partition by s.user_id
   order by s.resolved_evidence_rank,s.snapshot_match_score desc,s.snapshot_coverage_percent desc,s.attribute_overlap desc,s.observed_at desc,s.fit_report_id
 ) person_rank
 from scored s
)
select r.fit_report_id,r.user_id,r.closet_item_id,r.evidence_product_id,r.evidence_variant_id,
  r.fit_profile_version_id,r.original_size_label,r.normalized_size_id,r.fit,r.would_buy_again,
  r.snapshot_match_score,r.snapshot_coverage_percent,r.resolved_evidence_level,r.resolved_evidence_rank,
  r.attribute_overlap,r.resolved_directional_fit_support
from one_per_person r
where r.person_rank=1 and r.snapshot_match_score>0
order by r.resolved_evidence_rank,r.snapshot_match_score desc,r.snapshot_coverage_percent desc,r.attribute_overlap desc,r.fit_report_id
limit least(greatest(coalesce(p_result_limit,200),1),500);
$$;
revoke all on function public.get_product_evidence_candidates(uuid,uuid,integer) from public,anon;
grant execute on function public.get_product_evidence_candidates(uuid,uuid,integer) to authenticated;

comment on column public.fit_reports.garment_condition is
  'Observation-level state: normal, shrunk, stretched out, or altered/tailored. Materially changed states remain in personal history but are excluded from normal-product fit aggregation/recommendation evidence.';
comment on function public.get_product_fit_summary(uuid) is
  'Exact-product Shared physical Fit Result distribution from normal-condition observations only, latest eligible observation per unique wearer.';
comment on function public.get_product_evidence_candidates(uuid,uuid,integer) is
  'Auth-required Shared-only unique-wearer normal-condition historical fit evidence with safe directional recommendation support.';

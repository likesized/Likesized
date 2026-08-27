-- Batch the lightweight personalized Relevant Fit Report count used by tagged-garment cards.
-- Full FITuition evidence remains lazy and continues to use the canonical detailed endpoint
-- only when a member opens a specific garment.

create or replace function public.get_outfit_tagged_fit_counts(
  p_post_id uuid,
  p_match_threshold integer
)
returns table(
  closet_item_id uuid,
  matching_fit_reports integer
)
language sql
security invoker
set search_path=''
as $$
with tags as (
  select distinct opi.closet_item_id
  from public.outfit_post_items opi
  where opi.post_id = p_post_id
),
targets as (
  select
    t.closet_item_id,
    target_report.product_id,
    coalesce(target_report.objective_variant_key, '') as objective_variant_key
  from tags t
  left join lateral (
    select fr.product_id, fr.objective_variant_key
    from public.fit_reports fr
    where fr.closet_item_id = t.closet_item_id
    order by fr.created_at desc, fr.id desc
    limit 1
  ) target_report on true
),
community_counts as (
  select
    target.closet_item_id,
    count(*)::integer as report_count
  from targets target
  cross join lateral public.get_product_evidence_candidates(
    target.product_id,
    null::uuid,
    300
  ) candidate
  join public.fit_reports identity_report
    on identity_report.id = candidate.fit_report_id
  where target.product_id is not null
    and candidate.user_id <> auth.uid()
    and candidate.evidence_product_id = target.product_id
    and coalesce(identity_report.objective_variant_key, '') = target.objective_variant_key
    and candidate.historical_match_score >= least(greatest(p_match_threshold, 0), 100)
  group by target.closet_item_id
),
viewer_recent as (
  select
    fr.product_id,
    fr.objective_variant_key,
    fr.garment_condition,
    fr.created_at,
    fr.id
  from public.fit_reports fr
  where fr.user_id = auth.uid()
  order by fr.created_at desc, fr.id desc
  limit 200
),
own_latest as (
  select distinct on (fr.product_id, coalesce(fr.objective_variant_key, ''))
    fr.product_id,
    coalesce(fr.objective_variant_key, '') as objective_variant_key,
    fr.garment_condition
  from viewer_recent fr
  join (
    select distinct product_id, objective_variant_key
    from targets
    where product_id is not null
  ) target_identity
    on target_identity.product_id = fr.product_id
   and target_identity.objective_variant_key = coalesce(fr.objective_variant_key, '')
  order by fr.product_id, coalesce(fr.objective_variant_key, ''), fr.created_at desc, fr.id desc
),
own_counts as (
  select target.closet_item_id, 1::integer as report_count
  from targets target
  join own_latest own_report
    on own_report.product_id = target.product_id
   and own_report.objective_variant_key = target.objective_variant_key
  where own_report.garment_condition = 'normal'
)
select
  tag.closet_item_id,
  coalesce(community.report_count, 0) + coalesce(own_report.report_count, 0) as matching_fit_reports
from tags tag
left join community_counts community using (closet_item_id)
left join own_counts own_report using (closet_item_id)
order by tag.closet_item_id;
$$;

revoke all on function public.get_outfit_tagged_fit_counts(uuid, integer) from public, anon;
grant execute on function public.get_outfit_tagged_fit_counts(uuid, integer) to authenticated;

comment on function public.get_outfit_tagged_fit_counts(uuid, integer) is
  'Bounded Outfit-level batch projection of personalized Relevant Fit Report counts for tagged-garment cards; full FITuition evidence remains lazy per selected garment.';

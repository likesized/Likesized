-- LikeSized canonical migration: keep product-aware historical snapshot Match helpers private
-- while restoring the safe authenticated public wrapper used by Fit Report history.
-- SECURITY DEFINER is required because the wrapper calls a private helper; therefore the
-- wrapper explicitly reproduces the Fit Report visibility boundary instead of relying on RLS.

revoke all on function private.calculate_snapshot_match_for_product(uuid,uuid)
from public,anon,authenticated;

create or replace function public.get_fit_report_snapshot_matches(p_fit_report_ids uuid[])
returns table(
  fit_report_id uuid,
  historical_match_score integer,
  historical_coverage_percent integer
)
language sql
security definer
set search_path=''
as $$
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
  fr.fit_profile_version_id,
  fr.product_id
) hm
where v.user_id is not null
  and fr.id=any(coalesce(p_fit_report_ids,'{}'::uuid[]))
  and (
    fr.user_id=v.user_id
    or ci.visibility='shared'::public.closet_visibility
  )
limit 100;
$$;

revoke all on function public.get_fit_report_snapshot_matches(uuid[])
from public,anon,authenticated;
grant execute on function public.get_fit_report_snapshot_matches(uuid[])
to authenticated;

comment on function public.get_fit_report_snapshot_matches(uuid[]) is
  'Authenticated safe derived historical Match wrapper. Returns only Match score and coverage for the caller own or Shared Fit Reports; product-aware snapshot helper and raw historical measurements remain private.';

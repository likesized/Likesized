-- LikeSized canonical migration: directional Fit Result evidence for size recommendations.
-- Match % remains symmetric garment-relevant body similarity. This layer uses the sign
-- of private measurement differences only to decide how strongly a wearer's physical
-- Fit Result supports or opposes a size for the current viewer.

-- Fit Result is the required sizing signal. Remove the abandoned satisfaction-rating
-- experiment from the branch schema before this migration can ever reach production.
drop function if exists public.get_product_fit_summary(uuid);
alter table public.fit_reports drop column if exists fit_rating;

create or replace function private.require_complete_fit_report_intake()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  if new.fit is null then
    raise exception 'Physical Fit Result is required';
  end if;
  return new;
end;
$$;
revoke all on function private.require_complete_fit_report_intake() from public,anon,authenticated;
drop trigger if exists require_complete_fit_report_intake on public.fit_reports;
create trigger require_complete_fit_report_intake
before insert on public.fit_reports
for each row execute function private.require_complete_fit_report_intake();

-- Pure calibration helper. p_pressure is a private normalized body-direction signal:
-- positive means the viewer is larger/longer than the historical wearer across the
-- target garment's relevant dimensions; negative means smaller/shorter. The value is
-- never returned to clients.
create or replace function private.directional_fit_support_from_pressure(
  p_fit public.fit_rating,
  p_pressure numeric
) returns numeric
language sql
immutable
strict
set search_path=''
as $$
  select round(
    greatest(-1::numeric,least(1::numeric,
      case p_fit
        when 'too_small'::public.fit_rating then -.65 - .25*greatest(-1::numeric,least(1::numeric,p_pressure))
        when 'snug'::public.fit_rating then .48 - .55*greatest(-1::numeric,least(1::numeric,p_pressure))
        when 'just_right'::public.fit_rating then 1 - .25*abs(greatest(-1::numeric,least(1::numeric,p_pressure)))
        when 'relaxed'::public.fit_rating then .72 + .75*greatest(-1::numeric,least(1::numeric,p_pressure))
        when 'too_big'::public.fit_rating then -.65 + .25*greatest(-1::numeric,least(1::numeric,p_pressure))
      end
    )),6
  );
$$;
revoke all on function private.directional_fit_support_from_pressure(public.fit_rating,numeric) from public,anon,authenticated;

-- Convert signed, tolerance-normalized private body deltas into the outcome-specific
-- support value above. Weight itself is excluded because higher/lower body weight is
-- not a directional garment dimension. No raw or signed measurement delta leaves this
-- private helper.
create or replace function private.calculate_directional_fit_support_for_product(
  p_fit_profile_version_id uuid,
  p_product_id uuid,
  p_fit public.fit_rating
) returns numeric
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user_id uuid:=auth.uid();
  v_pressure numeric:=0;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode='28000';
  end if;

  with w as (
    select * from private.product_match_measurements(p_product_id)
    where measurement_type_key<>'weight' and weight>0
  ), d as (
    select
      sum(
        greatest(-1::numeric,least(1::numeric,(me.value_canonical-hist.value_canonical)/nullif(w.tolerance,0)))
        * w.weight
        * sqrt(private.fit_measurement_reliability(me.source,me.method)*private.fit_measurement_reliability(hist.source,hist.method))
      ) signed_weight,
      sum(
        w.weight
        * sqrt(private.fit_measurement_reliability(me.source,me.method)*private.fit_measurement_reliability(hist.source,hist.method))
      ) total_weight
    from w
    join public.body_measurements me
      on me.user_id=v_user_id and me.measurement_type_key=w.measurement_type_key
    join public.fit_profile_version_measurements hist
      on hist.fit_profile_version_id=p_fit_profile_version_id and hist.measurement_type_key=w.measurement_type_key
    where me.value_canonical is not null and hist.value_canonical is not null
  )
  select coalesce(signed_weight/nullif(total_weight,0),0) into v_pressure from d;

  return private.directional_fit_support_from_pressure(p_fit,v_pressure);
end;
$$;
revoke all on function private.calculate_directional_fit_support_for_product(uuid,uuid,public.fit_rating) from public,anon,authenticated;

-- Add only the outcome-specific support value to the safe evidence RPC. SECURITY DEFINER
-- is required so the wrapper can call the non-public directional helper. The query therefore
-- enforces authentication and Shared Closet visibility explicitly instead of relying on RLS.
-- The underlying directional pressure and raw measurement deltas remain private.
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
 select p.*,case when p_variant_id is not null and exists(select 1 from public.product_variants pv where pv.id=p_variant_id and pv.product_id=p.id) then p_variant_id else null::uuid end target_variant_id from public.products p where p.id=p_product_id
), candidates as (
 select fr.id fit_report_id,fr.user_id,fr.closet_item_id,fr.product_id evidence_product_id,fr.variant_id evidence_variant_id,fr.fit_profile_version_id,fr.size_label original_size_label,fr.normalized_size_id,fr.fit,fr.would_buy_again,fr.created_at observed_at,ep.brand_id,ep.product_family_id,ep.garment_type_key,ep.category,
 (select count(*)::integer from public.product_attribute_values ta join public.product_attribute_values ea on ea.attribute_key=ta.attribute_key and ea.option_key=ta.option_key
   where ta.product_id=p_product_id and ea.product_id=ep.id
     and ta.source_status in ('corroborated'::public.product_data_status,'verified'::public.product_data_status)
     and ea.source_status in ('corroborated'::public.product_data_status,'verified'::public.product_data_status)
     and ta.confidence>=.75 and ea.confidence>=.75) attribute_overlap,
 t.brand_id target_brand_id,t.product_family_id target_family_id,t.garment_type_key target_garment_type,t.category target_category,t.target_variant_id
 from public.fit_reports fr
 join public.closet_items ci on ci.id=fr.closet_item_id and ci.visibility='shared'::public.closet_visibility
 join public.products ep on ep.id=fr.product_id
 cross join target t
 cross join viewer v
 where v.user_id is not null
   and (fr.product_id=p_product_id or (t.product_family_id is not null and ep.product_family_id=t.product_family_id) or (t.garment_type_key is not null and ep.garment_type_key=t.garment_type_key) or ep.category=t.category)
), scored as (
 select c.*,hm.match_score snapshot_match_score,hm.coverage_percent snapshot_coverage_percent,
   private.calculate_directional_fit_support_for_product(c.fit_profile_version_id,p_product_id,c.fit) resolved_directional_fit_support,
 case when c.target_variant_id is not null and c.evidence_variant_id=c.target_variant_id then 'exact_variant'::public.evidence_level when c.evidence_product_id=p_product_id then 'exact_product'::public.evidence_level when c.target_family_id is not null and c.product_family_id=c.target_family_id then 'product_family'::public.evidence_level when c.target_garment_type is not null and c.garment_type_key=c.target_garment_type and c.attribute_overlap>0 then 'similar_garments'::public.evidence_level when c.brand_id=c.target_brand_id and c.garment_type_key=c.target_garment_type then 'brand_garment_type'::public.evidence_level else 'category_fit'::public.evidence_level end resolved_evidence_level,
 case when c.target_variant_id is not null and c.evidence_variant_id=c.target_variant_id then 1 when c.evidence_product_id=p_product_id then 2 when c.target_family_id is not null and c.product_family_id=c.target_family_id then 3 when c.target_garment_type is not null and c.garment_type_key=c.target_garment_type and c.attribute_overlap>0 then 4 when c.brand_id=c.target_brand_id and c.garment_type_key=c.target_garment_type then 5 else 6 end resolved_evidence_rank
 from candidates c cross join lateral private.calculate_snapshot_match_for_product(c.fit_profile_version_id,p_product_id) hm
), one_per_person as (
 select s.*,row_number() over(partition by s.user_id order by s.resolved_evidence_rank,s.snapshot_match_score desc,s.snapshot_coverage_percent desc,s.attribute_overlap desc,s.observed_at desc,s.fit_report_id) person_rank from scored s
)
select r.fit_report_id,r.user_id,r.closet_item_id,r.evidence_product_id,r.evidence_variant_id,r.fit_profile_version_id,r.original_size_label,r.normalized_size_id,r.fit,r.would_buy_again,r.snapshot_match_score,r.snapshot_coverage_percent,r.resolved_evidence_level,r.resolved_evidence_rank,r.attribute_overlap,r.resolved_directional_fit_support
from one_per_person r where r.person_rank=1 and r.snapshot_match_score>0
order by r.resolved_evidence_rank,r.snapshot_match_score desc,r.snapshot_coverage_percent desc,r.attribute_overlap desc,r.fit_report_id
limit least(greatest(coalesce(p_result_limit,200),1),500);
$$;
revoke all on function public.get_product_evidence_candidates(uuid,uuid,integer) from public,anon;
grant execute on function public.get_product_evidence_candidates(uuid,uuid,integer) to authenticated;

-- Exact-product physical Fit Result summary. The latest Shared observation per unique
-- wearer prevents repeat logging from inflating the distribution.
create function public.get_product_fit_summary(p_product_id uuid)
returns table(total_fit_count integer,too_small_count integer,snug_count integer,just_right_count integer,relaxed_count integer,too_big_count integer)
language sql security invoker set search_path='' as $$
with ranked as (
  select fr.fit,row_number() over(partition by fr.user_id order by fr.created_at desc,fr.id desc) wearer_rank
  from public.fit_reports fr join public.closet_items ci on ci.id=fr.closet_item_id
  where fr.product_id=p_product_id and ci.visibility='shared'::public.closet_visibility
), latest as (select fit from ranked where wearer_rank=1)
select count(*)::integer,
  count(*) filter(where fit='too_small'::public.fit_rating)::integer,
  count(*) filter(where fit='snug'::public.fit_rating)::integer,
  count(*) filter(where fit='just_right'::public.fit_rating)::integer,
  count(*) filter(where fit='relaxed'::public.fit_rating)::integer,
  count(*) filter(where fit='too_big'::public.fit_rating)::integer
from latest;
$$;
revoke all on function public.get_product_fit_summary(uuid) from public,anon;
grant execute on function public.get_product_fit_summary(uuid) to authenticated;

comment on function private.directional_fit_support_from_pressure(public.fit_rating,numeric) is 'Maps private signed garment-relevant body direction plus physical Fit Result to size-recommendation support; does not alter Match percent.';
comment on function private.calculate_directional_fit_support_for_product(uuid,uuid,public.fit_rating) is 'Auth-bound private directional recommendation helper. Raw and signed measurement deltas never leave private schema.';
comment on function public.get_product_evidence_candidates(uuid,uuid,integer) is 'Auth-required Shared-only unique-wearer historical fit evidence with safe outcome-specific directional recommendation support; raw body direction remains private.';
comment on function public.get_product_fit_summary(uuid) is 'Exact-product Shared physical Fit Result distribution, latest observation per unique wearer.';
comment on function private.require_complete_fit_report_intake() is 'Requires a physical Fit Result on every new Fit Report.';

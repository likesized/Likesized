-- Scale the canonical fit-matching and evidence read paths for realistic community data.
-- This migration does not add a parallel matching system. It preserves the existing
-- scoring helpers and evidence hierarchy while removing repeated full scans and
-- scoring work that cannot survive realistic production cardinality.

create or replace function private.calculate_fit_matches_batch_for_community(
  p_match_categories public.fit_match_category[],
  p_result_limit integer,
  p_fit_community public.fit_community
)
returns table(
  match_category public.fit_match_category,
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  match_score integer,
  coverage_percent integer
)
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user_id uuid:=auth.uid();
  v_limit integer:=least(greatest(coalesce(p_result_limit,30),1),100);
  v_community public.fit_community;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode='28000';
  end if;

  if not exists(
    select 1 from public.fit_profiles fp
    where fp.user_id=v_user_id and fp.completed_at is not null
  ) then
    return;
  end if;

  select coalesce(p_fit_community,fp.fit_community,'both'::public.fit_community)
  into v_community
  from public.fit_profiles fp
  where fp.user_id=v_user_id;

  return query
  with requested as (
    select distinct
      category,
      case category
        when 'tops'::public.fit_match_category then 'tops_default'
        when 'bottoms'::public.fit_match_category then 'bottoms_default'
        else 'overall'
      end as profile_key
    from unnest(coalesce(p_match_categories,'{}'::public.fit_match_category[])) as requested_category(category)
    where category in (
      'overall'::public.fit_match_category,
      'tops'::public.fit_match_category,
      'bottoms'::public.fit_match_category
    )
  ),
  weights as (
    select
      r.category,
      mpm.measurement_type_key,
      mpm.weight,
      mpm.coverage_weight,
      coalesce(mpm.tolerance_override_canonical,mt.default_tolerance_canonical) as tolerance
    from requested r
    join public.match_profile_measurements mpm on mpm.profile_key=r.profile_key
    join public.measurement_types mt on mt.key=mpm.measurement_type_key
  ),
  meta as (
    select
      r.category,
      sum(w.coverage_weight) as total_coverage,
      count(*)::integer as measurement_count,
      mp.minimum_shared_measurements,
      mp.minimum_coverage
    from requested r
    join weights w on w.category=r.category
    join public.match_profiles mp on mp.key=r.profile_key
    group by r.category,mp.minimum_shared_measurements,mp.minimum_coverage
  ),
  candidates as (
    select p.id,p.username,p.display_name,p.avatar_url
    from public.profiles p
    join public.fit_profiles fp on fp.user_id=p.id and fp.completed_at is not null
    where p.id<>v_user_id
      and p.username is not null
      and (
        v_community='both'::public.fit_community
        or fp.fit_community='both'::public.fit_community
        or fp.fit_community=v_community
      )
  ),
  aggregated as (
    select
      w.category,
      c.id,
      c.username,
      c.display_name,
      c.avatar_url,
      sum(case
        when me.value_canonical is not null and them.value_canonical is not null
          then private.fit_measurement_similarity(me.value_canonical,them.value_canonical,w.tolerance)
            *w.weight
            *sqrt(private.fit_measurement_reliability(me.source,me.method)*private.fit_measurement_reliability(them.source,them.method))
        else 0 end) as weighted_similarity,
      sum(case
        when me.value_canonical is not null and them.value_canonical is not null
          then w.weight
            *sqrt(private.fit_measurement_reliability(me.source,me.method)*private.fit_measurement_reliability(them.source,them.method))
        else 0 end) as similarity_weight,
      sum(case
        when me.value_canonical is not null and them.value_canonical is not null
          then w.coverage_weight
        else 0 end) as shared_coverage,
      sum(case
        when me.value_canonical is not null and them.value_canonical is not null
          then w.coverage_weight
            *sqrt(
              private.fit_measurement_confidence_reliability(me.source,me.method,w.measurement_type_key,me.confirmed_at,now())
              *private.fit_measurement_confidence_reliability(them.source,them.method,w.measurement_type_key,them.confirmed_at,now())
            )
        else 0 end) as reliable_coverage,
      count(*) filter(where me.value_canonical is not null and them.value_canonical is not null)::integer as shared_count,
      max(meta.total_coverage) as total_coverage,
      max(meta.measurement_count) as measurement_count,
      max(meta.minimum_shared_measurements) as minimum_shared_measurements,
      max(meta.minimum_coverage) as minimum_coverage
    from candidates c
    cross join weights w
    join meta on meta.category=w.category
    left join public.body_measurements me
      on me.user_id=v_user_id and me.measurement_type_key=w.measurement_type_key
    left join public.body_measurements them
      on them.user_id=c.id and them.measurement_type_key=w.measurement_type_key
    group by w.category,c.id,c.username,c.display_name,c.avatar_url
  ),
  qualified as (
    select
      a.*,
      least(1::numeric,greatest(0::numeric,a.shared_coverage/nullif(a.total_coverage,0))) as coverage
    from aggregated a
    where a.similarity_weight>0
      and a.shared_count>=a.minimum_shared_measurements
      and a.shared_coverage/nullif(a.total_coverage,0)>=a.minimum_coverage
  ),
  scored as (
    select
      q.category,
      q.id,
      q.username,
      q.display_name,
      q.avatar_url,
      private.confidence_adjusted_match(
        q.weighted_similarity,
        q.similarity_weight,
        q.shared_coverage,
        q.reliable_coverage,
        q.total_coverage,
        q.shared_count,
        q.measurement_count
      ) as resolved_match_score,
      round(q.coverage*100)::integer as resolved_coverage_percent
    from qualified q
  ),
  ranked as (
    select
      s.*,
      row_number() over(
        partition by s.category
        order by s.resolved_match_score desc,s.resolved_coverage_percent desc,s.username
      ) as result_rank
    from scored s
  )
  select
    r.category,
    r.id,
    r.username,
    r.display_name,
    r.avatar_url,
    r.resolved_match_score,
    r.resolved_coverage_percent
  from ranked r
  where r.result_rank<=v_limit
  order by r.category,r.result_rank;
end;
$$;

revoke all on function private.calculate_fit_matches_batch_for_community(public.fit_match_category[],integer,public.fit_community) from public,anon,authenticated;

create or replace function public.get_fit_matches_batch(
  p_match_categories public.fit_match_category[],
  p_result_limit integer default 100,
  p_fit_community public.fit_community default null
)
returns table(
  match_category public.fit_match_category,
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  match_score integer,
  coverage_percent integer
)
language sql
security definer
set search_path=''
as $$
  select *
  from private.calculate_fit_matches_batch_for_community(
    p_match_categories,
    p_result_limit,
    p_fit_community
  );
$$;

revoke all on function public.get_fit_matches_batch(public.fit_match_category[],integer,public.fit_community) from public,anon;
grant execute on function public.get_fit_matches_batch(public.fit_match_category[],integer,public.fit_community) to authenticated;

comment on function public.get_fit_matches_batch(public.fit_match_category[],integer,public.fit_community) is
  'Bounded set-wise current Fit Match resolver. Requested Overall/Tops/Bottoms categories share one candidate scan and preserve the canonical match scoring rules.';

-- Score many historical Fit Profile snapshots against one target Product while resolving
-- Product-specific weights and the viewer measurement rows once instead of once per report.
create or replace function private.calculate_snapshot_matches_for_product(
  p_fit_profile_version_ids uuid[],
  p_product_id uuid
)
returns table(
  fit_profile_version_id uuid,
  match_score integer,
  coverage_percent integer
)
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user_id uuid:=auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode='28000';
  end if;

  return query
  with requested as (
    select distinct requested_id as fit_profile_version_id
    from unnest(coalesce(p_fit_profile_version_ids,'{}'::uuid[])) requested_version(requested_id)
    where requested_id is not null
    limit 500
  ),
  snapshots as (
    select fpv.id as fit_profile_version_id,fpv.created_at
    from requested r
    join public.fit_profile_versions fpv on fpv.id=r.fit_profile_version_id
  ),
  weights as materialized (
    select * from private.product_match_measurements(p_product_id)
  ),
  meta as (
    select
      sum(w.coverage_weight) as total_coverage,
      count(*)::integer as measurement_count,
      max(w.minimum_shared_measurements) as minimum_shared_measurements,
      max(w.minimum_coverage) as minimum_coverage
    from weights w
  ),
  viewer_measurements as materialized (
    select
      w.measurement_type_key,
      w.weight,
      w.coverage_weight,
      w.tolerance,
      me.value_canonical,
      me.source,
      me.method,
      me.confirmed_at
    from weights w
    left join public.body_measurements me
      on me.user_id=v_user_id and me.measurement_type_key=w.measurement_type_key
  ),
  aggregated as (
    select
      snapshot.fit_profile_version_id,
      sum(case
        when viewer.value_canonical is not null and hist.value_canonical is not null
          then private.fit_measurement_similarity(viewer.value_canonical,hist.value_canonical,viewer.tolerance)
            *viewer.weight
            *sqrt(private.fit_measurement_reliability(viewer.source,viewer.method)*private.fit_measurement_reliability(hist.source,hist.method))
        else 0 end) as weighted_similarity,
      sum(case
        when viewer.value_canonical is not null and hist.value_canonical is not null
          then viewer.weight
            *sqrt(private.fit_measurement_reliability(viewer.source,viewer.method)*private.fit_measurement_reliability(hist.source,hist.method))
        else 0 end) as similarity_weight,
      sum(case
        when viewer.value_canonical is not null and hist.value_canonical is not null
          then viewer.coverage_weight
        else 0 end) as shared_coverage,
      sum(case
        when viewer.value_canonical is not null and hist.value_canonical is not null
          then viewer.coverage_weight
            *sqrt(
              private.fit_measurement_confidence_reliability(viewer.source,viewer.method,viewer.measurement_type_key,viewer.confirmed_at,now())
              *private.fit_measurement_confidence_reliability(hist.source,hist.method,viewer.measurement_type_key,hist.confirmed_at,snapshot.created_at)
            )
        else 0 end) as reliable_coverage,
      count(*) filter(where viewer.value_canonical is not null and hist.value_canonical is not null)::integer as shared_count,
      max(meta.total_coverage) as total_coverage,
      max(meta.measurement_count) as measurement_count,
      max(meta.minimum_shared_measurements) as minimum_shared_measurements,
      max(meta.minimum_coverage) as minimum_coverage
    from snapshots snapshot
    cross join viewer_measurements viewer
    cross join meta
    left join public.fit_profile_version_measurements hist
      on hist.fit_profile_version_id=snapshot.fit_profile_version_id
     and hist.measurement_type_key=viewer.measurement_type_key
    group by snapshot.fit_profile_version_id
  ),
  base as (
    select
      a.fit_profile_version_id,
      case
        when a.similarity_weight>0
         and a.shared_count>=a.minimum_shared_measurements
         and a.shared_coverage/nullif(a.total_coverage,0)>=a.minimum_coverage
          then private.confidence_adjusted_match(
            a.weighted_similarity,
            a.similarity_weight,
            a.shared_coverage,
            a.reliable_coverage,
            a.total_coverage,
            a.shared_count,
            a.measurement_count
          )
        else 0
      end as base_match,
      case
        when a.total_coverage>0
          then round(100*least(1::numeric,greatest(0::numeric,a.shared_coverage/nullif(a.total_coverage,0))))::integer
        else 0
      end as resolved_coverage_percent
    from aggregated a
  )
  select
    b.fit_profile_version_id,
    private.refine_snapshot_product_match_with_proportions(
      b.fit_profile_version_id,
      p_product_id,
      b.base_match
    ) as resolved_match_score,
    b.resolved_coverage_percent
  from base b;
end;
$$;

revoke all on function private.calculate_snapshot_matches_for_product(uuid[],uuid) from public,anon,authenticated;

-- Resolve the directional pressure for many historical snapshots with the Product matching
-- weights materialized once. The final fit-result interpretation stays canonical.
create or replace function private.calculate_directional_pressures_for_product(
  p_fit_profile_version_ids uuid[],
  p_product_id uuid
)
returns table(
  fit_profile_version_id uuid,
  pressure numeric
)
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user_id uuid:=auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode='28000';
  end if;

  return query
  with requested as (
    select distinct requested_id as fit_profile_version_id
    from unnest(coalesce(p_fit_profile_version_ids,'{}'::uuid[])) requested_version(requested_id)
    where requested_id is not null
    limit 500
  ),
  weights as materialized (
    select *
    from private.product_match_measurements(p_product_id)
    where measurement_type_key<>'weight' and weight>0
  ),
  viewer_measurements as materialized (
    select
      w.measurement_type_key,
      w.weight,
      w.tolerance,
      me.value_canonical,
      me.source,
      me.method
    from weights w
    join public.body_measurements me
      on me.user_id=v_user_id and me.measurement_type_key=w.measurement_type_key
  ),
  aggregated as (
    select
      r.fit_profile_version_id,
      sum(
        greatest(-1::numeric,least(1::numeric,(viewer.value_canonical-hist.value_canonical)/nullif(viewer.tolerance,0)))
        *viewer.weight
        *sqrt(private.fit_measurement_reliability(viewer.source,viewer.method)*private.fit_measurement_reliability(hist.source,hist.method))
      ) as signed_weight,
      sum(
        viewer.weight
        *sqrt(private.fit_measurement_reliability(viewer.source,viewer.method)*private.fit_measurement_reliability(hist.source,hist.method))
      ) as total_weight
    from requested r
    cross join viewer_measurements viewer
    join public.fit_profile_version_measurements hist
      on hist.fit_profile_version_id=r.fit_profile_version_id
     and hist.measurement_type_key=viewer.measurement_type_key
    where viewer.value_canonical is not null and hist.value_canonical is not null
    group by r.fit_profile_version_id
  )
  select
    r.fit_profile_version_id,
    coalesce(a.signed_weight/nullif(a.total_weight,0),0) as resolved_pressure
  from requested r
  left join aggregated a using (fit_profile_version_id);
end;
$$;

revoke all on function private.calculate_directional_pressures_for_product(uuid[],uuid) from public,anon,authenticated;

-- One canonical evidence core. It preserves the existing hierarchy and ordering while
-- discarding superseded reports before snapshot scoring. Summary readers can reuse this
-- core without paying for directional support that they never display.
create or replace function private.resolve_product_evidence_core(
  p_product_id uuid,
  p_variant_id uuid,
  p_result_limit integer
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
  attribute_overlap integer
)
language sql
security definer
set search_path=''
as $$
with viewer as (
  select auth.uid() as user_id
),
target as (
  select
    p.*,
    case
      when p_variant_id is not null and exists(
        select 1 from public.product_variants pv
        where pv.id=p_variant_id and pv.product_id=p.id
      ) then p_variant_id
      else null::uuid
    end as target_variant_id
  from public.products p
  where p.id=p_product_id
),
raw_candidates as (
  select
    fr.id as fit_report_id,
    fr.user_id,
    fr.closet_item_id,
    fr.product_id as evidence_product_id,
    fr.variant_id as evidence_variant_id,
    fr.objective_variant_key,
    fr.fit_profile_version_id,
    fr.size_label as original_size_label,
    fr.normalized_size_id,
    fr.fit,
    fr.would_buy_again,
    fr.created_at as observed_at,
    ep.brand_id,
    ep.product_family_id,
    ep.garment_type_key,
    ep.category,
    t.brand_id as target_brand_id,
    t.product_family_id as target_family_id,
    t.garment_type_key as target_garment_type,
    t.category as target_category,
    t.target_variant_id
  from public.fit_reports fr
  join public.closet_items ci
    on ci.id=fr.closet_item_id and ci.visibility='shared'::public.closet_visibility
  join public.products ep on ep.id=fr.product_id
  cross join target t
  cross join viewer v
  where v.user_id is not null
    and fr.garment_condition='normal'::public.garment_condition
    and (
      fr.product_id=p_product_id
      or (t.product_family_id is not null and ep.product_family_id=t.product_family_id)
      or (t.garment_type_key is not null and ep.garment_type_key=t.garment_type_key)
      or ep.category=t.category
    )
),
latest_candidates as materialized (
  select *
  from (
    select
      r.*,
      row_number() over(
        partition by r.user_id,r.evidence_product_id,coalesce(r.objective_variant_key,'')
        order by r.observed_at desc,r.fit_report_id desc
      ) as evidence_unit_rank
    from raw_candidates r
  ) ranked
  where ranked.evidence_unit_rank=1
),
with_overlap as materialized (
  select
    c.*,
    coalesce(overlap.attribute_overlap,0) as attribute_overlap
  from latest_candidates c
  left join lateral (
    select count(*)::integer as attribute_overlap
    from public.product_attribute_values ta
    join public.product_attribute_values ea
      on ea.attribute_key=ta.attribute_key and ea.option_key=ta.option_key
    where ta.product_id=p_product_id
      and ea.product_id=c.evidence_product_id
      and ta.source_status in ('corroborated'::public.product_data_status,'verified'::public.product_data_status)
      and ea.source_status in ('corroborated'::public.product_data_status,'verified'::public.product_data_status)
      and ta.confidence>=.75
      and ea.confidence>=.75
  ) overlap on true
),
snapshot_scores as materialized (
  select *
  from private.calculate_snapshot_matches_for_product(
    array(
      select distinct c.fit_profile_version_id
      from with_overlap c
      where c.fit_profile_version_id is not null
    ),
    p_product_id
  )
),
scored as (
  select
    c.*,
    hm.match_score as snapshot_match_score,
    hm.coverage_percent as snapshot_coverage_percent,
    case
      when c.target_variant_id is not null and c.evidence_variant_id=c.target_variant_id then 'exact_variant'::public.evidence_level
      when c.evidence_product_id=p_product_id then 'exact_product'::public.evidence_level
      when c.target_family_id is not null and c.product_family_id=c.target_family_id then 'product_family'::public.evidence_level
      when c.target_garment_type is not null and c.garment_type_key=c.target_garment_type and c.attribute_overlap>0 then 'similar_garments'::public.evidence_level
      when c.brand_id=c.target_brand_id and c.garment_type_key=c.target_garment_type then 'brand_garment_type'::public.evidence_level
      else 'category_fit'::public.evidence_level
    end as resolved_evidence_level,
    case
      when c.target_variant_id is not null and c.evidence_variant_id=c.target_variant_id then 1
      when c.evidence_product_id=p_product_id then 2
      when c.target_family_id is not null and c.product_family_id=c.target_family_id then 3
      when c.target_garment_type is not null and c.garment_type_key=c.target_garment_type and c.attribute_overlap>0 then 4
      when c.brand_id=c.target_brand_id and c.garment_type_key=c.target_garment_type then 5
      else 6
    end as resolved_evidence_rank
  from with_overlap c
  join snapshot_scores hm using (fit_profile_version_id)
),
limited as materialized (
  select s.*
  from scored s
  where s.snapshot_match_score>0
  order by
    s.resolved_evidence_rank,
    s.snapshot_match_score desc,
    s.snapshot_coverage_percent desc,
    s.attribute_overlap desc,
    s.fit_report_id
  limit least(greatest(coalesce(p_result_limit,200),1),500)
)
select
  l.fit_report_id,
  l.user_id,
  l.closet_item_id,
  l.evidence_product_id,
  l.evidence_variant_id,
  l.fit_profile_version_id,
  l.original_size_label,
  l.normalized_size_id,
  l.fit,
  l.would_buy_again,
  l.snapshot_match_score,
  l.snapshot_coverage_percent,
  l.resolved_evidence_level,
  l.resolved_evidence_rank,
  l.attribute_overlap
from limited l
order by
  l.resolved_evidence_rank,
  l.snapshot_match_score desc,
  l.snapshot_coverage_percent desc,
  l.attribute_overlap desc,
  l.fit_report_id;
$$;

revoke all on function private.resolve_product_evidence_core(uuid,uuid,integer) from public,anon,authenticated;

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
with core as materialized (
  select *
  from private.resolve_product_evidence_core(p_product_id,p_variant_id,p_result_limit)
),
pressures as materialized (
  select *
  from private.calculate_directional_pressures_for_product(
    array(
      select distinct c.fit_profile_version_id
      from core c
      where c.fit_profile_version_id is not null
    ),
    p_product_id
  )
)
select
  c.fit_report_id,
  c.user_id,
  c.closet_item_id,
  c.evidence_product_id,
  c.evidence_variant_id,
  c.fit_profile_version_id,
  c.original_size_label,
  c.normalized_size_id,
  c.fit,
  c.would_buy_again,
  c.historical_match_score,
  c.historical_coverage_percent,
  c.evidence_level,
  c.evidence_rank,
  c.attribute_overlap,
  private.directional_fit_support_from_pressure(c.fit,coalesce(p.pressure,0))
from core c
left join pressures p using (fit_profile_version_id)
order by
  c.evidence_rank,
  c.historical_match_score desc,
  c.historical_coverage_percent desc,
  c.attribute_overlap desc,
  c.fit_report_id;
$$;

create or replace function public.get_product_evidence_summaries(
  p_product_ids uuid[],
  p_result_limit integer default 40
)
returns table(
  product_id uuid,
  best_match_score integer,
  report_count integer,
  best_fit_report_id uuid,
  best_user_id uuid,
  best_original_size_label text,
  best_fit public.fit_rating
)
language sql
security definer
set search_path=''
as $$
with requested as (
  select distinct requested_product_id as product_id
  from unnest(coalesce(p_product_ids,'{}'::uuid[])) requested_product(requested_product_id)
  where requested_product_id is not null
  limit 96
),
candidates as (
  select
    r.product_id,
    c.fit_report_id,
    c.user_id,
    c.original_size_label,
    c.fit,
    c.historical_match_score,
    c.historical_coverage_percent,
    c.evidence_rank
  from requested r
  left join lateral private.resolve_product_evidence_core(
    r.product_id,
    null::uuid,
    least(greatest(coalesce(p_result_limit,40),1),100)
  ) c on true
),
ranked as (
  select
    c.*,
    row_number() over(
      partition by c.product_id
      order by c.historical_match_score desc nulls last,c.evidence_rank,c.historical_coverage_percent desc,c.fit_report_id
    ) as evidence_position
  from candidates c
)
select
  r.product_id,
  coalesce(max(r.historical_match_score),0)::integer as best_match_score,
  count(r.fit_report_id)::integer as report_count,
  (array_agg(r.fit_report_id) filter(where r.evidence_position=1))[1] as best_fit_report_id,
  (array_agg(r.user_id) filter(where r.evidence_position=1))[1] as best_user_id,
  (array_agg(r.original_size_label) filter(where r.evidence_position=1))[1] as best_original_size_label,
  (array_agg(r.fit) filter(where r.evidence_position=1))[1] as best_fit
from ranked r
group by r.product_id
order by r.product_id;
$$;

revoke all on function public.get_product_evidence_summaries(uuid[],integer) from public,anon;
grant execute on function public.get_product_evidence_summaries(uuid[],integer) to authenticated;

comment on function public.get_product_evidence_summaries(uuid[],integer) is
  'Bounded batch projection used by Explore cards. It reuses the canonical Product evidence core without calculating directional support that cards do not display.';

-- Tagged Outfit cards need only the exact Product + tracked-variation count. Do not invoke
-- the full six-level FITuition hierarchy merely to calculate this lightweight badge.
create or replace function public.get_outfit_tagged_fit_counts(
  p_post_id uuid,
  p_match_threshold integer
)
returns table(
  closet_item_id uuid,
  matching_fit_reports integer
)
language sql
security definer
set search_path=''
as $$
with tags as (
  select distinct opi.closet_item_id
  from public.outfit_post_items opi
  where opi.post_id=p_post_id
    and exists(
      select 1
      from public.outfit_posts op
      where op.id=p_post_id
        and (op.status='published' or op.user_id=auth.uid())
    )
),
targets as (
  select
    t.closet_item_id,
    target_report.product_id,
    coalesce(target_report.objective_variant_key,'') as objective_variant_key
  from tags t
  left join lateral (
    select fr.product_id,fr.objective_variant_key
    from public.fit_reports fr
    where fr.closet_item_id=t.closet_item_id
    order by fr.created_at desc,fr.id desc
    limit 1
  ) target_report on true
),
community_candidates as materialized (
  select
    target.closet_item_id,
    target.product_id,
    fr.id as fit_report_id,
    fr.user_id,
    fr.fit_profile_version_id,
    fr.created_at,
    row_number() over(
      partition by target.closet_item_id,fr.user_id
      order by fr.created_at desc,fr.id desc
    ) as evidence_unit_rank
  from targets target
  join public.fit_reports fr
    on fr.product_id=target.product_id
   and coalesce(fr.objective_variant_key,'')=target.objective_variant_key
   and fr.garment_condition='normal'::public.garment_condition
  join public.closet_items ci
    on ci.id=fr.closet_item_id and ci.visibility='shared'::public.closet_visibility
  where target.product_id is not null
    and fr.user_id<>auth.uid()
),
community_latest as materialized (
  select *
  from community_candidates c
  where c.evidence_unit_rank=1
),
community_scored as (
  select
    target.closet_item_id,
    score.fit_profile_version_id,
    score.match_score
  from (
    select distinct closet_item_id,product_id
    from community_latest
  ) target
  cross join lateral private.calculate_snapshot_matches_for_product(
    array(
      select distinct c.fit_profile_version_id
      from community_latest c
      where c.closet_item_id=target.closet_item_id
        and c.fit_profile_version_id is not null
    ),
    target.product_id
  ) score
),
community_counts as (
  select
    latest.closet_item_id,
    count(*)::integer as report_count
  from community_latest latest
  join community_scored score
    on score.closet_item_id=latest.closet_item_id
   and score.fit_profile_version_id=latest.fit_profile_version_id
  where score.match_score>=least(greatest(p_match_threshold,0),100)
  group by latest.closet_item_id
),
viewer_recent as (
  select
    fr.product_id,
    fr.objective_variant_key,
    fr.garment_condition,
    fr.created_at,
    fr.id
  from public.fit_reports fr
  where fr.user_id=auth.uid()
  order by fr.created_at desc,fr.id desc
  limit 200
),
own_latest as (
  select distinct on (fr.product_id,coalesce(fr.objective_variant_key,''))
    fr.product_id,
    coalesce(fr.objective_variant_key,'') as objective_variant_key,
    fr.garment_condition
  from viewer_recent fr
  join (
    select distinct product_id,objective_variant_key
    from targets
    where product_id is not null
  ) target_identity
    on target_identity.product_id=fr.product_id
   and target_identity.objective_variant_key=coalesce(fr.objective_variant_key,'')
  order by fr.product_id,coalesce(fr.objective_variant_key,''),fr.created_at desc,fr.id desc
),
own_counts as (
  select target.closet_item_id,1::integer as report_count
  from targets target
  join own_latest own_report
    on own_report.product_id=target.product_id
   and own_report.objective_variant_key=target.objective_variant_key
  where own_report.garment_condition='normal'
)
select
  tag.closet_item_id,
  coalesce(community.report_count,0)+coalesce(own_report.report_count,0) as matching_fit_reports
from tags tag
left join community_counts community using (closet_item_id)
left join own_counts own_report using (closet_item_id)
order by tag.closet_item_id;
$$;

revoke all on function public.get_outfit_tagged_fit_counts(uuid,integer) from public,anon;
grant execute on function public.get_outfit_tagged_fit_counts(uuid,integer) to authenticated;

comment on function public.get_outfit_tagged_fit_counts(uuid,integer) is
  'Bounded Outfit-level projection of exact Product/tracked-variation Relevant Fit Report counts. Full FITuition evidence remains lazy for the selected garment.';
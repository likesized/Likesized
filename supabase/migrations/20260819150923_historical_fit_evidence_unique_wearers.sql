-- LikeSized canonical migration: 20260819150923_historical_fit_evidence_unique_wearers
-- Exact SQL applied to the connected Supabase project.

-- Canonical historical-fit evidence rules: current people match current profiles; garment evidence matches the viewer to the immutable snapshot on each Fit Report.

create or replace function public.get_product_evidence_candidates(
  p_product_id uuid,
  p_variant_id uuid default null,
  p_result_limit integer default 200
)
returns table (
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
security invoker
set search_path=''
as $$
  with target as (
    select
      p.*,
      coalesce(
        gt.match_profile_key,
        case p.category
          when 'tops'::public.garment_category then 'tops_default'
          when 'bottoms'::public.garment_category then 'bottoms_default'
          when 'dresses'::public.garment_category then 'dresses_default'
          when 'shoes'::public.garment_category then 'shoes'
          else 'overall'
        end
      ) as target_match_profile_key
    from public.products p
    left join public.garment_types gt on gt.key=p.garment_type_key
    where p.id=p_product_id
  ),
  candidates as (
    select
      fr.id as fit_report_id,
      fr.user_id,
      fr.closet_item_id,
      fr.product_id as evidence_product_id,
      fr.variant_id as evidence_variant_id,
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
      (
        select count(*)::integer
        from public.product_attribute_values ta
        join public.product_attribute_values ea
          on ea.attribute_key=ta.attribute_key and ea.option_key=ta.option_key
        where ta.product_id=p_product_id and ea.product_id=ep.id
      ) as attribute_overlap,
      t.brand_id as target_brand_id,
      t.product_family_id as target_family_id,
      t.garment_type_key as target_garment_type,
      t.category as target_category,
      t.target_match_profile_key
    from public.fit_reports fr
    join public.products ep on ep.id=fr.product_id
    cross join target t
    where
      fr.product_id=p_product_id
      or (t.product_family_id is not null and ep.product_family_id=t.product_family_id)
      or (t.garment_type_key is not null and ep.garment_type_key=t.garment_type_key)
      or ep.category=t.category
  ),
  scored as (
    select
      c.*,
      hm.match_score as snapshot_match_score,
      hm.coverage_percent as snapshot_coverage_percent,
      case
        when p_variant_id is not null and c.evidence_variant_id=p_variant_id then 'exact_variant'::public.evidence_level
        when c.evidence_product_id=p_product_id then 'exact_product'::public.evidence_level
        when c.target_family_id is not null and c.product_family_id=c.target_family_id then 'product_family'::public.evidence_level
        when c.target_garment_type is not null and c.garment_type_key=c.target_garment_type and c.attribute_overlap>0 then 'similar_garments'::public.evidence_level
        when c.brand_id=c.target_brand_id and c.garment_type_key=c.target_garment_type then 'brand_garment_type'::public.evidence_level
        else 'category_fit'::public.evidence_level
      end as resolved_evidence_level,
      case
        when p_variant_id is not null and c.evidence_variant_id=p_variant_id then 1
        when c.evidence_product_id=p_product_id then 2
        when c.target_family_id is not null and c.product_family_id=c.target_family_id then 3
        when c.target_garment_type is not null and c.garment_type_key=c.target_garment_type and c.attribute_overlap>0 then 4
        when c.brand_id=c.target_brand_id and c.garment_type_key=c.target_garment_type then 5
        else 6
      end as resolved_evidence_rank
    from candidates c
    cross join lateral private.calculate_snapshot_match(c.fit_profile_version_id,c.target_match_profile_key) hm
  ),
  one_per_person as (
    select
      s.*,
      row_number() over (
        partition by s.user_id
        order by
          s.resolved_evidence_rank asc,
          s.snapshot_match_score desc,
          s.snapshot_coverage_percent desc,
          s.attribute_overlap desc,
          s.observed_at desc,
          s.fit_report_id
      ) as person_rank
    from scored s
  )
  select
    r.fit_report_id,
    r.user_id,
    r.closet_item_id,
    r.evidence_product_id,
    r.evidence_variant_id,
    r.fit_profile_version_id,
    r.original_size_label,
    r.normalized_size_id,
    r.fit,
    r.would_buy_again,
    r.snapshot_match_score,
    r.snapshot_coverage_percent,
    r.resolved_evidence_level,
    r.resolved_evidence_rank,
    r.attribute_overlap
  from one_per_person r
  where r.person_rank=1
  order by r.resolved_evidence_rank, r.snapshot_match_score desc, r.snapshot_coverage_percent desc, r.attribute_overlap desc, r.fit_report_id
  limit least(greatest(coalesce(p_result_limit,200),1),500);
$$;

revoke all on function public.get_product_evidence_candidates(uuid,uuid,integer) from public,anon;
grant execute on function public.get_product_evidence_candidates(uuid,uuid,integer) to authenticated;

create or replace function public.get_fit_report_snapshot_matches(
  p_fit_report_ids uuid[]
)
returns table (
  fit_report_id uuid,
  historical_match_score integer,
  historical_coverage_percent integer
)
language sql
security invoker
set search_path=''
as $$
  select
    fr.id,
    hm.match_score,
    hm.coverage_percent
  from public.fit_reports fr
  join public.products p on p.id=fr.product_id
  left join public.garment_types gt on gt.key=p.garment_type_key
  cross join lateral private.calculate_snapshot_match(
    fr.fit_profile_version_id,
    coalesce(
      gt.match_profile_key,
      case p.category
        when 'tops'::public.garment_category then 'tops_default'
        when 'bottoms'::public.garment_category then 'bottoms_default'
        when 'dresses'::public.garment_category then 'dresses_default'
        when 'shoes'::public.garment_category then 'shoes'
        else 'overall'
      end
    )
  ) hm
  where fr.id=any(coalesce(p_fit_report_ids,'{}'::uuid[]))
  limit 100;
$$;

revoke all on function public.get_fit_report_snapshot_matches(uuid[]) from public,anon;
grant execute on function public.get_fit_report_snapshot_matches(uuid[]) to authenticated;

comment on function public.get_fit_matches(public.fit_match_category,integer) is
  'Current-person discovery only: compares the viewer current body_measurements to other members current body_measurements.';
comment on function public.get_garment_fit_matches(text,integer) is
  'Current-person garment-specific discovery only: current body to current body.';
comment on function public.get_product_evidence_candidates(uuid,uuid,integer) is
  'Recommendation evidence: compares viewer current body to each Fit Report immutable historical snapshot and returns at most one strongest observation per unique wearer.';
comment on function public.get_fit_report_snapshot_matches(uuid[]) is
  'Safe derived historical match scores for visible Fit Reports. Never returns raw historical measurements.';

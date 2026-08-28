-- Preserve historical FITuition correctness while keeping candidate discovery bounded.
-- Current-person Match neighborhoods are not a valid proxy for a wearer's historical body state,
-- so historical evidence uses private buckets derived from immutable Fit Profile snapshots.

create index if not exists fit_reports_product_profile_version_created_idx
  on public.fit_reports(product_id,fit_profile_version_id,created_at desc);

create table private.fit_profile_version_candidate_buckets (
  fit_profile_version_id uuid not null references public.fit_profile_versions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  measurement_type_key text not null references public.measurement_types(key),
  bucket integer not null,
  primary key(fit_profile_version_id,measurement_type_key)
);

create index fit_profile_version_candidate_bucket_lookup_idx
  on private.fit_profile_version_candidate_buckets(measurement_type_key,bucket,fit_profile_version_id);
create index fit_profile_version_candidate_bucket_user_idx
  on private.fit_profile_version_candidate_buckets(user_id,fit_profile_version_id);

revoke all on private.fit_profile_version_candidate_buckets from public,anon,authenticated;

insert into private.fit_profile_version_candidate_buckets(
  fit_profile_version_id,user_id,measurement_type_key,bucket
)
select
  fpvm.fit_profile_version_id,
  fpv.user_id,
  fpvm.measurement_type_key,
  private.fit_match_bucket(fpvm.value_canonical)
from public.fit_profile_version_measurements fpvm
join public.fit_profile_versions fpv on fpv.id=fpvm.fit_profile_version_id
where fpvm.value_canonical is not null
on conflict(fit_profile_version_id,measurement_type_key) do update
set user_id=excluded.user_id,bucket=excluded.bucket;

create or replace function private.sync_fit_profile_version_candidate_bucket()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user_id uuid;
begin
  if tg_op='DELETE' then
    delete from private.fit_profile_version_candidate_buckets b
    where b.fit_profile_version_id=old.fit_profile_version_id
      and b.measurement_type_key=old.measurement_type_key;
    return old;
  end if;

  if tg_op='UPDATE' and (
    new.fit_profile_version_id is distinct from old.fit_profile_version_id
    or new.measurement_type_key is distinct from old.measurement_type_key
  ) then
    delete from private.fit_profile_version_candidate_buckets b
    where b.fit_profile_version_id=old.fit_profile_version_id
      and b.measurement_type_key=old.measurement_type_key;
  end if;

  select fpv.user_id into v_user_id
  from public.fit_profile_versions fpv
  where fpv.id=new.fit_profile_version_id;

  if v_user_id is null or new.value_canonical is null then
    delete from private.fit_profile_version_candidate_buckets b
    where b.fit_profile_version_id=new.fit_profile_version_id
      and b.measurement_type_key=new.measurement_type_key;
    return new;
  end if;

  insert into private.fit_profile_version_candidate_buckets(
    fit_profile_version_id,user_id,measurement_type_key,bucket
  ) values (
    new.fit_profile_version_id,v_user_id,new.measurement_type_key,
    private.fit_match_bucket(new.value_canonical)
  )
  on conflict(fit_profile_version_id,measurement_type_key) do update
  set user_id=excluded.user_id,bucket=excluded.bucket;

  return new;
end;
$$;
revoke all on function private.sync_fit_profile_version_candidate_bucket() from public,anon,authenticated;

create trigger fit_profile_version_measurements_sync_candidate_bucket
after insert or update or delete on public.fit_profile_version_measurements
for each row execute function private.sync_fit_profile_version_candidate_bucket();

-- Fit Community does not change Match math, but it changes who is eligible for discovery.
-- Bump the same private Match-input revision so cached neighborhoods containing this member
-- become stale immediately instead of waiting for the safety TTL.
create or replace function private.bump_match_input_version_on_fit_community_change()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  if new.fit_community is distinct from old.fit_community then
    new.match_input_version:=old.match_input_version+1;
  end if;
  return new;
end;
$$;
revoke all on function private.bump_match_input_version_on_fit_community_change() from public,anon,authenticated;

create trigger fit_profiles_bump_match_input_on_fit_community_change
before update of fit_community on public.fit_profiles
for each row execute function private.bump_match_input_version_on_fit_community_change();

create or replace function private.discover_historical_product_snapshot_candidates(
  p_product_id uuid,
  p_candidate_limit integer default 1400
)
returns table(fit_profile_version_id uuid)
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user_id uuid:=auth.uid();
  v_limit integer:=least(greatest(coalesce(p_candidate_limit,1400),200),1800);
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode='28000';
  end if;

  return query
  with target as materialized (
    select p.id,p.product_family_id,p.garment_type_key,p.category
    from public.products p
    where p.id=p_product_id
  ),
  viewer_buckets as materialized (
    select
      bm.measurement_type_key,
      private.fit_match_bucket(bm.value_canonical) as bucket
    from public.body_measurements bm
    where bm.user_id=v_user_id and bm.value_canonical is not null
  ),
  exact_seed as materialized (
    select
      b.fit_profile_version_id,
      count(distinct vb.measurement_type_key)::integer as hits,
      max(fr.created_at) as latest_at,
      1 as priority
    from viewer_buckets vb
    join private.fit_profile_version_candidate_buckets b
      on b.measurement_type_key=vb.measurement_type_key
     and b.bucket between vb.bucket-2 and vb.bucket+2
     and b.user_id<>v_user_id
    join public.fit_reports fr
      on fr.fit_profile_version_id=b.fit_profile_version_id
     and fr.product_id=p_product_id
     and fr.garment_condition='normal'::public.garment_condition
    join public.closet_items ci
      on ci.id=fr.closet_item_id and ci.visibility='shared'::public.closet_visibility
    group by b.fit_profile_version_id
    order by count(distinct vb.measurement_type_key) desc,max(fr.created_at) desc,b.fit_profile_version_id
    limit 450
  ),
  family_seed as materialized (
    select
      b.fit_profile_version_id,
      count(distinct vb.measurement_type_key)::integer as hits,
      max(fr.created_at) as latest_at,
      2 as priority
    from target t
    join public.products ep
      on t.product_family_id is not null and ep.product_family_id=t.product_family_id
    join public.fit_reports fr
      on fr.product_id=ep.id and fr.garment_condition='normal'::public.garment_condition
    join public.closet_items ci
      on ci.id=fr.closet_item_id and ci.visibility='shared'::public.closet_visibility
    join private.fit_profile_version_candidate_buckets b
      on b.fit_profile_version_id=fr.fit_profile_version_id and b.user_id<>v_user_id
    join viewer_buckets vb
      on vb.measurement_type_key=b.measurement_type_key
     and b.bucket between vb.bucket-2 and vb.bucket+2
    where ep.id<>p_product_id
    group by b.fit_profile_version_id
    order by count(distinct vb.measurement_type_key) desc,max(fr.created_at) desc,b.fit_profile_version_id
    limit 300
  ),
  garment_seed as materialized (
    select
      b.fit_profile_version_id,
      count(distinct vb.measurement_type_key)::integer as hits,
      max(fr.created_at) as latest_at,
      3 as priority
    from target t
    join public.products ep
      on t.garment_type_key is not null and ep.garment_type_key=t.garment_type_key
    join public.fit_reports fr
      on fr.product_id=ep.id and fr.garment_condition='normal'::public.garment_condition
    join public.closet_items ci
      on ci.id=fr.closet_item_id and ci.visibility='shared'::public.closet_visibility
    join private.fit_profile_version_candidate_buckets b
      on b.fit_profile_version_id=fr.fit_profile_version_id and b.user_id<>v_user_id
    join viewer_buckets vb
      on vb.measurement_type_key=b.measurement_type_key
     and b.bucket between vb.bucket-2 and vb.bucket+2
    group by b.fit_profile_version_id
    order by count(distinct vb.measurement_type_key) desc,max(fr.created_at) desc,b.fit_profile_version_id
    limit 350
  ),
  broad_seed as materialized (
    select
      seeded.fit_profile_version_id,
      count(*)::integer as hits,
      null::timestamptz as latest_at,
      4 as priority
    from viewer_buckets vb
    cross join lateral (
      select b.fit_profile_version_id
      from private.fit_profile_version_candidate_buckets b
      where b.measurement_type_key=vb.measurement_type_key
        and b.bucket between vb.bucket-2 and vb.bucket+2
        and b.user_id<>v_user_id
      order by abs(b.bucket-vb.bucket),b.fit_profile_version_id
      limit 160
    ) seeded
    group by seeded.fit_profile_version_id
    order by count(*) desc,seeded.fit_profile_version_id
    limit 650
  ),
  own_seed as materialized (
    select fpv.id as fit_profile_version_id,999 as hits,fpv.created_at as latest_at,0 as priority
    from public.fit_profile_versions fpv
    where fpv.user_id=v_user_id
    order by fpv.created_at desc,fpv.id desc
    limit 200
  ),
  combined as (
    select * from own_seed
    union all select * from exact_seed
    union all select * from family_seed
    union all select * from garment_seed
    union all select * from broad_seed
  ),
  ranked as (
    select
      c.fit_profile_version_id,
      min(c.priority) as priority,
      max(c.hits) as hits,
      max(c.latest_at) as latest_at
    from combined c
    group by c.fit_profile_version_id
    order by min(c.priority),max(c.hits) desc,max(c.latest_at) desc nulls last,c.fit_profile_version_id
    limit v_limit
  )
  select r.fit_profile_version_id
  from ranked r
  order by r.priority,r.hits desc,r.latest_at desc nulls last,r.fit_profile_version_id;
end;
$$;
revoke all on function private.discover_historical_product_snapshot_candidates(uuid,integer) from public,anon,authenticated;

-- Rebind the canonical evidence core to historical snapshot-derived candidates. The exact
-- historical Match scorer remains authoritative; buckets only bound who is worth scoring.
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
  from candidate_snapshots cs
  join public.fit_reports fr on fr.fit_profile_version_id=cs.fit_profile_version_id
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

comment on function private.discover_historical_product_snapshot_candidates(uuid,integer) is
  'Private bounded historical evidence shortlist. Uses immutable Fit Profile snapshot buckets, prioritizing exact Product/family/garment evidence before broad fallback; exact historical Match math still decides the displayed score.';

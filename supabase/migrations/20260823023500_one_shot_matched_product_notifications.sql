begin;

alter table public.product_evidence_notifications
  add column active boolean;

update public.product_evidence_notifications
set active=(last_notified_at is null)
where active is null;

alter table public.product_evidence_notifications
  alter column active set default true,
  alter column active set not null;

alter table public.product_evidence_notifications
  add column matched_fit_report_id uuid references public.fit_reports(id) on delete set null;

create index product_evidence_notifications_active_idx
  on public.product_evidence_notifications(product_id,user_id)
  where active;

create or replace function private.calculate_snapshot_match_for_user_product(
  p_user_id uuid,
  p_fit_profile_version_id uuid,
  p_product_id uuid
)
returns table(match_score integer, coverage_percent integer)
language plpgsql
security definer
set search_path=''
as $$
declare
  v_base_match integer;
  v_coverage_percent integer;
  v_garment_type_key text;
  v_market_segment public.garment_market_segment;
  v_similarity numeric;
  v_influence numeric;
begin
  if p_user_id is null or p_fit_profile_version_id is null or p_product_id is null then
    return query select 0,0;
    return;
  end if;

  with snapshot as (
    select created_at
    from public.fit_profile_versions
    where id=p_fit_profile_version_id
  ), w as (
    select *
    from private.product_match_measurements(p_product_id)
  ), meta as (
    select
      sum(coverage_weight) total_coverage,
      count(*)::integer measurement_count,
      max(minimum_shared_measurements) minimum_shared_measurements,
      max(minimum_coverage) minimum_coverage
    from w
  ), s as (
    select
      sum(case when me.value_canonical is not null and hist.value_canonical is not null
        then private.fit_measurement_similarity(me.value_canonical,hist.value_canonical,w.tolerance)
          *w.weight
          *sqrt(private.fit_measurement_reliability(me.source,me.method)*private.fit_measurement_reliability(hist.source,hist.method))
        else 0 end) weighted_similarity,
      sum(case when me.value_canonical is not null and hist.value_canonical is not null
        then w.weight*sqrt(private.fit_measurement_reliability(me.source,me.method)*private.fit_measurement_reliability(hist.source,hist.method))
        else 0 end) similarity_weight,
      sum(case when me.value_canonical is not null and hist.value_canonical is not null then w.coverage_weight else 0 end) shared_coverage,
      sum(case when me.value_canonical is not null and hist.value_canonical is not null
        then w.coverage_weight*sqrt(
          private.fit_measurement_confidence_reliability(me.source,me.method,w.measurement_type_key,me.confirmed_at,now())
          *private.fit_measurement_confidence_reliability(hist.source,hist.method,w.measurement_type_key,hist.confirmed_at,snapshot.created_at)
        ) else 0 end) reliable_coverage,
      count(*) filter(where me.value_canonical is not null and hist.value_canonical is not null)::integer shared_count,
      max(meta.total_coverage) total_coverage,
      max(meta.measurement_count) measurement_count,
      max(meta.minimum_shared_measurements) minimum_shared_measurements,
      max(meta.minimum_coverage) minimum_coverage
    from w
    cross join meta
    cross join snapshot
    left join public.body_measurements me
      on me.user_id=p_user_id
     and me.measurement_type_key=w.measurement_type_key
    left join public.fit_profile_version_measurements hist
      on hist.fit_profile_version_id=p_fit_profile_version_id
     and hist.measurement_type_key=w.measurement_type_key
  )
  select
    case when similarity_weight>0
          and shared_count>=minimum_shared_measurements
          and shared_coverage/nullif(total_coverage,0)>=minimum_coverage
      then private.confidence_adjusted_match(
        weighted_similarity,similarity_weight,shared_coverage,reliable_coverage,total_coverage,shared_count,measurement_count
      )
      else 0 end,
    case when total_coverage>0
      then round(100*least(1::numeric,greatest(0::numeric,shared_coverage/nullif(total_coverage,0))))::integer
      else 0 end
  into v_base_match,v_coverage_percent
  from s;

  v_base_match:=coalesce(v_base_match,0);
  v_coverage_percent:=coalesce(v_coverage_percent,0);

  if v_base_match<=0 then
    return query select v_base_match,v_coverage_percent;
    return;
  end if;

  select garment_type_key,market_segment
  into v_garment_type_key,v_market_segment
  from public.products
  where id=p_product_id;

  if v_garment_type_key is null then
    return query select v_base_match,v_coverage_percent;
    return;
  end if;

  with standard_available as (
    select
      r.weight,
      r.relative_tolerance,
      me_n.value_canonical/me_d.value_canonical viewer_ratio,
      hist_n.value_canonical/hist_d.value_canonical historical_ratio,
      sqrt(
        sqrt(private.fit_measurement_reliability(me_n.source,me_n.method)*private.fit_measurement_reliability(me_d.source,me_d.method))
        *sqrt(private.fit_measurement_reliability(hist_n.source,hist_n.method)*private.fit_measurement_reliability(hist_d.source,hist_d.method))
      ) reliability
    from private.garment_proportion_rules r
    join public.body_measurements me_n
      on me_n.user_id=p_user_id
     and me_n.measurement_type_key=r.numerator_measurement_type_key
    join public.body_measurements me_d
      on me_d.user_id=p_user_id
     and me_d.measurement_type_key=r.denominator_measurement_type_key
    join public.fit_profile_version_measurements hist_n
      on hist_n.fit_profile_version_id=p_fit_profile_version_id
     and hist_n.measurement_type_key=r.numerator_measurement_type_key
    join public.fit_profile_version_measurements hist_d
      on hist_d.fit_profile_version_id=p_fit_profile_version_id
     and hist_d.measurement_type_key=r.denominator_measurement_type_key
    where r.garment_type_key=v_garment_type_key
  ), bust_shape_available as (
    select
      r.bust_to_chest_ratio_weight weight,
      r.bust_to_chest_relative_tolerance relative_tolerance,
      me_bust.value_canonical/me_chest.value_canonical viewer_ratio,
      hist_bust.value_canonical/hist_chest.value_canonical historical_ratio,
      sqrt(
        sqrt(private.fit_measurement_reliability(me_bust.source,me_bust.method)*private.fit_measurement_reliability(me_chest.source,me_chest.method))
        *sqrt(private.fit_measurement_reliability(hist_bust.source,hist_bust.method)*private.fit_measurement_reliability(hist_chest.source,hist_chest.method))
      ) reliability
    from private.bust_shaping_product_rules r
    join public.body_measurements me_bust
      on me_bust.user_id=p_user_id
     and me_bust.measurement_type_key='full_bust'
    join public.body_measurements me_chest
      on me_chest.user_id=p_user_id
     and me_chest.measurement_type_key='chest_circumference'
    join public.fit_profile_version_measurements hist_bust
      on hist_bust.fit_profile_version_id=p_fit_profile_version_id
     and hist_bust.measurement_type_key='full_bust'
    join public.fit_profile_version_measurements hist_chest
      on hist_chest.fit_profile_version_id=p_fit_profile_version_id
     and hist_chest.measurement_type_key='chest_circumference'
    where r.garment_type_key=v_garment_type_key
      and v_market_segment='womens'::public.garment_market_segment
      and r.bust_to_chest_ratio_weight>0
  ), available as (
    select * from standard_available
    union all
    select * from bust_shape_available
  )
  select
    sum(private.fit_proportion_similarity(viewer_ratio,historical_ratio,relative_tolerance)*weight*reliability)
      /nullif(sum(weight*reliability),0),
    least(.08::numeric,coalesce(sum(weight*reliability),0))
  into v_similarity,v_influence
  from available;

  return query
  select private.apply_proportion_refinement(v_base_match,v_similarity,v_influence),v_coverage_percent;
end;
$$;

revoke all on function private.calculate_snapshot_match_for_user_product(uuid,uuid,uuid)
  from public,anon,authenticated;

create or replace function private.notify_product_evidence_watchers()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  if new.product_id is null then
    return new;
  end if;

  if new.garment_condition is distinct from 'normal'::public.garment_condition then
    return new;
  end if;

  if not exists(
    select 1
    from public.closet_items ci
    where ci.id=new.closet_item_id
      and ci.visibility='shared'::public.closet_visibility
  ) then
    return new;
  end if;

  with qualifying as (
    select watch.user_id
    from public.product_evidence_notifications watch
    cross join lateral private.calculate_snapshot_match_for_user_product(
      watch.user_id,
      coalesce(new.match_fit_profile_version_id,new.fit_profile_version_id),
      new.product_id
    ) hm
    where watch.product_id=new.product_id
      and watch.active
      and watch.user_id<>new.user_id
      and watch.requested_at<=new.created_at
      and hm.match_score>=75
  )
  update public.product_evidence_notifications watch
  set
    last_notified_at=now(),
    read_at=null,
    active=false,
    matched_fit_report_id=new.id
  from qualifying q
  where watch.user_id=q.user_id
    and watch.product_id=new.product_id
    and watch.active;

  return new;
end;
$$;

revoke all on function private.notify_product_evidence_watchers()
  from public,anon,authenticated;

comment on table public.product_evidence_notifications is
  'Private per-member Product bell state and one-shot alert history. An active bell fires only when a future Shared normal-condition Fit Report for the exact Product reaches the canonical historical garment Match minimums and a 75%+ Match for that member; firing turns the bell off until the member enables it again.';

commit;

-- LikeSized canonical migration: exact-variation FITuition watches only fire when a new report clears the strong Body Match threshold.
alter table public.product_evidence_notifications add column objective_variant_key text not null default '',add column minimum_match_score integer not null default 85 check(minimum_match_score between 1 and 100);
alter table public.product_evidence_notifications drop constraint product_evidence_notifications_pkey;
alter table public.product_evidence_notifications add constraint product_evidence_notifications_pkey primary key(user_id,product_id,objective_variant_key);
create or replace function private.calculate_user_snapshot_match_for_product(p_user_id uuid,p_fit_profile_version_id uuid,p_product_id uuid)
returns table(match_score integer,coverage_percent integer) language plpgsql stable security definer set search_path='' as $$
begin
 if p_user_id is null or p_fit_profile_version_id is null or p_product_id is null then return query select 0,0;return;end if;
 return query with w as(select * from private.product_match_measurements(p_product_id)),meta as(select sum(coverage_weight) total_coverage,count(*)::integer measurement_count,max(minimum_shared_measurements) minimum_shared_measurements,max(minimum_coverage) minimum_coverage from w),s as(
 select sum(case when me.value_canonical is not null and hist.value_canonical is not null then private.fit_measurement_similarity(me.value_canonical,hist.value_canonical,w.tolerance)*w.weight*sqrt(private.fit_measurement_reliability(me.source,me.method)*private.fit_measurement_reliability(hist.source,hist.method)) else 0 end) weighted_similarity,
 sum(case when me.value_canonical is not null and hist.value_canonical is not null then w.weight*sqrt(private.fit_measurement_reliability(me.source,me.method)*private.fit_measurement_reliability(hist.source,hist.method)) else 0 end) similarity_weight,
 sum(case when me.value_canonical is not null and hist.value_canonical is not null then w.coverage_weight else 0 end) shared_coverage,
 sum(case when me.value_canonical is not null and hist.value_canonical is not null then w.coverage_weight*sqrt(private.fit_measurement_reliability(me.source,me.method)*private.fit_measurement_reliability(hist.source,hist.method)) else 0 end) reliable_coverage,
 count(*) filter(where me.value_canonical is not null and hist.value_canonical is not null)::integer shared_count,max(meta.total_coverage) total_coverage,max(meta.measurement_count) measurement_count,max(meta.minimum_shared_measurements) minimum_shared_measurements,max(meta.minimum_coverage) minimum_coverage
 from w cross join meta left join public.body_measurements me on me.user_id=p_user_id and me.measurement_type_key=w.measurement_type_key left join public.fit_profile_version_measurements hist on hist.fit_profile_version_id=p_fit_profile_version_id and hist.measurement_type_key=w.measurement_type_key)
 select case when similarity_weight>0 and shared_count>=minimum_shared_measurements and shared_coverage/nullif(total_coverage,0)>=minimum_coverage then private.confidence_adjusted_match(weighted_similarity,similarity_weight,shared_coverage,reliable_coverage,total_coverage,shared_count,measurement_count) else 0 end,case when total_coverage>0 then round(100*least(1::numeric,greatest(0::numeric,shared_coverage/nullif(total_coverage,0))))::integer else 0 end from s;
end;$$;
revoke all on function private.calculate_user_snapshot_match_for_product(uuid,uuid,uuid) from public,anon,authenticated;
create or replace function private.notify_product_evidence_watchers() returns trigger language plpgsql security definer set search_path='' as $$
declare v_watch record;v_match integer;begin
 for v_watch in select pen.user_id,pen.objective_variant_key,pen.minimum_match_score from public.product_evidence_notifications pen where pen.product_id=new.product_id and pen.user_id<>new.user_id and pen.requested_at<=new.created_at and pen.objective_variant_key=coalesce(new.objective_variant_key,'') loop
  select m.match_score into v_match from private.calculate_user_snapshot_match_for_product(v_watch.user_id,new.fit_profile_version_id,new.product_id) m;
  if coalesce(v_match,0)>=v_watch.minimum_match_score then update public.product_evidence_notifications set last_notified_at=now(),read_at=null where user_id=v_watch.user_id and product_id=new.product_id and objective_variant_key=v_watch.objective_variant_key;end if;
 end loop;return new;
end;$$;
revoke all on function private.notify_product_evidence_watchers() from public,anon,authenticated;
drop trigger if exists notify_product_evidence_watchers_after_fit_report on public.fit_reports;create trigger notify_product_evidence_watchers_after_fit_report after insert on public.fit_reports for each row execute function private.notify_product_evidence_watchers();
comment on column public.product_evidence_notifications.objective_variant_key is 'Exact tracked fit-variation identity for a personalized evidence watch.';
comment on column public.product_evidence_notifications.minimum_match_score is 'Minimum Body Match required before an exact-variation evidence watch fires; quick-view watches use 85.';
comment on table public.product_evidence_notifications is 'Member requests for an in-app alert when a strong exact-variation Fit Report arrives.';

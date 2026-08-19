-- LikeSized canonical migration: 20260819150022_immutable_fit_profile_versions
-- Exact SQL applied to the connected Supabase project.
-- Every Fit Report is permanently tied to the body/size state that existed when it was logged.

create table public.fit_profile_versions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  version_number integer not null check (version_number > 0),
  measurement_fingerprint text not null,
  created_reason text not null check (created_reason in ('profile_save','fit_report_lock','system')),
  created_at timestamptz not null default now(),
  unique (user_id, version_number)
);
create index fit_profile_versions_user_created_idx
  on public.fit_profile_versions(user_id, created_at desc);

create table public.fit_profile_version_measurements (
  fit_profile_version_id uuid not null references public.fit_profile_versions(id) on delete cascade,
  measurement_type_key text not null references public.measurement_types(key),
  entered_value numeric(12,6) not null,
  entered_unit public.measurement_unit not null,
  value_canonical numeric(12,6) not null,
  source public.measurement_source not null,
  method public.measurement_method not null,
  primary key (fit_profile_version_id, measurement_type_key)
);
create index fit_profile_version_measurements_type_idx
  on public.fit_profile_version_measurements(measurement_type_key, fit_profile_version_id);

create table public.fit_profile_version_size_references (
  fit_profile_version_id uuid not null references public.fit_profile_versions(id) on delete cascade,
  reference_type public.size_reference_type not null,
  original_size_label text not null,
  sizing_system text,
  band_size numeric(6,2),
  cup_designation text,
  shoe_size numeric(6,2),
  normalized_value text,
  primary key (fit_profile_version_id, reference_type)
);

-- V1 stores one current normally-worn reference per type; historical copies live above.
create unique index user_size_references_user_type_uq
  on public.user_size_references(user_id, reference_type);

alter table public.fit_profiles
  add column current_version_id uuid references public.fit_profile_versions(id) on delete set null;

create or replace function private.ensure_fit_profile_version_for_user(
  p_user_id uuid,
  p_reason text default 'fit_report_lock'
)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  v_current_version_id uuid;
  v_current_fingerprint text;
  v_fingerprint text;
  v_version_number integer;
  v_new_version_id uuid;
begin
  if p_reason not in ('profile_save','fit_report_lock','system') then
    raise exception 'Invalid Fit Profile version reason';
  end if;

  -- Serialize version creation per user.
  select fp.current_version_id
    into v_current_version_id
  from public.fit_profiles fp
  where fp.user_id=p_user_id
  for update;

  if not found then
    raise exception 'Fit Profile not found';
  end if;

  if not exists (
    select 1 from public.body_measurements bm where bm.user_id=p_user_id
  ) then
    raise exception 'Cannot snapshot an empty Fit Profile';
  end if;

  select encode(
    extensions.digest(
      coalesce((
        select string_agg(
          bm.measurement_type_key || ':' || bm.value_canonical::text,
          '|' order by bm.measurement_type_key
        )
        from public.body_measurements bm
        where bm.user_id=p_user_id
      ),'')
      || '||' ||
      coalesce((
        select string_agg(
          usr.reference_type::text || ':' ||
          coalesce(usr.normalized_value,'') || ':' ||
          coalesce(usr.sizing_system,'') || ':' ||
          coalesce(usr.band_size::text,'') || ':' ||
          coalesce(usr.cup_designation,'') || ':' ||
          coalesce(usr.shoe_size::text,''),
          '|' order by usr.reference_type::text
        )
        from public.user_size_references usr
        where usr.user_id=p_user_id
      ),''),
      'sha256'
    ),
    'hex'
  ) into v_fingerprint;

  if v_current_version_id is not null then
    select fpv.measurement_fingerprint
      into v_current_fingerprint
    from public.fit_profile_versions fpv
    where fpv.id=v_current_version_id and fpv.user_id=p_user_id;

    if v_current_fingerprint=v_fingerprint then
      return v_current_version_id;
    end if;
  end if;

  select coalesce(max(fpv.version_number),0)+1
    into v_version_number
  from public.fit_profile_versions fpv
  where fpv.user_id=p_user_id;

  insert into public.fit_profile_versions(
    user_id,version_number,measurement_fingerprint,created_reason
  ) values (
    p_user_id,v_version_number,v_fingerprint,p_reason
  ) returning id into v_new_version_id;

  insert into public.fit_profile_version_measurements(
    fit_profile_version_id,measurement_type_key,entered_value,entered_unit,
    value_canonical,source,method
  )
  select
    v_new_version_id,bm.measurement_type_key,bm.entered_value,bm.entered_unit,
    bm.value_canonical,bm.source,bm.method
  from public.body_measurements bm
  where bm.user_id=p_user_id;

  insert into public.fit_profile_version_size_references(
    fit_profile_version_id,reference_type,original_size_label,sizing_system,
    band_size,cup_designation,shoe_size,normalized_value
  )
  select
    v_new_version_id,usr.reference_type,usr.original_size_label,usr.sizing_system,
    usr.band_size,usr.cup_designation,usr.shoe_size,usr.normalized_value
  from public.user_size_references usr
  where usr.user_id=p_user_id;

  update public.fit_profiles
  set current_version_id=v_new_version_id,
      updated_at=now()
  where user_id=p_user_id;

  return v_new_version_id;
end;
$$;
revoke all on function private.ensure_fit_profile_version_for_user(uuid,text) from public,anon,authenticated;

create or replace function public.commit_fit_profile_version()
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode='28000';
  end if;
  return private.ensure_fit_profile_version_for_user(v_user_id,'profile_save');
end;
$$;
revoke all on function public.commit_fit_profile_version() from public,anon;
grant execute on function public.commit_fit_profile_version() to authenticated;

alter table public.fit_reports
  drop constraint fit_reports_closet_item_id_key;

alter table public.fit_reports
  add column fit_profile_version_id uuid not null references public.fit_profile_versions(id);

create index fit_reports_closet_history_idx
  on public.fit_reports(closet_item_id, created_at desc);
create index fit_reports_profile_version_idx
  on public.fit_reports(fit_profile_version_id);

create or replace function private.lock_fit_report_history()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  v_version_user_id uuid;
begin
  if tg_op='INSERT' then
    if new.fit_profile_version_id is null then
      new.fit_profile_version_id := private.ensure_fit_profile_version_for_user(new.user_id,'fit_report_lock');
    end if;

    select fpv.user_id into v_version_user_id
    from public.fit_profile_versions fpv
    where fpv.id=new.fit_profile_version_id;

    if v_version_user_id is distinct from new.user_id then
      raise exception 'Fit Report snapshot does not belong to this user';
    end if;

    return new;
  end if;

  if new.fit_profile_version_id is distinct from old.fit_profile_version_id
     or new.user_id is distinct from old.user_id
     or new.closet_item_id is distinct from old.closet_item_id
     or new.product_id is distinct from old.product_id
     or new.variant_id is distinct from old.variant_id
     or new.size_label is distinct from old.size_label
     or new.normalized_size_id is distinct from old.normalized_size_id then
    raise exception 'Historical Fit Report garment/body association is immutable; create a new Fit Report observation instead';
  end if;

  return new;
end;
$$;
revoke all on function private.lock_fit_report_history() from public,anon,authenticated;

create trigger lock_fit_report_history_before_write
before insert or update on public.fit_reports
for each row execute function private.lock_fit_report_history();

-- Compare the current viewer to the historical body snapshot associated with a report.
create or replace function private.calculate_snapshot_match(
  p_fit_profile_version_id uuid,
  p_profile_key text
)
returns table(match_score integer, coverage_percent integer)
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode='28000';
  end if;

  return query
  with weights as (
    select
      mpm.measurement_type_key,
      mpm.weight,
      coalesce(mpm.tolerance_override_canonical,mt.default_tolerance_canonical) as tolerance
    from public.match_profile_measurements mpm
    join public.measurement_types mt on mt.key=mpm.measurement_type_key
    where mpm.profile_key=p_profile_key
  ),
  total as (
    select sum(weight) total_weight from weights
  ),
  scored as (
    select
      sum(
        case when me.value_canonical is not null and hist.value_canonical is not null
          then private.clamped_similarity(me.value_canonical,hist.value_canonical,w.tolerance)*w.weight
          else 0 end
      ) weighted_similarity,
      sum(
        case when me.value_canonical is not null and hist.value_canonical is not null
          then w.weight else 0 end
      ) shared_weight,
      max(t.total_weight) total_weight
    from weights w
    cross join total t
    left join public.body_measurements me
      on me.user_id=v_user_id and me.measurement_type_key=w.measurement_type_key
    left join public.fit_profile_version_measurements hist
      on hist.fit_profile_version_id=p_fit_profile_version_id
     and hist.measurement_type_key=w.measurement_type_key
  )
  select
    case when s.shared_weight>0
      then round(least(1::numeric,greatest(0::numeric,s.weighted_similarity/nullif(s.shared_weight,0)))*100)::integer
      else 0 end,
    case when s.total_weight>0
      then round(least(1::numeric,greatest(0::numeric,s.shared_weight/nullif(s.total_weight,0)))*100)::integer
      else 0 end
  from scored s;
end;
$$;
revoke all on function private.calculate_snapshot_match(uuid,text) from public,anon;
grant execute on function private.calculate_snapshot_match(uuid,text) to authenticated;

-- Recreate product evidence so body-match relevance is calculated against each report's historical snapshot.
drop function public.get_product_evidence_candidates(uuid,uuid,integer);
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
  )
  select
    c.fit_report_id,c.user_id,c.closet_item_id,c.evidence_product_id,c.evidence_variant_id,
    c.fit_profile_version_id,c.original_size_label,c.normalized_size_id,c.fit,c.would_buy_again,
    hm.match_score,hm.coverage_percent,
    case
      when p_variant_id is not null and c.evidence_variant_id=p_variant_id then 'exact_variant'::public.evidence_level
      when c.evidence_product_id=p_product_id then 'exact_product'::public.evidence_level
      when c.target_family_id is not null and c.product_family_id=c.target_family_id then 'product_family'::public.evidence_level
      when c.target_garment_type is not null and c.garment_type_key=c.target_garment_type and c.attribute_overlap>0 then 'similar_garments'::public.evidence_level
      when c.brand_id=c.target_brand_id and c.garment_type_key=c.target_garment_type then 'brand_garment_type'::public.evidence_level
      else 'category_fit'::public.evidence_level
    end,
    case
      when p_variant_id is not null and c.evidence_variant_id=p_variant_id then 1
      when c.evidence_product_id=p_product_id then 2
      when c.target_family_id is not null and c.product_family_id=c.target_family_id then 3
      when c.target_garment_type is not null and c.garment_type_key=c.target_garment_type and c.attribute_overlap>0 then 4
      when c.brand_id=c.target_brand_id and c.garment_type_key=c.target_garment_type then 5
      else 6
    end,
    c.attribute_overlap
  from candidates c
  cross join lateral private.calculate_snapshot_match(c.fit_profile_version_id,c.target_match_profile_key) hm
  order by 14, 11 desc, 12 desc, 15 desc, c.fit_report_id
  limit least(greatest(coalesce(p_result_limit,200),1),500);
$$;
revoke all on function public.get_product_evidence_candidates(uuid,uuid,integer) from public,anon;
grant execute on function public.get_product_evidence_candidates(uuid,uuid,integer) to authenticated;

-- Historical raw snapshots are owner-only. No direct writes are granted.
alter table public.fit_profile_versions enable row level security;
alter table public.fit_profile_version_measurements enable row level security;
alter table public.fit_profile_version_size_references enable row level security;

create policy "owner reads Fit Profile versions"
on public.fit_profile_versions for select to authenticated
using ((select auth.uid())=user_id);

create policy "owner reads Fit Profile version measurements"
on public.fit_profile_version_measurements for select to authenticated
using (
  exists (
    select 1 from public.fit_profile_versions fpv
    where fpv.id=fit_profile_version_measurements.fit_profile_version_id
      and fpv.user_id=(select auth.uid())
  )
);

create policy "owner reads Fit Profile version size references"
on public.fit_profile_version_size_references for select to authenticated
using (
  exists (
    select 1 from public.fit_profile_versions fpv
    where fpv.id=fit_profile_version_size_references.fit_profile_version_id
      and fpv.user_id=(select auth.uid())
  )
);

revoke all on public.fit_profile_versions,public.fit_profile_version_measurements,public.fit_profile_version_size_references from anon,authenticated;
grant select on public.fit_profile_versions,public.fit_profile_version_measurements,public.fit_profile_version_size_references to authenticated;

comment on table public.fit_profile_versions is
  'Immutable private historical body-state versions. Existing Fit Reports never move when current measurements change.';
comment on table public.fit_profile_version_measurements is
  'Immutable owner-private raw measurement snapshot for one Fit Profile version.';
comment on table public.fit_profile_version_size_references is
  'Immutable owner-private normally-worn size references for one Fit Profile version.';
comment on column public.fit_reports.fit_profile_version_id is
  'Immutable body-state snapshot used when this fit observation was recorded. New body state + new try-on = new Fit Report row.';

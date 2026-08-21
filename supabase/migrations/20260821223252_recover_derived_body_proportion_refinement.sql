-- LikeSized canonical migration: derived body proportions as low-weight garment-specific refinements.
-- Proportions are computed privately from existing measurements. They are never member-entered,
-- never stored as profile fields, never returned to clients, and never affect qualification/coverage.

create table private.garment_proportion_rules (
  garment_type_key text not null references public.garment_types(key) on delete cascade,
  proportion_key text not null check (proportion_key ~ '^[a-z0-9_]+$'),
  numerator_measurement_type_key text not null references public.measurement_types(key),
  denominator_measurement_type_key text not null references public.measurement_types(key),
  weight numeric(6,5) not null check (weight > 0 and weight <= .04),
  relative_tolerance numeric(6,5) not null check (relative_tolerance > 0 and relative_tolerance <= .30),
  primary key (garment_type_key, proportion_key),
  check (numerator_measurement_type_key <> denominator_measurement_type_key)
);
revoke all on private.garment_proportion_rules from public,anon,authenticated;

-- Broad, conservative cold-start priors. Total available influence is capped again in the
-- refinement helper, so these cannot become a second body-matching formula.
insert into private.garment_proportion_rules
(garment_type_key,proportion_key,numerator_measurement_type_key,denominator_measurement_type_key,weight,relative_tolerance)
select g,'chest_to_waist','chest_circumference','natural_waist',.025,.15
from unnest(array['t_shirt','polo','dress_shirt','work_shirt','casual_button_down','tank','camisole','sweater','sweatshirt','hoodie','suit_jackets','blazers','jackets','coats']) g;

insert into private.garment_proportion_rules
select g,'shoulder_to_chest','shoulder_width','chest_circumference',.020,.12
from unnest(array['t_shirt','polo','dress_shirt','work_shirt','casual_button_down','tank','camisole','sweater','sweatshirt','hoodie','suit_jackets','blazers','jackets','coats']) g;

insert into private.garment_proportion_rules
select g,'torso_to_height','torso_body_length','height',.020,.10
from unnest(array['t_shirt','polo','dress_shirt','work_shirt','casual_button_down','blouse','tank','camisole','sweater','sweatshirt','hoodie','dresses','suit_jackets','blazers','jackets','coats']) g;

insert into private.garment_proportion_rules values
('blouse','bust_to_waist','full_bust','natural_waist',.030,.15),
('blouse','shoulder_to_bust','shoulder_width','full_bust',.020,.12),
('dresses','bust_to_waist','full_bust','natural_waist',.025,.15),
('dresses','waist_to_hip','natural_waist','full_hip_seat',.025,.12),
('dresses','shoulder_to_bust','shoulder_width','full_bust',.010,.12);

insert into private.garment_proportion_rules
select g,'lower_waist_to_hip','lower_pants_waist','full_hip_seat',.030,.12
from unnest(array['jeans','chinos','dress_pants','trousers','work_pants','shorts','joggers','leggings']) g;

insert into private.garment_proportion_rules
select g,'thigh_to_hip','thigh_circumference','full_hip_seat',.020,.12
from unnest(array['jeans','chinos','dress_pants','trousers','work_pants','shorts','joggers','leggings']) g;

insert into private.garment_proportion_rules
select g,'inseam_to_height','inseam','height',.020,.10
from unnest(array['jeans','chinos','dress_pants','trousers','work_pants','joggers','leggings']) g;

insert into private.garment_proportion_rules
select g,'front_rise_to_height','front_rise','height',.010,.10
from unnest(array['jeans','chinos','dress_pants','trousers','work_pants','shorts','joggers','leggings']) g;

insert into private.garment_proportion_rules values
('skirts','waist_to_hip','natural_waist','full_hip_seat',.035,.12),
('skirts','waist_to_hip_length_to_height','waist_to_hip_length','height',.020,.10),
('jumpsuits','bust_to_waist','full_bust','natural_waist',.020,.15),
('jumpsuits','waist_to_hip','natural_waist','full_hip_seat',.020,.12),
('jumpsuits','torso_girth_to_height','torso_girth','height',.025,.10),
('jumpsuits','inseam_to_height','inseam','height',.015,.10),
('rompers','bust_to_waist','full_bust','natural_waist',.020,.15),
('rompers','waist_to_hip','natural_waist','full_hip_seat',.020,.12),
('rompers','torso_girth_to_height','torso_girth','height',.025,.10),
('bodysuits','bust_to_waist','full_bust','natural_waist',.020,.15),
('bodysuits','waist_to_hip','natural_waist','full_hip_seat',.020,.12),
('bodysuits','torso_girth_to_height','torso_girth','height',.035,.10);

create or replace function private.fit_proportion_similarity(a numeric,b numeric,relative_tolerance numeric)
returns numeric
language sql
immutable
strict
set search_path=''
as $$
  select case
    when a<=0 or b<=0 or relative_tolerance<=0 then 0::numeric
    else exp(-ln(16::numeric)*power((abs(a-b)/nullif((abs(a)+abs(b))/2,0))/relative_tolerance,2))
  end;
$$;
revoke all on function private.fit_proportion_similarity(numeric,numeric,numeric) from public,anon,authenticated;

create or replace function private.apply_proportion_refinement(
  p_base_match integer,
  p_proportion_similarity numeric,
  p_influence numeric
) returns integer
language sql
immutable
set search_path=''
as $$
  select case
    when p_base_match is null then null
    when p_base_match<=0 or p_proportion_similarity is null or coalesce(p_influence,0)<=0 then p_base_match
    else round(
      greatest(0::numeric,least(100::numeric,
        p_base_match + greatest(-4::numeric,least(4::numeric,
          least(.08::numeric,greatest(0::numeric,p_influence)) *
          (greatest(0::numeric,least(1::numeric,p_proportion_similarity))*100-p_base_match)
        ))
      ))
    )::integer
  end;
$$;
revoke all on function private.apply_proportion_refinement(integer,numeric,numeric) from public,anon,authenticated;

create or replace function private.refine_current_garment_match_with_proportions(
  p_other_user_id uuid,
  p_garment_type_key text,
  p_base_match integer
) returns integer
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user_id uuid:=auth.uid();
  v_similarity numeric;
  v_influence numeric;
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode='28000'; end if;
  if p_base_match is null or p_base_match<=0 then return p_base_match; end if;

  with available as (
    select r.weight,r.relative_tolerance,
      me_n.value_canonical/me_d.value_canonical viewer_ratio,
      them_n.value_canonical/them_d.value_canonical other_ratio,
      sqrt(
        sqrt(private.fit_measurement_reliability(me_n.source,me_n.method)*private.fit_measurement_reliability(me_d.source,me_d.method)) *
        sqrt(private.fit_measurement_reliability(them_n.source,them_n.method)*private.fit_measurement_reliability(them_d.source,them_d.method))
      ) reliability
    from private.garment_proportion_rules r
    join public.body_measurements me_n on me_n.user_id=v_user_id and me_n.measurement_type_key=r.numerator_measurement_type_key
    join public.body_measurements me_d on me_d.user_id=v_user_id and me_d.measurement_type_key=r.denominator_measurement_type_key
    join public.body_measurements them_n on them_n.user_id=p_other_user_id and them_n.measurement_type_key=r.numerator_measurement_type_key
    join public.body_measurements them_d on them_d.user_id=p_other_user_id and them_d.measurement_type_key=r.denominator_measurement_type_key
    where r.garment_type_key=p_garment_type_key
  )
  select
    sum(private.fit_proportion_similarity(viewer_ratio,other_ratio,relative_tolerance)*weight*reliability)/nullif(sum(weight*reliability),0),
    least(.08::numeric,coalesce(sum(weight*reliability),0))
  into v_similarity,v_influence
  from available;

  return private.apply_proportion_refinement(p_base_match,v_similarity,v_influence);
end;
$$;
revoke all on function private.refine_current_garment_match_with_proportions(uuid,text,integer) from public,anon,authenticated;

create or replace function private.refine_snapshot_product_match_with_proportions(
  p_fit_profile_version_id uuid,
  p_product_id uuid,
  p_base_match integer
) returns integer
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user_id uuid:=auth.uid();
  v_garment_type_key text;
  v_similarity numeric;
  v_influence numeric;
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode='28000'; end if;
  if p_base_match is null or p_base_match<=0 then return p_base_match; end if;
  select garment_type_key into v_garment_type_key from public.products where id=p_product_id;
  if v_garment_type_key is null then return p_base_match; end if;

  with available as (
    select r.weight,r.relative_tolerance,
      me_n.value_canonical/me_d.value_canonical viewer_ratio,
      hist_n.value_canonical/hist_d.value_canonical historical_ratio,
      sqrt(
        sqrt(private.fit_measurement_reliability(me_n.source,me_n.method)*private.fit_measurement_reliability(me_d.source,me_d.method)) *
        sqrt(private.fit_measurement_reliability(hist_n.source,hist_n.method)*private.fit_measurement_reliability(hist_d.source,hist_d.method))
      ) reliability
    from private.garment_proportion_rules r
    join public.body_measurements me_n on me_n.user_id=v_user_id and me_n.measurement_type_key=r.numerator_measurement_type_key
    join public.body_measurements me_d on me_d.user_id=v_user_id and me_d.measurement_type_key=r.denominator_measurement_type_key
    join public.fit_profile_version_measurements hist_n on hist_n.fit_profile_version_id=p_fit_profile_version_id and hist_n.measurement_type_key=r.numerator_measurement_type_key
    join public.fit_profile_version_measurements hist_d on hist_d.fit_profile_version_id=p_fit_profile_version_id and hist_d.measurement_type_key=r.denominator_measurement_type_key
    where r.garment_type_key=v_garment_type_key
  )
  select
    sum(private.fit_proportion_similarity(viewer_ratio,historical_ratio,relative_tolerance)*weight*reliability)/nullif(sum(weight*reliability),0),
    least(.08::numeric,coalesce(sum(weight*reliability),0))
  into v_similarity,v_influence
  from available;

  return private.apply_proportion_refinement(p_base_match,v_similarity,v_influence);
end;
$$;
revoke all on function private.refine_snapshot_product_match_with_proportions(uuid,uuid,integer) from public,anon,authenticated;

-- Garment-specific current-person discovery keeps the canonical base matcher and applies
-- the bounded proportion refinement only after normal qualification/confidence succeeds.
create or replace function private.calculate_fit_matches_for_garment(p_garment_type_key text,p_result_limit integer default 100)
returns table(user_id uuid,username text,display_name text,avatar_url text,match_score integer,coverage_percent integer)
language plpgsql security definer set search_path='' as $$
declare v_user_id uuid:=auth.uid(); v_limit integer:=least(greatest(coalesce(p_result_limit,100),1),100);
begin
 if v_user_id is null then raise exception 'Authentication required' using errcode='28000'; end if;
 if not exists(select 1 from public.garment_types where key=p_garment_type_key and active) then raise exception 'Unknown garment type'; end if;
 if not exists(select 1 from public.fit_profiles fp where fp.user_id=v_user_id and fp.completed_at is not null) then return; end if;
 return query
 with w as (select * from private.garment_match_measurements(p_garment_type_key)), meta as (
  select sum(coverage_weight) total_coverage,count(*)::integer measurement_count,max(minimum_shared_measurements) minimum_shared_measurements,max(minimum_coverage) minimum_coverage from w
 ), candidates as (
  select p.id,p.username,p.display_name,p.avatar_url from public.profiles p join public.fit_profiles fp on fp.user_id=p.id and fp.completed_at is not null where p.id<>v_user_id and p.username is not null
 ), s as (
  select c.id,c.username,c.display_name,c.avatar_url,
   sum(case when me.value_canonical is not null and them.value_canonical is not null then private.fit_measurement_similarity(me.value_canonical,them.value_canonical,w.tolerance)*w.weight*sqrt(private.fit_measurement_reliability(me.source,me.method)*private.fit_measurement_reliability(them.source,them.method)) else 0 end) weighted_similarity,
   sum(case when me.value_canonical is not null and them.value_canonical is not null then w.weight*sqrt(private.fit_measurement_reliability(me.source,me.method)*private.fit_measurement_reliability(them.source,them.method)) else 0 end) similarity_weight,
   sum(case when me.value_canonical is not null and them.value_canonical is not null then w.coverage_weight else 0 end) shared_coverage,
   sum(case when me.value_canonical is not null and them.value_canonical is not null then w.coverage_weight*sqrt(private.fit_measurement_reliability(me.source,me.method)*private.fit_measurement_reliability(them.source,them.method)) else 0 end) reliable_coverage,
   count(*) filter(where me.value_canonical is not null and them.value_canonical is not null)::integer shared_count,
   max(meta.total_coverage) total_coverage,max(meta.measurement_count) measurement_count,max(meta.minimum_shared_measurements) minimum_shared_measurements,max(meta.minimum_coverage) minimum_coverage
  from candidates c cross join w cross join meta
  left join public.body_measurements me on me.user_id=v_user_id and me.measurement_type_key=w.measurement_type_key
  left join public.body_measurements them on them.user_id=c.id and them.measurement_type_key=w.measurement_type_key
  group by c.id,c.username,c.display_name,c.avatar_url
 ), q as (
  select s.*,least(1::numeric,greatest(0::numeric,shared_coverage/nullif(total_coverage,0))) coverage from s
  where similarity_weight>0 and shared_count>=minimum_shared_measurements and shared_coverage/nullif(total_coverage,0)>=minimum_coverage
 ), base as (
  select q.*,private.confidence_adjusted_match(weighted_similarity,similarity_weight,shared_coverage,reliable_coverage,total_coverage,shared_count,measurement_count) base_match from q
 )
 select base.id,base.username,base.display_name,base.avatar_url,
   private.refine_current_garment_match_with_proportions(base.id,p_garment_type_key,base.base_match),
   round(base.coverage*100)::integer
 from base order by 5 desc,6 desc,base.username limit v_limit;
end; $$;
revoke all on function private.calculate_fit_matches_for_garment(text,integer) from public,anon,authenticated;
grant execute on function private.calculate_fit_matches_for_garment(text,integer) to authenticated;

-- Historical product Match uses the same canonical base product model, then the same bounded
-- proportion refinement against the immutable body snapshot from the original try-on.
create or replace function private.calculate_snapshot_match_for_product(p_fit_profile_version_id uuid,p_product_id uuid)
returns table(match_score integer,coverage_percent integer)
language plpgsql security definer set search_path='' as $$
declare v_user_id uuid:=auth.uid();
begin
 if v_user_id is null then raise exception 'Authentication required' using errcode='28000'; end if;
 return query
 with w as (select * from private.product_match_measurements(p_product_id)), meta as (
  select sum(coverage_weight) total_coverage,count(*)::integer measurement_count,max(minimum_shared_measurements) minimum_shared_measurements,max(minimum_coverage) minimum_coverage from w
 ), s as (
  select sum(case when me.value_canonical is not null and hist.value_canonical is not null then private.fit_measurement_similarity(me.value_canonical,hist.value_canonical,w.tolerance)*w.weight*sqrt(private.fit_measurement_reliability(me.source,me.method)*private.fit_measurement_reliability(hist.source,hist.method)) else 0 end) weighted_similarity,
   sum(case when me.value_canonical is not null and hist.value_canonical is not null then w.weight*sqrt(private.fit_measurement_reliability(me.source,me.method)*private.fit_measurement_reliability(hist.source,hist.method)) else 0 end) similarity_weight,
   sum(case when me.value_canonical is not null and hist.value_canonical is not null then w.coverage_weight else 0 end) shared_coverage,
   sum(case when me.value_canonical is not null and hist.value_canonical is not null then w.coverage_weight*sqrt(private.fit_measurement_reliability(me.source,me.method)*private.fit_measurement_reliability(hist.source,hist.method)) else 0 end) reliable_coverage,
   count(*) filter(where me.value_canonical is not null and hist.value_canonical is not null)::integer shared_count,
   max(meta.total_coverage) total_coverage,max(meta.measurement_count) measurement_count,max(meta.minimum_shared_measurements) minimum_shared_measurements,max(meta.minimum_coverage) minimum_coverage
  from w cross join meta
  left join public.body_measurements me on me.user_id=v_user_id and me.measurement_type_key=w.measurement_type_key
  left join public.fit_profile_version_measurements hist on hist.fit_profile_version_id=p_fit_profile_version_id and hist.measurement_type_key=w.measurement_type_key
 ), base as (
  select
    case when similarity_weight>0 and shared_count>=minimum_shared_measurements and shared_coverage/nullif(total_coverage,0)>=minimum_coverage
      then private.confidence_adjusted_match(weighted_similarity,similarity_weight,shared_coverage,reliable_coverage,total_coverage,shared_count,measurement_count)
      else 0 end base_match,
    case when total_coverage>0 then round(100*least(1::numeric,greatest(0::numeric,shared_coverage/nullif(total_coverage,0))))::integer else 0 end coverage_percent
  from s
 )
 select private.refine_snapshot_product_match_with_proportions(p_fit_profile_version_id,p_product_id,base.base_match),base.coverage_percent from base;
end; $$;
revoke all on function private.calculate_snapshot_match_for_product(uuid,uuid) from public,anon,authenticated;

comment on table private.garment_proportion_rules is 'Private configuration for dimensionless garment-specific body-proportion refinements. No derived member values are stored.';
comment on function private.fit_proportion_similarity(numeric,numeric,numeric) is 'Symmetric smooth similarity between two positive dimensionless body proportions using relative difference.';
comment on function private.apply_proportion_refinement(integer,numeric,numeric) is 'Bounds derived-proportion influence to 8% and at most +/-4 Match points after normal qualification/confidence.';
comment on function private.refine_current_garment_match_with_proportions(uuid,text,integer) is 'Private current-person garment Match refinement from automatically derived proportions; missing ratios never reduce coverage.';
comment on function private.refine_snapshot_product_match_with_proportions(uuid,uuid,integer) is 'Private historical product Match refinement from current body vs immutable historical snapshot proportions; no ratios leave private schema.';
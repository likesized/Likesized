-- LikeSized canonical migration: owner-private Fit Community relevance preference.
-- Fit Community controls default member/social relevance only. It never changes body Match %,
-- garment Department, Product identity, or immutable historical body snapshots.

create type public.fit_community as enum ('men','women','both');

alter table public.fit_profiles
  add column fit_community public.fit_community not null default 'both'::public.fit_community;

comment on column public.fit_profiles.fit_community is
  'Owner-private default member-fit community for personalized social/discovery relevance. Men/Women/Both is separate from garment Department and never changes body Match math.';

-- Keep the established five-argument Fit Profile writer intact for backward compatibility.
-- The six-argument overload wraps it in the same database transaction, then saves Fit Community.
create function public.save_fit_profile(
  p_username text,
  p_unit_system public.unit_system,
  p_measurements jsonb,
  p_size_references jsonb,
  p_fit_preferences jsonb,
  p_fit_community public.fit_community
)
returns uuid
language plpgsql
security invoker
set search_path=''
as $$
declare
  v_version_id uuid;
begin
  if p_fit_community is null then
    raise exception 'Fit Community is required' using errcode='22023';
  end if;

  v_version_id:=public.save_fit_profile(
    p_username,
    p_unit_system,
    p_measurements,
    p_size_references,
    p_fit_preferences
  );

  update public.fit_profiles
  set fit_community=p_fit_community,updated_at=now()
  where user_id=auth.uid();
  if not found then raise exception 'Fit Profile not found'; end if;

  return v_version_id;
end;
$$;

revoke all on function public.save_fit_profile(text,public.unit_system,jsonb,jsonb,jsonb,public.fit_community)
from public,anon;
grant execute on function public.save_fit_profile(text,public.unit_system,jsonb,jsonb,jsonb,public.fit_community)
to authenticated,service_role;

comment on function public.save_fit_profile(text,public.unit_system,jsonb,jsonb,jsonb,public.fit_community) is
  'Atomically saves the established Fit Profile plus owner-private Fit Community. Fit Community is relevance metadata, not Match input.';

-- Community-aware member matching keeps the existing body Match calculation unchanged and
-- narrows only the candidate set. Both is compatible with Men and Women.
create function private.calculate_fit_matches_for_profile_community(
  p_profile_key text,
  p_result_limit integer,
  p_fit_community public.fit_community
)
returns table(
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
  if v_user_id is null then raise exception 'Authentication required' using errcode='28000'; end if;
  if not exists(select 1 from public.match_profiles where key=p_profile_key) then raise exception 'Unknown match profile'; end if;
  if not exists(select 1 from public.fit_profiles fp where fp.user_id=v_user_id and fp.completed_at is not null) then return; end if;

  select coalesce(p_fit_community,fp.fit_community,'both'::public.fit_community)
  into v_community
  from public.fit_profiles fp
  where fp.user_id=v_user_id;

  return query
  with w as (
    select mpm.measurement_type_key,mpm.weight,mpm.coverage_weight,coalesce(mpm.tolerance_override_canonical,mt.default_tolerance_canonical) tolerance
    from public.match_profile_measurements mpm
    join public.measurement_types mt on mt.key=mpm.measurement_type_key
    where mpm.profile_key=p_profile_key
  ), meta as (
    select sum(w.coverage_weight) total_coverage,count(*)::integer measurement_count,mp.minimum_shared_measurements,mp.minimum_coverage
    from w cross join public.match_profiles mp
    where mp.key=p_profile_key
    group by mp.minimum_shared_measurements,mp.minimum_coverage
  ), candidates as (
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
  ), s as (
    select c.id,c.username,c.display_name,c.avatar_url,
      sum(case when me.value_canonical is not null and them.value_canonical is not null then private.fit_measurement_similarity(me.value_canonical,them.value_canonical,w.tolerance)*w.weight*sqrt(private.fit_measurement_reliability(me.source,me.method)*private.fit_measurement_reliability(them.source,them.method)) else 0 end) weighted_similarity,
      sum(case when me.value_canonical is not null and them.value_canonical is not null then w.weight*sqrt(private.fit_measurement_reliability(me.source,me.method)*private.fit_measurement_reliability(them.source,them.method)) else 0 end) similarity_weight,
      sum(case when me.value_canonical is not null and them.value_canonical is not null then w.coverage_weight else 0 end) shared_coverage,
      sum(case when me.value_canonical is not null and them.value_canonical is not null then w.coverage_weight*sqrt(private.fit_measurement_confidence_reliability(me.source,me.method,w.measurement_type_key,me.confirmed_at,now())*private.fit_measurement_confidence_reliability(them.source,them.method,w.measurement_type_key,them.confirmed_at,now())) else 0 end) reliable_coverage,
      count(*) filter(where me.value_canonical is not null and them.value_canonical is not null)::integer shared_count,
      max(meta.total_coverage) total_coverage,max(meta.measurement_count) measurement_count,max(meta.minimum_shared_measurements) minimum_shared_measurements,max(meta.minimum_coverage) minimum_coverage
    from candidates c cross join w cross join meta
    left join public.body_measurements me on me.user_id=v_user_id and me.measurement_type_key=w.measurement_type_key
    left join public.body_measurements them on them.user_id=c.id and them.measurement_type_key=w.measurement_type_key
    group by c.id,c.username,c.display_name,c.avatar_url
  ), q as (
    select s.*,least(1::numeric,greatest(0::numeric,shared_coverage/nullif(total_coverage,0))) coverage
    from s
    where similarity_weight>0
      and shared_count>=minimum_shared_measurements
      and shared_coverage/nullif(total_coverage,0)>=minimum_coverage
  )
  select q.id,q.username,q.display_name,q.avatar_url,
    private.confidence_adjusted_match(weighted_similarity,similarity_weight,shared_coverage,reliable_coverage,total_coverage,shared_count,measurement_count),
    round(coverage*100)::integer
  from q
  order by 5 desc,6 desc,q.username
  limit v_limit;
end;
$$;

revoke all on function private.calculate_fit_matches_for_profile_community(text,integer,public.fit_community)
from public,anon;
grant execute on function private.calculate_fit_matches_for_profile_community(text,integer,public.fit_community)
to authenticated,service_role;

create or replace function public.get_fit_matches(
  p_match_category public.fit_match_category default 'overall'::public.fit_match_category,
  p_result_limit integer default 30
)
returns table(user_id uuid,username text,display_name text,avatar_url text,match_score integer)
language sql
set search_path=''
as $$
  select m.user_id,m.username,m.display_name,m.avatar_url,m.match_score
  from private.calculate_fit_matches_for_profile_community(
    case p_match_category
      when 'tops'::public.fit_match_category then 'tops_default'
      when 'bottoms'::public.fit_match_category then 'bottoms_default'
      else 'overall'
    end,
    p_result_limit,
    null
  ) m;
$$;

create function public.get_fit_matches(
  p_match_category public.fit_match_category,
  p_result_limit integer,
  p_fit_community public.fit_community
)
returns table(user_id uuid,username text,display_name text,avatar_url text,match_score integer)
language sql
set search_path=''
as $$
  select m.user_id,m.username,m.display_name,m.avatar_url,m.match_score
  from private.calculate_fit_matches_for_profile_community(
    case p_match_category
      when 'tops'::public.fit_match_category then 'tops_default'
      when 'bottoms'::public.fit_match_category then 'bottoms_default'
      else 'overall'
    end,
    p_result_limit,
    p_fit_community
  ) m;
$$;

revoke all on function public.get_fit_matches(public.fit_match_category,integer,public.fit_community)
from public,anon;
grant execute on function public.get_fit_matches(public.fit_match_category,integer,public.fit_community)
to authenticated,service_role;

comment on function public.get_fit_matches(public.fit_match_category,integer,public.fit_community) is
  'Returns unchanged body Match scores after filtering candidate members by the requested Fit Community. Both is compatible with either community.';

-- Community-aware following feed filters by the wearer/member Fit Community, never by the
-- Department of the garment in the post. A Women-community member wearing Men''s jeans remains
-- Women-community content.
create function private.get_following_feed_for_current_user_community(
  p_result_limit integer,
  p_before timestamptz,
  p_fit_community public.fit_community
)
returns table(
  activity_id uuid,
  activity_type text,
  actor_id uuid,
  username text,
  display_name text,
  occurred_at timestamptz,
  relevant_match_category public.fit_match_category,
  closet_item_id uuid,
  fit_report_id uuid,
  outfit_post_id uuid,
  product_slug text,
  product_name text,
  brand_name text,
  garment_type_key text,
  size_label text,
  fit public.fit_rating,
  fit_notes text,
  would_buy_again boolean,
  outfit_caption text,
  outfit_photo_path text
)
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user_id uuid:=auth.uid();
  v_limit integer:=least(greatest(coalesce(p_result_limit,50),1),100);
  v_community public.fit_community;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode='28000';
  end if;

  select coalesce(p_fit_community,fp.fit_community,'both'::public.fit_community)
  into v_community
  from public.fit_profiles fp
  where fp.user_id=v_user_id;

  return query
  select
    e.id,
    e.event_type,
    e.actor_id,
    p.username,
    p.display_name,
    e.occurred_at,
    case
      when e.event_type='outfit_posted' then 'overall'::public.fit_match_category
      when prod.category='tops'::public.garment_category then 'tops'::public.fit_match_category
      when prod.category='bottoms'::public.garment_category then 'bottoms'::public.fit_match_category
      else 'overall'::public.fit_match_category
    end,
    e.closet_item_id,
    e.fit_report_id,
    e.outfit_post_id,
    prod.slug,
    prod.name,
    b.name,
    prod.garment_type_key,
    fr.size_label,
    fr.fit,
    fr.fit_notes,
    fr.would_buy_again,
    op.caption,
    op.photo_url
  from private.following_activity_events e
  join public.follows f
    on f.follower_id=v_user_id
   and f.followed_id=e.actor_id
  join public.profiles p
    on p.id=e.actor_id
   and p.username is not null
  join public.fit_profiles actor_fp
    on actor_fp.user_id=e.actor_id
   and actor_fp.completed_at is not null
  left join public.closet_items ci
    on ci.id=e.closet_item_id
  left join public.fit_reports fr
    on fr.id=e.fit_report_id
  left join public.products prod
    on prod.id=fr.product_id
  left join public.brands b
    on b.id=prod.brand_id
  left join public.outfit_posts op
    on op.id=e.outfit_post_id
  where (p_before is null or e.occurred_at<p_before)
    and (
      v_community='both'::public.fit_community
      or actor_fp.fit_community='both'::public.fit_community
      or actor_fp.fit_community=v_community
    )
    and (
      (
        e.event_type in ('closet_shared','fit_report_added')
        and ci.id is not null
        and ci.user_id=e.actor_id
        and ci.visibility='shared'::public.closet_visibility
        and fr.id is not null
        and fr.user_id=e.actor_id
        and fr.closet_item_id=ci.id
      )
      or
      (
        e.event_type='outfit_posted'
        and op.id is not null
        and op.user_id=e.actor_id
      )
    )
  order by e.occurred_at desc,e.id desc
  limit v_limit;
end;
$$;

revoke all on function private.get_following_feed_for_current_user_community(integer,timestamptz,public.fit_community)
from public,anon;
grant execute on function private.get_following_feed_for_current_user_community(integer,timestamptz,public.fit_community)
to authenticated,service_role;

create or replace function public.get_following_feed(
  p_result_limit integer default 50,
  p_before timestamptz default null
)
returns table(
  activity_id uuid,activity_type text,actor_id uuid,username text,display_name text,occurred_at timestamptz,
  relevant_match_category public.fit_match_category,closet_item_id uuid,fit_report_id uuid,outfit_post_id uuid,
  product_slug text,product_name text,brand_name text,garment_type_key text,size_label text,fit public.fit_rating,
  fit_notes text,would_buy_again boolean,outfit_caption text,outfit_photo_path text
)
language sql
set search_path=''
as $$
  select * from private.get_following_feed_for_current_user_community(p_result_limit,p_before,null);
$$;

create function public.get_following_feed(
  p_result_limit integer,
  p_before timestamptz,
  p_fit_community public.fit_community
)
returns table(
  activity_id uuid,activity_type text,actor_id uuid,username text,display_name text,occurred_at timestamptz,
  relevant_match_category public.fit_match_category,closet_item_id uuid,fit_report_id uuid,outfit_post_id uuid,
  product_slug text,product_name text,brand_name text,garment_type_key text,size_label text,fit public.fit_rating,
  fit_notes text,would_buy_again boolean,outfit_caption text,outfit_photo_path text
)
language sql
set search_path=''
as $$
  select * from private.get_following_feed_for_current_user_community(p_result_limit,p_before,p_fit_community);
$$;

revoke all on function public.get_following_feed(integer,timestamptz,public.fit_community)
from public,anon;
grant execute on function public.get_following_feed(integer,timestamptz,public.fit_community)
to authenticated,service_role;

comment on function public.get_following_feed(integer,timestamptz,public.fit_community) is
  'Returns followed activity from the requested wearer Fit Community. Garment Department never determines community eligibility.';

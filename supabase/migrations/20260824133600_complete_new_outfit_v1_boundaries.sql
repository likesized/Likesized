-- Complete the New Outfit V1 public/member boundary after the core schema migration.
-- Anonymous visitors may read published editorial content and comments, but never
-- member Fit details, Closet links, unresolved identity state, or internal commerce data.

-- Public comments are readable only while the published Outfit has comments enabled.
drop policy if exists "members read visible outfit comments" on public.outfit_comments;
create policy "visible outfit comments readable"
on public.outfit_comments
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.outfit_posts op
    where op.id=outfit_comments.post_id
      and op.status='published'::public.outfit_post_status
      and op.comments_enabled
      and (
        (select auth.uid()) is null
        or not private.members_blocked((select auth.uid()),op.user_id)
      )
  )
);
create policy "admins read all outfit comments"
on public.outfit_comments
for select
to authenticated
using (private.is_admin());
grant select on public.outfit_comments to anon;

-- Public garment teasers intentionally expose only already-resolved canonical Products.
-- An Unconfirmed/Needs More Evidence Closet garment has a null Product until resolution,
-- so its owner may still use it in an Outfit without creating public/searchable Product truth.
create or replace function public.get_public_outfit_product_teasers(p_post_id uuid)
returns table(
  product_id uuid,
  product_slug text,
  brand_name text,
  product_name text,
  image_url text
)
language sql
stable
security definer
set search_path=''
as $$
  select distinct on (p.id)
    p.id,
    p.slug,
    b.name,
    p.name,
    p.image_url
  from public.outfit_posts op
  join public.outfit_post_items oi on oi.post_id=op.id
  join public.fit_reports fr on fr.closet_item_id=oi.closet_item_id
  join public.products p on p.id=fr.product_id
  join public.brands b on b.id=p.brand_id
  where op.id=p_post_id
    and op.status='published'::public.outfit_post_status
    and p.catalog_status<>'rejected'::public.product_data_status
    and (
      auth.uid() is null
      or not private.members_blocked(auth.uid(),op.user_id)
    )
    and not exists (
      select 1
      from public.garment_submissions gs
      join public.catalog_candidates cc on cc.id=gs.candidate_id
      where gs.closet_item_id=oi.closet_item_id
        and gs.resolved_product_id is null
        and cc.status<>'merged'
    )
  order by p.id,fr.created_at desc,fr.id desc;
$$;
revoke all on function public.get_public_outfit_product_teasers(uuid) from public;
grant execute on function public.get_public_outfit_product_teasers(uuid) to anon,authenticated;
comment on function public.get_public_outfit_product_teasers(uuid) is
  'Safe published Outfit teaser: canonical Product identity/image only. No size, Fit Result, Fit Report, body Match, Closet, candidate/review state or shopping evidence is returned.';

-- Creator style-tag suggestions use the vocabulary already used by visible published Outfits.
create or replace function public.get_outfit_style_tag_suggestions(
  p_query text default null,
  p_result_limit integer default 20
)
returns table(display_tag text, normalized_tag text, usage_count integer)
language plpgsql
stable
security definer
set search_path=''
as $$
declare
  v_user_id uuid:=auth.uid();
  v_query text:=private.normalize_outfit_style_tag(coalesce(p_query,''));
  v_limit integer:=least(greatest(coalesce(p_result_limit,20),1),50);
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode='28000'; end if;
  return query
  select
    min(st.display_tag) as display_tag,
    st.normalized_tag,
    count(*)::integer as usage_count
  from public.outfit_style_tags st
  join public.outfit_posts op on op.id=st.post_id
  where op.status='published'::public.outfit_post_status
    and not private.members_blocked(v_user_id,op.user_id)
    and (v_query='' or st.normalized_tag like v_query||'%')
  group by st.normalized_tag
  order by count(*) desc,min(st.display_tag)
  limit v_limit;
end;
$$;
revoke all on function public.get_outfit_style_tag_suggestions(text,integer) from public,anon;
grant execute on function public.get_outfit_style_tag_suggestions(text,integer) to authenticated;

-- Existing Fit Twin notification rows may outlive an unfollow by design, but a block is a
-- stronger privacy boundary. Lists and unread counts therefore re-check the block and
-- published source state at read time.
create or replace function private.get_fit_twin_activity_notifications_for_current_user(
  p_result_limit integer default 50,
  p_before timestamptz default null
)
returns table (
  notification_id uuid,
  activity_id uuid,
  activity_type text,
  actor_id uuid,
  username text,
  display_name text,
  created_at timestamptz,
  read_at timestamptz,
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
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode='28000'; end if;
  return query
  select
    n.id,e.id,e.event_type,e.actor_id,p.username,p.display_name,n.created_at,n.read_at,
    case
      when e.event_type='outfit_posted' then 'overall'::public.fit_match_category
      when prod.category='tops'::public.garment_category then 'tops'::public.fit_match_category
      when prod.category='bottoms'::public.garment_category then 'bottoms'::public.fit_match_category
      else 'overall'::public.fit_match_category
    end,
    e.closet_item_id,e.fit_report_id,e.outfit_post_id,prod.slug,prod.name,b.name,prod.garment_type_key,
    fr.size_label,fr.fit,fr.fit_notes,fr.would_buy_again,op.headline,op.photo_url
  from private.fit_twin_activity_notifications n
  join private.following_activity_events e on e.id=n.activity_id
  join public.profiles p on p.id=e.actor_id and p.username is not null
  left join public.closet_items ci on ci.id=e.closet_item_id
  left join public.fit_reports fr on fr.id=e.fit_report_id
  left join public.products prod on prod.id=fr.product_id
  left join public.brands b on b.id=prod.brand_id
  left join public.outfit_posts op on op.id=e.outfit_post_id
  where n.recipient_id=v_user_id
    and (p_before is null or n.created_at<p_before)
    and not private.members_blocked(v_user_id,e.actor_id)
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
        and op.status='published'::public.outfit_post_status
      )
    )
  order by n.created_at desc,n.id desc
  limit v_limit;
end;
$$;

create or replace function private.get_fit_twin_notification_unread_count_for_current_user()
returns integer
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user_id uuid:=auth.uid();
  v_count integer;
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode='28000'; end if;
  select count(*)::integer into v_count
  from private.fit_twin_activity_notifications n
  join private.following_activity_events e on e.id=n.activity_id
  left join public.outfit_posts op on op.id=e.outfit_post_id
  left join public.closet_items ci on ci.id=e.closet_item_id
  where n.recipient_id=v_user_id
    and n.read_at is null
    and not private.members_blocked(v_user_id,e.actor_id)
    and (
      (e.event_type='outfit_posted' and op.status='published'::public.outfit_post_status)
      or
      (e.event_type in ('closet_shared','fit_report_added') and ci.visibility='shared'::public.closet_visibility)
    );
  return v_count;
end;
$$;

comment on table public.member_blocks is
  'Private signed-in member block state. Blocking removes both follow directions and suppresses signed-in Outfit/feed interactions; it cannot prevent anonymous access to an otherwise public Outfit URL.';

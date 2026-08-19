create or replace function private.get_following_feed_for_current_user(
  p_result_limit integer default 50,
  p_before timestamptz default null
)
returns table (
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
  v_user_id uuid := auth.uid();
  v_limit integer := least(greatest(coalesce(p_result_limit,50),1),100);
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode='28000';
  end if;

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

revoke all on function private.get_following_feed_for_current_user(integer,timestamptz) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.get_following_feed_for_current_user(integer,timestamptz) to authenticated;

create or replace function public.get_following_feed(
  p_result_limit integer default 50,
  p_before timestamptz default null
)
returns table (
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
language sql
security invoker
set search_path=''
as $$
  select *
  from private.get_following_feed_for_current_user(p_result_limit,p_before);
$$;

revoke all on function public.get_following_feed(integer,timestamptz) from public, anon;
grant execute on function public.get_following_feed(integer,timestamptz) to authenticated;

comment on function private.get_following_feed_for_current_user(integer,timestamptz) is
  'Private auth-bound Following Feed helper. It reads the private activity ledger and returns only safe member/activity fields after current follow and Closet visibility checks.';
comment on function public.get_following_feed(integer,timestamptz) is
  'SECURITY INVOKER public wrapper for the private auth-bound Following Feed helper.';
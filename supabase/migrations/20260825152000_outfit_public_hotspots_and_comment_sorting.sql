-- Public Outfit hotspot projection and sortable comment paging.
-- Keeps raw Closet/Fit Report tables protected while exposing only published Outfit UI data.

create or replace function public.get_public_outfit_tagged_items(p_post_id uuid)
returns table(
  closet_item_id uuid,
  product_id uuid,
  product_slug text,
  brand_name text,
  product_name text,
  image_url text,
  garment_type_key text
)
language sql
stable
security definer
set search_path = ''
as $$
  select distinct on (oi.closet_item_id)
    oi.closet_item_id,
    p.id,
    p.slug,
    b.name,
    p.name,
    p.image_url,
    p.garment_type_key
  from public.outfit_posts op
  join public.outfit_post_items oi on oi.post_id = op.id
  join public.fit_reports fr on fr.closet_item_id = oi.closet_item_id
  join public.products p on p.id = fr.product_id
  join public.brands b on b.id = p.brand_id
  where op.id = p_post_id
    and op.status = 'published'::public.outfit_post_status
    and p.catalog_status <> 'rejected'::public.product_data_status
    and (
      auth.uid() is null
      or not private.members_blocked(auth.uid(), op.user_id)
    )
    and not exists (
      select 1
      from public.garment_submissions gs
      join public.catalog_candidates cc on cc.id = gs.candidate_id
      where gs.closet_item_id = oi.closet_item_id
        and gs.resolved_product_id is null
        and cc.status <> 'merged'
    )
  order by oi.closet_item_id, fr.created_at desc, fr.id desc;
$$;

revoke all on function public.get_public_outfit_tagged_items(uuid) from public;
grant execute on function public.get_public_outfit_tagged_items(uuid) to anon, authenticated;

create or replace function public.get_public_outfit_hotspots(p_post_id uuid)
returns table(
  photo_id uuid,
  closet_item_id uuid,
  x numeric,
  y numeric
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    opt.photo_id,
    opt.closet_item_id,
    opt.x,
    opt.y
  from public.outfit_posts op
  join public.outfit_photos ph on ph.post_id = op.id
  join public.outfit_photo_tags opt on opt.photo_id = ph.id
  where op.id = p_post_id
    and op.status = 'published'::public.outfit_post_status
    and (
      auth.uid() is null
      or not private.members_blocked(auth.uid(), op.user_id)
    )
    and exists (
      select 1
      from public.outfit_post_items oi
      join public.fit_reports fr on fr.closet_item_id = oi.closet_item_id
      join public.products p on p.id = fr.product_id
      where oi.post_id = op.id
        and oi.closet_item_id = opt.closet_item_id
        and p.catalog_status <> 'rejected'::public.product_data_status
        and not exists (
          select 1
          from public.garment_submissions gs
          join public.catalog_candidates cc on cc.id = gs.candidate_id
          where gs.closet_item_id = oi.closet_item_id
            and gs.resolved_product_id is null
            and cc.status <> 'merged'
        )
    )
  order by ph.sort_order, opt.created_at, opt.closet_item_id;
$$;

revoke all on function public.get_public_outfit_hotspots(uuid) from public;
grant execute on function public.get_public_outfit_hotspots(uuid) to anon, authenticated;

create or replace function public.get_outfit_comments_sorted_page(
  p_post_id uuid,
  p_sort text default 'top',
  p_before_like_count bigint default null,
  p_before_created_at timestamptz default null,
  p_before_id uuid default null,
  p_result_limit integer default 20
)
returns table(
  comment_id uuid,
  body text,
  created_at timestamptz,
  username text,
  display_name text,
  avatar_url text,
  like_count bigint,
  liked_by_viewer boolean,
  can_delete boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  with viewer as (
    select auth.uid() as user_id
  ), visible_post as (
    select op.id, op.user_id
    from public.outfit_posts op
    cross join viewer v
    where op.id = p_post_id
      and op.status = 'published'::public.outfit_post_status
      and op.comments_enabled
      and (v.user_id is null or not private.members_blocked(v.user_id, op.user_id))
  )
  select
    oc.id,
    oc.body,
    oc.created_at,
    p.username,
    p.display_name,
    p.avatar_url,
    oc.like_count::bigint,
    (v.user_id is not null and exists(
      select 1
      from public.outfit_comment_likes ocl
      where ocl.comment_id = oc.id and ocl.user_id = v.user_id
    )) as liked_by_viewer,
    (v.user_id is not null and (oc.user_id = v.user_id or vp.user_id = v.user_id)) as can_delete
  from public.outfit_comments oc
  join visible_post vp on vp.id = oc.post_id
  join public.profiles p on p.id = oc.user_id and p.username is not null
  cross join viewer v
  where p_sort in ('top', 'newest')
    and (
      p_before_created_at is null
      or (
        p_sort = 'newest'
        and p_before_id is not null
        and (oc.created_at, oc.id) < (p_before_created_at, p_before_id)
      )
      or (
        p_sort = 'top'
        and p_before_like_count is not null
        and p_before_id is not null
        and (
          oc.like_count < p_before_like_count
          or (oc.like_count = p_before_like_count and (oc.created_at, oc.id) < (p_before_created_at, p_before_id))
        )
      )
    )
  order by
    case when p_sort = 'top' then oc.like_count end desc,
    oc.created_at desc,
    oc.id desc
  limit least(greatest(coalesce(p_result_limit, 20), 1), 50);
$$;

revoke all on function public.get_outfit_comments_sorted_page(uuid,text,bigint,timestamptz,uuid,integer) from public;
grant execute on function public.get_outfit_comments_sorted_page(uuid,text,bigint,timestamptz,uuid,integer) to anon, authenticated;

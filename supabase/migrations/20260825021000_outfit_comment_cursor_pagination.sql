-- LikeSized canonical migration: cursor-paginated published Outfit comments.
-- Keeps current public profile identity live while loading newest comments first in bounded pages.

create or replace function public.get_outfit_comments_page(
  p_post_id uuid,
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
set search_path=''
as $$
  with viewer as (
    select auth.uid() as user_id
  ), visible_post as (
    select op.id,op.user_id
    from public.outfit_posts op
    cross join viewer v
    where op.id=p_post_id
      and op.status='published'::public.outfit_post_status
      and op.comments_enabled
      and (v.user_id is null or not private.members_blocked(v.user_id,op.user_id))
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
      select 1 from public.outfit_comment_likes ocl
      where ocl.comment_id=oc.id and ocl.user_id=v.user_id
    )) as liked_by_viewer,
    (v.user_id is not null and (oc.user_id=v.user_id or vp.user_id=v.user_id)) as can_delete
  from public.outfit_comments oc
  join visible_post vp on vp.id=oc.post_id
  join public.profiles p on p.id=oc.user_id and p.username is not null
  cross join viewer v
  where p_before_created_at is null
     or (p_before_id is not null and (oc.created_at,oc.id)<(p_before_created_at,p_before_id))
  order by oc.created_at desc,oc.id desc
  limit least(greatest(coalesce(p_result_limit,20),1),50);
$$;

revoke all on function public.get_outfit_comments_page(uuid,timestamptz,uuid,integer) from public;
grant execute on function public.get_outfit_comments_page(uuid,timestamptz,uuid,integer) to anon,authenticated;
comment on function public.get_outfit_comments_page(uuid,timestamptz,uuid,integer) is
  'Cursor-paginated published Outfit comments ordered newest first with live public profile identity and safe viewer-specific Like/delete booleans; raw private profile/body data is never exposed.';

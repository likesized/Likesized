-- Preserve the live-profile-identity projection while matching the declared RPC type.
-- outfit_comments.like_count is integer; the public projection intentionally exposes
-- bigint for compatibility with count-style API consumers.

create or replace function public.get_public_outfit_comments(
  p_post_id uuid,
  p_result_limit integer default 200
)
returns table(
  comment_id uuid,
  body text,
  created_at timestamptz,
  username text,
  display_name text,
  avatar_url text,
  like_count bigint
)
language plpgsql
stable
security definer
set search_path=''
as $$
declare
  v_limit integer:=least(greatest(coalesce(p_result_limit,200),1),200);
begin
  return query
  select
    oc.id,
    oc.body,
    oc.created_at,
    p.username,
    p.display_name,
    p.avatar_url,
    oc.like_count::bigint
  from public.outfit_comments oc
  join public.outfit_posts op on op.id=oc.post_id
  join public.profiles p on p.id=oc.user_id
  where oc.post_id=p_post_id
    and op.status='published'::public.outfit_post_status
    and op.comments_enabled
    and p.username is not null
    and (
      auth.uid() is null
      or not private.members_blocked(auth.uid(),op.user_id)
    )
  order by oc.created_at,oc.id
  limit v_limit;
end;
$$;

revoke all on function public.get_public_outfit_comments(uuid,integer) from public;
grant execute on function public.get_public_outfit_comments(uuid,integer) to anon,authenticated;
comment on function public.get_public_outfit_comments(uuid,integer) is
  'Safe published Outfit comment projection using the commenter current username, display name and profile photo; identity is resolved live and is never snapshotted onto the comment.';

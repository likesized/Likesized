-- Profile photos are current member identity, not historical content snapshots.
-- An uploaded profile photo is public identity and every Outfit/comment surface resolves
-- the current profiles.avatar_url when it renders.

update storage.buckets
set public = true
where id = 'profile-photos';

drop policy if exists "members read profile photos" on storage.objects;
drop policy if exists "public reads profile photos" on storage.objects;
create policy "public reads profile photos"
on storage.objects for select to public
using (bucket_id = 'profile-photos');

-- Keep logged-out comment reads narrow while returning the commenter's CURRENT public
-- identity. No username/display name/avatar path is copied onto outfit_comments.
drop function if exists public.get_public_outfit_comments(uuid,integer);
create function public.get_public_outfit_comments(
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
  select oc.id,oc.body,oc.created_at,p.username,p.display_name,p.avatar_url,oc.like_count
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

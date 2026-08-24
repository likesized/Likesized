-- Harden New Outfit V1 social controls after the core model is established.

-- Blocking must remove both directions of an existing follow even though ordinary follow
-- deletion is intentionally follower-owned. Bind the privileged function strictly to auth.uid().
create or replace function public.block_member(p_blocked_id uuid)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user_id uuid:=auth.uid();
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode='28000'; end if;
  if p_blocked_id is null or p_blocked_id=v_user_id then raise exception 'Invalid member'; end if;
  if not exists(select 1 from public.profiles p where p.id=p_blocked_id and p.username is not null) then raise exception 'Member not found'; end if;

  insert into public.member_blocks(blocker_id,blocked_id)
  values(v_user_id,p_blocked_id)
  on conflict do nothing;

  delete from public.follows
  where (follower_id=v_user_id and followed_id=p_blocked_id)
     or (follower_id=p_blocked_id and followed_id=v_user_id);
end;
$$;
revoke all on function public.block_member(uuid) from public,anon;
grant execute on function public.block_member(uuid) to authenticated;

-- Admin moderation can remove reported Outfit comments while ordinary members retain only
-- self-delete / creator-delete rights.
create policy "Admins delete outfit comments"
on public.outfit_comments
for delete
to authenticated
using (private.is_admin());

-- Admin moderation may remove private draft photo files if a draft ever becomes a moderation
-- target through future tooling. This does not make draft metadata/content visible to admins in
-- member surfaces; it only completes the storage cleanup permission boundary.
create policy "Admins delete outfit draft photo files"
on storage.objects
for delete
to authenticated
using (bucket_id='outfit-draft-photos' and private.is_admin());

-- LikeSized canonical migration: switch an Outfit's one main photo without ever
-- creating an intermediate two-main state under outfit_photos_one_main_uq.
create or replace function public.sync_outfit_photo_order(
  p_post_id uuid,
  p_photo_ids uuid[],
  p_main_photo_id uuid
)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user_id uuid:=auth.uid();
  v_count integer;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if not exists(select 1 from public.outfit_posts where id=p_post_id and user_id=v_user_id) then raise exception 'Outfit not found'; end if;
  if cardinality(coalesce(p_photo_ids,array[]::uuid[])) not between 1 and 6 then raise exception 'Choose 1 to 6 Outfit photos'; end if;
  if p_main_photo_id is null or not (p_main_photo_id=any(p_photo_ids)) then raise exception 'Main photo must be in the gallery'; end if;

  select count(*)::integer into v_count
  from public.outfit_photos
  where post_id=p_post_id and id=any(p_photo_ids);
  if v_count<>cardinality(p_photo_ids)
     or v_count<>(select count(*)::integer from public.outfit_photos where post_id=p_post_id)
  then
    raise exception 'Photo order does not match this Outfit';
  end if;

  -- The partial unique index is not deferrable. Clear the old main first, then
  -- set ordering, then promote the requested main photo in this same RPC transaction.
  update public.outfit_photos
  set is_main=false
  where post_id=p_post_id and is_main;

  update public.outfit_photos ph
  set sort_order=q.ord-1
  from unnest(p_photo_ids) with ordinality q(id,ord)
  where ph.post_id=p_post_id and ph.id=q.id;

  update public.outfit_photos
  set is_main=true
  where post_id=p_post_id and id=p_main_photo_id;

  update public.outfit_posts op
  set photo_url=(
    select ph.display_path
    from public.outfit_photos ph
    where ph.post_id=p_post_id and ph.id=p_main_photo_id
  ),updated_at=now()
  where op.id=p_post_id and op.user_id=v_user_id;
end;
$$;

revoke all on function public.sync_outfit_photo_order(uuid,uuid[],uuid) from public,anon;
grant execute on function public.sync_outfit_photo_order(uuid,uuid[],uuid) to authenticated;
comment on function public.sync_outfit_photo_order(uuid,uuid[],uuid) is
  'Atomically owns Outfit photo order and one-main-photo promotion. Clears the prior main before promoting the requested cover so the partial one-main unique constraint cannot be violated.';

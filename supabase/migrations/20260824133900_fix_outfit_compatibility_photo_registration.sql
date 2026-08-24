-- Preserve the retired one-photo Outfit RPC as a compatibility boundary without
-- relying on a bare ON CONFLICT against outfit_photos. The gallery table has a
-- DEFERRABLE (post_id, sort_order) uniqueness constraint, which PostgreSQL cannot
-- use as an arbiter for ON CONFLICT DO NOTHING.

create or replace function public.create_outfit_post(
  p_post_id uuid,
  p_caption text,
  p_photo_url text,
  p_closet_item_ids uuid[]
)
returns uuid
language plpgsql
security invoker
set search_path=''
as $$
declare
  v_user_id uuid:=auth.uid();
  v_count integer;
  v_photo_id uuid:=gen_random_uuid();
  v_feed_path text;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode='28000';
  end if;
  if p_post_id is null or nullif(btrim(coalesce(p_photo_url,'')),'') is null then
    raise exception 'Invalid outfit post';
  end if;
  if p_photo_url !~ ('^' || v_user_id::text || '/' || p_post_id::text || '/outfit\.(jpg|png|webp)$') then
    raise exception 'Invalid outfit photo path';
  end if;

  v_count:=coalesce(cardinality(p_closet_item_ids),0);
  if v_count not between 1 and 6 then
    raise exception 'Choose 1 to 6 Closet items';
  end if;

  perform public.save_outfit_post_content(
    p_post_id,
    coalesce(nullif(left(btrim(coalesce(p_caption,'')),100),''),'Outfit'),
    null,
    p_closet_item_ids,
    array['everyday'],
    array[]::text[],
    true
  );

  v_feed_path:=case
    when p_photo_url like '%/display.webp' then regexp_replace(p_photo_url,'/display\.webp$','/feed.webp')
    else p_photo_url
  end;

  insert into public.outfit_photos(
    id,post_id,bucket,display_path,feed_path,sort_order,is_main
  )
  select
    v_photo_id,p_post_id,'outfit-photos',p_photo_url,v_feed_path,0,true
  where not exists(
    select 1
    from public.outfit_photos existing
    where existing.post_id=p_post_id
  );

  update public.outfit_posts
  set
    photo_url=(
      select ph.display_path
      from public.outfit_photos ph
      where ph.post_id=p_post_id
      order by ph.is_main desc,ph.sort_order,ph.id
      limit 1
    ),
    status='published',
    published_at=coalesce(published_at,now()),
    updated_at=now()
  where id=p_post_id
    and user_id=v_user_id;

  return p_post_id;
end;
$$;

revoke all on function public.create_outfit_post(uuid,text,text,uuid[]) from public,anon;
grant execute on function public.create_outfit_post(uuid,text,text,uuid[]) to authenticated;

comment on function public.create_outfit_post(uuid,text,text,uuid[]) is
  'Retired one-photo Outfit compatibility RPC. Reuses canonical Outfit content/gallery state, preserves the legacy owner-scoped photo-path guard, never changes Closet visibility, and remains for historical feed/integration compatibility only.';

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
  v_user_id uuid := auth.uid();
  v_count integer;
  v_unique_count integer;
  v_owned_count integer;
  v_reported_count integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode='28000';
  end if;
  if p_post_id is null or p_photo_url is null or btrim(p_photo_url)='' then
    raise exception 'Invalid outfit post';
  end if;
  if p_caption is not null and char_length(p_caption)>500 then
    raise exception 'Outfit caption is too long';
  end if;

  v_count := coalesce(cardinality(p_closet_item_ids),0);
  if v_count<1 or v_count>6 then
    raise exception 'Choose 1 to 6 Closet items';
  end if;

  select count(*)::integer
    into v_unique_count
  from (
    select distinct item_id
    from unnest(p_closet_item_ids) as item_id
    where item_id is not null
  ) q;
  if v_unique_count<>v_count then
    raise exception 'Closet items must be unique and non-null';
  end if;

  if p_photo_url !~ ('^' || v_user_id::text || '/' || p_post_id::text || '/outfit\.(jpg|png|webp)$') then
    raise exception 'Invalid outfit photo path';
  end if;

  if not exists (
    select 1 from public.profiles p
    where p.id=v_user_id and p.username is not null
  ) then
    raise exception 'Completed member profile required';
  end if;

  select count(*)::integer
    into v_owned_count
  from public.closet_items ci
  where ci.user_id=v_user_id
    and ci.id=any(p_closet_item_ids);
  if v_owned_count<>v_count then
    raise exception 'Every tagged garment must belong to the current member';
  end if;

  select count(*)::integer
    into v_reported_count
  from (
    select distinct fr.closet_item_id
    from public.fit_reports fr
    where fr.user_id=v_user_id
      and fr.closet_item_id=any(p_closet_item_ids)
  ) q;
  if v_reported_count<>v_count then
    raise exception 'Every tagged garment must have Fit Report evidence';
  end if;

  update public.closet_items ci
  set visibility='shared'::public.closet_visibility
  where ci.user_id=v_user_id
    and ci.id=any(p_closet_item_ids);

  insert into public.outfit_posts(id,user_id,caption,photo_url)
  values(p_post_id,v_user_id,nullif(btrim(coalesce(p_caption,'')),''),p_photo_url);

  insert into public.outfit_post_items(post_id,closet_item_id)
  select p_post_id,item_id
  from unnest(p_closet_item_ids) as item_id;

  return p_post_id;
end;
$$;

revoke all on function public.create_outfit_post(uuid,text,text,uuid[]) from public, anon;
grant execute on function public.create_outfit_post(uuid,text,text,uuid[]) to authenticated;

comment on function public.create_outfit_post(uuid,text,text,uuid[]) is
  'Atomic authenticated outfit creation: validates 1-6 unique owned Closet items with Fit Reports, shares them, creates the outfit post and tags in one transaction. Storage upload occurs before this RPC and is removed by the app if the transaction fails.';
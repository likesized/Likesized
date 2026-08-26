-- Keep selected Outfit items and photo hotspots consistent during edit/save.
-- The selected Outfit item set is authoritative. Removing an item must also
-- remove any hotspot that still references that Closet item, including stale
-- hotspot state left behind by an interrupted/failed prior save.

create or replace function public.save_outfit_post_content(
  p_post_id uuid,
  p_headline text,
  p_story text,
  p_closet_item_ids uuid[],
  p_occasions text[],
  p_style_tags text[],
  p_comments_enabled boolean default true
)
returns uuid
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_user_id uuid:=auth.uid(); v_status public.outfit_post_status; v_headline text:=nullif(btrim(coalesce(p_headline,'')),''); v_story text:=nullif(btrim(coalesce(p_story,'')),'');
  v_item_ids uuid[]:=coalesce(p_closet_item_ids,array[]::uuid[]); v_occasions text[]:=coalesce(p_occasions,array[]::text[]); v_styles text[]:=coalesce(p_style_tags,array[]::text[]);
  v_count integer; v_value text; v_normalized text; v_index integer:=0;
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode='28000'; end if;
  if p_post_id is null then raise exception 'Outfit id is required'; end if;
  if v_headline is not null and char_length(v_headline)>100 then raise exception 'Headline is too long'; end if;
  if v_story is not null and char_length(v_story)>5000 then raise exception 'Outfit Story is too long'; end if;
  if cardinality(v_item_ids)>6 or cardinality(v_occasions)>2 or cardinality(v_styles)>3 then raise exception 'Too many Outfit selections'; end if;
  if cardinality(v_item_ids)<>(select count(distinct x) from unnest(v_item_ids) x where x is not null) then raise exception 'Garments must be unique'; end if;
  if cardinality(v_occasions)<>(select count(distinct x) from unnest(v_occasions) x where x is not null) then raise exception 'Occasions must be unique'; end if;
  select status into v_status from public.outfit_posts where id=p_post_id and user_id=v_user_id;
  if not found then
    insert into public.outfit_posts(id,user_id,caption,headline,story,status,comments_enabled,created_at,updated_at)
    values(p_post_id,v_user_id,v_headline,v_headline,v_story,'draft',coalesce(p_comments_enabled,true),now(),now()); v_status:='draft';
  else
    update public.outfit_posts set caption=v_headline,headline=v_headline,story=v_story,comments_enabled=coalesce(p_comments_enabled,true),updated_at=now() where id=p_post_id and user_id=v_user_id;
  end if;
  select count(*)::integer into v_count from public.closet_items ci where ci.user_id=v_user_id and ci.id=any(v_item_ids);
  if v_count<>cardinality(v_item_ids) then raise exception 'Every tagged garment must belong to the current member'; end if;
  select count(distinct fr.closet_item_id)::integer into v_count from public.fit_reports fr where fr.user_id=v_user_id and fr.closet_item_id=any(v_item_ids);
  if v_count<>cardinality(v_item_ids) then raise exception 'Every tagged garment must have Fit Report evidence'; end if;

  delete from public.outfit_photo_tags t
  using public.outfit_photos ph
  where ph.id=t.photo_id
    and ph.post_id=p_post_id
    and not (t.closet_item_id=any(v_item_ids));

  delete from public.outfit_post_items where post_id=p_post_id;
  insert into public.outfit_post_items(post_id,closet_item_id) select p_post_id,x from unnest(v_item_ids) x;
  delete from public.outfit_occasions where post_id=p_post_id; v_index:=0;
  foreach v_value in array v_occasions loop insert into public.outfit_occasions(post_id,occasion,sort_order) values(p_post_id,v_value,v_index); v_index:=v_index+1; end loop;
  delete from public.outfit_style_tags where post_id=p_post_id; v_index:=0;
  foreach v_value in array v_styles loop
    v_value:=btrim(regexp_replace(v_value,'^#+','','g')); if char_length(v_value) not between 1 and 30 then raise exception 'Style tags must be 1 to 30 characters'; end if;
    v_normalized:=private.normalize_outfit_style_tag(v_value); if v_normalized='' or char_length(v_normalized)>30 then raise exception 'Invalid style tag'; end if;
    insert into public.outfit_style_tags(post_id,normalized_tag,display_tag,sort_order) values(p_post_id,v_normalized,v_value,v_index); v_index:=v_index+1;
  end loop;
  if v_status='published'::public.outfit_post_status and (v_headline is null or cardinality(v_item_ids) not between 1 and 6 or cardinality(v_occasions) not between 1 and 2) then raise exception 'Published Outfits must keep headline, garments and occasion'; end if;
  return p_post_id;
end;
$function$;

create or replace function public.replace_outfit_photo_tags(p_photo_id uuid, p_tags jsonb)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare v_user_id uuid:=auth.uid(); v_post_id uuid; v_item jsonb; v_closet_item_id uuid; v_x numeric; v_y numeric;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  select ph.post_id into v_post_id from public.outfit_photos ph join public.outfit_posts op on op.id=ph.post_id where ph.id=p_photo_id and op.user_id=v_user_id;
  if v_post_id is null then raise exception 'Outfit photo not found'; end if;
  if jsonb_typeof(coalesce(p_tags,'[]'::jsonb))<>'array' or jsonb_array_length(coalesce(p_tags,'[]'::jsonb))>6 then raise exception 'Invalid photo tags'; end if;
  delete from public.outfit_photo_tags where photo_id=p_photo_id;
  for v_item in select value from jsonb_array_elements(coalesce(p_tags,'[]'::jsonb)) loop
    v_closet_item_id:=(v_item->>'closet_item_id')::uuid; v_x:=(v_item->>'x')::numeric; v_y:=(v_item->>'y')::numeric;
    if v_x not between 0 and 1 or v_y not between 0 and 1 then raise exception 'Invalid hotspot position'; end if;
    if exists(select 1 from public.outfit_post_items oi where oi.post_id=v_post_id and oi.closet_item_id=v_closet_item_id) then
      insert into public.outfit_photo_tags(photo_id,closet_item_id,x,y) values(p_photo_id,v_closet_item_id,v_x,v_y);
    end if;
  end loop;
end;
$function$;

-- Canonical Explore search now returns exact group counts with each ranked row.
-- The existing Product and member search functions are replaced in place so
-- autocomplete and full Search Results use the same search rules.

drop function public.search_catalog_products(text, integer);

create function public.search_catalog_products(
  p_query text,
  p_result_limit integer default 24
)
returns table (
  id uuid,
  name text,
  slug text,
  category public.garment_category,
  brand_name text,
  total_count bigint
)
language plpgsql
security invoker
set search_path=''
as $$
declare
  v_query text := btrim(regexp_replace(coalesce(p_query,''),'\s+',' ','g'));
  v_text_norm text;
  v_ident_norm text;
  v_limit integer := least(greatest(coalesce(p_result_limit,24),1),50);
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode='28000';
  end if;
  if v_query='' then
    return;
  end if;
  v_query := left(v_query,80);
  v_text_norm := regexp_replace(lower(v_query),'[^a-z0-9]+','','g');
  v_ident_norm := upper(regexp_replace(v_query,'[\s_.-]+','','g'));

  return query
  with ranked as (
    select p.id,p.name,p.slug,p.category,b.name as brand_name,
      greatest(
        case when p.normalized_name=v_text_norm then 100 else 0 end,
        case when p.manufacturer_style_normalized=v_ident_norm and v_ident_norm<>'' then 98 else 0 end,
        case when b.normalized_name=v_text_norm then 95 else 0 end,
        case when position(lower(v_query) in lower(p.name))>0 then 85 else 0 end,
        case when position(lower(v_query) in lower(coalesce(p.manufacturer_style_number,'')))>0 then 82 else 0 end,
        case when position(lower(v_query) in lower(b.name))>0 then 80 else 0 end
      ) as score
    from public.products p
    join public.brands b on b.id=p.brand_id
    where p.catalog_status<>'rejected'::public.product_data_status
      and (
        p.normalized_name=v_text_norm
        or (p.manufacturer_style_normalized=v_ident_norm and v_ident_norm<>'')
        or b.normalized_name=v_text_norm
        or position(lower(v_query) in lower(p.name))>0
        or position(lower(v_query) in lower(coalesce(p.manufacturer_style_number,'')))>0
        or position(lower(v_query) in lower(b.name))>0
      )

    union all

    select p.id,p.name,p.slug,p.category,b.name,
      case when ba.normalized_alias=v_text_norm then 94 else 78 end
    from public.brand_aliases ba
    join public.brands b on b.id=ba.brand_id
    join public.products p on p.brand_id=b.id
    where p.catalog_status<>'rejected'::public.product_data_status
      and (
        ba.normalized_alias=v_text_norm
        or position(lower(v_query) in lower(ba.alias))>0
      )

    union all

    select p.id,p.name,p.slug,p.category,b.name,
      case when pi.normalized_value=v_ident_norm and v_ident_norm<>'' then 99 else 84 end
    from public.product_identifiers pi
    join public.products p on p.id=pi.product_id
    join public.brands b on b.id=p.brand_id
    where p.catalog_status<>'rejected'::public.product_data_status
      and (
        (pi.normalized_value=v_ident_norm and v_ident_norm<>'')
        or position(lower(v_query) in lower(pi.original_value))>0
      )

    union all

    select p.id,p.name,p.slug,p.category,b.name,
      greatest(
        case when rl.retailer_product_id_normalized=v_ident_norm and v_ident_norm<>'' then 97 else 0 end,
        case when rl.sku_normalized=v_ident_norm and v_ident_norm<>'' then 97 else 0 end,
        case when position(lower(v_query) in lower(coalesce(rl.retailer_product_id,'')))>0 then 83 else 0 end,
        case when position(lower(v_query) in lower(coalesce(rl.sku,'')))>0 then 83 else 0 end,
        case when position(lower(v_query) in lower(coalesce(rl.listing_title,'')))>0 then 76 else 0 end
      )
    from public.retailer_listings rl
    join public.products p on p.id=rl.product_id
    join public.brands b on b.id=p.brand_id
    where p.catalog_status<>'rejected'::public.product_data_status
      and (
        (rl.retailer_product_id_normalized=v_ident_norm and v_ident_norm<>'')
        or (rl.sku_normalized=v_ident_norm and v_ident_norm<>'')
        or position(lower(v_query) in lower(coalesce(rl.retailer_product_id,'')))>0
        or position(lower(v_query) in lower(coalesce(rl.sku,'')))>0
        or position(lower(v_query) in lower(coalesce(rl.listing_title,'')))>0
      )
  ), deduped as (
    select r.id,r.name,r.slug,r.category,r.brand_name,max(r.score) as score
    from ranked r
    where r.score>0
    group by r.id,r.name,r.slug,r.category,r.brand_name
  )
  select d.id,d.name,d.slug,d.category,d.brand_name,count(*) over() as total_count
  from deduped d
  order by d.score desc,
    (select case
      when p.catalog_review_needed then 3
      when p.catalog_status='verified'::public.product_data_status then 0
      when p.catalog_status='corroborated'::public.product_data_status then 1
      else 2 end
     from public.products p where p.id=d.id),
    d.brand_name,d.name,d.id
  limit v_limit;
end;
$$;

drop function public.search_members(text, integer);

create function public.search_members(
  p_query text,
  p_result_limit integer default 24
)
returns table (
  id uuid,
  username text,
  display_name text,
  avatar_url text,
  total_count bigint
)
language plpgsql
security invoker
set search_path=''
as $$
declare
  v_user_id uuid := auth.uid();
  v_query text := btrim(regexp_replace(coalesce(p_query,''),'\s+',' ','g'));
  v_limit integer := least(greatest(coalesce(p_result_limit,24),1),50);
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode='28000';
  end if;
  if v_query='' then
    return;
  end if;
  v_query := left(v_query,80);

  return query
  with ranked as (
    select p.id,p.username,p.display_name,p.avatar_url,
      case when lower(p.username)=lower(v_query) then 0
           when lower(coalesce(p.display_name,''))=lower(v_query) then 1
           when position(lower(v_query) in lower(p.username))=1 then 2
           else 3 end as rank
    from public.profiles p
    where p.id<>v_user_id
      and p.username is not null
      and (
        position(lower(v_query) in lower(p.username))>0
        or position(lower(v_query) in lower(coalesce(p.display_name,'')))>0
      )
  )
  select r.id,r.username,r.display_name,r.avatar_url,count(*) over() as total_count
  from ranked r
  order by r.rank,r.username,r.id
  limit v_limit;
end;
$$;

create function public.search_outfits(
  p_query text,
  p_result_limit integer default 24
)
returns table (
  id uuid,
  user_id uuid,
  caption text,
  photo_url text,
  created_at timestamptz,
  username text,
  display_name text,
  total_count bigint
)
language plpgsql
security invoker
set search_path=''
as $$
declare
  v_query text := btrim(regexp_replace(coalesce(p_query,''),'\s+',' ','g'));
  v_limit integer := least(greatest(coalesce(p_result_limit,24),1),50);
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode='28000';
  end if;
  if v_query='' then
    return;
  end if;
  v_query := left(v_query,80);

  return query
  with ranked as (
    select op.id,op.user_id,op.caption,op.photo_url,op.created_at,
      p.username,p.display_name,
      greatest(
        case when lower(coalesce(op.caption,''))=lower(v_query) then 100 else 0 end,
        case when lower(p.username)=lower(v_query) then 98 else 0 end,
        case when lower(coalesce(p.display_name,''))=lower(v_query) then 96 else 0 end,
        case when position(lower(v_query) in lower(coalesce(op.caption,'')))=1 then 90 else 0 end,
        case when position(lower(v_query) in lower(coalesce(op.caption,'')))>0 then 84 else 0 end,
        case when position(lower(v_query) in lower(p.username))>0 then 82 else 0 end,
        case when position(lower(v_query) in lower(coalesce(p.display_name,'')))>0 then 80 else 0 end,
        case when exists (
          select 1
          from public.outfit_post_items opi
          join public.closet_items ci on ci.id=opi.closet_item_id
          join public.products prod on prod.id=ci.product_id
          join public.brands b on b.id=prod.brand_id
          where opi.post_id=op.id
            and (
              position(lower(v_query) in lower(prod.name))>0
              or position(lower(v_query) in lower(b.name))>0
            )
        ) then 78 else 0 end
      ) as score
    from public.outfit_posts op
    join public.profiles p on p.id=op.user_id and p.username is not null
  )
  select r.id,r.user_id,r.caption,r.photo_url,r.created_at,
    r.username,r.display_name,count(*) over() as total_count
  from ranked r
  where r.score>0
  order by r.score desc,r.created_at desc,r.id
  limit v_limit;
end;
$$;

revoke all on function public.search_catalog_products(text,integer) from public,anon;
revoke all on function public.search_members(text,integer) from public,anon;
revoke all on function public.search_outfits(text,integer) from public,anon;
grant execute on function public.search_catalog_products(text,integer) to authenticated;
grant execute on function public.search_members(text,integer) to authenticated;
grant execute on function public.search_outfits(text,integer) to authenticated;

comment on function public.search_catalog_products(text,integer) is
  'Authenticated canonical Product search with exact total count. Returns one deduplicated Product per result and no private member data.';
comment on function public.search_members(text,integer) is
  'Authenticated member-readable username/display-name search with exact total count. Excludes the viewer and returns no Fit Profile measurements.';
comment on function public.search_outfits(text,integer) is
  'Authenticated Outfit search over caption, creator identity and member-readable tagged Product names, with exact total count and no private measurements.';

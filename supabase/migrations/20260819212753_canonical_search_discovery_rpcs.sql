create or replace function public.search_catalog_products(
  p_query text,
  p_result_limit integer default 24
)
returns table (
  id uuid,
  name text,
  slug text,
  category public.garment_category,
  brand_name text
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
    where p.normalized_name=v_text_norm
       or (p.manufacturer_style_normalized=v_ident_norm and v_ident_norm<>'')
       or b.normalized_name=v_text_norm
       or position(lower(v_query) in lower(p.name))>0
       or position(lower(v_query) in lower(coalesce(p.manufacturer_style_number,'')))>0
       or position(lower(v_query) in lower(b.name))>0

    union all

    select p.id,p.name,p.slug,p.category,b.name,
      case when ba.normalized_alias=v_text_norm then 94 else 78 end
    from public.brand_aliases ba
    join public.brands b on b.id=ba.brand_id
    join public.products p on p.brand_id=b.id
    where ba.normalized_alias=v_text_norm
       or position(lower(v_query) in lower(ba.alias))>0

    union all

    select p.id,p.name,p.slug,p.category,b.name,
      case when pi.normalized_value=v_ident_norm and v_ident_norm<>'' then 99 else 84 end
    from public.product_identifiers pi
    join public.products p on p.id=pi.product_id
    join public.brands b on b.id=p.brand_id
    where (pi.normalized_value=v_ident_norm and v_ident_norm<>'')
       or position(lower(v_query) in lower(pi.original_value))>0

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
    where (rl.retailer_product_id_normalized=v_ident_norm and v_ident_norm<>'')
       or (rl.sku_normalized=v_ident_norm and v_ident_norm<>'')
       or position(lower(v_query) in lower(coalesce(rl.retailer_product_id,'')))>0
       or position(lower(v_query) in lower(coalesce(rl.sku,'')))>0
       or position(lower(v_query) in lower(coalesce(rl.listing_title,'')))>0
  ), deduped as (
    select r.id,r.name,r.slug,r.category,r.brand_name,max(r.score) as score
    from ranked r
    where r.score>0
    group by r.id,r.name,r.slug,r.category,r.brand_name
  )
  select d.id,d.name,d.slug,d.category,d.brand_name
  from deduped d
  order by d.score desc, d.brand_name, d.name, d.id
  limit v_limit;
end;
$$;

create or replace function public.search_members(
  p_query text,
  p_result_limit integer default 24
)
returns table (
  id uuid,
  username text,
  display_name text,
  avatar_url text
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
  select p.id,p.username,p.display_name,p.avatar_url
  from public.profiles p
  where p.id<>v_user_id
    and p.username is not null
    and (
      position(lower(v_query) in lower(p.username))>0
      or position(lower(v_query) in lower(coalesce(p.display_name,'')))>0
    )
  order by
    case when lower(p.username)=lower(v_query) then 0
         when lower(coalesce(p.display_name,''))=lower(v_query) then 1
         when position(lower(v_query) in lower(p.username))=1 then 2
         else 3 end,
    p.username,
    p.id
  limit v_limit;
end;
$$;

revoke all on function public.search_catalog_products(text,integer) from public, anon;
revoke all on function public.search_members(text,integer) from public, anon;
grant execute on function public.search_catalog_products(text,integer) to authenticated;
grant execute on function public.search_members(text,integer) to authenticated;

comment on function public.search_catalog_products(text,integer) is
  'Authenticated V1 catalog discovery over canonical product/brand names, brand aliases, manufacturer style numbers, product identifiers, retailer IDs/SKUs and listing titles. Returns one deduplicated canonical Product per result.';
comment on function public.search_members(text,integer) is
  'Authenticated V1 member discovery over member-readable username/display name only. Excludes the current viewer and returns no raw Fit Profile data.';